// File: src/contexts/PraticheContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { db, auth } from '../firebase'; // Importa auth da firebase
import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { getSiglaAgenzia } from '../pages/PratichePage/utils/agenzieCodici';

const PraticheContext = createContext();

export function usePratiche() {
  return useContext(PraticheContext);
}

// gestione: "nuova" | "vecchia" | "all"
//   - "nuova"   -> vista/scrittura sulle pratiche della nuova gestione (da Settembre)
//   - "vecchia" -> vista/scrittura sulle pratiche storiche ("da completare")
//   - "all"     -> nessun filtro (calendario, genera incarico)
// autoCodice: true attiva la generazione automatica del codice per agenzia nel form.
export function PraticheProvider({ children, gestione = 'all', autoCodice = false }) {
  const [pratiche, setPratiche] = useState([]);
  const [collaboratori, setCollaboratori] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch pratiche
        const praticheCollection = collection(db, 'pratiche');
        const praticheSnapshot = await getDocs(praticheCollection);
        const praticheList = praticheSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setPratiche(praticheList);

        // Fetch collaboratori
        const collaboratoriCollection = collection(db, 'collaboratori');
        const collaboratoriSnapshot = await getDocs(collaboratoriCollection);
        const collaboratoriList = collaboratoriSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setCollaboratori(collaboratoriList);

        setLoading(false);
      } catch (error) {
        console.error("Error fetching data: ", error);
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Vista filtrata in base alla gestione. Le pratiche senza campo `gestione`
  // (pre-esistenti) sono considerate "vecchie".
  const praticheView =
    gestione === 'all'
      ? pratiche
      : gestione === 'nuova'
        ? pratiche.filter(p => p.gestione === 'nuova')
        : pratiche.filter(p => p.gestione !== 'nuova');

  // Add a new pratica
  async function addPratica(praticaData) {
    try {
      const user = auth.currentUser; // Prendi l'utente corrente da Firebase Auth
      if (!user) {
        console.error("Utente non autenticato. Impossibile aggiungere la pratica.");
        throw new Error("Utente non autenticato per aggiungere una pratica.");
      }

      const praticaConUserId = {
        ...praticaData,
        // Contrassegno gestione: le nuove pagine creano pratiche "nuove",
        // le pagine "da completare" (o all) restano "vecchie".
        gestione: gestione === 'nuova' ? 'nuova' : 'vecchia',
        userId: user.uid, // AGGIUNGI L'UID DELL'UTENTE LOGGATO
        createdAt: new Date().toISOString() // Per export giornaliero delle aggiunte
      };
      const docRef = await addDoc(collection(db, 'pratiche'), praticaConUserId);
      setPratiche(prev => [...prev, { id: docRef.id, ...praticaConUserId }]);
      return docRef.id;
    } catch (error) {
      console.error("Error adding document: ", error);
      throw error;
    }
  }

  // Update a pratica
  async function updatePratica(id, updates) {
    try {
      const praticaRef = doc(db, 'pratiche', id);
      await updateDoc(praticaRef, updates);
      setPratiche(prev =>
        prev.map(pratica =>
          pratica.id === id ? { ...pratica, ...updates } : pratica
        )
      );
      return true;
    } catch (error) {
      console.error("Error updating document: ", error);
      throw error;
    }
  }

  // Delete a pratica
  async function deletePratica(id) {
    try {
      await deleteDoc(doc(db, 'pratiche', id));
      setPratiche(prev => prev.filter(pratica => pratica.id !== id));
      return true;
    } catch (error) {
      console.error("Error deleting document: ", error);
      throw error;
    }
  }

  // Genera il prossimo codice progressivo per agenzia: formato NNN-SIGLA-AA
  // (es. 001-VIA-26). Progressivo per agenzia, azzerato ogni anno.
  // Ritorna null se l'agenzia non ha una sigla (in tal caso il codice resta manuale).
  async function generateNextCodice(agenzia) {
    const sigla = getSiglaAgenzia(agenzia);
    if (!sigla) return null;

    const yearSuffix = new Date().getFullYear().toString().slice(-2); // es. "26"
    const suffix = `-${sigla}-${yearSuffix}`;

    // Numerazione della SOLA nuova gestione: le pratiche storiche ("da completare")
    // non contano, così la serie nuova riparte da 001 per ogni sigla/anno anche se
    // lo stesso numero esiste già tra le vecchie (le due numerazioni sono indipendenti).
    const snapshot = await getDocs(collection(db, 'pratiche'));
    let maxNumber = 0;
    snapshot.forEach((docSnapshot) => {
      const data = docSnapshot.data();
      if (data.gestione !== 'nuova') return;
      const codice = data.codice || '';
      if (codice.endsWith(suffix)) {
        const match = codice.match(/^(\d+)-/);
        if (match) {
          const numero = parseInt(match[1], 10);
          if (numero > maxNumber) maxNumber = numero;
        }
      }
    });

    const formattedNumber = (maxNumber + 1).toString().padStart(3, '0'); // "001"
    return `${formattedNumber}${suffix}`;
  }

  // Calculate financial stats (sulla vista corrente)
  function calculateFinancialStats() {
    const stats = {
      totaleValore: 0,
      totaleDaAvere: 0,
      praticheTotali: praticheView.length,
      praticheAttive: 0
    };

    praticheView.forEach(pratica => {
      stats.totaleValore += pratica.importoTotale || 0;

      let importoRicevuto = 0;

      if (pratica.workflow) {
        importoRicevuto += pratica.workflow.acconto1?.importoCommittente || 0;
        importoRicevuto += pratica.workflow.acconto2?.importoCommittente || 0;
        importoRicevuto += pratica.workflow.saldo?.importoCommittente || 0;
      } else if (pratica.steps) {
        importoRicevuto =
          (pratica.steps?.acconto1?.completed ? pratica.steps.acconto1.importo || 0 : 0) +
          (pratica.steps?.acconto2?.completed ? pratica.steps.acconto2.importo || 0 : 0) +
          (pratica.steps?.saldo?.completed ? pratica.steps.saldo.importo || 0 : 0);
      }

      const daAvere = (pratica.importoTotale || 0) - importoRicevuto;
      stats.totaleDaAvere += daAvere;

      if (pratica.stato !== 'Completata') {
        stats.praticheAttive++;
      }
    });

    return stats;
  }

  const value = {
    pratiche: praticheView,
    collaboratori,
    loading,
    gestione,
    autoCodice,
    addPratica,
    updatePratica,
    deletePratica,
    generateNextCodice,
    calculateFinancialStats
  };

  return (
    <PraticheContext.Provider value={value}>
      {children}
    </PraticheContext.Provider>
  );
}

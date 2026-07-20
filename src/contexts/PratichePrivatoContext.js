// File: src/contexts/PratichePrivatoContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { db, auth } from '../firebase'; // Importa auth da firebase
import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { getSiglaAgenzia } from '../pages/PratichePage/utils/agenzieCodici';

const PratichePrivatoContext = createContext();

export function usePratichePrivato() {
  return useContext(PratichePrivatoContext);
}

// gestione: "nuova" | "vecchia" | "all" (vedi PraticheContext).
// autoCodice: true attiva la generazione automatica del codice per agenzia nel form.
export function PratichePrivatoProvider({ children, gestione = 'all', autoCodice = false }) {
  const [pratiche, setPratiche] = useState([]);
  const [collaboratori, setCollaboratori] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const praticheCollection = collection(db, 'pratiche_privato');
        const praticheSnapshot = await getDocs(praticheCollection);
        const praticheList = praticheSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setPratiche(praticheList);

        const collaboratoriCollection = collection(db, 'collaboratori');
        const collaboratoriSnapshot = await getDocs(collaboratoriCollection);
        const collaboratoriList = collaboratoriSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setCollaboratori(collaboratoriList);

        setLoading(false);
      } catch (error) {
        console.error("Error fetching data for Pratiche Privato: ", error);
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Vista filtrata in base alla gestione (pratiche senza campo `gestione` = "vecchie").
  const praticheView =
    gestione === 'all'
      ? pratiche
      : gestione === 'nuova'
        ? pratiche.filter(p => p.gestione === 'nuova')
        : pratiche.filter(p => p.gestione !== 'nuova');

  async function addPraticaPrivato(praticaData) {
    try {
      const user = auth.currentUser; // Prendi l'utente corrente da Firebase Auth
      if (!user) {
        console.error("Utente non autenticato. Impossibile aggiungere la pratica privata.");
        throw new Error("Utente non autenticato per aggiungere una pratica privata.");
      }
      const praticaConUserId = {
        ...praticaData,
        gestione: gestione === 'nuova' ? 'nuova' : 'vecchia',
        userId: user.uid, // AGGIUNGI L'UID DELL'UTENTE LOGGATO
        createdAt: new Date().toISOString() // Per export giornaliero delle aggiunte
      };
      const docRef = await addDoc(collection(db, 'pratiche_privato'), praticaConUserId);
      setPratiche(prev => [...prev, { id: docRef.id, ...praticaConUserId }]);
      return docRef.id;
    } catch (error) {
      console.error("Error adding private document: ", error);
      throw error;
    }
  }

  async function updatePraticaPrivato(id, updates) {
    try {
      const praticaRef = doc(db, 'pratiche_privato', id);
      await updateDoc(praticaRef, updates);
      setPratiche(prev =>
        prev.map(p =>
          p.id === id ? { ...p, ...updates } : p
        )
      );
      return true;
    } catch (error) {
      console.error("Error updating private document: ", error);
      throw error;
    }
  }

  async function deletePraticaPrivato(id) {
    try {
      await deleteDoc(doc(db, 'pratiche_privato', id));
      setPratiche(prev => prev.filter(p => p.id !== id));
      return true;
    } catch (error) {
      console.error("Error deleting private document: ", error);
      throw error;
    }
  }

  // Genera il prossimo codice progressivo per agenzia: formato NNN-SIGLA-AA
  // (es. 001-ICO-26). Stessa logica di PraticheContext.generateNextCodice, ma sulla
  // collezione pratiche_privato. Ritorna null se l'agenzia non ha una sigla
  // (in tal caso il codice resta manuale).
  async function generateNextCodice(agenzia) {
    const sigla = getSiglaAgenzia(agenzia);
    if (!sigla) return null;

    const yearSuffix = new Date().getFullYear().toString().slice(-2); // es. "26"
    const suffix = `-${sigla}-${yearSuffix}`;

    // Solo la nuova gestione: le pratiche storiche ("da completare") non contano, così
    // la serie nuova riparte da 001 per ogni sigla/anno. Tra le pratiche nuove si prende
    // il numero più alto salvato, quindi una modifica manuale sposta in avanti la serie.
    const snapshot = await getDocs(collection(db, 'pratiche_privato'));
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

  const value = {
    pratiche: praticheView,
    collaboratori,
    loading,
    gestione,
    autoCodice,
    generateNextCodice,
    addPratica: addPraticaPrivato,
    updatePratica: updatePraticaPrivato,
    deletePratica: deletePraticaPrivato
  };

  return (
    <PratichePrivatoContext.Provider value={value}>
      {children}
    </PratichePrivatoContext.Provider>
  );
}
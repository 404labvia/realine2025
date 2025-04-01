// File: src/contexts/PraticheContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';

const PraticheContext = createContext();

export function usePratiche() {
  return useContext(PraticheContext);
}

export function PraticheProvider({ children }) {
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

  // Add a new pratica
  async function addPratica(pratica) {
    try {
      const docRef = await addDoc(collection(db, 'pratiche'), pratica);
      setPratiche(prev => [...prev, { id: docRef.id, ...pratica }]);
      return docRef.id;
    } catch (error) {
      console.error("Error adding document: ", error);
      throw error; // Propaga l'errore per gestirlo nel componente
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
      throw error; // Propaga l'errore per gestirlo nel componente
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
      throw error; // Propaga l'errore per gestirlo nel componente
    }
  }

  // Calculate financial stats
  function calculateFinancialStats() {
    const stats = {
      totaleValore: 0,
      totaleDaAvere: 0,
      praticheTotali: pratiche.length,
      praticheAttive: 0
    };

    pratiche.forEach(pratica => {
      stats.totaleValore += pratica.importoTotale || 0;
      
      // Supporta sia il vecchio formato che il nuovo formato workflow
      let importoRicevuto = 0;
      
      if (pratica.workflow) {
        // Nuovo formato con workflow
        importoRicevuto += pratica.workflow.acconto1?.importoCommittente || 0;
        importoRicevuto += pratica.workflow.acconto2?.importoCommittente || 0;
        importoRicevuto += pratica.workflow.saldo?.importoCommittente || 0;
      } else {
        // Vecchio formato con steps
        importoRicevuto = 
          (pratica.steps?.acconto1?.completed ? pratica.steps.acconto1.importo || 0 : 0) +
          (pratica.steps?.acconto2?.completed ? pratica.steps.acconto2.importo || 0 : 0) +
          (pratica.steps?.saldo?.completed ? pratica.steps.saldo.importo || 0 : 0);
      }
        
      const daAvere = pratica.importoTotale - importoRicevuto;
      stats.totaleDaAvere += daAvere;
      
      if (pratica.stato !== 'Completata') {
        stats.praticheAttive++;
      }
    });
    
    return stats;
  }

  const value = {
    pratiche,
    collaboratori,
    loading,
    addPratica,
    updatePratica,
    deletePratica,
    calculateFinancialStats
  };

  return (
    <PraticheContext.Provider value={value}>
      {children}
    </PraticheContext.Provider>
  );
}
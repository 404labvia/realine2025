// File: src/contexts/PratichePrivatoContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';

// NUOVO: Nome del contesto
const PratichePrivatoContext = createContext();

// NUOVO: Hook per usare il contesto
export function usePratichePrivato() {
  return useContext(PratichePrivatoContext);
}

// NUOVO: Provider del contesto
export function PratichePrivatoProvider({ children }) {
  const [pratiche, setPratiche] = useState([]); // Conterrà le pratiche private
  const [collaboratori, setCollaboratori] = useState([]); // Lasciamo i collaboratori condivisi per ora
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch pratiche privato
        // MODIFICATO: Nome della collezione Firestore
        const praticheCollection = collection(db, 'pratiche_privato');
        const praticheSnapshot = await getDocs(praticheCollection);
        const praticheList = praticheSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setPratiche(praticheList);

        // Fetch collaboratori (assumiamo condivisi per ora)
        // Se hai bisogno di collaboratori separati per le pratiche private,
        // dovrai creare una collezione 'collaboratori_privato'
        // e modificare questa parte di conseguenza.
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

  // Add a new pratica privata
  // MODIFICATO: Nome della funzione per chiarezza (opzionale)
  async function addPraticaPrivato(pratica) {
    try {
      // MODIFICATO: Nome della collezione Firestore
      const docRef = await addDoc(collection(db, 'pratiche_privato'), pratica);
      setPratiche(prev => [...prev, { id: docRef.id, ...pratica }]);
      return docRef.id;
    } catch (error) {
      console.error("Error adding private document: ", error);
      throw error;
    }
  }

  // Update a pratica privata
  // MODIFICATO: Nome della funzione per chiarezza (opzionale)
  async function updatePraticaPrivato(id, updates) {
    try {
      // MODIFICATO: Nome della collezione Firestore
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

  // Delete a pratica privata
  // MODIFICATO: Nome della funzione per chiarezza (opzionale)
  async function deletePraticaPrivato(id) {
    try {
      // MODIFICATO: Nome della collezione Firestore
      await deleteDoc(doc(db, 'pratiche_privato', id));
      setPratiche(prev => prev.filter(p => p.id !== id));
      return true;
    } catch (error) {
      console.error("Error deleting private document: ", error);
      throw error;
    }
  }

  // RIMOZIONE: La funzione calculateFinancialStats non è rilevante qui
  // dato che queste pratiche sono escluse dai conteggi globali.
  // Se servono statistiche *solo* per le pratiche private, si può implementare qui.

  const value = {
    pratiche, // Queste sono le pratiche_privato
    collaboratori,
    loading,
    addPratica: addPraticaPrivato,       // Mappiamo al nome generico per facilitare il riutilizzo del codice nella pagina
    updatePratica: updatePraticaPrivato, // Mappiamo al nome generico
    deletePratica: deletePraticaPrivato  // Mappiamo al nome generico
    // calculateFinancialStats: calculateFinancialStatsPrivato, // Se implementata
  };

  return (
    // MODIFICATO: Usa il nuovo Context Provider
    <PratichePrivatoContext.Provider value={value}>
      {children}
    </PratichePrivatoContext.Provider>
  );
}
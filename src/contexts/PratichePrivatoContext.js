// File: src/contexts/PratichePrivatoContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { db, auth } from '../firebase'; // Importa auth da firebase
import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';

const PratichePrivatoContext = createContext();

export function usePratichePrivato() {
  return useContext(PratichePrivatoContext);
}

export function PratichePrivatoProvider({ children }) {
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

  async function addPraticaPrivato(praticaData) {
    try {
      const user = auth.currentUser; // Prendi l'utente corrente da Firebase Auth
      if (!user) {
        console.error("Utente non autenticato. Impossibile aggiungere la pratica privata.");
        throw new Error("Utente non autenticato per aggiungere una pratica privata.");
      }
      const praticaConUserId = {
        ...praticaData,
        userId: user.uid // AGGIUNGI L'UID DELL'UTENTE LOGGATO
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

  const value = {
    pratiche,
    collaboratori,
    loading,
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
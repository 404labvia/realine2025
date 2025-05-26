// src/pages/AccessiAgliAttiPage/contexts/AccessoAttiContext.js
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { db, auth } from '../../../firebase'; // Assicurati che il percorso a firebase.js sia corretto
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';

const AccessoAttiContext = createContext();

export function useAccessiAtti() {
  return useContext(AccessoAttiContext);
}

export function AccessoAttiProvider({ children }) {
  const [accessi, setAccessi] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(user => {
      if (user) {
        setCurrentUserId(user.uid);
      } else {
        setCurrentUserId(null);
        setAccessi([]); // Pulisci i dati se l'utente fa logout
      }
    });
    return () => unsubscribeAuth();
  }, []);

  const fetchAccessi = useCallback(() => {
    if (!currentUserId) {
      setLoading(false);
      setAccessi([]);
      return () => {}; // Funzione di cleanup vuota
    }

    setLoading(true);
    // Per ora, recuperiamo tutti gli accessi dell'utente loggato.
    // Potresti voler aggiungere filtri più specifici qui in futuro.
    const q = query(
      collection(db, 'accessi_atti'),
      where('userId', '==', currentUserId), // Filtra per utente corrente
      orderBy('dataCreazione', 'desc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const accessiList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Converte i timestamp di Firestore in oggetti Date JavaScript, se necessario
        dataCreazione: doc.data().dataCreazione?.toDate(),
        dataUltimaModifica: doc.data().dataUltimaModifica?.toDate(),
      }));
      setAccessi(accessiList);
      setLoading(false);
    }, (error) => {
      console.error("Errore nel fetch degli accessi agli atti: ", error);
      setLoading(false);
    });

    return unsubscribe; // Restituisce la funzione di unsubscribe per useEffect
  }, [currentUserId]);

  useEffect(() => {
    const unsubscribe = fetchAccessi();
    return () => unsubscribe(); // Cleanup all'unmount del provider o al cambio di fetchAccessi
  }, [fetchAccessi]);


  const addAccesso = async (accessoData) => {
    if (!auth.currentUser) {
      throw new Error("Utente non autenticato.");
    }
    try {
      const docRef = await addDoc(collection(db, 'accessi_atti'), {
        ...accessoData,
        userId: auth.currentUser.uid, // Associa l'accesso all'utente corrente
        dataCreazione: serverTimestamp(),
        dataUltimaModifica: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      console.error("Errore aggiungendo accesso atti: ", error);
      throw error;
    }
  };

  const updateAccesso = async (id, updates) => {
    try {
      const accessoRef = doc(db, 'accessi_atti', id);
      await updateDoc(accessoRef, {
        ...updates,
        dataUltimaModifica: serverTimestamp(),
      });
      return true;
    } catch (error) {
      console.error("Errore aggiornando accesso atti: ", error);
      throw error;
    }
  };

  const deleteAccesso = async (id) => {
    try {
      await deleteDoc(doc(db, 'accessi_atti', id));
      return true;
    } catch (error) {
      console.error("Errore eliminando accesso atti: ", error);
      throw error;
    }
  };

  const value = {
    accessi,
    loading,
    addAccesso,
    updateAccesso,
    deleteAccesso,
    fetchAccessi, // Esponi per refresh manuale se necessario
  };

  return (
    <AccessoAttiContext.Provider value={value}>
      {children}
    </AccessoAttiContext.Provider>
  );
}
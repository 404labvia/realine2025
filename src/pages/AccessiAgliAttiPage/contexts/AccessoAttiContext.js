// src/pages/AccessiAgliAttiPage/contexts/AccessoAttiContext.js
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { db, auth } from '../../../firebase';
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
        setAccessi([]);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  const fetchAccessi = useCallback(() => {
    if (!currentUserId) {
      setLoading(false);
      setAccessi([]);
      return () => {};
    }

    setLoading(true);
    const q = query(
      collection(db, 'accessi_atti'),
      where('userId', '==', currentUserId),
      orderBy('dataCreazione', 'desc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const accessiList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        dataCreazione: doc.data().dataCreazione?.toDate(),
        dataUltimaModifica: doc.data().dataUltimaModifica?.toDate(),
      }));
      setAccessi(accessiList);
      setLoading(false);
    }, (error) => {
      console.error("Errore nel fetch degli accessi agli atti: ", error);
      setLoading(false);
    });

    return unsubscribe;
  }, [currentUserId]);

  useEffect(() => {
    const unsubscribe = fetchAccessi();
    return () => unsubscribe();
  }, [fetchAccessi]);

  const addAccesso = async (accessoData) => {
    if (!auth.currentUser) {
      throw new Error("Utente non autenticato.");
    }
    try {
      const docRef = await addDoc(collection(db, 'accessi_atti'), {
        ...accessoData,
        userId: auth.currentUser.uid,
        dataCreazione: serverTimestamp(),
        dataUltimaModifica: serverTimestamp(),
        // Inizializza i nuovi campi booleani per il progresso
        faseDocumentiDelegaCompletata: accessoData.faseDocumentiDelegaCompletata || false,
        faseRichiestaInviataCompletata: accessoData.faseRichiestaInviataCompletata || false,
        faseDocumentiRicevutiCompletata: accessoData.faseDocumentiRicevutiCompletata || false,
        stato: accessoData.stato || "In Attesa", // Stato di default se non fornito
        // Rimuovi il vecchio campo 'progresso' se non più necessario o aggiornalo in base alle checkbox
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
    fetchAccessi,
  };

  return (
    <AccessoAttiContext.Provider value={value}>
      {children}
    </AccessoAttiContext.Provider>
  );
}
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
      const accessiList = querySnapshot.docs.map(docSnapshot => {
        const data = docSnapshot.data();
        return {
          id: docSnapshot.id,
          ...data,
          dataCreazione: data.dataCreazione?.toDate(),
          dataUltimaModifica: data.dataUltimaModifica?.toDate(),
          dataFaseDocumentiDelega: data.dataFaseDocumentiDelega?.toDate(),
          dataFaseRichiestaInviata: data.dataFaseRichiestaInviata?.toDate(),
          dataFaseDocumentiRicevuti: data.dataFaseDocumentiRicevuti?.toDate(),
          completata: data.completata || false, // Nuovo campo
        };
      });
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
      const dataToSave = {
        ...accessoData,
        userId: auth.currentUser.uid,
        dataCreazione: serverTimestamp(),
        dataUltimaModifica: serverTimestamp(),
        completata: false, // Nuovo campo
        faseDocumentiDelegaCompletata: accessoData.faseDocumentiDelegaCompletata || false,
        dataFaseDocumentiDelega: accessoData.faseDocumentiDelegaCompletata ? serverTimestamp() : null,
        faseRichiestaInviataCompletata: accessoData.faseRichiestaInviataCompletata || false,
        dataFaseRichiestaInviata: accessoData.faseRichiestaInviataCompletata ? serverTimestamp() : null,
        faseDocumentiRicevutiCompletata: accessoData.faseDocumentiRicevutiCompletata || false,
        dataFaseDocumentiRicevuti: accessoData.faseDocumentiRicevutiCompletata ? serverTimestamp() : null,
      };

      const docRef = await addDoc(collection(db, 'accessi_atti'), dataToSave);
      return docRef.id;
    } catch (error) {
      console.error("Errore aggiungendo accesso atti: ", error);
      throw error;
    }
  };

  const updateAccesso = async (id, updates) => {
    try {
      const accessoRef = doc(db, 'accessi_atti', id);
      const dataToUpdate = { ...updates, dataUltimaModifica: serverTimestamp() };

      // Gestione date per le fasi di progresso durante l'aggiornamento
      if (updates.hasOwnProperty('faseDocumentiDelegaCompletata')) {
        dataToUpdate.dataFaseDocumentiDelega = updates.faseDocumentiDelegaCompletata ? serverTimestamp() : null;
      }
      if (updates.hasOwnProperty('faseRichiestaInviataCompletata')) {
        dataToUpdate.dataFaseRichiestaInviata = updates.faseRichiestaInviataCompletata ? serverTimestamp() : null;
      }
      if (updates.hasOwnProperty('faseDocumentiRicevutiCompletata')) {
        dataToUpdate.dataFaseDocumentiRicevuti = updates.faseDocumentiRicevutiCompletata ? serverTimestamp() : null;
      }

      // Gestione aggiornamento date personalizzate
      if (updates.dataFaseDocumentiDelega && updates.dataFaseDocumentiDelega instanceof Date) {
        dataToUpdate.dataFaseDocumentiDelega = updates.dataFaseDocumentiDelega;
      }
      if (updates.dataFaseRichiestaInviata && updates.dataFaseRichiestaInviata instanceof Date) {
        dataToUpdate.dataFaseRichiestaInviata = updates.dataFaseRichiestaInviata;
      }
      if (updates.dataFaseDocumentiRicevuti && updates.dataFaseDocumentiRicevuti instanceof Date) {
        dataToUpdate.dataFaseDocumentiRicevuti = updates.dataFaseDocumentiRicevuti;
      }

      await updateDoc(accessoRef, dataToUpdate);
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
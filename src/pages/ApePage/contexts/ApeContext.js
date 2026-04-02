// src/pages/ApePage/contexts/ApeContext.js
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
  getDocs,
} from 'firebase/firestore';

const ApeContext = createContext();

export function useApe() {
  return useContext(ApeContext);
}

export function ApeProvider({ children }) {
  const [ape, setApe] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(user => {
      if (user) {
        setCurrentUserId(user.uid);
      } else {
        setCurrentUserId(null);
        setApe([]);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  const fetchApe = useCallback(() => {
    if (!currentUserId) {
      setLoading(false);
      setApe([]);
      return () => {};
    }

    setLoading(true);
    const q = query(
      collection(db, 'ape'),
      where('userId', '==', currentUserId),
      orderBy('dataCreazione', 'desc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const apeList = querySnapshot.docs.map(docSnapshot => {
        const data = docSnapshot.data();
        return {
          id: docSnapshot.id,
          ...data,
          dataCreazione: data.dataCreazione?.toDate(),
          dataUltimaModifica: data.dataUltimaModifica?.toDate(),
          dataFaseRichiesta: data.dataFaseRichiesta?.toDate(),
          dataFaseEsecuzione: data.dataFaseEsecuzione?.toDate(),
          dataFasePagamento: data.dataFasePagamento?.toDate(),
          completata: data.completata || false,
        };
      });
      setApe(apeList);
      setLoading(false);
    }, (error) => {
      console.error("Errore nel fetch degli APE: ", error);
      setLoading(false);
    });

    return unsubscribe;
  }, [currentUserId]);

  useEffect(() => {
    const unsubscribe = fetchApe();
    return () => unsubscribe();
  }, [fetchApe]);

  const addApe = async (apeData) => {
    if (!auth.currentUser) {
      throw new Error("Utente non autenticato.");
    }
    try {
      const dataToSave = {
        ...apeData,
        userId: auth.currentUser.uid,
        dataCreazione: serverTimestamp(),
        dataUltimaModifica: serverTimestamp(),
        completata: false,
        faseRichiestaCompletata: apeData.faseRichiestaCompletata || false,
        dataFaseRichiesta: apeData.faseRichiestaCompletata ? serverTimestamp() : null,
        faseEsecuzioneCompletata: apeData.faseEsecuzioneCompletata || false,
        dataFaseEsecuzione: apeData.faseEsecuzioneCompletata ? serverTimestamp() : null,
        fasePagamentoCompletata: apeData.fasePagamentoCompletata || false,
        dataFasePagamento: apeData.fasePagamentoCompletata ? serverTimestamp() : null,
      };

      const docRef = await addDoc(collection(db, 'ape'), dataToSave);
      return docRef.id;
    } catch (error) {
      console.error("Errore aggiungendo APE: ", error);
      throw error;
    }
  };

  const updateApe = async (id, updates) => {
    try {
      const apeRef = doc(db, 'ape', id);
      const dataToUpdate = { ...updates, dataUltimaModifica: serverTimestamp() };

      // Gestione date per le fasi di progresso durante l'aggiornamento
      if (updates.hasOwnProperty('faseRichiestaCompletata')) {
        dataToUpdate.dataFaseRichiesta = updates.faseRichiestaCompletata ? serverTimestamp() : null;
      }
      if (updates.hasOwnProperty('faseEsecuzioneCompletata')) {
        dataToUpdate.dataFaseEsecuzione = updates.faseEsecuzioneCompletata ? serverTimestamp() : null;
      }
      if (updates.hasOwnProperty('fasePagamentoCompletata')) {
        dataToUpdate.dataFasePagamento = updates.fasePagamentoCompletata ? serverTimestamp() : null;
      }

      // Gestione aggiornamento date personalizzate
      if (updates.dataFaseRichiesta && updates.dataFaseRichiesta instanceof Date) {
        dataToUpdate.dataFaseRichiesta = updates.dataFaseRichiesta;
      }
      if (updates.dataFaseEsecuzione && updates.dataFaseEsecuzione instanceof Date) {
        dataToUpdate.dataFaseEsecuzione = updates.dataFaseEsecuzione;
      }
      if (updates.dataFasePagamento && updates.dataFasePagamento instanceof Date) {
        dataToUpdate.dataFasePagamento = updates.dataFasePagamento;
      }

      await updateDoc(apeRef, dataToUpdate);
      return true;
    } catch (error) {
      console.error("Errore aggiornando APE: ", error);
      throw error;
    }
  };

  const deleteApe = async (id) => {
    try {
      await deleteDoc(doc(db, 'ape', id));
      return true;
    } catch (error) {
      console.error("Errore eliminando APE: ", error);
      throw error;
    }
  };

  const generateNextCodice = async () => {
    if (!auth.currentUser) {
      throw new Error("Utente non autenticato.");
    }

    try {
      const currentYear = new Date().getFullYear();
      const yearSuffix = currentYear.toString().slice(-2); // Ultime 2 cifre (es. "26")

      // Query per ottenere tutte le APE dell'utente corrente
      const q = query(
        collection(db, 'ape'),
        where('userId', '==', auth.currentUser.uid)
      );

      const querySnapshot = await getDocs(q);

      // Filtra le APE dell'anno corrente ed estrai i numeri progressivi
      let maxNumber = 0;
      querySnapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        const codice = data.codice || '';

        // Verifica se il codice termina con l'anno corrente (es. "-26")
        if (codice.endsWith(`-${yearSuffix}`)) {
          // Estrai la parte numerica prima del trattino
          const match = codice.match(/^(\d+)-/);
          if (match) {
            const numero = parseInt(match[1], 10);
            if (numero > maxNumber) {
              maxNumber = numero;
            }
          }
        }
      });

      // Incrementa e formatta
      const nextNumber = maxNumber + 1;
      const formattedNumber = nextNumber.toString().padStart(3, '0'); // Es. "001"
      return `${formattedNumber}-${yearSuffix}`;
    } catch (error) {
      console.error("Errore generando codice APE: ", error);
      throw error;
    }
  };

  const value = {
    ape,
    loading,
    addApe,
    updateApe,
    deleteApe,
    fetchApe,
    generateNextCodice,
  };

  return (
    <ApeContext.Provider value={value}>
      {children}
    </ApeContext.Provider>
  );
}
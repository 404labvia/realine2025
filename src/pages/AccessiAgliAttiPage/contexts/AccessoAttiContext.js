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

// !!! PASSO 1: Importa il tuo hook per Google Calendar !!!
// Assicurati che il percorso sia corretto per la tua struttura di progetto
import { useGoogleCalendarApi } from '../../../pages/CalendarPage/hooks/useGoogleCalendarApi';


const AccessoAttiContext = createContext();

export function useAccessiAtti() {
  return useContext(AccessoAttiContext);
}

export function AccessoAttiProvider({ children }) {
  const [accessi, setAccessi] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);

  // !!! PASSO 2: Istanzia l'hook per ottenere la funzione addGoogleEvent !!!
  const { addGoogleEvent } = useGoogleCalendarApi(); // Se non hai altre funzioni, puoi destrutturare solo addGoogleEvent

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(user => {
      if (user) {
        setCurrentUserId(user.uid);
      } else {
        setCurrentUserId(null);
        setAccessi([]); // Resetta gli accessi al logout
        setLoading(false); // Imposta loading a false se non c'è utente
      }
    });
    return () => unsubscribeAuth();
  }, []);

  // useCallback per fetchAccessi per evitare ricreazioni non necessarie
  const fetchAccessi = useCallback((userId) => {
    if (!userId) {
      setAccessi([]);
      setLoading(false);
      return () => {}; // Ritorna una funzione vuota per lo cleanup
    }

    setLoading(true);
    const q = query(
      collection(db, 'accessi_atti'),
      where('userId', '==', userId), // Filtra per userId
      orderBy('dataCreazione', 'desc') // Ordina per dataCreazione o altro campo rilevante
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const accessiData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setAccessi(accessiData);
        setLoading(false);
      },
      (error) => {
        console.error("Errore nel fetch degli accessi atti: ", error);
        setLoading(false);
      }
    );

    return unsubscribe; // Ritorna la funzione di unsubscribe per il cleanup
  }, []); // Nessuna dipendenza esterna diretta se currentUserId è gestito dall'effetto

  useEffect(() => {
    if (currentUserId) {
      const unsubscribe = fetchAccessi(currentUserId);
      return () => unsubscribe();
    } else {
      // Assicurati che lo stato sia pulito se non c'è utente
      setAccessi([]);
      setLoading(false);
    }
  }, [currentUserId, fetchAccessi]);


  const addAccesso = async (accessoData) => {
    if (!currentUserId) {
      console.error("Utente non autenticato. Impossibile aggiungere accesso.");
      throw new Error("Utente non autenticato");
    }
    try {
      const docRef = await addDoc(collection(db, 'accessi_atti'), {
        ...accessoData,
        userId: currentUserId, // Associa l'ID utente corrente
        dataCreazione: serverTimestamp(),
        dataUltimaModifica: serverTimestamp(),
        // Inizializza i campi booleani e le date delle fasi se non presenti
        faseDocumentiDelegaCompletata: accessoData.faseDocumentiDelegaCompletata || false,
        dataFaseDocumentiDelega: accessoData.faseDocumentiDelegaCompletata ? serverTimestamp() : null,
        faseRichiestaInviataCompletata: accessoData.faseRichiestaInviataCompletata || false,
        dataFaseRichiestaInviata: accessoData.faseRichiestaInviataCompletata ? serverTimestamp() : null,
        faseDocumentiRicevutiCompletata: accessoData.faseDocumentiRicevutiCompletata || false,
        dataFaseDocumentiRicevuti: accessoData.faseDocumentiRicevutiCompletata ? serverTimestamp() : null,
      });
      return docRef.id;
    } catch (error) {
      console.error("Errore aggiungendo accesso atti: ", error);
      throw error;
    }
  };

  // !!! PASSO 3: Modifica la funzione updateAccesso !!!
  const updateAccesso = async (id, updates) => {
    if (!currentUserId) {
      console.error("Utente non autenticato. Impossibile aggiornare accesso.");
      throw new Error("Utente non autenticato");
    }
    try {
      // Trova lo stato corrente dell'accesso prima dell'aggiornamento
      const accessoAttuale = accessi.find(a => a.id === id);
      const prevFaseRichiestaInviataCompletata = accessoAttuale ? accessoAttuale.faseRichiestaInviataCompletata : false;

      const accessoRef = doc(db, 'accessi_atti', id);
      const dataToUpdate = { ...updates, dataUltimaModifica: serverTimestamp() };

      // Gestione intelligente delle date delle fasi
      // Queste date vengono aggiornate solo se il flag corrispondente viene passato in 'updates'
      if (updates.hasOwnProperty('faseDocumentiDelegaCompletata')) {
        dataToUpdate.dataFaseDocumentiDelega = updates.faseDocumentiDelegaCompletata ? serverTimestamp() : null;
      }
      if (updates.hasOwnProperty('faseRichiestaInviataCompletata')) {
        dataToUpdate.dataFaseRichiestaInviata = updates.faseRichiestaInviataCompletata ? serverTimestamp() : null;
      }
      if (updates.hasOwnProperty('faseDocumentiRicevutiCompletata')) {
        dataToUpdate.dataFaseDocumentiRicevuti = updates.faseDocumentiRicevutiCompletata ? serverTimestamp() : null;
      }

      await updateDoc(accessoRef, dataToUpdate);

      // --- INIZIO LOGICA GOOGLE CALENDAR ---
      // Controlla se 'faseRichiestaInviataCompletata' è presente in updates ed è true,
      // e se il suo valore precedente era false.
      if (updates.faseRichiestaInviataCompletata === true && !prevFaseRichiestaInviataCompletata) {
        // La fase è stata appena completata
        const indirizzoPerEvento = accessoAttuale?.indirizzo || updates.indirizzo || "Indirizzo non disponibile";

        const eventStartDate = new Date();
        eventStartDate.setDate(eventStartDate.getDate() + 30); // Aggiunge 30 giorni

        // Formatta la data in YYYY-MM-DD per un evento di un giorno intero
        const year = eventStartDate.getFullYear();
        const month = String(eventStartDate.getMonth() + 1).padStart(2, '0'); // +1 perché i mesi sono 0-indicizzati
        const day = String(eventStartDate.getDate()).padStart(2, '0');
        const formattedDate = `${year}-${month}-${day}`;

        const eventDetails = {
          summary: `ACCESSO ATTI controllo arrivo licenze ${indirizzoPerEvento}`,
          description: `Controllo automatico reminder per l'accesso atti relativo a: ${indirizzoPerEvento}.\nID Pratica: ${id}. Controllare lo stato delle licenze/documenti attesi.`,
          start: {
            date: formattedDate, // Evento di un giorno intero
            // timeZone: 'Europe/Rome', // Opzionale per eventi "date", ma buona pratica per "dateTime"
          },
          end: {
            date: formattedDate, // Evento di un giorno intero
            // timeZone: 'Europe/Rome',
          },
          // Potresti voler aggiungere altri dettagli come attendees, reminders, etc.
        };

        try {
          console.log("Tentativo di creazione evento Google Calendar:", eventDetails);
          await addGoogleEvent(eventDetails);
          console.log(`Evento Google Calendar creato con successo per accesso ${id} - ${indirizzoPerEvento}`);
          // Qui potresti voler notificare l'utente del successo (es. con un toast/snackbar)
        } catch (calendarError) {
          console.error(`Errore durante la creazione dell'evento Google Calendar per accesso ${id}:`, calendarError);
          // Qui potresti voler notificare l'utente dell'errore
        }
      }
      // --- FINE LOGICA GOOGLE CALENDAR ---

      // Non è necessario chiamare fetchAccessi qui perché onSnapshot aggiornerà automaticamente 'accessi'
      return true;
    } catch (error) {
      console.error("Errore aggiornando accesso atti: ", error);
      throw error;
    }
  };

  const deleteAccesso = async (id) => {
    if (!currentUserId) {
      console.error("Utente non autenticato. Impossibile eliminare accesso.");
      throw new Error("Utente non autenticato");
    }
    try {
      await deleteDoc(doc(db, 'accessi_atti', id));
      // Non è necessario chiamare fetchAccessi qui perché onSnapshot aggiornerà automaticamente 'accessi'
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
    fetchAccessi, // Esponi fetchAccessi se necessario altrove, ma l'effect lo gestisce
    currentUserId
  };

  return (
    <AccessoAttiContext.Provider value={value}>
      {!loading && children}
    </AccessoAttiContext.Provider>
  );
}
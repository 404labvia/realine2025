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
  getDoc,
} from 'firebase/firestore';
import { useGoogleCalendarApi } from '../../CalendarPage/hooks/useGoogleCalendarApi'; // Verifica percorso
import { format, addDays } from 'date-fns'; // Per la manipolazione delle date

const AccessoAttiContext = createContext();

export function useAccessiAtti() {
  return useContext(AccessoAttiContext);
}

export function AccessoAttiProvider({ children }) {
  const [accessi, setAccessi] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);

  // Utilizza l'hook di Google Calendar API
  const { gapiClientInitialized, googleApiToken, addGoogleEvent, deleteGoogleEvent } = useGoogleCalendarApi(); // Aggiunto deleteGoogleEvent

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(user => {
      if (user) {
        setCurrentUserId(user.uid);
      } else {
        setCurrentUserId(null);
        setAccessi([]);
        setLoading(false);
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
      orderBy('dataCreazione', 'desc') // o un altro campo di ordinamento se preferisci
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const accessiData = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
      setAccessi(accessiData);
      setLoading(false);
    }, (error) => {
      console.error("Errore nel caricare gli accessi atti:", error);
      setLoading(false);
    });
    return unsubscribe;
  }, [currentUserId]);

  useEffect(() => {
    const unsubscribeFirestore = fetchAccessi();
    return () => {
      if (unsubscribeFirestore) {
        unsubscribeFirestore();
      }
    };
  }, [fetchAccessi]);

  const addAccesso = async (nuovoAccesso) => {
    if (!currentUserId) {
        console.error("Utente non autenticato, impossibile aggiungere.");
        throw new Error("Utente non autenticato.");
    }
    try {
        const docRef = await addDoc(collection(db, 'accessi_atti'), {
            ...nuovoAccesso,
            userId: currentUserId,
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
    if (!currentUserId) {
      console.error("Utente non autenticato, impossibile aggiornare.");
      throw new Error("Utente non autenticato.");
    }
    try {
      const accessoRef = doc(db, 'accessi_atti', id);
      const docSnap = await getDoc(accessoRef);

      if (!docSnap.exists()) {
        console.error("Documento accesso atti non trovato per l'aggiornamento:", id);
        throw new Error("Documento non trovato.");
      }
      const accessoOriginale = docSnap.data();

      const dataToUpdate = { ...updates, dataUltimaModifica: serverTimestamp() };

      // Gestione date per le fasi di progresso
      if (updates.hasOwnProperty('faseDocumentiDelegaCompletata')) {
        dataToUpdate.dataFaseDocumentiDelega = updates.faseDocumentiDelegaCompletata ? serverTimestamp() : null;
      }
      if (updates.hasOwnProperty('faseRichiestaInviataCompletata')) {
        dataToUpdate.dataFaseRichiestaInviata = updates.faseRichiestaInviataCompletata ? serverTimestamp() : null;
      }
      if (updates.hasOwnProperty('faseDocumentiRicevutiCompletata')) {
        dataToUpdate.dataFaseDocumentiRicevuti = updates.faseDocumentiRicevutiCompletata ? serverTimestamp() : null;
      }
      // Aggiungi qui la gestione per altre fasi se necessario

      await updateDoc(accessoRef, dataToUpdate);

      // --- INIZIO LOGICA AUTOMAZIONE GOOGLE CALENDAR ---
      const flagRichiestaInviataImpostato = dataToUpdate.faseRichiestaInviataCompletata === true;
      const promemoriaGiaEsistente = accessoOriginale.promemoriaLicenzeCalendarEventId;

      const indirizzoPerEvento = updates.indirizzo || accessoOriginale.indirizzo || 'Indirizzo non specificato';
 // LOG DI DEBUG PER GOOGLE CALENDAR API STATUS
      console.log("AccessoAttiContext DEBUG Calendar Automation Trigger:", {
        flagRichiestaInviataImpostato,
        promemoriaGiaEsistente: !!promemoriaGiaEsistente, // logga come booleano
        gapiClientInitialized,
        hasGoogleApiToken: !!googleApiToken, // logga se il token esiste
        isAddGoogleEventFunction: typeof addGoogleEvent === 'function',
        addGoogleEventFunction: addGoogleEvent // logga la funzione stessa per ispezionarla se necessario
      });

      if (flagRichiestaInviataImpostato && !promemoriaGiaEsistente && gapiClientInitialized && googleApiToken && typeof addGoogleEvent === 'function') {
        // ... resto della logica di creazione evento ...
      } else if (flagRichiestaInviataImpostato && !promemoriaGiaEsistente) { // Modificato per loggare solo se le condizioni API falliscono
        console.warn(`AccessoAttiContext: Impossibile creare evento Google Calendar per accesso ID: ${id}. Dettagli API:`, {gapiClientInitialized, hasToken: !!googleApiToken, isFunc: typeof addGoogleEvent === 'function'});
        alert("L'accesso atti è stato aggiornato, ma il promemoria su Google Calendar non può essere creato in questo momento. Assicurati di essere autenticato con Google e che l'API di Calendar sia accessibile. Controlla la console per dettagli.");
      }
      if (flagRichiestaInviataImpostato && !promemoriaGiaEsistente && gapiClientInitialized && googleApiToken && typeof addGoogleEvent === 'function') {
        console.log(`AccessoAttiContext: Trigger automazione promemoria Google Calendar per accesso ID: ${id}`);

        const dataBasePromemoria = new Date(); // Usa la data/ora corrente del client come riferimento
        const dataEventoPromemoria = addDays(dataBasePromemoria, 30);
        const dataEventoFormattata = format(dataEventoPromemoria, 'yyyy-MM-dd'); // Formato YYYY-MM-DD per eventi giornalieri

        const eventDetails = {
          summary: `ACCESSO ATTI controllo arrivo licenze ${indirizzoPerEvento}`,
          start: {
            date: dataEventoFormattata,
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone, // Fuso orario del browser utente
          },
          end: {
            date: dataEventoFormattata, // Evento di un giorno intero
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
          description: `Promemoria automatico per l'accesso agli atti con codice: ${accessoOriginale.codice || id}, Indirizzo: ${indirizzoPerEvento}. Creato il ${format(new Date(), 'dd/MM/yyyy HH:mm')}.`,
          // Puoi aggiungere qui altri dettagli, come i promemoria predefiniti
          reminders: {
            useDefault: true, // Usa i promemoria predefiniti dell'utente su Google Calendar
          },
        };

        try {
          console.log("AccessoAttiContext: Tentativo di creazione evento Google Calendar:", eventDetails);
          // Assumi che 'primary' sia il calendario target. Modifica se necessario.
          const calendarEvent = await addGoogleEvent(eventDetails, 'primary');

          if (calendarEvent && calendarEvent.id) {
            console.log("AccessoAttiContext: Evento Google Calendar creato con ID:", calendarEvent.id);
            // Aggiorna il documento Firestore con l'ID dell'evento di Calendar
            await updateDoc(accessoRef, {
              promemoriaLicenzeCalendarEventId: calendarEvent.id,
              dataUltimaModifica: serverTimestamp(), // Aggiorna anche la data di ultima modifica
            });
            console.log(`AccessoAttiContext: Campo promemoriaLicenzeCalendarEventId aggiornato su Firestore per accesso ID: ${id}`);
          } else {
            console.warn("AccessoAttiContext: La creazione dell'evento Google Calendar non ha restituito un ID valido.", calendarEvent);
            // Potresti voler comunque marcare che un tentativo è stato fatto, o loggare diversamente
          }

        } catch (calendarError) {
          console.error("AccessoAttiContext: Errore durante la creazione dell'evento Google Calendar:", calendarError);
          alert(`L'accesso atti è stato aggiornato, ma si è verificato un errore durante la creazione del promemoria su Google Calendar: ${calendarError.result?.error?.message || calendarError.message || 'Errore sconosciuto'}. Controlla la console per dettagli.`);
        }
      } else if (flagRichiestaInviataImpostato && promemoriaGiaEsistente) {
        console.log(`AccessoAttiContext: Promemoria Google Calendar già esistente (ID evento: ${promemoriaGiaEsistente}) per accesso ID: ${id}`);
      } else if (flagRichiestaInviataImpostato) { // Il flag è true ma l'API non è pronta
        console.warn(`AccessoAttiContext: Impossibile creare evento Google Calendar per accesso ID: ${id}. API non pronta, token mancante o funzione addGoogleEvent non disponibile.`, {gapiClientInitialized, hasToken: !!googleApiToken, hasFunc: typeof addGoogleEvent});
        alert("L'accesso atti è stato aggiornato, ma il promemoria su Google Calendar non può essere creato in questo momento. Assicurati di essere autenticato con Google e che l'API di Calendar sia accessibile.");
      }
      // --- FINE LOGICA AUTOMAZIONE GOOGLE CALENDAR ---

      return true;
    } catch (error) {
      console.error("Errore aggiornando accesso atti (updateAccesso principale): ", error);
      throw error;
    }
  };

  const deleteAccesso = async (id) => {
    if (!currentUserId) {
      console.error("Utente non autenticato, impossibile eliminare.");
      throw new Error("Utente non autenticato.");
    }
    try {
      const accessoRef = doc(db, 'accessi_atti', id);
      const docSnap = await getDoc(accessoRef);

      if (docSnap.exists()) {
        const accessoData = docSnap.data();
        // Se l'automazione del calendario è attiva e l'evento esiste, prova a eliminarlo
        if (accessoData.promemoriaLicenzeCalendarEventId && gapiClientInitialized && googleApiToken && typeof deleteGoogleEvent === 'function') {
          try {
            console.log(`AccessoAttiContext: Tentativo di eliminazione evento Calendar ID: ${accessoData.promemoriaLicenzeCalendarEventId}`);
            // Assumi 'primary' come calendarId, modifica se necessario
            await deleteGoogleEvent(accessoData.promemoriaLicenzeCalendarEventId, 'primary');
            console.log(`AccessoAttiContext: Evento Calendar ${accessoData.promemoriaLicenzeCalendarEventId} eliminato.`);
          } catch (calendarError) {
            console.warn(`AccessoAttiContext: Errore eliminando evento Calendar associato (ID: ${accessoData.promemoriaLicenzeCalendarEventId}). Potrebbe essere già stato eliminato o i permessi sono cambiati. Errore:`, calendarError.result?.error?.message || calendarError.message);
            // Non bloccare l'eliminazione dell'accesso atti se l'evento di calendario non può essere eliminato
          }
        }
      }
      await deleteDoc(accessoRef);
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
    // Includi qui altre funzioni o valori che il contesto deve esporre
  };

  return (
    <AccessoAttiContext.Provider value={value}>
      {children}
    </AccessoAttiContext.Provider>
  );
}
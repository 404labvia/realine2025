// src/pages/CalendarPage/hooks/useGoogleCalendarApi.js
//
// Le operazioni su Google Calendar passano da Cloud Functions callable, che usano
// un Service Account lato server (vedi functions/index.js). Niente più OAuth utente,
// niente token in localStorage, niente refresh: l'utente loggato a Firebase usa il
// calendario direttamente. Questo elimina il problema della scadenza token ogni ora
// e la dipendenza dai popup/iframe (che gli ad blocker bloccavano).
import { useState, useEffect, useCallback } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../../firebase';
import { calendarIds } from '../utils/calendarUtils';

// Calendari gestiti: solo i 2 attivi. 'primary' = REALINE Badalucco (alias risolto lato server).
// Castro e Antonelli rimossi (mai usati, non condivisi col service account).
const ALL_CALENDAR_IDS = [
  'primary',
  calendarIds.ID_DE_ANTONI,
].filter(Boolean);

// Callable verso le Cloud Functions (server-side, service account).
const callList = httpsCallable(functions, 'listCalendarEvents');
const callCreate = httpsCallable(functions, 'createCalendarEvent');
const callUpdate = httpsCallable(functions, 'updateCalendarEvent');
const callDelete = httpsCallable(functions, 'deleteCalendarEvent');

// Mappa un item evento Google nello shape usato dall'app.
const mapEvent = (item, calendarId) => ({
  id: item.id,
  title: item.summary || '(Nessun titolo)',
  start: new Date(item.start.dateTime || item.start.date),
  end: new Date(item.end.dateTime || item.end.date),
  description: item.description || '',
  location: item.location || '',
  category: item.extendedProperties?.private?.category || 'altro',
  relatedPraticaId: item.extendedProperties?.private?.relatedPraticaId || '',
  isPrivate: item.extendedProperties?.private?.isPrivate === 'true',
  priority: item.extendedProperties?.private?.priority || 'normale',
  noDueDate: item.extendedProperties?.private?.noDueDate === 'true',
  googleEvent: true,
  sourceCalendarId: calendarId, // Importante per modifiche/cancellazioni
});

export const useGoogleCalendarApi = () => {
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);

  const fetchGoogleEvents = useCallback(async () => {
    setIsLoadingEvents(true);
    try {
      const timeMin = new Date(new Date().setMonth(new Date().getMonth() - 2)).toISOString();
      const timeMax = new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString();

      const { data } = await callList({ calendarIds: ALL_CALENDAR_IDS, timeMin, timeMax });
      const results = (data && data.results) || [];
      const events = results.flatMap(({ calendarId, items, error }) => {
        if (error) console.error(`Errore caricando eventi da ${calendarId}:`, error);
        return (items || []).map((item) => mapEvent(item, calendarId));
      });
      setCalendarEvents(events);
    } catch (error) {
      console.error('Errore generale in fetchGoogleEvents (hook):', error);
      alert('Errore nel comunicare con Google Calendar.');
    } finally {
      setIsLoadingEvents(false);
    }
  }, []);

  // Carica gli eventi all'avvio della pagina.
  useEffect(() => {
    fetchGoogleEvents();
  }, [fetchGoogleEvents]);

  const createGoogleEvent = useCallback(async (eventResource, targetCalendarId = 'primary') => {
    try {
      const { data } = await callCreate({ calendarId: targetCalendarId, resource: eventResource });
      await fetchGoogleEvents();
      return data; // Evento creato
    } catch (error) {
      console.error(`Errore creazione evento su ${targetCalendarId}:`, error);
      throw error;
    }
  }, [fetchGoogleEvents]);

  const updateGoogleEvent = useCallback(async (eventId, eventResource, targetCalendarId = 'primary') => {
    try {
      const { data } = await callUpdate({ calendarId: targetCalendarId, eventId, resource: eventResource });
      await fetchGoogleEvents();
      return data; // Evento aggiornato
    } catch (error) {
      console.error(`Errore aggiornamento evento su ${targetCalendarId}:`, error);
      fetchGoogleEvents(); // Risincronizza anche in caso di errore
      throw error;
    }
  }, [fetchGoogleEvents]);

  const deleteGoogleEvent = useCallback(async (eventId, targetCalendarId = 'primary') => {
    try {
      await callDelete({ calendarId: targetCalendarId, eventId });
      // Aggiorna subito lo stato locale, poi risincronizza dal server.
      setCalendarEvents((prev) => prev.filter((event) => event.id !== eventId));
      await fetchGoogleEvents();
    } catch (error) {
      console.error(`Errore eliminazione evento ${eventId} su ${targetCalendarId}:`, error);
      throw error;
    }
  }, [fetchGoogleEvents]);

  return {
    calendarEvents,
    isLoadingEvents,
    fetchGoogleEvents,
    createGoogleEvent,
    updateGoogleEvent,
    deleteGoogleEvent,
    // --- Stub di retro-compatibilità ---
    // Il calendario ora è sempre disponibile (service account server-side): non esiste
    // più login/token OAuth lato browser. Questi valori mantengono funzionanti i gating
    // delle altre pagine (Dashboard, Pratiche, PraticheBoard, PratichePrivato, CalendarTask)
    // senza doverle riscrivere: si comportano come "sempre autenticato e pronto".
    googleApiToken: 'service-account',
    gapiClientInitialized: true,
    isLoadingGapi: false,
    loginToGoogle: fetchGoogleEvents, // l'eventuale "Connetti" ora si limita a (ri)caricare gli eventi
    logoutFromGoogle: () => {},
  };
};

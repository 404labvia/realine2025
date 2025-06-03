// src/pages/Dashboard/hooks/useTodoListItems.js
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useGoogleCalendarApi } from '../../CalendarPage/hooks/useGoogleCalendarApi';
import { usePratiche } from '../../../contexts/PraticheContext'; // Per i dettagli delle pratiche
import { usePratichePrivato } from '../../../contexts/PratichePrivatoContext'; // Per i dettagli delle pratiche private
import { getCompletedState, setCompletedState } from '../../../services/todoStateService'; // Il nostro nuovo servizio
import { startOfDay, endOfDay, addDays, startOfWeek, endOfWeek, parseISO, isValid } from 'date-fns';

// Definiamo l'interfaccia TodoItem per chiarezza
// interface TodoItem {
//   gCalEventId: string;
//   gCalCalendarId: string;
//   title: string;
//   dueDate: Date;
//   endDate?: Date;
//   isCompleted: boolean;
//   praticaInfo?: { id: string; codice?: string; indirizzo?: string; cliente?: string; };
//   originalGCalEventData: any;
// }

export const useTodoListItems = () => {
  const { googleApiToken, gapiClientInitialized, calendarEvents, fetchGoogleEvents, isLoadingEvents: isLoadingCalendarEvents } = useGoogleCalendarApi();
  const { pratiche: praticheStandard, loading: loadingPraticheStd } = usePratiche();
  const { pratiche: pratichePrivate, loading: loadingPratichePriv } = usePratichePrivato();

  const [allTodoItems, setAllTodoItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Stato per i filtri
  const [activeFilter, setActiveFilter] = useState('inCorso'); // 'inCorso', 'completate'
  const [dateFilter, setDateFilter] = useState('all'); // 'all', 'today', 'tomorrow', 'week'
  const [selectedPraticaIdFilter, setSelectedPraticaIdFilter] = useState(''); // ID della pratica per filtrare

  // Combina pratiche standard e private per cercare i dettagli
  const tutteLePratiche = useMemo(() => {
    if (loadingPraticheStd || loadingPratichePriv) return [];
    const std = Array.isArray(praticheStandard) ? praticheStandard : [];
    const prv = Array.isArray(pratichePrivate) ? pratichePrivate : [];
    return [...std, ...prv];
  }, [praticheStandard, pratichePrivate, loadingPraticheStd, loadingPratichePriv]);


  // Trasforma eventi GCal in TodoItem e applica stato di completamento
  useEffect(() => {
    if (!isLoadingCalendarEvents && gapiClientInitialized && googleApiToken) {
      setIsLoading(true);
      const transformedItems = calendarEvents
        .filter(event => event.sourceCalendarId === 'primary') // Solo calendario primario
        .map(event => {
          let praticaInfo = null;
          const relatedPraticaId = event.extendedProperties?.private?.relatedPraticaId;
          if (relatedPraticaId) {
            const praticaTrovata = tutteLePratiche.find(p => p.id === relatedPraticaId);
            if (praticaTrovata) {
              praticaInfo = {
                id: praticaTrovata.id,
                codice: praticaTrovata.codice,
                indirizzo: praticaTrovata.indirizzo,
                cliente: praticaTrovata.cliente,
              };
            }
          }

          // La data di inizio dell'evento è la nostra dueDate per la ToDoList
          // Google Calendar restituisce date in formato stringa ISO o oggetti Date a seconda del client GAPI
          let validDueDate;
          if (event.start?.dateTime) {
            validDueDate = parseISO(event.start.dateTime);
          } else if (event.start?.date) { // Eventi giornalieri
            validDueDate = parseISO(event.start.date);
          } else if (event.start instanceof Date) {
            validDueDate = event.start;
          } else {
            console.warn("Formato data inizio evento non riconosciuto:", event.start);
            validDueDate = new Date(); // Fallback, anche se non ideale
          }

          let validEndDate;
           if (event.end?.dateTime) {
            validEndDate = parseISO(event.end.dateTime);
          } else if (event.end?.date) {
            validEndDate = parseISO(event.end.date);
          } else if (event.end instanceof Date) {
            validEndDate = event.end;
          }


          return {
            gCalEventId: event.id,
            gCalCalendarId: event.sourceCalendarId,
            title: event.summary || event.title || '(Nessun titolo)',
            dueDate: isValid(validDueDate) ? validDueDate : new Date(),
            endDate: isValid(validEndDate) ? validEndDate : undefined,
            isCompleted: getCompletedState(event.id),
            praticaInfo,
            originalGCalEventData: event,
          };
        });
      setAllTodoItems(transformedItems);
      setIsLoading(false);
    } else if (!googleApiToken && gapiClientInitialized) {
      // Se l'utente fa logout da Google, svuota la lista
      setAllTodoItems([]);
      setIsLoading(false);
    }
  }, [calendarEvents, googleApiToken, gapiClientInitialized, isLoadingCalendarEvents, tutteLePratiche]);

  const toggleComplete = useCallback((gCalEventId) => {
    const currentState = getCompletedState(gCalEventId);
    setCompletedState(gCalEventId, !currentState);
    // Aggiorna lo stato locale per riflettere il cambiamento immediatamente
    setAllTodoItems(prevItems =>
      prevItems.map(item =>
        item.gCalEventId === gCalEventId ? { ...item, isCompleted: !currentState } : item
      )
    );
  }, []);

  const filteredAndSortedItems = useMemo(() => {
    let items = [...allTodoItems];

    // 1. Filtra per stato completato/in corso
    if (activeFilter === 'inCorso') {
      items = items.filter(item => !item.isCompleted);
    } else if (activeFilter === 'completate') {
      items = items.filter(item => item.isCompleted);
    }

    // 2. Filtra per data
    const today = startOfDay(new Date());
    if (dateFilter === 'today') {
      items = items.filter(item => isValid(item.dueDate) && format(item.dueDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd'));
    } else if (dateFilter === 'tomorrow') {
      const tomorrow = startOfDay(addDays(today, 1));
      items = items.filter(item => isValid(item.dueDate) && format(item.dueDate, 'yyyy-MM-dd') === format(tomorrow, 'yyyy-MM-dd'));
    } else if (dateFilter === 'week') {
      const startOfThisWeek = startOfWeek(today, { weekStartsOn: 1 }); // Lunedì
      const endOfThisWeek = endOfWeek(today, { weekStartsOn: 1 });
      items = items.filter(item =>
        isValid(item.dueDate) &&
        item.dueDate >= startOfThisWeek &&
        item.dueDate <= endOfThisWeek
      );
    }
    // 'all' non necessita di filtri data aggiuntivi

    // 3. Filtra per pratica selezionata
    if (selectedPraticaIdFilter) {
      items = items.filter(item => item.praticaInfo?.id === selectedPraticaIdFilter);
    }

    // 4. Ordina per data di scadenza (ascendente)
    items.sort((a, b) => (isValid(a.dueDate) && isValid(b.dueDate) ? a.dueDate.getTime() - b.dueDate.getTime() : 0));

    return items;
  }, [allTodoItems, activeFilter, dateFilter, selectedPraticaIdFilter]);

  // Funzione per forzare il refresh degli eventi da Google Calendar
  const refreshCalendarEvents = useCallback(() => {
      if (googleApiToken && gapiClientInitialized) {
          fetchGoogleEvents(); // Chiamata fornita da useGoogleCalendarApi
      }
  },[googleApiToken, gapiClientInitialized, fetchGoogleEvents]);


  return {
    todoItems: filteredAndSortedItems,
    isLoading: isLoading || isLoadingCalendarEvents || loadingPraticheStd || loadingPratichePriv,
    toggleComplete,
    activeFilter,
    setActiveFilter,
    dateFilter,
    setDateFilter,
    selectedPraticaIdFilter,
    setSelectedPraticaIdFilter,
    praticheDisponibiliPerFiltro: tutteLePratiche.filter(p => p.codice && p.indirizzo), // Per popolare il dropdown filtro pratiche
    refreshCalendarEvents, // Aggiunta per permettere il refresh manuale
  };
};
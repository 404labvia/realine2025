// src/pages/Dashboard/hooks/useTodoListItems.js
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useGoogleCalendarApi } from '../../CalendarPage/hooks/useGoogleCalendarApi';
import { usePratiche } from '../../../contexts/PraticheContext';
import { usePratichePrivato } from '../../../contexts/PratichePrivatoContext';
import { getCompletedState, setCompletedState } from '../../../services/todoStateService';
import { startOfDay, addDays, startOfWeek, endOfWeek, parseISO, isValid, format, isPast, isToday } from 'date-fns';

export const useTodoListItems = () => {
  const { googleApiToken, gapiClientInitialized, calendarEvents, fetchGoogleEvents, isLoadingEvents: isLoadingCalendarEvents } = useGoogleCalendarApi();
  const { pratiche: praticheStandard, loading: loadingPraticheStd } = usePratiche();
  const { pratiche: pratichePrivate, loading: loadingPratichePriv } = usePratichePrivato();

  const [allTodoItems, setAllTodoItems] = useState([]);
  const [isLoadingHook, setIsLoadingHook] = useState(true);

  const [activeFilter, setActiveFilter] = useState('inCorso');
  const [dateFilter, setDateFilter] = useState('all');
  // selectedPraticaIdFilter rimosso

  const tutteLePratiche = useMemo(() => {
    if (loadingPraticheStd || loadingPratichePriv) return [];
    const std = Array.isArray(praticheStandard) ? praticheStandard : [];
    const prv = Array.isArray(pratichePrivate) ? pratichePrivate : [];
    return [...std, ...prv];
  }, [praticheStandard, pratichePrivate, loadingPraticheStd, loadingPratichePriv]);

  useEffect(() => {
    if (!isLoadingCalendarEvents && gapiClientInitialized && googleApiToken) {
      setIsLoadingHook(true);
      const transformedItems = calendarEvents
        .filter(event => event.sourceCalendarId === 'primary')
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

          let validDueDate, validEndDate;
          if (event.start?.dateTime) validDueDate = parseISO(event.start.dateTime);
          else if (event.start?.date) validDueDate = parseISO(event.start.date);
          else if (event.start instanceof Date) validDueDate = event.start;
          else validDueDate = new Date();

          if (event.end?.dateTime) validEndDate = parseISO(event.end.dateTime);
          else if (event.end?.date) validEndDate = parseISO(event.end.date);
          else if (event.end instanceof Date) validEndDate = event.end;

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
      setIsLoadingHook(false);
    } else if (!googleApiToken && gapiClientInitialized) {
      setAllTodoItems([]);
      setIsLoadingHook(false);
    }
  }, [calendarEvents, googleApiToken, gapiClientInitialized, isLoadingCalendarEvents, tutteLePratiche]);

  const toggleComplete = useCallback((gCalEventId) => {
    const currentState = getCompletedState(gCalEventId);
    setCompletedState(gCalEventId, !currentState);
    setAllTodoItems(prevItems =>
      prevItems.map(item =>
        item.gCalEventId === gCalEventId ? { ...item, isCompleted: !currentState } : item
      )
    );
  }, []);

  const filteredAndSortedItems = useMemo(() => {
    let items = [...allTodoItems];

    if (activeFilter === 'inCorso') {
      items = items.filter(item => !item.isCompleted);
    } else if (activeFilter === 'completate') {
      items = items.filter(item => item.isCompleted);
    } else if (activeFilter === 'overdue') {
      items = items.filter(item => {
        const validDueDate = item.dueDate && isValid(new Date(item.dueDate));
        return validDueDate && isPast(new Date(item.dueDate)) && !isToday(new Date(item.dueDate)) && !item.isCompleted;
      });
    }

    const today = startOfDay(new Date());
    if (dateFilter === 'today') {
      items = items.filter(item => isValid(item.dueDate) && format(item.dueDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd'));
    } else if (dateFilter === 'tomorrow') {
      const tomorrow = startOfDay(addDays(today, 1));
      items = items.filter(item => isValid(item.dueDate) && format(item.dueDate, 'yyyy-MM-dd') === format(tomorrow, 'yyyy-MM-dd'));
    } else if (dateFilter === 'week') {
      const startOfThisWeek = startOfWeek(today, { weekStartsOn: 1 });
      const endOfThisWeek = endOfWeek(today, { weekStartsOn: 1 });
      items = items.filter(item =>
        isValid(item.dueDate) &&
        item.dueDate >= startOfThisWeek &&
        item.dueDate <= endOfThisWeek
      );
    }

    // Filtro per pratica rimosso

    items.sort((a, b) => (isValid(a.dueDate) && isValid(b.dueDate) ? a.dueDate.getTime() - b.dueDate.getTime() : 0));

    return items;
  }, [allTodoItems, activeFilter, dateFilter]);

  const refreshCalendarEvents = useCallback(() => {
      if (googleApiToken && gapiClientInitialized) {
          fetchGoogleEvents();
      }
  },[googleApiToken, gapiClientInitialized, fetchGoogleEvents]);

  return {
    todoItems: filteredAndSortedItems,
    isLoading: isLoadingHook || isLoadingCalendarEvents || loadingPraticheStd || loadingPratichePriv,
    toggleComplete,
    activeFilter,
    setActiveFilter,
    dateFilter,
    setDateFilter,
    refreshCalendarEvents,
  };
};
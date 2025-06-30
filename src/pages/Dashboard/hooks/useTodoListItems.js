// src/pages/Dashboard/hooks/useTodoListItems.js
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useGoogleCalendarApi } from '../../CalendarPage/hooks/useGoogleCalendarApi';
import { usePratiche } from '../../../contexts/PraticheContext';
import { usePratichePrivato } from '../../../contexts/PratichePrivatoContext';
import { getCompletedState, setCompletedState } from '../../../services/todoStateService';
import { startOfDay, addDays, startOfWeek, endOfWeek, parseISO, isValid, format } from 'date-fns';

export const useTodoListItems = () => {
  const { googleApiToken, gapiClientInitialized, calendarEvents, fetchGoogleEvents, isLoadingEvents: isLoadingCalendarEvents } = useGoogleCalendarApi();
  const { pratiche: praticheStandard, loading: loadingPraticheStd } = usePratiche();
  const { pratiche: pratichePrivate, loading: loadingPratichePriv } = usePratichePrivato();

  const [allTodoItems, setAllTodoItems] = useState([]);
  const [isLoadingHook, setIsLoadingHook] = useState(true);

  const [activeFilter, setActiveFilter] = useState('inCorso');
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedPraticaIdFilter, setSelectedPraticaIdFilter] = useState('');

  const tutteLePratiche = useMemo(() => {
    if (loadingPraticheStd || loadingPratichePriv) return [];
    const std = Array.isArray(praticheStandard) ? praticheStandard : [];
    const priv = Array.isArray(pratichePrivate) ? pratichePrivate : [];
    return [...std, ...priv];
  }, [praticheStandard, pratichePrivate, loadingPraticheStd, loadingPratichePriv]);

  useEffect(() => {
    if (!gapiClientInitialized || loadingPraticheStd || loadingPratichePriv) {
      return;
    }
    setIsLoadingHook(true);

    const items = calendarEvents.map(event => {
      const praticaId = event.extendedProperties?.private?.praticaId;
      const praticaInfo = praticaId ? tutteLePratiche.find(p => p.id === praticaId) : null;
      const completedState = getCompletedState(event.id);

      // **MODIFICA CHIAVE APPLICATA QUI**
      // Creiamo l'oggetto con le proprietà attese dal componente TodoList.js
      return {
        gCalEventId: event.id,
        title: event.summary,
        dueDate: parseISO(event.start?.dateTime || event.start?.date),
        isCompleted: completedState,
        praticaId: praticaId,
        praticaIndirizzo: praticaInfo?.indirizzo || null, // Aggiunto
        praticaCliente: praticaInfo?.cliente || null,     // Aggiunto
      };
    });
    setAllTodoItems(items);
    setIsLoadingHook(false);

  }, [calendarEvents, tutteLePratiche, gapiClientInitialized, loadingPraticheStd, loadingPratichePriv]);

  const toggleComplete = (itemId) => {
    const currentState = getCompletedState(itemId);
    const newState = !currentState;
    setCompletedState(itemId, newState);

    setAllTodoItems(prevItems =>
      prevItems.map(item =>
        item.gCalEventId === itemId ? { ...item, isCompleted: newState } : item
      )
    );
  };

  const praticheDisponibiliPerFiltro = useMemo(() => {
    const praticheIds = new Set(allTodoItems.map(item => item.praticaId).filter(Boolean));
    return tutteLePratiche.filter(p => praticheIds.has(p.id));
  }, [allTodoItems, tutteLePratiche]);


  const filteredAndSortedItems = useMemo(() => {
    let items = [...allTodoItems];
    const today = startOfDay(new Date());

    if (activeFilter === 'completate') {
      items = items.filter(item => item.isCompleted);
    } else if (activeFilter === 'inCorso') {
      items = items.filter(item => !item.isCompleted);
    }

    if (dateFilter === 'today') {
      items = items.filter(item => isValid(item.dueDate) && item.dueDate >= today && item.dueDate < addDays(today, 1));
    } else if (dateFilter === 'tomorrow') {
      const tomorrow = addDays(today, 1);
      items = items.filter(item => isValid(item.dueDate) && item.dueDate >= tomorrow && item.dueDate < addDays(tomorrow, 1));
    } else if (dateFilter === 'week') {
      const startOfThisWeek = startOfWeek(today, { weekStartsOn: 1 });
      const endOfThisWeek = endOfWeek(today, { weekStartsOn: 1 });
      items = items.filter(item =>
        isValid(item.dueDate) &&
        item.dueDate >= startOfThisWeek &&
        item.dueDate <= endOfThisWeek
      );
    }

    if (selectedPraticaIdFilter) {
      items = items.filter(item => item.praticaId === selectedPraticaIdFilter);
    }

    items.sort((a, b) => (isValid(a.dueDate) && isValid(b.dueDate) ? a.dueDate.getTime() - b.dueDate.getTime() : 0));

    return items;
  }, [allTodoItems, activeFilter, dateFilter, selectedPraticaIdFilter]);

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
    selectedPraticaIdFilter,
    setSelectedPraticaIdFilter,
    praticheDisponibiliPerFiltro,
    refreshCalendarEvents,
  };
};
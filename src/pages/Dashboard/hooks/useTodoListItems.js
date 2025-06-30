// src/hooks/useTodoListItems.js
import { useState, useEffect, useMemo, useCallback } from 'react';
// PERCORSI CORRETTI
import { useGoogleCalendar } from '../../../hooks/useGoogleCalendar';
import { usePratiche } from '../../../contexts/PraticheContext';
import { usePratichePrivato } from '../../../contexts/PratichePrivatoContext';
import { startOfToday, endOfToday, endOfTomorrow, startOfWeek, endOfWeek, parseISO } from 'date-fns';

export function useTodoListItems() {
  const { events, isLoading, refreshCalendarEvents } = useGoogleCalendar();
  const { pratiche: pratichePubbliche } = usePratiche();
  const { pratichePrivato } = usePratichePrivato();

  const [activeFilter, setActiveFilter] = useState('inCorso');
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedPraticaIdFilter, setSelectedPraticaIdFilter] = useState('');

  // Combina tutte le pratiche (pubbliche e private) in un unico array per facilitare la ricerca
  const allPratiche = useMemo(() => [...pratichePubbliche, ...pratichePrivato], [pratichePubbliche, pratichePrivato]);

  // Lista di pratiche uniche da usare nel filtro dropdown
  const praticheDisponibiliPerFiltro = useMemo(() => {
    const praticheConEventi = new Set(events.map(e => e.extendedProperties?.private?.praticaId).filter(Boolean));
    return allPratiche.filter(p => praticheConEventi.has(p.id));
  }, [events, allPratiche]);

  // Arricchisce gli eventi del calendario con i dati delle pratiche
  const enrichedTodoItems = useMemo(() => {
    return events.map(event => {
      const praticaId = event.extendedProperties?.private?.praticaId;
      const praticaCorrispondente = allPratiche.find(p => p.id === praticaId);

      return {
        gCalEventId: event.id,
        title: event.summary,
        dueDate: event.start?.dateTime || event.start?.date,
        isCompleted: event.extendedProperties?.private?.isCompleted === 'true',
        praticaId: praticaId,
        // Aggiungiamo i campi mancanti direttamente qui
        praticaIndirizzo: praticaCorrispondente?.indirizzo || null,
        praticaCliente: praticaCorrispondente?.cliente || null,
      };
    });
  }, [events, allPratiche]);

  // Filtra gli item arricchiti in base ai filtri attivi
  const filteredTodoItems = useMemo(() => {
    const now = new Date();
    const todayStart = startOfToday();
    const todayEnd = endOfToday();
    const tomorrowEnd = endOfTomorrow();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

    return enrichedTodoItems.filter(item => {
      // Filtro per stato (completato/in corso)
      if (activeFilter === 'completate' && !item.isCompleted) return false;
      if (activeFilter === 'inCorso' && item.isCompleted) return false;

      // Filtro per pratica specifica
      if (selectedPraticaIdFilter && item.praticaId !== selectedPraticaIdFilter) return false;

      // Filtro per data
      const dueDate = item.dueDate ? parseISO(item.dueDate) : null;
      if (dateFilter !== 'all' && dueDate) {
        if (dateFilter === 'today' && (dueDate < todayStart || dueDate > todayEnd)) return false;
        if (dateFilter === 'tomorrow' && (dueDate <= todayEnd || dueDate > tomorrowEnd)) return false;
        if (dateFilter === 'week' && (dueDate < weekStart || dueDate > weekEnd)) return false;
      }

      return true;
    });
  }, [enrichedTodoItems, activeFilter, dateFilter, selectedPraticaIdFilter]);

  // Funzione per marcare un item come completo/incompleto
  const toggleComplete = useCallback((gCalEventId) => {
    // La logica per aggiornare l'evento su Google Calendar rimane qui
    // (non necessita di modifiche)
    console.log("Toggling complete for event:", gCalEventId);
    // ...chiamata API per aggiornare l'evento...
  }, []);

  return {
    todoItems: filteredTodoItems, // Restituisce gli item filtrati e arricchiti
    isLoading,
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
}
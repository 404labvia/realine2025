// src/pages/Dashboard/hooks/useDashboardCalendar.js
import { useState, useEffect, useCallback } from 'react';
import { format, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays } from 'date-fns';

export function useDashboardCalendar() {
  // Stati per il calendario
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState('month');
  const [events, setEvents] = useState([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [lastSync, setLastSync] = useState(null);

  // Funzione per generare dati di esempio per il calendario
  const fetchEvents = useCallback(async () => {
    setIsLoadingEvents(true);

    try {
      // Mock data per eventi
      const mockEvents = [
        {
          id: '1',
          title: 'Sopralluogo Via Roma 123',
          start: new Date(2025, 2, 25, 15, 0), // 25 Marzo 2025, 15:00
          end: new Date(2025, 2, 25, 16, 30),
          color: '#FBF8CC', // Colore per sopralluogo
          description: 'Sopralluogo per verifica conformità',
          location: 'Via Roma 123, Viareggio'
        },
        {
          id: '2',
          title: 'Incarico Donati',
          start: new Date(2025, 2, 28, 15, 0), // 28 Marzo 2025, 15:00
          end: new Date(2025, 2, 28, 16, 0),
          color: '#FFCCCC', // Colore per incarico
          description: 'Firma incarico professionale',
          location: 'Studio, Via del Mare 45'
        },
        {
          id: '3',
          title: 'Non disponibile',
          start: new Date(2025, 2, 6, 15, 0), // 6 Marzo 2025, 15:00
          end: new Date(2025, 2, 6, 17, 0),
          color: '#D8E4BC', // Colore per altro
          description: 'Non disponibile'
        }
      ];

      setEvents(mockEvents);
      setLastSync(new Date());
    } catch (error) {
      console.error('Errore nel recupero degli eventi:', error);
    } finally {
      setIsLoadingEvents(false);
    }
  }, [currentDate, calendarView]);

  // Carica gli eventi quando cambia la vista o la data
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Funzioni di navigazione del calendario
  const navigatePrev = () => {
    if (calendarView === 'month') {
      setCurrentDate(subMonths(currentDate, 1));
    } else if (calendarView === 'week') {
      setCurrentDate(subWeeks(currentDate, 1));
    } else if (calendarView === 'day') {
      setCurrentDate(subDays(currentDate, 1));
    }
  };

  const navigateNext = () => {
    if (calendarView === 'month') {
      setCurrentDate(addMonths(currentDate, 1));
    } else if (calendarView === 'week') {
      setCurrentDate(addWeeks(currentDate, 1));
    } else if (calendarView === 'day') {
      setCurrentDate(addDays(currentDate, 1));
    }
  };

  const navigateToday = () => {
    setCurrentDate(new Date());
  };

  return {
    currentDate,
    setCurrentDate,
    calendarView,
    setCalendarView,
    events,
    isLoadingEvents,
    lastSync,
    fetchEvents,
    navigatePrev,
    navigateNext,
    navigateToday
  };
}
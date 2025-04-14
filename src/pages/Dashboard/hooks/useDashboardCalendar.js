// src/pages/Dashboard/hooks/useDashboardCalendar.js
import { useState, useEffect, useCallback } from 'react';
import { format, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays } from 'date-fns';
import { signInWithGoogle, isGoogleCalendarAuthenticated } from '../../../firebase';

export function useDashboardCalendar() {
  // Stati per il calendario
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState('month');
  const [googleEvents, setGoogleEvents] = useState([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [lastSync, setLastSync] = useState(null);

  // Controlla l'autenticazione Google Calendar all'avvio
  useEffect(() => {
    const authenticated = isGoogleCalendarAuthenticated();
    setIsAuthenticated(authenticated);
    
    if (authenticated) {
      fetchEvents();
    }
  }, []);

  // Funzione per sincronizzare eventi da Google Calendar
  const fetchEvents = useCallback(async () => {
    if (!isGoogleCalendarAuthenticated()) {
      return;
    }
    
    setIsLoadingEvents(true);
    
    try {
      // In una implementazione reale, qui ci sarebbe la chiamata a Google Calendar API
      // Per ora utilizziamo dati di esempio

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
        // Altri eventi mock...
      ];

      setGoogleEvents(mockEvents);
      setLastSync(new Date());
    } catch (error) {
      console.error('Errore nel recupero degli eventi:', error);
    } finally {
      setIsLoadingEvents(false);
    }
  }, [currentDate, calendarView]);

  // Carica gli eventi quando cambia la vista o la data
  useEffect(() => {
    if (isAuthenticated) {
      fetchEvents();
    }
  }, [fetchEvents, isAuthenticated, currentDate, calendarView]);

  // Funzione per l'autenticazione con Google
  const handleGoogleAuth = async () => {
    try {
      const result = await signInWithGoogle();
      
      if (result && result.token) {
        setIsAuthenticated(true);
        fetchEvents();
      } else {
        alert("Autenticazione non riuscita. Riprova.");
      }
    } catch (error) {
      console.error("Errore durante l'autenticazione Google:", error);
      alert("Si è verificato un errore durante l'autenticazione. Riprova.");
    }
  };

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
    googleEvents,
    isAuthenticated,
    isLoadingEvents,
    lastSync,
    fetchEvents,
    handleGoogleAuth,
    navigatePrev,
    navigateNext,
    navigateToday
  };
}
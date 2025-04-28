import { useState, useEffect, useCallback } from 'react';
import { startOfMonth, endOfMonth } from 'date-fns';
import googleCalendarService from '../services/GoogleCalendarService';
import enhancedAuthService from '../services/EnhancedAuthService';

export const useCalendarEvents = (currentDate) => {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastSync, setLastSync] = useState(null);

  // Funzione per recuperare gli eventi
  const fetchEvents = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Verifica autenticazione
      if (!enhancedAuthService.isCalendarAuthenticated()) {
        setEvents([]);
        return;
      }

      // Calcola intervallo date
      const start = startOfMonth(currentDate);
      const end = endOfMonth(currentDate);

      // Recupera eventi da Google Calendar
      const googleEvents = await googleCalendarService.getEvents(start, end);
      
      // Converte gli eventi nel formato interno
      const formattedEvents = googleEvents.map(event => 
        googleCalendarService.mapEventToInternal(event)
      );

      setEvents(formattedEvents);
      setLastSync(new Date());
    } catch (error) {
      console.error('Errore nel recupero eventi:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  }, [currentDate]);

  // Aggiorna gli eventi quando cambia la data o l'autenticazione
  useEffect(() => {
    if (enhancedAuthService.isCalendarAuthenticated()) {
      fetchEvents();
    }
  }, [fetchEvents, currentDate]);

  // Setup refresh periodico
  useEffect(() => {
    if (!enhancedAuthService.isCalendarAuthenticated()) return;

    const interval = setInterval(() => {
      fetchEvents();
    }, 5 * 60 * 1000); // Aggiorna ogni 5 minuti

    return () => clearInterval(interval);
  }, [fetchEvents]);

  return {
    events,
    isLoading,
    error,
    lastSync,
    refreshEvents: fetchEvents
  };
};

export default useCalendarEvents;
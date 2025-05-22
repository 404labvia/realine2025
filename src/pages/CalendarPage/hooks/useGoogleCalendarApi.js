// src/pages/CalendarPage/hooks/useGoogleCalendarApi.js
import { useState, useEffect, useCallback } from 'react';
import { useGoogleLogin, googleLogout } from '@react-oauth/google';
import {
  GAPI_SCRIPT_URL,
  API_KEY,
  DISCOVERY_DOCS,
  eventColors, // Importato per la mappatura degli eventi
  mapGoogleColorToHex, // Importato per la mappatura degli eventi
  defaultEventColor // Importato per la mappatura degli eventi
} from '../utils/calendarUtils'; // Assicurati che il percorso sia corretto

export const useGoogleCalendarApi = () => {
  const [googleApiToken, setGoogleApiToken] = useState(() => localStorage.getItem('googleApiToken'));
  const [gapiClientInitialized, setGapiClientInitialized] = useState(false);
  const [isLoadingGapi, setIsLoadingGapi] = useState(true);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);

  const initializeGapiClient = useCallback((resolve, reject) => {
    if (!API_KEY) {
      console.error("API Key for GAPI client is missing!");
      reject(new Error("API Key for GAPI client is missing!"));
      setIsLoadingGapi(false);
      return;
    }
    if (window.gapi && window.gapi.client) {
      window.gapi.client
        .init({
          apiKey: API_KEY,
          discoveryDocs: DISCOVERY_DOCS,
        })
        .then(() => {
          console.log('GAPI client initialized successfully (hook).');
          setGapiClientInitialized(true);
          setIsLoadingGapi(false);
          if (googleApiToken) {
            try {
              window.gapi.client.setToken({ access_token: googleApiToken });
              console.log("GAPI token set after init from existing token (hook).");
            } catch (e) {
              console.error("Error setting GAPI token (after init, hook):", e);
            }
          }
          resolve();
        })
        .catch((error) => {
          console.error('Error initializing GAPI client (hook):', error);
          setIsLoadingGapi(false);
          reject(error);
        });
    } else {
        console.error("window.gapi or window.gapi.client not loaded before init attempt.");
        setIsLoadingGapi(false);
        reject(new Error("GAPI client not loaded"));
    }
  }, [googleApiToken]);

  const loadGapiScript = useCallback(() => {
    setIsLoadingGapi(true);
    return new Promise((resolve, reject) => {
      if (window.gapi && window.gapi.client && window.gapi.client.calendar) {
        setGapiClientInitialized(true);
        setIsLoadingGapi(false);
        resolve();
        return;
      }

      const existingScript = document.getElementById('gapi-script-tag');
      if (existingScript && window.gapi) {
        window.gapi.load('client', () => initializeGapiClient(resolve, reject));
        return;
      }
      if (existingScript && !window.gapi) {
         existingScript.addEventListener('load', () => {
            window.gapi.load('client', () => initializeGapiClient(resolve, reject));
        });
        existingScript.addEventListener('error', (err) => {
            setIsLoadingGapi(false);
            reject(err);
        });
        return;
      }
      if (!existingScript) {
        const script = document.createElement('script');
        script.id = 'gapi-script-tag';
        script.src = GAPI_SCRIPT_URL;
        script.async = true;
        script.defer = true;
        script.onload = () => {
          window.gapi.load('client', () => initializeGapiClient(resolve, reject));
        };
        script.onerror = (error) => {
          setIsLoadingGapi(false);
          reject(error);
        };
        document.body.appendChild(script);
      }
    });
  }, [initializeGapiClient]);

  useEffect(() => {
    loadGapiScript().catch(err => {
        console.error("Critical failure loading GAPI script (hook):", err);
    });
  }, [loadGapiScript]);

  const internalHandleGoogleLogout = useCallback(() => {
    googleLogout();
    localStorage.removeItem('googleApiToken');
    setGoogleApiToken(null);
    setCalendarEvents([]);
    // Non resettare gapiClientInitialized qui, il client è ancora caricato.
    console.log("Logged out from Google API (hook)");
  }, []);

  const fetchGoogleEvents = useCallback(async () => {
    if (!gapiClientInitialized) {
      console.warn("fetchGoogleEvents called but GAPI client not initialized (hook).");
      return;
    }
    if (!googleApiToken) {
      console.warn("fetchGoogleEvents called but no Google API token (hook).");
      setCalendarEvents([]);
      return;
    }

    setIsLoadingEvents(true);
    try {
      window.gapi.client.setToken({ access_token: googleApiToken });
      const response = await window.gapi.client.calendar.events.list({
        calendarId: 'primary',
        timeMin: new Date(new Date().setMonth(new Date().getMonth() - 2)).toISOString(),
        timeMax: new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString(),
        maxResults: 250,
        singleEvents: true,
        orderBy: 'startTime',
      });

      const items = response.result.items || [];
      const formattedEvents = items.map((item) => ({
        id: item.id,
        title: item.summary || '(Nessun titolo)',
        start: new Date(item.start.dateTime || item.start.date),
        end: new Date(item.end.dateTime || item.end.date),
        description: item.description || '',
        location: item.location || '',
        category: item.extendedProperties?.private?.category || 'altro',
        color: item.extendedProperties?.private?.category ? eventColors[item.extendedProperties.private.category] : (item.colorId ? mapGoogleColorToHex(item.colorId) : defaultEventColor),
        relatedPraticaId: item.extendedProperties?.private?.relatedPraticaId || '',
        isPrivate: item.extendedProperties?.private?.isPrivate === 'true', // Converti a booleano
        googleEvent: true, // Flag per identificare eventi da Google
      }));
      setCalendarEvents(formattedEvents);
    } catch (error) {
      console.error('Error fetching events from Google Calendar (hook):', error);
      if (error?.result?.error?.code === 401) {
        console.warn("Google API token expired or invalid. Logging out (hook).");
        internalHandleGoogleLogout();
        alert("Sessione Google Calendar scaduta. Riconnetti per continuare.");
      }
    } finally {
      setIsLoadingEvents(false);
    }
  }, [gapiClientInitialized, googleApiToken, internalHandleGoogleLogout]);

  useEffect(() => {
    if (googleApiToken && gapiClientInitialized) {
      fetchGoogleEvents();
    }
  }, [googleApiToken, gapiClientInitialized, fetchGoogleEvents]);

  const loginToGoogle = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      const accessToken = tokenResponse.access_token;
      localStorage.setItem('googleApiToken', accessToken);
      setGoogleApiToken(accessToken);
      if (gapiClientInitialized && window.gapi?.client) {
         try {
            window.gapi.client.setToken({ access_token: accessToken });
            console.log("GAPI token set immediately after login (hook).");
            // Fetch events immediately after successful login and token set
            fetchGoogleEvents();
         } catch(e) {
            console.error("Error setting GAPI token (after login, hook):", e);
         }
      } else if (!gapiClientInitialized) {
          // Se GAPI non è ancora pronto, loadGapiScript dovrebbe gestirlo al suo completamento
          console.warn("GAPI client not ready during login success, token will be set upon GAPI init.");
      }
    },
    onError: (error) => {
      console.error('Google API Login Failed (hook):', error);
      alert('Login con Google per il calendario fallito.');
    },
    scope: 'https://www.googleapis.com/auth/calendar.events',
  });

  const createGoogleEvent = useCallback(async (eventResource) => {
    if (!gapiClientInitialized || !googleApiToken || !window.gapi?.client?.calendar) {
      throw new Error("Google Calendar API not ready or not authenticated.");
    }
    try {
      await window.gapi.client.calendar.events.insert({
        calendarId: 'primary',
        resource: eventResource,
      });
      await fetchGoogleEvents(); // Refresh events
    } catch (error) {
      console.error("Error creating Google Calendar event (hook):", error);
      throw error;
    }
  }, [gapiClientInitialized, googleApiToken, fetchGoogleEvents]);

  const updateGoogleEvent = useCallback(async (eventId, eventResource) => {
    if (!gapiClientInitialized || !googleApiToken || !window.gapi?.client?.calendar) {
      throw new Error("Google Calendar API not ready or not authenticated.");
    }
    try {
      await window.gapi.client.calendar.events.update({
        calendarId: 'primary',
        eventId: eventId,
        resource: eventResource,
      });
      await fetchGoogleEvents(); // Refresh events
    } catch (error) {
      console.error("Error updating Google Calendar event (hook):", error);
      fetchGoogleEvents(); // Tentativo di refresh anche in caso di errore per risincronizzare
      throw error;
    }
  }, [gapiClientInitialized, googleApiToken, fetchGoogleEvents]);

  const deleteGoogleEvent = useCallback(async (eventId) => {
    if (!gapiClientInitialized || !googleApiToken || !window.gapi?.client?.calendar) {
      throw new Error("Google Calendar API not ready or not authenticated.");
    }
    try {
      await window.gapi.client.calendar.events.delete({
        calendarId: 'primary',
        eventId: eventId,
      });
      await fetchGoogleEvents(); // Refresh events
    } catch (error) {
      console.error("Error deleting Google Calendar event (hook):", error);
      throw error;
    }
  }, [gapiClientInitialized, googleApiToken, fetchGoogleEvents]);

  return {
    googleApiToken,
    gapiClientInitialized,
    isLoadingGapi,
    calendarEvents,
    isLoadingEvents,
    loginToGoogle,
    logoutFromGoogle: internalHandleGoogleLogout,
    fetchGoogleEvents,
    createGoogleEvent,
    updateGoogleEvent,
    deleteGoogleEvent,
    // Rimuovo loadGapiScript dall'export pubblico, dovrebbe essere gestito internamente.
    // Se si vuole un refresh manuale della connessione GAPI, si può aggiungere una funzione apposita.
  };
};
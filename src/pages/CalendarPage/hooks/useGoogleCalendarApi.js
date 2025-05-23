// src/pages/CalendarPage/hooks/useGoogleCalendarApi.js
import { useState, useEffect, useCallback } from 'react';
import { useGoogleLogin, googleLogout } from '@react-oauth/google';
import {
  GAPI_SCRIPT_URL,
  API_KEY,
  DISCOVERY_DOCS,
  calendarIds, // <<< Importiamo gli ID definiti
  // Non importiamo più le mappe colori qui perché la logica è in eventStyleGetter
} from '../utils/calendarUtils'; // Assicurati che il percorso sia corretto

// Usiamo gli ID importati per costruire la lista
const SHARED_CALENDAR_IDS = [
    calendarIds.ID_DE_ANTONI,
    calendarIds.ID_CASTRO,
    calendarIds.ID_ANTONELLI,
];

export const useGoogleCalendarApi = () => {
  const [googleApiToken, setGoogleApiToken] = useState(() => localStorage.getItem('googleApiToken'));
  const [gapiClientInitialized, setGapiClientInitialized] = useState(false);
  const [isLoadingGapi, setIsLoadingGapi] = useState(true);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);

  // --- Funzioni di Inizializzazione GAPI ---
  const initializeGapiClient = useCallback((resolve, reject) => {
    // ... (codice invariato)
        if (!API_KEY) {
            console.error("API Key for GAPI client is missing!");
            setIsLoadingGapi(false);
            reject(new Error("API Key for GAPI client is missing!"));
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
    // ... (codice invariato)
        setIsLoadingGapi(true);
        return new Promise((resolve, reject) => {
            if (window.gapi && window.gapi.client && window.gapi.client.calendar) {
                setGapiClientInitialized(true);
                setIsLoadingGapi(false);
                if (googleApiToken && window.gapi.client.getToken() === null) {
                    window.gapi.client.setToken({ access_token: googleApiToken });
                }
                resolve();
                return;
            }

            const existingScript = document.getElementById('gapi-script-tag');
            const loadClient = () => window.gapi.load('client', () => initializeGapiClient(resolve, reject));

            if (existingScript && window.gapi) { loadClient(); return; }
            if (existingScript && !window.gapi) {
                existingScript.addEventListener('load', loadClient);
                existingScript.addEventListener('error', (err) => { setIsLoadingGapi(false); reject(err); });
                return;
            }
            if (!existingScript) {
                const script = document.createElement('script');
                script.id = 'gapi-script-tag';
                script.src = GAPI_SCRIPT_URL;
                script.async = true;
                script.defer = true;
                script.onload = loadClient;
                script.onerror = (error) => { setIsLoadingGapi(false); reject(error); };
                document.body.appendChild(script);
            }
        });
  }, [initializeGapiClient, googleApiToken]);

  useEffect(() => {
    // ... (codice invariato)
        loadGapiScript().catch(err => {
            console.error("Critical failure loading GAPI script (hook):", err);
            setIsLoadingGapi(false);
        });
  }, [loadGapiScript]);

  // --- Funzioni di Autenticazione e Gestione Token ---
  const clearAppAuthTokenAndState = useCallback(() => {
    // ... (codice invariato)
    localStorage.removeItem('googleApiToken');
    setGoogleApiToken(null);
    setCalendarEvents([]);
    console.log("Token API di Google dell'app e stato eventi cancellati.");
  }, []);

  const handleLoginSuccess = useCallback((tokenResponse) => {
    // ... (codice invariato)
        const accessToken = tokenResponse.access_token;
        localStorage.setItem('googleApiToken', accessToken);
        setGoogleApiToken(accessToken);
        if (gapiClientInitialized && window.gapi?.client) {
            try {
                window.gapi.client.setToken({ access_token: accessToken });
                console.log("GAPI token set immediately after login (hook).");
            } catch (e) {
                console.error("Error setting GAPI token (after login, hook):", e);
            }
        } else if (!gapiClientInitialized) {
            console.warn("GAPI client not ready during login success, token will be set upon GAPI init.");
        }
  }, [gapiClientInitialized]);

  const handleLoginError = useCallback((error) => {
    // ... (codice invariato)
    console.error('Google API Login Failed (hook):', error);
    alert('Login con Google per il calendario fallito.');
  }, []);

  const loginToGoogle = useGoogleLogin({
    onSuccess: handleLoginSuccess,
    onError: handleLoginError,
    scope: 'https://www.googleapis.com/auth/calendar.events',
  });

  // --- Funzione per Caricare Eventi (Usa ID completi) ---
  const fetchGoogleEvents = useCallback(async () => {
    if (!gapiClientInitialized || !googleApiToken) {
      setCalendarEvents([]);
      return;
    }

    setIsLoadingEvents(true);
    // Ora SHARED_CALENDAR_IDS contiene gli ID completi
    const calendarIdsToFetch = ['primary', ...SHARED_CALENDAR_IDS];

    try {
      if (window.gapi?.client) {
        window.gapi.client.setToken({ access_token: googleApiToken });
      } else {
        throw new Error("GAPI client non disponibile.");
      }

      const eventPromises = calendarIdsToFetch.map(calendarId =>
        window.gapi.client.calendar.events.list({
          calendarId: calendarId,
          timeMin: new Date(new Date().setMonth(new Date().getMonth() - 2)).toISOString(),
          timeMax: new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString(),
          maxResults: 250,
          singleEvents: true,
          orderBy: 'startTime',
        }).then(response => {
          const items = response.result.items || [];
          console.log(`Eventi caricati da ${calendarId}:`, items.length);
          return items.map(item => ({
            id: item.id,
            title: item.summary || '(Nessun titolo)',
            start: new Date(item.start.dateTime || item.start.date),
            end: new Date(item.end.dateTime || item.end.date),
            description: item.description || '',
            location: item.location || '',
            category: item.extendedProperties?.private?.category || 'altro',
            relatedPraticaId: item.extendedProperties?.private?.relatedPraticaId || '',
            isPrivate: item.extendedProperties?.private?.isPrivate === 'true',
            googleEvent: true,
            sourceCalendarId: calendarId, // Memorizza il calendario di origine
            // Rimuoviamo il 'color' qui, perché eventStyleGetter lo determinerà da sourceCalendarId
          }));
        }).catch(err => {
          console.error(`Errore nel caricare eventi da ${calendarId}:`, err);
          if (err?.result?.error?.code === 404) {
             alert(`Calendario non trovato o accesso negato per l'ID: ${calendarId}. Assicurati che l'ID sia corretto e di avere i permessi.`);
          }
          return [];
        })
      );

      const results = await Promise.all(eventPromises);
      const allFormattedEvents = results.flat();
      setCalendarEvents(allFormattedEvents);

    } catch (error) {
      console.error('Errore generale in fetchGoogleEvents (hook):', error);
      if (error?.result?.error?.code === 401) {
        console.warn("Token API di Google scaduto/non valido. Tentativo di rinnovo automatico.");
        clearAppAuthTokenAndState();
        loginToGoogle();
      } else {
        alert("Si è verificato un errore nel comunicare con Google Calendar.");
      }
    } finally {
      setIsLoadingEvents(false);
    }
  }, [gapiClientInitialized, googleApiToken, clearAppAuthTokenAndState, loginToGoogle]);

  useEffect(() => {
    // ... (codice invariato)
    if (googleApiToken && gapiClientInitialized) {
      fetchGoogleEvents();
    } else {
      setCalendarEvents([]);
    }
  }, [googleApiToken, gapiClientInitialized, fetchGoogleEvents]);

  // --- Funzioni CRUD (Invariate rispetto all'ultima versione) ---
  const createGoogleEvent = useCallback(async (eventResource, targetCalendarId = 'primary') => {
    // ... (codice invariato)
        if (!gapiClientInitialized || !googleApiToken || !window.gapi?.client?.calendar) {
            throw new Error("Google Calendar API not ready or not authenticated.");
        }
        try {
            window.gapi.client.setToken({ access_token: googleApiToken });
            await window.gapi.client.calendar.events.insert({
                calendarId: targetCalendarId,
                resource: eventResource,
            });
            await fetchGoogleEvents();
        } catch (error) {
            console.error(`Error creating Google Calendar event on ${targetCalendarId} (hook):`, error);
            if (error?.result?.error?.code === 401) { clearAppAuthTokenAndState(); loginToGoogle(); }
            throw error;
        }
  }, [gapiClientInitialized, googleApiToken, fetchGoogleEvents, clearAppAuthTokenAndState, loginToGoogle]);

  const updateGoogleEvent = useCallback(async (eventId, eventResource, targetCalendarId = 'primary') => {
    // ... (codice invariato)
        if (!gapiClientInitialized || !googleApiToken || !window.gapi?.client?.calendar) {
            throw new Error("Google Calendar API not ready or not authenticated.");
        }
        try {
            window.gapi.client.setToken({ access_token: googleApiToken });
            await window.gapi.client.calendar.events.update({
                calendarId: targetCalendarId,
                eventId: eventId,
                resource: eventResource,
            });
            await fetchGoogleEvents();
        } catch (error) {
            console.error(`Error updating Google Calendar event on ${targetCalendarId} (hook):`, error);
            if (error?.result?.error?.code === 401) { clearAppAuthTokenAndState(); loginToGoogle(); }
            else { fetchGoogleEvents(); }
            throw error;
        }
  }, [gapiClientInitialized, googleApiToken, fetchGoogleEvents, clearAppAuthTokenAndState, loginToGoogle]);

  const deleteGoogleEvent = useCallback(async (eventId, targetCalendarId = 'primary') => {
    // ... (codice invariato)
        if (!gapiClientInitialized || !googleApiToken || !window.gapi?.client?.calendar) {
            throw new Error("Google Calendar API not ready or not authenticated.");
        }
        try {
            window.gapi.client.setToken({ access_token: googleApiToken });
            await window.gapi.client.calendar.events.delete({
                calendarId: targetCalendarId,
                eventId: eventId,
            });
            await fetchGoogleEvents();
        } catch (error) {
            console.error(`Error deleting Google Calendar event on ${targetCalendarId} (hook):`, error);
            if (error?.result?.error?.code === 401) { clearAppAuthTokenAndState(); loginToGoogle(); }
            throw error;
        }
  }, [gapiClientInitialized, googleApiToken, fetchGoogleEvents, clearAppAuthTokenAndState, loginToGoogle]);

  // --- Logout (Invariato) ---
  const logoutFromGoogle = useCallback(() => {
    // ... (codice invariato)
        try { googleLogout(); } catch (e) { console.error("Errore durante googleLogout:", e); }
        localStorage.removeItem('googleApiToken');
        setGoogleApiToken(null);
        setCalendarEvents([]);
        console.log("Logged out from Google API, token revoked, and app token cleared (hook).");
  }, []);

  // --- Return ---
  return {
    googleApiToken,
    gapiClientInitialized,
    isLoadingGapi,
    calendarEvents,
    isLoadingEvents,
    loginToGoogle,
    logoutFromGoogle,
    fetchGoogleEvents,
    createGoogleEvent,
    updateGoogleEvent,
    deleteGoogleEvent,
  };
};
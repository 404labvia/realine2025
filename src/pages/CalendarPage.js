// src/pages/CalendarPage.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, addHours, startOfHour } from 'date-fns';
import { it } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useGoogleLogin, googleLogout } from '@react-oauth/google';
import { FaPlus, FaSync, FaCog, FaCalendarCheck, FaCalendarTimes, FaSave, FaTrash } from 'react-icons/fa';
import { usePratiche } from '../contexts/PraticheContext';
import { usePratichePrivato } from '../contexts/PratichePrivatoContext';

const locales = {
  'it-IT': it,
};
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date) => startOfWeek(date, { weekStartsOn: 1 }),
  getDay,
  locales,
});

const eventColors = {
  sopralluogo: '#FBF8CC',
  incarico: '#FFCCCC',
  pagamento: '#E4DFEC',
  accessoAtti: '#FCD5B4',
  presentazionePratica: '#DAEEF3',
  taskPratica: '#A7F3D0',
  altro: '#D8E4BC',
  privato: '#E5E7EB',
};

const GAPI_SCRIPT_URL = 'https://apis.google.com/js/api.js';
const API_KEY = process.env.REACT_APP_FIREBASE_API_KEY;
const DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'];

function CalendarPage() {
  console.log("CalendarPage rendering...");

  const { pratiche: praticheStandard, loading: loadingPraticheStandard } = usePratiche();
  const { pratiche: pratichePrivate, loading: loadingPratichePrivate } = usePratichePrivato();

  const tutteLePratiche = useMemo(() => {
    if (loadingPraticheStandard || loadingPratichePrivate) return [];
    return [...(praticheStandard || []), ...(pratichePrivate || [])];
  }, [praticheStandard, pratichePrivate, loadingPraticheStandard, loadingPratichePrivate]);

  const [googleApiToken, setGoogleApiToken] = useState(() => localStorage.getItem('googleApiToken'));
  const [gapiLoaded, setGapiLoaded] = useState(!!(window.gapi && window.gapi.client && window.gapi.client.calendar));
  const [events, setEvents] = useState([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);

  const defaultEventColor = eventColors.altro;

  const [formState, setFormState] = useState({
    id: null,
    title: '',
    start: new Date(),
    end: addHours(new Date(), 1),
    description: '',
    location: '',
    category: 'altro',
    relatedPraticaId: '',
    isPrivate: false,
  });

  const loadGapiScript = useCallback(() => {
    console.log("Attempting to load GAPI script...");
    return new Promise((resolve, reject) => {
      if (window.gapi && window.gapi.client && window.gapi.client.calendar) {
        console.log("GAPI client already loaded and initialized.");
        setGapiLoaded(true);
        if (googleApiToken) {
          try {
            window.gapi.client.setToken({ access_token: googleApiToken });
            console.log("GAPI token set from existing token.");
          } catch (e) {
            console.error("Error setting GAPI token (in loadGapiScript):", e);
          }
        }
        resolve();
        return;
      }

      const existingScript = document.getElementById('gapi-script');
      if (existingScript) {
         // Se lo script esiste già, assumiamo che sia in caricamento o caricato.
         // Aggiungiamo un listener per 'load' se non è già 'loaded' e 'gapi' non è definito
        if (!window.gapi) {
            existingScript.addEventListener('load', () => {
                console.log("GAPI script loaded via existing tag.");
                window.gapi.load('client', () => {
                    initializeGapiClient(resolve, reject);
                });
            });
            existingScript.addEventListener('error', (error) => {
                console.error('Error loading GAPI script file (existing tag):', error);
                reject(error);
            });
        } else if (window.gapi && !window.gapi.client?.calendar) { // GAPI esiste ma client non inizializzato
             window.gapi.load('client', () => {
                initializeGapiClient(resolve, reject);
            });
        } else { // GAPI e client già pronti
            resolve();
        }
        return;
      }


      const script = document.createElement('script');
      script.id = 'gapi-script';
      script.src = GAPI_SCRIPT_URL;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        console.log("GAPI script newly loaded.");
        window.gapi.load('client', () => {
          initializeGapiClient(resolve, reject);
        });
      };
      script.onerror = (error) => {
        console.error('Error loading GAPI script file (new tag):', error);
        reject(error);
      };
      document.body.appendChild(script);
    });
  }, [googleApiToken]); // googleApiToken come dipendenza

  const initializeGapiClient = useCallback((resolve, reject) => {
    console.log("'client' module loaded via gapi.load, initializing...");
    if (!API_KEY) {
      console.error("API Key for GAPI client is missing!");
      reject(new Error("API Key for GAPI client is missing!"));
      return;
    }
    window.gapi.client
      .init({
        apiKey: API_KEY,
        discoveryDocs: DISCOVERY_DOCS,
      })
      .then(() => {
        console.log('GAPI client initialized successfully.');
        setGapiLoaded(true);
        if (googleApiToken) {
          try {
            window.gapi.client.setToken({ access_token: googleApiToken });
            console.log("GAPI token set after init.");
          } catch(e) {
            console.error("Error setting GAPI token (after init):", e);
          }
        }
        resolve();
      })
      .catch((error) => {
        console.error('Error initializing GAPI client:', error);
        reject(error);
      });
  }, [googleApiToken]);


  const fetchGoogleCalendarEvents = useCallback(async () => {
    if (!gapiLoaded) {
      console.warn("fetchGoogleCalendarEvents called but GAPI not loaded.");
      return;
    }
    if (!googleApiToken) {
      console.warn("fetchGoogleCalendarEvents called but no Google API token.");
      setEvents([]);
      return;
    }

    setIsLoadingEvents(true);
    console.log("Fetching Google Calendar events...");
    try {
      if (!(window.gapi && window.gapi.client && window.gapi.client.calendar && window.gapi.client.calendar.events)) {
          console.error("GAPI client.calendar.events non disponibile per fetchGoogleCalendarEvents");
          await loadGapiScript(); // Tenta di ricaricare/reinizializzare
          if (!(window.gapi && window.gapi.client && window.gapi.client.calendar && window.gapi.client.calendar.events)) {
            setIsLoadingEvents(false);
            return;
          }
      }
      window.gapi.client.setToken({ access_token: googleApiToken });

      const response = await window.gapi.client.calendar.events.list({
        calendarId: 'primary',
        timeMin: new Date(new Date().setMonth(new Date().getMonth() - 2)).toISOString(), // Esteso a 2 mesi prima
        timeMax: new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString(), // Esteso a 3 mesi dopo
        maxResults: 250,
        singleEvents: true,
        orderBy: 'startTime',
      });

      console.log("Google Calendar API response:", response);
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
        isPrivate: item.extendedProperties?.private?.isPrivate === 'true',
        googleEvent: true,
      }));
      setEvents(formattedEvents);
      console.log("Eventi caricati:", formattedEvents.length);
    } catch (error) {
      console.error('Errore nel caricare gli eventi da Google Calendar:', error);
      if (error && error.result && error.result.error && error.result.error.code === 401) {
        console.warn("Token Google API scaduto o non valido. Eseguire logout.");
        handleGoogleLogout();
        alert("Sessione Google scaduta. Effettua nuovamente il login con Google per il calendario.");
      }
    } finally {
      setIsLoadingEvents(false);
    }
  }, [gapiLoaded, googleApiToken, loadGapiScript]); // Aggiunto loadGapiScript


  useEffect(() => {
    loadGapiScript().then(() => {
      if (googleApiToken) {
        fetchGoogleCalendarEvents();
      }
    }).catch(err => {
        console.error("Errore critico nel setup di GAPI:", err);
    });
  }, [loadGapiScript]); // Solo loadGapiScript qui, il token è gestito dal suo useEffect o da quello di fetchGoogleCalendarEvents

  useEffect(() => {
    if (googleApiToken && gapiLoaded) {
      fetchGoogleCalendarEvents();
    }
  }, [googleApiToken, gapiLoaded, fetchGoogleCalendarEvents]);


  const googleLogin = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      console.log('Google API Login Success:', tokenResponse);
      const accessToken = tokenResponse.access_token;
      localStorage.setItem('googleApiToken', accessToken);
      setGoogleApiToken(accessToken);
      // Non chiamare fetchGoogleCalendarEvents direttamente qui, l'useEffect sopra lo farà
    },
    onError: (error) => {
      console.error('Google API Login Failed:', error);
      alert('Login con Google per il calendario fallito.');
    },
    scope: 'https://www.googleapis.com/auth/calendar.events',
  });

  const handleGoogleLogout = () => {
    googleLogout();
    localStorage.removeItem('googleApiToken');
    setGoogleApiToken(null);
    setEvents([]);
    console.log("Logged out from Google API");
  };

  const handleSelectSlot = useCallback(({ start, end }) => {
    setSelectedSlot({ start, end });
    setSelectedEvent(null);
    setFormState({
      id: null,
      title: '',
      start: startOfHour(start),
      end: startOfHour(addHours(start, 1)),
      description: '',
      location: '',
      category: 'altro',
      relatedPraticaId: '',
      isPrivate: false,
    });
    setShowEventModal(true);
  }, []);

  const handleSelectEvent = useCallback((event) => {
    setSelectedEvent(event);
    setSelectedSlot(null);
    setFormState({
      id: event.id,
      title: event.title,
      start: new Date(event.start),
      end: new Date(event.end),
      description: event.description || '',
      location: event.location || '',
      category: event.category || 'altro',
      relatedPraticaId: event.relatedPraticaId || '',
      isPrivate: event.isPrivate || false,
    });
    setShowEventModal(true);
  }, []);

  const handleEventDropOrResize = useCallback(async ({ event, start, end }) => {
    if (!gapiLoaded || !googleApiToken) {
        console.warn("Operazione drop/resize fallita: GAPI non pronto o token mancante.");
        fetchGoogleCalendarEvents();
        return;
    }
    if (!event.googleEvent) {
        alert("Questa funzionalità è disponibile solo per eventi di Google Calendar.");
        fetchGoogleCalendarEvents();
        return;
    }

    console.log("Attempting to update event (drop/resize):", event.id);
    const eventResource = {
        summary: event.title,
        description: event.description,
        location: event.location,
        start: { dateTime: new Date(start).toISOString() },
        end: { dateTime: new Date(end).toISOString() },
        extendedProperties: {
          private: {
            category: event.category,
            relatedPraticaId: event.relatedPraticaId,
            isPrivate: String(event.isPrivate),
          }
        }
      };

    try {
      await window.gapi.client.calendar.events.update({
        calendarId: 'primary',
        eventId: event.id,
        resource: eventResource,
      });
      console.log("Evento aggiornato con successo (drop/resize). Ricarico...");
      fetchGoogleCalendarEvents();
    } catch (error) {
      console.error("Errore nell'aggiornare l'evento (drop/resize):", error);
      alert("Errore durante l'aggiornamento dell'evento. Verranno ricaricati gli eventi.");
      fetchGoogleCalendarEvents();
    }
  }, [gapiLoaded, googleApiToken, fetchGoogleCalendarEvents]);


  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!gapiLoaded || !googleApiToken) {
      alert("Autenticazione Google Calendar richiesta.");
      return;
    }
    if (new Date(formState.end) <= new Date(formState.start)) {
        alert("L'ora di fine deve essere successiva all'ora di inizio.");
        return;
    }


    const praticaSelezionata = tutteLePratiche.find(p => p.id === formState.relatedPraticaId);
    let eventTitle = formState.title;
    if (praticaSelezionata) {
        eventTitle = `${formState.title} (Pratica: ${praticaSelezionata.codice || praticaSelezionata.indirizzo})`;
    }

    const eventResource = {
      summary: eventTitle,
      description: formState.description,
      location: formState.location,
      start: { dateTime: new Date(formState.start).toISOString() },
      end: { dateTime: new Date(formState.end).toISOString() },
      extendedProperties: {
        private: {
          category: formState.category,
          relatedPraticaId: formState.relatedPraticaId || null,
          isPrivate: String(formState.isPrivate),
        },
      },
    };

    console.log("Submitting event:", formState.id ? "UPDATE" : "INSERT", eventResource);

    try {
      if (formState.id) {
        await window.gapi.client.calendar.events.update({
          calendarId: 'primary',
          eventId: formState.id,
          resource: eventResource,
        });
      } else {
        await window.gapi.client.calendar.events.insert({
          calendarId: 'primary',
          resource: eventResource,
        });
      }
      setShowEventModal(false);
      setSelectedEvent(null);
      setSelectedSlot(null);
      console.log("Evento salvato con successo. Ricarico...");
      fetchGoogleCalendarEvents();
    } catch (error) {
      console.error("Errore nel salvare l'evento su Google Calendar:", error);
      alert("Si è verificato un errore nel salvare l'evento su Google Calendar.");
    }
  };

  const handleDeleteCurrentEvent = async () => {
    if (!formState.id || !gapiLoaded || !googleApiToken) return;
    if (window.confirm("Sei sicuro di voler eliminare questo evento?")) {
      console.log("Attempting to delete event:", formState.id);
      try {
        await window.gapi.client.calendar.events.delete({
          calendarId: 'primary',
          eventId: formState.id,
        });
        setShowEventModal(false);
        setSelectedEvent(null);
        setSelectedSlot(null);
        console.log("Evento eliminato con successo. Ricarico...");
        fetchGoogleCalendarEvents();
      } catch (error) {
        console.error("Errore nell'eliminare l'evento da Google Calendar:", error);
        alert("Errore nell'eliminare l'evento.");
      }
    }
  };

  const mapGoogleColorToHex = (colorId) => {
    const googleColors = {
      '1': '#a4bdfc', '2': '#7ae7bf', '3': '#dbadff', '4': '#ff887c',
      '5': '#fbd75b', '6': '#ffb878', '7': '#46d6db', '8': '#e1e1e1',
      '9': '#5484ed', '10': '#51b749', '11': '#dc2127',
    };
    return googleColors[colorId] || defaultEventColor;
  };

  const eventStyleGetter = (event) => {
    const backgroundColor = event.color || eventColors[event.category] || defaultEventColor;
    let textColor = '#333333';
    if (['#FBF8CC', '#E4DFEC', '#DAEEF3', '#FCD5B4', '#D8E4BC', '#E5E7EB', '#A7F3D0', '#a4bdfc', '#7ae7bf', '#ffb878', '#46d6db', '#e1e1e1'].includes(backgroundColor.toLowerCase())) {
        textColor = '#404040';
    } else if (['#FFCCCC'].includes(backgroundColor.toLowerCase())){
        textColor = '#7f1d1d';
    }


    const style = {
      backgroundColor,
      borderRadius: '5px',
      opacity: 0.9,
      color: textColor,
      border: '1px solid rgba(0,0,0,0.1)',
      display: 'block',
      fontSize: '0.75em',
      padding: '1px 3px',
    };
    return { style };
  };

  const messages = {
    allDay: 'Tutto il giorno',
    previous: 'Prec',
    next: 'Succ',
    today: 'Oggi',
    month: 'Mese',
    week: 'Settimana',
    day: 'Giorno',
    agenda: 'Agenda',
    date: 'Data',
    time: 'Ora',
    event: 'Evento',
    noEventsInRange: 'Nessun evento in questo intervallo.',
    showMore: total => `+ Altri ${total}`
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
        <h1 className="text-2xl font-bold text-gray-800">Calendario</h1>
        <div>
          {!googleApiToken ? (
            <button
              onClick={() => { console.log("Connetti Google Calendar clicked. GAPI loaded:", gapiLoaded); if (gapiLoaded) googleLogin(); else loadGapiScript().then(() => googleLogin());}}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex items-center text-sm sm:text-base"
              disabled={isLoadingEvents} // Disabilitato mentre si caricano eventi o gapi
            >
              <FaCalendarCheck className="mr-2" /> Connetti Google Calendar
            </button>
          ) : (
            <div className="flex items-center space-x-2">
              <button
                onClick={fetchGoogleCalendarEvents}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-2 px-3 rounded flex items-center text-xs sm:text-sm"
                disabled={isLoadingEvents || !gapiLoaded}
                title="Aggiorna eventi"
              >
                <FaSync className={`mr-1 sm:mr-2 ${isLoadingEvents ? 'animate-spin' : ''}`} /> Aggiorna
              </button>
              <button
                onClick={handleGoogleLogout}
                className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-3 rounded flex items-center text-xs sm:text-sm"
                title="Disconnetti Google Calendar"
              >
                <FaCalendarTimes className="mr-1 sm:mr-2" /> Disconnetti
              </button>
            </div>
          )}
        </div>
      </div>

      {(!gapiLoaded && !googleApiToken) && (
        <div className="text-center py-4 text-gray-600 bg-yellow-50 p-3 rounded-md">
          Inizializzazione API di Google in corso... Se il messaggio persiste, assicurati che il Client ID Google sia corretto in `src/index.js` e prova a ricaricare la pagina.
        </div>
      )}

      {(googleApiToken && gapiLoaded) ? (
        <div style={{ height: 'calc(100vh - 220px)' }} className="bg-white p-2 sm:p-4 rounded-lg shadow-md">
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: '100%' }}
            views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
            defaultView={Views.WEEK}
            selectable
            onSelectSlot={handleSelectSlot}
            onSelectEvent={handleSelectEvent}
            onEventDrop={handleEventDropOrResize}
            onEventResize={handleEventDropOrResize}
            resizable
            messages={messages}
            culture="it-IT"
            eventPropGetter={eventStyleGetter}
            dayLayoutAlgorithm="no-overlap"
            popup
            formats={{
                agendaHeaderFormat: ({ start, end }, culture, local) =>
                  local.format(start, 'dd/MM/yyyy', culture) + ' – ' + local.format(end, 'dd/MM/yyyy', culture),
                dayHeaderFormat: (date, culture, local) => local.format(date, 'eeee dd MMMM', culture), // Formato più completo
                dayRangeHeaderFormat: ({ start, end }, culture, local) =>
                  local.format(start, 'dd MMM', culture) + ' – ' + local.format(end, 'dd MMM', culture)
            }}
            step={15}
            timeslots={4}
          />
        </div>
      ) : !googleApiToken && gapiLoaded ? (
        <div className="text-center py-10 text-gray-700 bg-gray-50 p-6 rounded-lg shadow">
            <FaCalendarCheck className="mx-auto text-4xl text-blue-500 mb-3" />
            <p className="text-lg">Connetti il tuo Google Calendar per visualizzare e gestire gli eventi.</p>
        </div>
      ) : null}

      {showEventModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] p-4">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                {formState.id ? 'Modifica Evento' : 'Nuovo Evento'}
              </h2>
              <button onClick={() => {setShowEventModal(false); setSelectedEvent(null); setSelectedSlot(null);}} className="text-gray-500 hover:text-gray-700 text-2xl p-1">&times;</button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label htmlFor="eventTitleModal" className="block text-sm font-medium text-gray-700">Titolo *</label>
                <input
                  type="text"
                  id="eventTitleModal"
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={formState.title}
                  onChange={(e) => setFormState({ ...formState, title: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="eventStartDateModal" className="block text-sm font-medium text-gray-700">Data Inizio</label>
                  <input
                    type="date"
                    id="eventStartDateModal"
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={formState.start ? format(formState.start, 'yyyy-MM-dd') : ''}
                    onChange={(e) => setFormState({ ...formState, start: new Date(e.target.value + 'T' + (formState.start ? format(formState.start, 'HH:mm') : '00:00')) })}
                  />
                </div>
                <div>
                  <label htmlFor="eventStartTimeModal" className="block text-sm font-medium text-gray-700">Ora Inizio</label>
                  <input
                    type="time"
                    id="eventStartTimeModal"
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={formState.start ? format(formState.start, 'HH:mm') : ''}
                    onChange={(e) => setFormState({ ...formState, start: new Date((formState.start ? format(formState.start, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')) + 'T' + e.target.value) })}
                    step="900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="eventEndDateModal" className="block text-sm font-medium text-gray-700">Data Fine</label>
                  <input
                    type="date"
                    id="eventEndDateModal"
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={formState.end ? format(formState.end, 'yyyy-MM-dd') : ''}
                    onChange={(e) => setFormState({ ...formState, end: new Date(e.target.value + 'T' + (formState.end ? format(formState.end, 'HH:mm') : '00:00')) })}
                  />
                </div>
                <div>
                  <label htmlFor="eventEndTimeModal" className="block text-sm font-medium text-gray-700">Ora Fine</label>
                  <input
                    type="time"
                    id="eventEndTimeModal"
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={formState.end ? format(formState.end, 'HH:mm') : ''}
                    onChange={(e) => setFormState({ ...formState, end: new Date((formState.end ? format(formState.end, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')) + 'T' + e.target.value) })}
                    step="900"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="eventDescriptionModal" className="block text-sm font-medium text-gray-700">Descrizione</label>
                <textarea
                  id="eventDescriptionModal"
                  rows="3"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={formState.description}
                  onChange={(e) => setFormState({ ...formState, description: e.target.value })}
                ></textarea>
              </div>

              <div>
                <label htmlFor="eventLocationModal" className="block text-sm font-medium text-gray-700">Luogo</label>
                <input
                  type="text"
                  id="eventLocationModal"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={formState.location}
                  onChange={(e) => setFormState({ ...formState, location: e.target.value })}
                />
              </div>

              <div>
                <label htmlFor="eventCategoryModal" className="block text-sm font-medium text-gray-700">Categoria</label>
                <select
                  id="eventCategoryModal"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={formState.category}
                  onChange={(e) => setFormState({ ...formState, category: e.target.value })}
                >
                  {Object.entries(eventColors).map(([key, value]) => (
                    <option key={key} value={key}>
                      {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="relatedPraticaModal" className="block text-sm font-medium text-gray-700">Pratica Collegata</label>
                <select
                  id="relatedPraticaModal"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={formState.relatedPraticaId}
                  onChange={(e) => {
                    const praticaId = e.target.value;
                    const isPrivate = pratichePrivate.some(p => p.id === praticaId);
                    setFormState({
                      ...formState,
                      relatedPraticaId: praticaId,
                      isPrivate: isPrivate
                    });
                  }}
                >
                  <option value="">Nessuna pratica</option>
                  {tutteLePratiche.map((pratica) => (
                    <option key={pratica.id} value={pratica.id}>
                      {`${pratica.codice || 'ID:'+pratica.id.substring(0,5)} - ${pratica.indirizzo || ''} (${pratica.cliente || 'N/D'}) ${pratichePrivate.some(p => p.id === pratica.id) ? '(Priv.)' : '(Std.)'}`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-between items-center pt-4 mt-4 border-t">
                {formState.id ? (
                    <button
                    type="button"
                    onClick={handleDeleteCurrentEvent}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center"
                    >
                    <FaTrash className="mr-2" /> Elimina
                    </button>
                ) : ( <div></div> )}
                <div className="flex space-x-2">
                    <button
                    type="button"
                    onClick={() => {setShowEventModal(false); setSelectedEvent(null); setSelectedSlot(null);}}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                    Annulla
                    </button>
                    <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                    >
                    <FaSave className="mr-2" /> Salva Evento
                    </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default CalendarPage; // Assicurati che ci sia l'export default
import React, { useState, useEffect, useCallback } from 'react';
import { format, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isSameDay, parse } from 'date-fns';
import { it } from 'date-fns/locale';
import { FaChevronLeft, FaChevronRight, FaCalendarAlt, FaListUl, FaCog, FaPlus, FaSync, FaGoogle } from 'react-icons/fa';
import { BsCalendarWeek, BsCalendarMonth, BsCalendarDay } from 'react-icons/bs';
import { usePratiche } from '../contexts/PraticheContext';
import { signInWithGoogle, isGoogleCalendarAuthenticated, getGoogleCalendarToken } from '../firebase';

// Colori per le diverse categorie di eventi
const eventColors = {
  sopralluogo: '#FBF8CC', // giallo chiaro
  incarico: '#FFCCCC', // rosso chiaro
  pagamento: '#E4DFEC', // viola chiaro
  accessoAtti: '#FCD5B4', // arancione chiaro
  presentazionePratica: '#DAEEF3', // azzurro chiaro
  altro: '#D8E4BC', // verde chiaro
  privato: '#CCCCCC' // grigio chiaro
};

// Componente principale della pagina calendario
function CalendarPage() {
  const { pratiche } = usePratiche();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('month'); // 'month', 'week', 'day'
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [calendars, setCalendars] = useState([]);
  const [selectedCalendars, setSelectedCalendars] = useState([]);
  
  // Stato per il form di eventi spostato a livello di componente (fix per hooks)
  const [formState, setFormState] = useState({
    title: '',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    startTime: format(new Date(), 'HH:mm'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    endTime: format(new Date(new Date().setHours(new Date().getHours() + 1)), 'HH:mm'),
    description: '',
    location: '',
    category: 'altro',
    calendarId: 'primary',
    relatedPraticaId: ''
  });

  // Controlla l'autenticazione all'avvio
  useEffect(() => {
    // Verifica se l'utente è già autenticato
    const authenticated = isGoogleCalendarAuthenticated();
    setIsAuthenticated(authenticated);
    
    // Controlla se c'è un evento creato da una pratica
    const newEventData = localStorage.getItem('newEventFromPratica');
    if (newEventData) {
      try {
        const newEvent = JSON.parse(newEventData);
        setSelectedEvent(null);
        setSelectedDate(new Date(newEvent.start));
        setShowEventModal(true);
        // Rimuovi l'evento dalla localStorage dopo averlo utilizzato
        localStorage.removeItem('newEventFromPratica');
      } catch (error) {
        console.error('Errore nel parsing dell\'evento:', error);
      }
    }
  }, []);
  
  // Aggiorna il formState quando selectedEvent o selectedDate cambiano
  useEffect(() => {
    // Recupera eventuale nuovo evento dalla localStorage
    const storedEventData = localStorage.getItem('newEventFromPratica');
    const storedEvent = storedEventData ? JSON.parse(storedEventData) : null;
    
    const event = selectedEvent || storedEvent || {
      title: '',
      start: selectedDate ? new Date(selectedDate) : new Date(),
      end: selectedDate ? new Date(new Date(selectedDate).setHours(new Date(selectedDate).getHours() + 1)) : new Date(new Date().setHours(new Date().getHours() + 1)),
      description: '',
      location: '',
      category: 'altro',
      color: eventColors.altro,
      calendarId: 'primary'
    };
    
    const startDate = new Date(event.start);
    const endDate = new Date(event.end);
    
    setFormState({
      title: event.title,
      startDate: format(startDate, 'yyyy-MM-dd'),
      startTime: format(startDate, 'HH:mm'),
      endDate: format(endDate, 'yyyy-MM-dd'),
      endTime: format(endDate, 'HH:mm'),
      description: event.description || '',
      location: event.location || '',
      category: event.category || 'altro',
      calendarId: event.calendarId || 'primary',
      relatedPraticaId: event.relatedPraticaId || ''
    });
    
    // Se l'evento dalla localStorage aveva un id di pratica correlata, lo impostiamo
    if (storedEvent && storedEvent.relatedPraticaId) {
      setFormState(prev => ({
        ...prev,
        relatedPraticaId: storedEvent.relatedPraticaId
      }));
    }
  }, [selectedEvent, selectedDate]);

  // Funzione per ottenere gli eventi da Google Calendar
  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      // Verifica se l'utente è autenticato
      if (isGoogleCalendarAuthenticated()) {
        // Qui aggiungerai in futuro il codice per recuperare eventi reali da Google Calendar
        console.log("Usando token per recuperare eventi:", getGoogleCalendarToken());
        
        // TODO: Implementare la chiamata API reale a Google Calendar
        // Per ora continuiamo con i mock data
      }
      
      // Mock data per eventi
      const mockEvents = [
        {
          id: '1',
          title: 'Sopralluogo Via Roma 123',
          start: new Date(2025, 2, 25, 15, 0), // 25 Marzo 2025, 15:00
          end: new Date(2025, 2, 25, 16, 30),
          color: eventColors.sopralluogo,
          description: 'Sopralluogo per verifica conformità',
          location: 'Via Roma 123, Viareggio',
          calendarId: 'primary',
          relatedPraticaId: pratiche[0]?.id || null
        },
        {
          id: '2',
          title: 'Incarico Donati',
          start: new Date(2025, 2, 28, 15, 0), // 28 Marzo 2025, 15:00
          end: new Date(2025, 2, 28, 16, 0),
          color: eventColors.incarico,
          description: 'Firma incarico professionale',
          location: 'Studio, Via del Mare 45',
          calendarId: 'primary',
          relatedPraticaId: null
        },
        {
          id: '3',
          title: 'Non disponibile',
          start: new Date(2025, 2, 6, 15, 0), // 6 Marzo 2025, 15:00
          end: new Date(2025, 2, 6, 17, 0),
          color: eventColors.altro,
          description: 'Non disponibile',
          calendarId: 'primary',
          relatedPraticaId: null
        },
        {
          id: '4',
          title: 'Fattura Parrini primo acconto',
          start: new Date(2025, 2, 26, 17, 0), // 26 Marzo 2025, 17:00
          end: new Date(2025, 2, 26, 17, 30),
          color: eventColors.pagamento,
          description: 'Emettere fattura primo acconto',
          calendarId: 'primary',
          relatedPraticaId: null
        },
        {
          id: '5',
          title: 'Pratiche loc. GINORI',
          start: new Date(2025, 2, 26, 18, 0), // 26 Marzo 2025, 18:00
          end: new Date(2025, 2, 26, 19, 0),
          color: eventColors.altro,
          description: 'Revisione pratiche località Ginori',
          calendarId: 'primary',
          relatedPraticaId: null
        },
        {
          id: '6',
          title: 'AGG via Boltori',
          start: new Date(2025, 2, 14, 15, 0), // 14 Marzo 2025, 15:00
          end: new Date(2025, 2, 14, 16, 0),
          color: eventColors.presentazionePratica,
          description: 'Aggiornamento pratica via Boltori',
          calendarId: 'primary',
          relatedPraticaId: null
        }
      ];

      // Aggiungi più mockEvents per simulare i dati delle immagini fornite
      const additionalEvents = [
        {
          id: '7',
          title: 'Chiamare ALE proprietario via...',
          start: new Date(2025, 2, 25, 15, 0),
          end: new Date(2025, 2, 25, 15, 30),
          color: eventColors.altro,
          calendarId: 'primary'
        },
        {
          id: '8',
          title: 'Giacomo Ferrari Barner Querc...',
          start: new Date(2025, 2, 25, 15, 30),
          end: new Date(2025, 2, 25, 16, 30),
          color: eventColors.altro,
          calendarId: 'primary'
        },
        {
          id: '9',
          title: 'Giacomo Landi',
          start: new Date(2025, 2, 25, 17, 0),
          end: new Date(2025, 2, 25, 18, 0),
          color: eventColors.altro,
          calendarId: 'primary'
        },
        {
          id: '10',
          title: 'Mandare prezzario vuoto FERR...',
          start: new Date(2025, 2, 26, 15, 0),
          end: new Date(2025, 2, 26, 16, 0),
          color: eventColors.altro,
          calendarId: 'primary'
        },
        {
          id: '11',
          title: 'Privato sito',
          start: new Date(2025, 2, 26, 16, 30),
          end: new Date(2025, 2, 26, 17, 30),
          color: eventColors.privato,
          calendarId: 'primary'
        },
        {
          id: '12',
          title: 'Privato ufficio',
          start: new Date(2025, 2, 27, 15, 0),
          end: new Date(2025, 2, 27, 16, 0),
          color: eventColors.privato,
          calendarId: 'primary'
        },
        {
          id: '13',
          title: 'Incarico Tiziano',
          start: new Date(2025, 2, 28, 15, 30),
          end: new Date(2025, 2, 28, 16, 30),
          color: eventColors.incarico,
          calendarId: 'primary'
        },
        {
          id: '14',
          title: 'BARNER CAMAIORE appunta...',
          start: new Date(2025, 2, 5, 15, 30),
          end: new Date(2025, 2, 5, 16, 30),
          color: eventColors.altro,
          calendarId: 'primary'
        },
        {
          id: '15',
          title: 'Agenzia Lucca appuntamento...',
          start: new Date(2025, 2, 5, 18, 15),
          end: new Date(2025, 2, 5, 19, 15),
          color: eventColors.altro,
          calendarId: 'primary'
        }
      ];

      setEvents([...mockEvents, ...additionalEvents]);

      // Mock dei calendari disponibili
      setCalendars([
        { id: 'primary', summary: 'Il mio calendario', selected: true, backgroundColor: '#4285F4' },
        { id: 'work', summary: 'Lavoro', selected: true, backgroundColor: '#0B8043' },
        { id: 'family', summary: 'Famiglia', selected: true, backgroundColor: '#8E24AA' },
        { id: 'holidays', summary: 'Festività italiane', selected: true, backgroundColor: '#D50000' }
      ]);

      setSelectedCalendars(['primary', 'work', 'family', 'holidays']);
      
      // Se abbiamo un token di autenticazione, aggiorna lo stato
      setIsAuthenticated(isGoogleCalendarAuthenticated());
    } catch (error) {
      console.error('Errore nel recupero degli eventi:', error);
    } finally {
      setIsLoading(false);
    }
  }, [pratiche]);

  // Carica gli eventi all'avvio e quando cambia la vista o la data
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents, currentDate, view]);

  // Funzioni per la navigazione del calendario
  const navigatePrev = () => {
    if (view === 'month') {
      setCurrentDate(subMonths(currentDate, 1));
    } else if (view === 'week') {
      setCurrentDate(subWeeks(currentDate, 1));
    } else if (view === 'day') {
      setCurrentDate(subDays(currentDate, 1));
    }
  };

  const navigateNext = () => {
    if (view === 'month') {
      setCurrentDate(addMonths(currentDate, 1));
    } else if (view === 'week') {
      setCurrentDate(addWeeks(currentDate, 1));
    } else if (view === 'day') {
      setCurrentDate(addDays(currentDate, 1));
    }
  };

  const navigateToday = () => {
    setCurrentDate(new Date());
  };

  // Funzione per autenticarsi con Google
  const handleGoogleAuth = async () => {
    try {
      // Utilizza la funzione reale di autenticazione OAuth2
      const result = await signInWithGoogle();
      
      if (result && result.token) {
        console.log("Autenticazione riuscita, token:", result.token);
        setIsAuthenticated(true);
        fetchEvents(); // Aggiorna gli eventi dopo l'autenticazione
      } else {
        alert("Autenticazione non riuscita. Riprova.");
      }
    } catch (error) {
      console.error("Errore durante l'autenticazione Google:", error);
      alert("Si è verificato un errore durante l'autenticazione. Riprova.");
    }
  };

  // Funzione per creare un nuovo evento
  const handleCreateEvent = (date) => {
    setSelectedDate(date);
    setSelectedEvent(null);
    setShowEventModal(true);
  };

  // Funzione per visualizzare i dettagli di un evento
  const handleViewEvent = (event) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  };

  // Funzione per salvare un evento (nuovo o modificato)
  const handleSaveEvent = async (eventData) => {
    try {
      // Qui andrebbe la vera logica di salvataggio con l'API di Google Calendar
      if (selectedEvent) {
        // Modifica evento esistente
        const updatedEvents = events.map(event => 
          event.id === selectedEvent.id ? {...event, ...eventData} : event
        );
        setEvents(updatedEvents);
      } else {
        // Nuovo evento
        const newEvent = {
          id: Date.now().toString(),
          ...eventData,
          color: eventColors[eventData.category] || eventColors.altro
        };
        setEvents([...events, newEvent]);
      }
      
      setShowEventModal(false);
    } catch (error) {
      console.error("Errore nel salvare l'evento:", error);
      alert("Si è verificato un errore nel salvare l'evento.");
    }
  };

  // Funzione per eliminare un evento
  const handleDeleteEvent = async (eventId) => {
    if (window.confirm("Sei sicuro di voler eliminare questo evento?")) {
      try {
        // Qui andrebbe la vera logica di eliminazione con l'API di Google Calendar
        setEvents(events.filter(event => event.id !== eventId));
        setShowEventModal(false);
      } catch (error) {
        console.error("Errore nell'eliminare l'evento:", error);
        alert("Si è verificato un errore nell'eliminare l'evento.");
      }
    }
  };

  // Funzione per gestire il cambio dei calendari selezionati
  const handleCalendarToggle = (calendarId) => {
    if (selectedCalendars.includes(calendarId)) {
      setSelectedCalendars(selectedCalendars.filter(id => id !== calendarId));
    } else {
      setSelectedCalendars([...selectedCalendars, calendarId]);
    }
  };

  // Gestisce i cambiamenti nel form dell'evento
  const handleFormChange = (field, value) => {
    setFormState(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Gestisce il submit del form dell'evento
  const handleSubmitEventForm = (e) => {
    e.preventDefault();
    
    const startDateTime = new Date(`${formState.startDate}T${formState.startTime}`);
    const endDateTime = new Date(`${formState.endDate}T${formState.endTime}`);
    
    // Controlla che la data di fine sia dopo quella di inizio
    if (endDateTime <= startDateTime) {
      alert('La data di fine deve essere successiva alla data di inizio.');
      return;
    }
    
    const eventData = {
      title: formState.title,
      start: startDateTime,
      end: endDateTime,
      description: formState.description,
      location: formState.location,
      category: formState.category,
      color: eventColors[formState.category] || eventColors.altro,
      calendarId: formState.calendarId,
      relatedPraticaId: formState.relatedPraticaId || null
    };
    
    handleSaveEvent(eventData);
  };

  // Genera intestazioni e celle per la vista mensile
  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = startOfWeek(monthStart, { locale: it });
    const endDate = endOfWeek(monthEnd, { locale: it });

    const dateFormat = 'd';
    const dayFormat = 'EEEEEE';
    const monthYearFormat = 'MMMM yyyy';
    
    const days = [];
    let day = startDate;
    
    // Intestazioni dei giorni della settimana
    const daysOfWeek = [];
    for (let i = 0; i < 7; i++) {
      daysOfWeek.push(
        <div key={`header-${i}`} className="text-center font-medium py-2 border-b">
          {format(addDays(startDate, i), dayFormat, { locale: it }).toUpperCase()}
        </div>
      );
    }

    // Celle dei giorni
    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const cloneDay = day;
        const dateString = format(cloneDay, 'yyyy-MM-dd');
        const dayEvents = events.filter(event => 
          isSameDay(parse(dateString, 'yyyy-MM-dd', new Date()), new Date(event.start))
        );
        
        days.push(
          <div
            key={dateString}
            className={`min-h-24 border p-1 ${
              !isSameMonth(cloneDay, monthStart) ? 'bg-gray-100 text-gray-400' : 
              isSameDay(cloneDay, new Date()) ? 'bg-blue-50 border-blue-500' : ''
            }`}
            onClick={() => handleCreateEvent(cloneDay)}
          >
            <div className="flex justify-between items-center">
              <span className={`font-medium ${isSameDay(cloneDay, new Date()) ? 'text-blue-600' : ''}`}>
                {format(cloneDay, dateFormat)}
              </span>
              {dayEvents.length > 0 && (
                <span className="text-xs text-gray-500">{dayEvents.length} eventi</span>
              )}
            </div>
            <div className="overflow-y-auto max-h-20">
              {dayEvents.map((event, idx) => (
                <div 
                  key={event.id}
                  className="text-xs mt-1 p-1 rounded truncate cursor-pointer"
                  style={{ backgroundColor: event.color || eventColors.altro }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewEvent(event);
                  }}
                >
                  {format(new Date(event.start), 'HH:mm')} {event.title}
                </div>
              ))}
            </div>
          </div>
        );
        
        day = addDays(day, 1);
      }
    }

    return (
      <div>
        <div className="text-xl font-bold mb-4 text-center">
          {format(currentDate, monthYearFormat, { locale: it })}
        </div>
        <div className="grid grid-cols-7 gap-0">
          {daysOfWeek}
          {days}
        </div>
      </div>
    );
  };

  // Funzione per controllare se due date sono nello stesso mese
  const isSameMonth = (date1, date2) => {
    return date1.getMonth() === date2.getMonth() && date1.getFullYear() === date2.getFullYear();
  };

  // Genera vista settimanale
  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate, { locale: it });
    const weekEnd = endOfWeek(currentDate, { locale: it });
    
    const days = [];
    let day = weekStart;
    
    // Righe orarie
    const hours = [];
    for (let hour = 8; hour <= 20; hour++) {
      hours.push(
        <div key={`hour-${hour}`} className="border-t h-12 relative">
          <span className="absolute -top-2 -left-16 text-xs text-gray-500">
            {hour.toString().padStart(2, '0')}:00
          </span>
        </div>
      );
    }

    // Intestazioni dei giorni
    while (day <= weekEnd) {
      const dayStr = format(day, 'EEEE d', { locale: it });
      const isToday = isSameDay(day, new Date());
      
      const dayEvents = events.filter(event => 
        isSameDay(day, new Date(event.start))
      );
      
      days.push(
        <div key={day.toString()} className="flex-1 min-w-0">
          <div className={`text-center p-2 border-b ${isToday ? 'bg-blue-50 font-bold' : ''}`}>
            {dayStr}
          </div>
          <div className="relative min-h-[576px]"> {/* 12 ore * 48px */}
            {dayEvents.map(event => {
              const startHour = new Date(event.start).getHours();
              const startMinute = new Date(event.start).getMinutes();
              const endHour = new Date(event.end).getHours();
              const endMinute = new Date(event.end).getMinutes();
              
              const top = ((startHour - 8) * 60 + startMinute) * 0.2; // 0.2px per minuto
              const height = ((endHour - startHour) * 60 + (endMinute - startMinute)) * 0.2;
              
              return (
                <div
                  key={event.id}
                  className="absolute left-0 right-0 mx-1 p-1 rounded text-xs overflow-hidden"
                  style={{
                    top: `${top}px`,
                    height: `${height}px`,
                    backgroundColor: event.color || eventColors.altro
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewEvent(event);
                  }}
                >
                  <div className="font-bold">{format(new Date(event.start), 'HH:mm')}</div>
                  <div className="truncate">{event.title}</div>
                </div>
              );
            })}
            <div className="absolute inset-0">
              {hours}
            </div>
          </div>
        </div>
      );
      
      day = addDays(day, 1);
    }

    return (
      <div>
        <div className="text-xl font-bold mb-4 text-center">
          {format(weekStart, 'd MMMM', { locale: it })} - {format(weekEnd, 'd MMMM yyyy', { locale: it })}
        </div>
        <div className="flex">
          <div className="w-16">
            <div className="h-12 border-b"></div> {/* Spazio per intestazioni */}
            <div className="relative min-h-[576px]">
              {hours}
            </div>
          </div>
          <div className="flex flex-1">
            {days}
          </div>
        </div>
      </div>
    );
  };

  // Genera vista giornaliera
  const renderDayView = () => {
    const dayFormat = 'EEEE d MMMM yyyy';
    
    const dayEvents = events.filter(event => 
      isSameDay(currentDate, new Date(event.start))
    );
    
    // Righe orarie
    const hours = [];
    for (let hour = 8; hour <= 20; hour++) {
      const hourEvents = dayEvents.filter(event => {
        const eventStartHour = new Date(event.start).getHours();
        const eventEndHour = new Date(event.end).getHours();
        return eventStartHour <= hour && eventEndHour > hour;
      });
      
      hours.push(
        <div key={`hour-${hour}`} className="flex border-t">
          <div className="w-16 pr-2 py-2 text-right text-gray-500">
            {hour.toString().padStart(2, '0')}:00
          </div>
          <div 
            className="flex-1 min-h-16 py-1 relative"
            onClick={() => {
              const dateWithHour = new Date(currentDate);
              dateWithHour.setHours(hour, 0, 0, 0);
              handleCreateEvent(dateWithHour);
            }}
          >
            {hourEvents.map(event => {
              const startHour = new Date(event.start).getHours();
              const startMinute = new Date(event.start).getMinutes();
              const eventTop = startHour === hour ? `${startMinute}px` : '0px';
              
              return (
                <div
                  key={event.id}
                  className="p-2 my-1 rounded"
                  style={{ 
                    backgroundColor: event.color || eventColors.altro,
                    marginTop: eventTop
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewEvent(event);
                  }}
                >
                  <div className="font-bold">
                    {format(new Date(event.start), 'HH:mm')} - {format(new Date(event.end), 'HH:mm')}
                  </div>
                  <div>{event.title}</div>
                  {event.location && <div className="text-sm">{event.location}</div>}
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    return (
      <div>
        <div className="text-xl font-bold mb-4 text-center">
          {format(currentDate, dayFormat, { locale: it })}
        </div>
        <div className="bg-white">
          {hours}
        </div>
      </div>
    );
  };

  // Seleziona la vista appropriata
  const renderCalendarView = () => {
    switch (view) {
      case 'month':
        return renderMonthView();
      case 'week':
        return renderWeekView();
      case 'day':
        return renderDayView();
      default:
        return renderMonthView();
    }
  };

  // Modale per la creazione/modifica eventi - MODIFICATO PER USARE formState GLOBALE
  const renderEventModal = () => {
    if (!showEventModal) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-5 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
          <h2 className="text-lg font-semibold mb-3">
            {selectedEvent ? 'Modifica Evento' : 'Nuovo Evento'}
          </h2>
          
          <form onSubmit={handleSubmitEventForm} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Titolo *</label>
              <input
                type="text"
                required
                className="w-full p-2 border border-gray-300 rounded-md"
                value={formState.title}
                onChange={(e) => handleFormChange('title', e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data inizio</label>
                <input
                  type="date"
                  required
                  className="w-full p-2 border border-gray-300 rounded-md"
                  value={formState.startDate}
                  onChange={(e) => handleFormChange('startDate', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ora inizio</label>
                <input
                  type="time"
                  required
                  className="w-full p-2 border border-gray-300 rounded-md"
                  value={formState.startTime}
                  onChange={(e) => handleFormChange('startTime', e.target.value)}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data fine</label>
                <input
                  type="date"
                  required
                  className="w-full p-2 border border-gray-300 rounded-md"
                  value={formState.endDate}
                  onChange={(e) => handleFormChange('endDate', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ora fine</label>
                <input
                  type="time"
                  required
                  className="w-full p-2 border border-gray-300 rounded-md"
                  value={formState.endTime}
                  onChange={(e) => handleFormChange('endTime', e.target.value)}
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descrizione</label>
              <textarea
                className="w-full p-2 border border-gray-300 rounded-md"
                rows="3"
                value={formState.description}
                onChange={(e) => handleFormChange('description', e.target.value)}
              ></textarea>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Luogo</label>
              <input
                type="text"
                className="w-full p-2 border border-gray-300 rounded-md"
                value={formState.location}
                onChange={(e) => handleFormChange('location', e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
              <select
                className="w-full p-2 border border-gray-300 rounded-md"
                value={formState.category}
                onChange={(e) => handleFormChange('category', e.target.value)}
              >
                <option value="sopralluogo">Sopralluogo</option>
                <option value="incarico">Incarico</option>
                <option value="pagamento">Pagamento</option>
                <option value="accessoAtti">Accesso Atti</option>
                <option value="presentazionePratica">Presentazione Pratica</option>
                <option value="privato">Privato</option>
                <option value="altro">Altro</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Calendario</label>
              <select
                className="w-full p-2 border border-gray-300 rounded-md"
                value={formState.calendarId}
                onChange={(e) => handleFormChange('calendarId', e.target.value)}
              >
                {calendars.map(calendar => (
                  <option key={calendar.id} value={calendar.id}>
                    {calendar.summary}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pratica collegata</label>
              <select
                className="w-full p-2 border border-gray-300 rounded-md"
                value={formState.relatedPraticaId}
                onChange={(e) => handleFormChange('relatedPraticaId', e.target.value)}
              >
                <option value="">Nessuna pratica collegata</option>
                {pratiche.map(pratica => (
                  <option key={pratica.id} value={pratica.id}>
                    {pratica.codice} - {pratica.indirizzo} - {pratica.cliente}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex justify-between pt-4 border-t">
              {selectedEvent && (
                <button
                  type="button"
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                  onClick={() => handleDeleteEvent(selectedEvent.id)}
                >
                  Elimina
                </button>
              )}
              
              <div className="space-x-2">
                <button
                  type="button"
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
                  onClick={() => setShowEventModal(false)}
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Salva
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Modale per le impostazioni del calendario
  const renderSettingsModal = () => {
    if (!showSettingsModal) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-5 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
          <h2 className="text-lg font-semibold mb-3">Impostazioni Calendario</h2>
          
          <h3 className="font-medium mt-4 mb-2">Calendari</h3>
          <div className="space-y-2 mb-4">
            {calendars.map(calendar => (
              <label key={calendar.id} className="flex items-center">
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={selectedCalendars.includes(calendar.id)}
                  onChange={() => handleCalendarToggle(calendar.id)}
                />
                <span className="w-4 h-4 inline-block mr-2" style={{ backgroundColor: calendar.backgroundColor }}></span>
                {calendar.summary}
              </label>
            ))}
          </div>
          
          <h3 className="font-medium mt-4 mb-2">Aggiorna Frequenza</h3>
          <div className="flex items-center mb-4">
            <select className="p-2 border border-gray-300 rounded-md mr-2">
              <option value="5">5 minuti</option>
              <option value="15">15 minuti</option>
              <option value="30">30 minuti</option>
              <option value="60">1 ora</option>
            </select>
            <button 
              className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
              onClick={fetchEvents}
            >
              <FaSync className="inline-block mr-1" />
              Aggiorna ora
            </button>
          </div>
          
          <div className="flex justify-end mt-4 pt-4 border-t">
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              onClick={() => setShowSettingsModal(false)}
            >
              Chiudi
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Calendario</h1>
        
        {!isAuthenticated ? (
          <button 
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
            onClick={handleGoogleAuth}
          >
            <FaGoogle className="mr-2" />
            Connetti Google Calendar
          </button>
        ) : (
          <div className="flex items-center space-x-2">
            <button
              className="p-2 border border-gray-300 rounded-md hover:bg-gray-100"
              onClick={() => setShowEventModal(true)}
              title="Nuovo evento"
            >
              <FaPlus />
            </button>
            <button
              className="p-2 border border-gray-300 rounded-md hover:bg-gray-100"
              onClick={() => setShowSettingsModal(true)}
              title="Impostazioni"
            >
              <FaCog />
            </button>
          </div>
        )}
      </div>
      
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-2">
            <button 
              className="p-2 border border-gray-300 rounded-md hover:bg-gray-100"
              onClick={navigatePrev}
            >
              <FaChevronLeft />
            </button>
            <button 
              className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
              onClick={navigateToday}
            >
              Oggi
            </button>
            <button 
              className="p-2 border border-gray-300 rounded-md hover:bg-gray-100"
              onClick={navigateNext}
            >
              <FaChevronRight />
            </button>
          </div>
          
          <div className="flex items-center space-x-1">
            <button 
              className={`p-2 rounded-md ${view === 'day' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}
              onClick={() => setView('day')}
              title="Vista giornaliera"
            >
              <BsCalendarDay />
            </button>
            <button 
              className={`p-2 rounded-md ${view === 'week' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}
              onClick={() => setView('week')}
              title="Vista settimanale"
            >
              <BsCalendarWeek />
            </button>
            <button 
              className={`p-2 rounded-md ${view === 'month' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}
              onClick={() => setView('month')}
              title="Vista mensile"
            >
              <BsCalendarMonth />
            </button>
          </div>
        </div>
        
        <div className="p-4 overflow-x-auto">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            renderCalendarView()
          )}
        </div>
      </div>
      
      {renderEventModal()}
      {renderSettingsModal()}
    </div>
  );
}

export default CalendarPage;
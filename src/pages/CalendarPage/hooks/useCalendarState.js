// src/pages/CalendarPage/hooks/useCalendarState.js
import { useState, useCallback } from 'react';
import { addHours, startOfHour, format } from 'date-fns';

export const useCalendarState = (tutteLePratiche = [], pratichePrivate = []) => {
  const getInitialFormState = () => ({
    id: null,
    title: '',
    // Inizializza start e end con valori sensati e arrotondati
    start: startOfHour(new Date()),
    end: startOfHour(addHours(new Date(), 1)),
    description: '',
    location: '',
    category: 'altro',
    relatedPraticaId: '',
    isPrivate: false,
  });

  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null); // Potrebbe essere utile per riferimento, anche se il form usa formState
  const [selectedSlot, setSelectedSlot] = useState(null);   // Idem
  const [formState, setFormState] = useState(getInitialFormState());

  const handleSelectSlot = useCallback(({ start, end }) => {
    setSelectedSlot({ start, end });
    setSelectedEvent(null);
    setFormState({
      id: null,
      title: '',
      start: startOfHour(start), // Arrotonda all'inizio dell'ora
      end: startOfHour(addHours(start, 1)), // Default durata 1 ora, arrotondato
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

    const cleanTitle = event.title?.includes('(Pratica:')
      ? event.title.substring(0, event.title.indexOf('(Pratica:')).trim()
      : event.title;

    setFormState({
      id: event.id,
      title: cleanTitle || '',
      start: new Date(event.start), // Assicura che siano oggetti Date
      end: new Date(event.end),     // Assicura che siano oggetti Date
      description: event.description || '',
      location: event.location || '',
      category: event.category || 'altro',
      relatedPraticaId: event.relatedPraticaId || '',
      isPrivate: event.isPrivate || false, // Assicura che sia un booleano
    });
    setShowEventModal(true);
  }, []);

  const resetFormAndCloseModal = useCallback(() => {
    setShowEventModal(false);
    setSelectedEvent(null);
    setSelectedSlot(null);
    setFormState(getInitialFormState()); // Resetta allo stato iniziale
  }, []);

  const handleFormChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setFormState(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  }, []);

  const handleDateChange = useCallback((fieldName, dateValueString) => {
    // dateValueString è nel formato "yyyy-MM-dd"
    setFormState(prev => {
      const newDate = new Date(prev[fieldName] ? prev[fieldName] : new Date()); // Conserva l'ora esistente o usa l'ora corrente
      if (dateValueString) {
        const [year, month, day] = dateValueString.split('-').map(Number);
        newDate.setFullYear(year, month - 1, day); // Mese è 0-indexed
      }
      return { ...prev, [fieldName]: newDate };
    });
  }, []);

  const handleTimeChange = useCallback((fieldName, timeValueString) => {
    // timeValueString è nel formato "HH:mm"
    setFormState(prev => {
      const newDate = new Date(prev[fieldName] ? prev[fieldName] : new Date()); // Conserva la data esistente o usa la data corrente
      if (timeValueString) {
        const [hours, minutes] = timeValueString.split(':').map(Number);
        newDate.setHours(hours, minutes, 0, 0); // Resetta secondi e millisecondi
      }
      return { ...prev, [fieldName]: newDate };
    });
  }, []);

  const handleRelatedPraticaChange = useCallback((praticaId) => {
    const isPraticaPrivate = pratichePrivate.some(p => p.id === praticaId);
    setFormState(prev => ({
      ...prev,
      relatedPraticaId: praticaId,
      isPrivate: praticaId ? isPraticaPrivate : false,
    }));
  }, [pratichePrivate]);

  // Questa funzione è utile se vuoi che il titolo dell'evento includa dettagli della pratica
  // e vuoi generarlo al momento del salvataggio o della visualizzazione.
  const getEventTitleWithPraticaDetails = useCallback(() => {
    let eventTitle = formState.title;
    if (formState.relatedPraticaId) {
      const praticaSelezionata = tutteLePratiche.find(p => p.id === formState.relatedPraticaId);
      if (praticaSelezionata) {
        // Assicurati che il titolo base non sia vuoto prima di aggiungere dettagli
        const baseTitle = formState.title.trim() || "Evento";
        eventTitle = `${baseTitle} (Pratica: ${praticaSelezionata.indirizzo || 'N/D'} - ${praticaSelezionata.cliente || 'N/D'})`;
      }
    }
    return eventTitle;
  }, [formState.title, formState.relatedPraticaId, tutteLePratiche]);

  // Funzione per preparare l'oggetto evento per l'API di Google Calendar
  // Utilizza getEventTitleWithPraticaDetails per il titolo finale.
  const prepareEventForApi = useCallback(() => {
    const finalTitle = getEventTitleWithPraticaDetails();

    const extendedPrivateProperties = {
      category: formState.category,
      isPrivate: String(formState.isPrivate), // Google API preferisce stringhe per extendedProps
    };
    if (formState.relatedPraticaId) {
      extendedPrivateProperties.relatedPraticaId = formState.relatedPraticaId;
    }

    return {
      summary: finalTitle,
      description: formState.description,
      location: formState.location,
      start: { dateTime: new Date(formState.start).toISOString() },
      end: { dateTime: new Date(formState.end).toISOString() },
      extendedProperties: {
        private: extendedPrivateProperties,
      },
    };
  }, [formState, getEventTitleWithPraticaDetails]);


  // Handler per mostrare il modale per la creazione di un nuovo evento (usato da CalendarHeader)
  const openNewEventModal = useCallback((defaultDate = new Date()) => {
    setSelectedSlot(null); // Assicura che non ci sia uno slot selezionato che sovrascriva
    setSelectedEvent(null);
    setFormState({
      id: null,
      title: '',
      start: startOfHour(defaultDate),
      end: startOfHour(addHours(defaultDate, 1)),
      description: '',
      location: '',
      category: 'altro',
      relatedPraticaId: '',
      isPrivate: false,
    });
    setShowEventModal(true);
  }, []);


  return {
    showEventModal,
    // setShowEventModal, // Esposto solo se necessario direttamente, altrimenti tramite reset o open
    selectedEvent,
    selectedSlot,
    formState,
    // setFormState, // Esposto solo se necessario per manipolazioni molto specifiche, preferire handler

    handleSelectSlot,
    handleSelectEvent,
    resetFormAndCloseModal,
    openNewEventModal, // Per il pulsante "Aggiungi" in CalendarHeader

    // Handler per il form in EventModal
    handleFormChange,
    handleDateChange,
    handleTimeChange,
    handleRelatedPraticaChange,

    // Utility per preparare i dati per l'API
    // getEventTitleWithPraticaDetails, // Potrebbe non servire esporla se prepareEventForApi fa tutto
    prepareEventForApi,
  };
};
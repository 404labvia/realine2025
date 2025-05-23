// src/pages/CalendarPage/hooks/useCalendarState.js
import { useState, useCallback } from 'react';
import { addHours, startOfHour } from 'date-fns';

export const useCalendarState = (tutteLePratiche = [], pratichePrivate = []) => {
  // Modificato per accettare praticaIdToSelect
  const getInitialFormState = (praticaIdToSelect = '') => ({
    id: null,
    title: '', // Titolo sempre vuoto all'inizio
    start: startOfHour(new Date()),
    end: startOfHour(addHours(new Date(), 1)),
    description: '',
    relatedPraticaId: praticaIdToSelect, // Usa l'ID passato
    isPrivate: praticaIdToSelect ? pratichePrivate.some(p => p.id === praticaIdToSelect) : false,
    targetCalendarId: 'primary',
  });

  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [formState, setFormState] = useState(getInitialFormState());

  const handleSelectSlot = useCallback(({ start, end }) => {
    setSelectedSlot({ start, end });
    setSelectedEvent(null);
    setFormState({
      id: null,
      title: '',
      start: startOfHour(start),
      end: startOfHour(addHours(start, 1)),
      description: '',
      relatedPraticaId: '',
      isPrivate: false,
      targetCalendarId: 'primary',
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
      start: new Date(event.start),
      end: new Date(event.end),
      description: event.description || '',
      relatedPraticaId: event.relatedPraticaId || '',
      isPrivate: event.isPrivate || false,
      targetCalendarId: event.sourceCalendarId || 'primary',
    });
    setShowEventModal(true);
  }, []);

  const resetFormAndCloseModal = useCallback(() => {
    setShowEventModal(false);
    setSelectedEvent(null);
    setSelectedSlot(null);
    setFormState(getInitialFormState());
  }, []);

  const handleFormChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setFormState(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  }, []);

  const handleDateChange = useCallback((fieldName, dateValueString) => {
    setFormState(prev => {
      const newDate = new Date(prev[fieldName] ? prev[fieldName] : Date.now());
      if (dateValueString) {
        const [year, month, day] = dateValueString.split('-').map(Number);
        newDate.setFullYear(year, month - 1, day);
      }
      return { ...prev, [fieldName]: newDate };
    });
  }, []);

  const handleTimeChange = useCallback((fieldName, timeValueString) => {
    setFormState(prev => {
      const newDate = new Date(prev[fieldName] ? prev[fieldName] : Date.now());
      if (timeValueString) {
        const [hours, minutes] = timeValueString.split(':').map(Number);
        newDate.setHours(hours, minutes, 0, 0);
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
      // Non modifichiamo il titolo qui per mantenere quello inserito dall'utente
    }));
  }, [pratichePrivate]);

  // Mantenuto per compatibilità con EventModal: aggiunge i dettagli pratica al titolo
  // SOLO se un titolo è già presente o se non c'è titolo ma c'è pratica.
  const getEventTitleWithPraticaDetails = useCallback(() => {
    let eventTitle = formState.title.trim();
    if (formState.relatedPraticaId) {
      const praticaSelezionata = tutteLePratiche.find(p => p.id === formState.relatedPraticaId);
      if (praticaSelezionata) {
          const baseTitle = eventTitle || "Task"; // Usa "Task" se titolo è vuoto
          eventTitle = `${baseTitle} (Pratica: ${praticaSelezionata.indirizzo || 'N/D'} - ${praticaSelezionata.cliente || 'N/D'})`;
      }
    }
    return eventTitle || 'Nuovo Evento'; // Fallback se tutto è vuoto
  }, [formState.title, formState.relatedPraticaId, tutteLePratiche]);


  const prepareEventForApi = useCallback(() => {
    // Se il titolo è vuoto E c'è una pratica, usa "Task" come base
    // Altrimenti usa il titolo inserito. Se è vuoto senza pratica, sarà vuoto.
    let titleForApi = formState.title.trim();
    if (!titleForApi && formState.relatedPraticaId) {
        titleForApi = "Task";
    }

    // Aggiungi dettagli pratica se presente, ma non se già inclusi
    if (formState.relatedPraticaId && !titleForApi.includes('(Pratica:')) {
        const praticaSelezionata = tutteLePratiche.find(p => p.id === formState.relatedPraticaId);
        if (praticaSelezionata) {
            titleForApi = `${titleForApi || 'Evento'} (Pratica: ${praticaSelezionata.indirizzo || 'N/D'} - ${praticaSelezionata.cliente || 'N/D'})`;
        }
    }


    const extendedPrivateProperties = {
      isPrivate: String(formState.isPrivate),
    };
    if (formState.relatedPraticaId) {
      extendedPrivateProperties.relatedPraticaId = formState.relatedPraticaId;
    }

    return {
      summary: titleForApi || 'Nuovo Evento', // Usa il titolo elaborato o 'Nuovo Evento'
      description: formState.description,
      start: { dateTime: new Date(formState.start).toISOString() },
      end: { dateTime: new Date(formState.end).toISOString() },
      extendedProperties: {
        private: extendedPrivateProperties,
      },
    };
  }, [formState, tutteLePratiche]); // Rimosso getEventTitleWithPraticaDetails, rimpiazzato con logica interna

  // Modificato per accettare praticaIdToSet
  const openNewEventModal = useCallback((defaultDate = new Date(), praticaIdToSet = '') => {
    setSelectedSlot(null);
    setSelectedEvent(null);
    setFormState({
      ...getInitialFormState(praticaIdToSet), // Passa l'ID
      start: startOfHour(defaultDate),
      end: startOfHour(addHours(defaultDate, 1)),
      title: '', // Assicura che il titolo sia vuoto
    });
    setShowEventModal(true);
  }, [pratichePrivate]); // Aggiunta dipendenza

  return {
    showEventModal, formState, selectedEvent,
    handleSelectSlot, handleSelectEvent,
    resetFormAndCloseModal, openNewEventModal,
    handleFormChange, handleDateChange, handleTimeChange,
    handleRelatedPraticaChange, prepareEventForApi,
  };
};
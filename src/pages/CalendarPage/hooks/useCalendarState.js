// src/pages/CalendarPage/hooks/useCalendarState.js
import { useState, useCallback } from 'react';
import { addHours, startOfHour } from 'date-fns';

export const useCalendarState = (tutteLePratiche = [], pratichePrivate = []) => {
  const getInitialFormState = () => ({
    id: null,
    title: '',
    start: startOfHour(new Date()),
    end: startOfHour(addHours(new Date(), 1)),
    description: '',
    relatedPraticaId: '',
    isPrivate: false,
    targetCalendarId: 'primary', // Aggiunto, default 'primary'
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
      targetCalendarId: 'primary', // Default per nuovi eventi
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
      targetCalendarId: event.sourceCalendarId || 'primary', // Usa il calendario sorgente dell'evento
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
    }));
  }, [pratichePrivate]);

  const getEventTitleWithPraticaDetails = useCallback(() => {
    let eventTitle = formState.title;
    if (formState.relatedPraticaId) {
      const praticaSelezionata = tutteLePratiche.find(p => p.id === formState.relatedPraticaId);
      if (praticaSelezionata) {
        const baseTitle = formState.title.trim() || "Evento";
        eventTitle = `${baseTitle} (Pratica: ${praticaSelezionata.indirizzo || 'N/D'} - ${praticaSelezionata.cliente || 'N/D'})`;
      }
    }
    return eventTitle;
  }, [formState.title, formState.relatedPraticaId, tutteLePratiche]);

  const prepareEventForApi = useCallback(() => {
    const finalTitle = getEventTitleWithPraticaDetails();
    const extendedPrivateProperties = {
      isPrivate: String(formState.isPrivate),
      // Non aggiungiamo più 'category' qui perché l'abbiamo rimossa dal form
    };
    if (formState.relatedPraticaId) {
      extendedPrivateProperties.relatedPraticaId = formState.relatedPraticaId;
    }

    return {
      summary: finalTitle,
      description: formState.description,
      start: { dateTime: new Date(formState.start).toISOString() },
      end: { dateTime: new Date(formState.end).toISOString() },
      extendedProperties: {
        private: extendedPrivateProperties,
      },
    };
  }, [formState, getEventTitleWithPraticaDetails]);

  const openNewEventModal = useCallback((defaultDate = new Date()) => {
    setSelectedSlot(null); setSelectedEvent(null);
    setFormState({
      ...getInitialFormState(),
      start: startOfHour(defaultDate),
      end: startOfHour(addHours(defaultDate, 1)),
    });
    setShowEventModal(true);
  }, []);

  return {
    showEventModal, formState, selectedEvent,
    handleSelectSlot, handleSelectEvent,
    resetFormAndCloseModal, openNewEventModal,
    handleFormChange, handleDateChange, handleTimeChange,
    handleRelatedPraticaChange, prepareEventForApi,
  };
};
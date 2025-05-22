// src/pages/CalendarPage.js
import React, { useMemo, useCallback } from 'react';
import { Calendar, Views } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';

import { usePratiche } from '../contexts/PraticheContext';
import { usePratichePrivato } from '../contexts/PratichePrivatoContext';

import {
  localizer,
  messages,
  eventStyleGetter,
  eventColors, // Importato per passarlo a EventModal
} from './CalendarPage/utils/calendarUtils';
import { useCalendarState } from './CalendarPage/hooks/useCalendarState';
import { useGoogleCalendarApi } from './CalendarPage/hooks/useGoogleCalendarApi';

import CalendarHeader from './CalendarPage/components/CalendarHeader';
import EventModal from './CalendarPage/components/EventModal';

// Icona per il messaggio "Connetti..." se gapi è inizializzato ma non c'è token
import { FaCalendarCheck as FaCalendarCheckIcon } from 'react-icons/fa';


function CalendarPage() {
  const { pratiche: praticheStandard, loading: loadingPraticheStandard } = usePratiche();
  const { pratiche: pratichePrivate, loading: loadingPratichePrivate } = usePratichePrivato();

  const tutteLePratiche = useMemo(() => {
    if (loadingPraticheStandard || loadingPratichePrivate) return [];
    const std = Array.isArray(praticheStandard) ? praticheStandard : [];
    const prv = Array.isArray(pratichePrivate) ? pratichePrivate : [];
    return [...std, ...prv];
  }, [praticheStandard, pratichePrivate, loadingPraticheStandard, loadingPratichePrivate]);

  const {
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
  } = useGoogleCalendarApi();

  const {
    showEventModal,
    formState,
    handleSelectSlot,
    handleSelectEvent,
    resetFormAndCloseModal,
    openNewEventModal,
    handleFormChange,
    handleDateChange,
    handleTimeChange,
    handleRelatedPraticaChange,
    prepareEventForApi,
  } = useCalendarState(tutteLePratiche, pratichePrivate);


  const handleSaveEvent = async () => {
    if (new Date(formState.end) <= new Date(formState.start)) {
      alert("L'ora di fine deve essere successiva all'ora di inizio.");
      return;
    }
    const eventResource = prepareEventForApi();
    try {
      if (formState.id) {
        await updateGoogleEvent(formState.id, eventResource);
      } else {
        await createGoogleEvent(eventResource);
      }
      resetFormAndCloseModal();
    } catch (error) {
      console.error("Errore nel salvare l'evento (CalendarPage):", error);
      alert("Si è verificato un errore nel salvare l'evento su Google Calendar.");
      // Non chiudere il modale in caso di errore, così l'utente può riprovare o correggere.
    }
  };

  const handleDeleteEvent = async () => {
    if (!formState.id) return; // Dovrebbe essere già gestito dal modale

    if (window.confirm("Sei sicuro di voler eliminare questo evento?")) {
      try {
        await deleteGoogleEvent(formState.id);
        resetFormAndCloseModal();
      } catch (error) {
        console.error("Errore nell'eliminare l'evento (CalendarPage):", error);
        alert("Errore nell'eliminare l'evento.");
      }
    }
  };

  const handleEventDropOrResize = useCallback(async ({ event, start, end }) => {
    if (!gapiClientInitialized || !googleApiToken || !window.gapi?.client?.calendar) {
        console.warn("Operazione drop/resize fallita: GAPI non pronto o token mancante.");
        fetchGoogleEvents(); // Risincronizza per sicurezza
        return;
    }
    // Verifica se l'evento è un evento di Google Calendar (se hai altri tipi di eventi locali)
    if (!event.googleEvent && !event.id) { // event.id potrebbe non esserci se l'evento non è mai stato salvato
        alert("Questa funzionalità è disponibile solo per eventi di Google Calendar salvati.");
        fetchGoogleEvents();
        return;
    }

    // Costruisci la risorsa evento basandoti sull'evento originale e le nuove date
    // Assicurati che il titolo e altre proprietà rilevanti siano preservate.
    // Se il titolo contiene dettagli della pratica, potresti volerli rigenerare o usare il titolo esistente.
    // Per semplicità, qui usiamo le proprietà esistenti dell'evento per tutto tranne start/end.
    const eventResource = {
        summary: event.title, // Potrebbe essere necessario aggiornarlo se il titolo è dinamico
        description: event.description,
        location: event.location,
        start: { dateTime: new Date(start).toISOString() },
        end: { dateTime: new Date(end).toISOString() },
        extendedProperties: {
          private: { // Assicurati che queste proprietà esistano sull'oggetto evento trascinato
            category: event.category || 'altro',
            relatedPraticaId: event.relatedPraticaId || "",
            isPrivate: String(event.isPrivate || false),
          }
        }
      };

    try {
      await updateGoogleEvent(event.id, eventResource);
      // fetchGoogleEvents() è già chiamato da updateGoogleEvent in caso di successo.
    } catch (error) {
      console.error("Errore nell'aggiornare l'evento (drag/resize) (CalendarPage):", error);
      fetchGoogleEvents(); // Risincronizza in caso di errore
    }
  }, [gapiClientInitialized, googleApiToken, updateGoogleEvent, fetchGoogleEvents]);


  return (
    <div className="container mx-auto p-4">
      <CalendarHeader
        googleApiToken={googleApiToken}
        gapiClientInitialized={gapiClientInitialized}
        isLoadingGapi={isLoadingGapi}
        isLoadingEvents={isLoadingEvents}
        onLogin={() => {
            // Assicura che GAPI sia pronto prima di tentare il login
            if (gapiClientInitialized) {
                loginToGoogle();
            } else {
                // Potresti voler richiamare loadGapiScript qui se fallisce,
                // ma l'hook useGoogleCalendarApi dovrebbe già tentare al mount.
                // Oppure, mostrare un messaggio all'utente.
                alert("L'API di Google Calendar non è ancora pronta. Riprova tra poco.");
            }
        }}
        onLogout={logoutFromGoogle}
        onRefreshEvents={fetchGoogleEvents}
        onShowCreationModal={() => openNewEventModal(new Date())} // Passa la data corrente come default
      />

      {(isLoadingGapi && !googleApiToken && !gapiClientInitialized) && ( // Mostra solo se GAPI non è ancora inizializzato
        <div className="text-center py-4 text-gray-600 bg-yellow-50 p-3 rounded-md">
          Inizializzazione API di Google in corso... Se il messaggio persiste, verifica la console per errori.
        </div>
      )}

      {(googleApiToken && gapiClientInitialized) ? (
        <div style={{ height: 'calc(100vh - 220px)' }} className="bg-white p-2 sm:p-4 rounded-lg shadow-md">
          <Calendar
            localizer={localizer}
            events={calendarEvents} // Eventi dall'hook API
            startAccessor="start"
            endAccessor="end"
            style={{ height: '100%' }}
            views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
            defaultView={Views.WEEK}
            selectable
            onSelectSlot={handleSelectSlot} // Dall'hook state
            onSelectEvent={handleSelectEvent} // Dall'hook state
            onEventDrop={handleEventDropOrResize}
            onEventResize={handleEventDropOrResize}
            resizable
            messages={messages}
            culture="it-IT"
            eventPropGetter={eventStyleGetter}
            dayLayoutAlgorithm="no-overlap"
            popup
            formats={{
                agendaHeaderFormat: ({ start: s, end: e }, culture, local) =>
                  `${local.format(s, 'dd/MM/yyyy', culture)} – ${local.format(e, 'dd/MM/yyyy', culture)}`,
                dayHeaderFormat: (date, culture, local) => local.format(date, 'eeee dd MMMM', culture),
                dayRangeHeaderFormat: ({ start: s, end: e }, culture, local) =>
                  `${local.format(s, 'dd MMM', culture)} – ${local.format(e, 'dd MMM', culture)}`
            }}
            step={15}
            timeslots={4}
          />
        </div>
      ) : !googleApiToken && gapiClientInitialized ? ( // GAPI pronto, ma utente non loggato
        <div className="text-center py-10 text-gray-700 bg-gray-50 p-6 rounded-lg shadow">
            <FaCalendarCheckIcon className="mx-auto text-4xl text-blue-500 mb-3" />
            <p className="text-lg">Connetti il tuo Google Calendar per visualizzare e gestire gli eventi.</p>
            <button
              onClick={() => {
                if (gapiClientInitialized) loginToGoogle();
                else alert("L'API di Google Calendar non è ancora pronta. Riprova tra poco.");
              }}
              className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex items-center mx-auto"
              disabled={isLoadingGapi} // Disabilitato mentre GAPI carica, o se non inizializzato
            >
              Connetti Google Calendar
            </button>
        </div>
      ) : null} {/* Non mostrare nulla se GAPI sta ancora caricando e non c'è token */}

      {showEventModal && (
        <EventModal
          showEventModal={showEventModal}
          onClose={resetFormAndCloseModal}
          formState={formState}
          onFormChange={handleFormChange}
          onDateChange={handleDateChange}
          onTimeChange={handleTimeChange}
          onRelatedPraticaChange={handleRelatedPraticaChange}
          onSave={handleSaveEvent}
          onDelete={handleDeleteEvent}
          tutteLePratiche={tutteLePratiche}
          pratichePrivate={pratichePrivate} // Passato per la logica di visualizzazione nel select
          eventColors={eventColors} // Passa l'oggetto eventColors
        />
      )}
    </div>
  );
}

export default CalendarPage;
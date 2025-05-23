// src/pages/CalendarPage.js
import React, { useMemo, useCallback } from 'react';
import { Calendar, Views } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';

import { usePratiche } from '../../contexts/PraticheContext';
import { usePratichePrivato } from '../../contexts/PratichePrivatoContext';

import {
  localizer,
  messages,
  eventStyleGetter,
  calendarNameMap,
  calendarIds,
} from './CalendarPage/utils/calendarUtils';
import { useCalendarState } from './CalendarPage/hooks/useCalendarState';
import { useGoogleCalendarApi } from './CalendarPage/hooks/useGoogleCalendarApi';

import CalendarHeader from './CalendarPage/components/CalendarHeader';
import EventModal from './CalendarPage/components/EventModal';
import { FaCalendarCheck as FaCalendarCheckIcon } from 'react-icons/fa';

const calendarListForModal = [
    { id: 'primary', name: calendarNameMap['primary'] },
    { id: calendarIds.ID_DE_ANTONI, name: calendarNameMap[calendarIds.ID_DE_ANTONI] },
    { id: calendarIds.ID_CASTRO, name: calendarNameMap[calendarIds.ID_CASTRO] },
    { id: calendarIds.ID_ANTONELLI, name: calendarNameMap[calendarIds.ID_ANTONELLI] },
].filter(cal => cal.id && cal.name); // Filtra se per caso gli ID non sono stati ancora sostituiti e sono placeholder

function CalendarPage() {
  const { pratiche: praticheStandard, loading: loadingPraticheStandard } = usePratiche();
  const { pratiche: pratichePrivate, loading: loadingPratichePrivate } = usePratichePrivato();

  const tutteLePratiche = useMemo(() => {
    if (loadingPraticheStandard || loadingPratichePrivate) return [];
    const std = Array.isArray(praticheStandard) ? praticheStandard : [];
    const prv = Array.isArray(pratichePrivate) ? pratichePrivate : [];
    return [...std, ...prv];
  }, [praticheStandard, pratichePrivate, loadingPraticheStandard, loadingPratichePrivate]);

  const praticheInCorsoPerModal = useMemo(() => {
    // ASSUNZIONE: pratica.stato === 'Completata' per le pratiche archiviate/completate
    // Confermata dai tuoi file PraticheContext.js
    return tutteLePratiche.filter(pratica => pratica.stato !== 'Completata');
  }, [tutteLePratiche]);

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
    const targetCalendar = formState.targetCalendarId;

    try {
      if (formState.id) {
        await updateGoogleEvent(formState.id, eventResource, targetCalendar);
      } else {
        await createGoogleEvent(eventResource, targetCalendar);
      }
      resetFormAndCloseModal();
    } catch (error) {
      console.error("Errore nel salvare l'evento (CalendarPage):", error);
      alert("Si è verificato un errore nel salvare l'evento su Google Calendar. Controlla la console.");
    }
  };

  const handleDeleteEvent = async () => {
    if (!formState.id || !formState.targetCalendarId) {
        console.error("CalendarPage handleDeleteEvent: ID evento o ID calendario mancante.", formState);
        alert("Impossibile eliminare l'evento: informazioni mancanti.");
        return;
    }
    const calendarIdForDelete = formState.targetCalendarId;
    const eventIdToDelete = formState.id;

    if (window.confirm("Sei sicuro di voler eliminare questo evento?")) {
      try {
        console.log(`DEBUG CalendarPage: Chiamata a deleteGoogleEvent con eventId: ${eventIdToDelete}, calendarId: ${calendarIdForDelete}`);
        await deleteGoogleEvent(eventIdToDelete, calendarIdForDelete);
        resetFormAndCloseModal();
      } catch (error) {
        console.error("Errore nell'eliminare l'evento (CalendarPage):", error);
        // L'alert più specifico (es. 404) dovrebbe venire dall'hook API se l'errore viene rilanciato
        alert("Errore nell'eliminare l'evento. Controlla la console per i dettagli specifici.");
      }
    }
  };

  const handleEventDropOrResize = useCallback(async ({ event, start, end }) => {
    if (!gapiClientInitialized || !googleApiToken || !window.gapi?.client?.calendar) {
        fetchGoogleEvents(); return;
    }
    if (!event.googleEvent && !event.id) {
        alert("Questa funzionalità è solo per eventi Google Calendar salvati.");
        fetchGoogleEvents(); return;
    }

    const extendedPrivateProperties = { isPrivate: String(event.isPrivate || false) };
    if (event.relatedPraticaId) extendedPrivateProperties.relatedPraticaId = event.relatedPraticaId;
    // Non includere la category se non la gestiamo più attivamente
    if (event.category) extendedPrivateProperties.category = event.category; // Manteniamo se presente nell'evento originale

    const eventResource = {
        summary: event.title,
        description: event.description,
        ...(event.location && { location: event.location }), // Includi location solo se esiste nell'evento originale
        start: { dateTime: new Date(start).toISOString() },
        end: { dateTime: new Date(end).toISOString() },
        extendedProperties: { private: extendedPrivateProperties }
      };

    try {
      await updateGoogleEvent(event.id, eventResource, event.sourceCalendarId);
    } catch (error) {
      console.error("Errore update drag/resize (CalendarPage):", error);
      fetchGoogleEvents();
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
            if (gapiClientInitialized) loginToGoogle();
            else alert("API Google Calendar non pronta. Riprova.");
        }}
        onLogout={logoutFromGoogle}
        onRefreshEvents={fetchGoogleEvents}
        onShowCreationModal={() => openNewEventModal(new Date())}
      />

      {(isLoadingGapi && !googleApiToken && !gapiClientInitialized) && (
        <div className="text-center py-4 text-gray-600 bg-yellow-50 p-3 rounded-md">
          Inizializzazione API di Google in corso...
        </div>
      )}

      {(googleApiToken && gapiClientInitialized) ? (
        <div style={{ height: 'calc(100vh - 220px)' }} className="bg-white p-2 sm:p-4 rounded-lg shadow-md">
          <Calendar
            localizer={localizer}
            events={calendarEvents}
            startAccessor="start"
            endAccessor="end"
            style={{ height: '100%' }}
            views={[Views.MONTH, Views.WORK_WEEK, Views.DAY, Views.AGENDA]}
            defaultView={Views.WORK_WEEK}
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
      ) : !googleApiToken && gapiClientInitialized ? (
        <div className="text-center py-10 text-gray-700 bg-gray-50 p-6 rounded-lg shadow">
            <FaCalendarCheckIcon className="mx-auto text-4xl text-blue-500 mb-3" />
            <p className="text-lg">Connetti il tuo Google Calendar per visualizzare e gestire gli eventi.</p>
            <button
              onClick={() => {
                if (gapiClientInitialized) loginToGoogle();
                else alert("API Google Calendar non pronta. Riprova.");
              }}
              className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex items-center mx-auto"
              disabled={isLoadingGapi}
            >
              Connetti Google Calendar
            </button>
        </div>
      ) : null}

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
          tutteLePratiche={praticheInCorsoPerModal} // Passa la lista pratiche filtrata
          pratichePrivate={pratichePrivate}
          calendarList={calendarListForModal}
        />
      )}
    </div>
  );
}

export default CalendarPage;
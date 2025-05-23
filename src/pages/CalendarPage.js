// src/pages/CalendarPage.js
import React, { useMemo, useCallback } from 'react';
import { Calendar, Views } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';

// Assicurati che i percorsi ai tuoi contesti siano corretti
// In base ai file che hai caricato, questi dovrebbero essere:
import { usePratiche } from '../contexts/PraticheContext';
import { usePratichePrivato } from '../contexts/PratichePrivatoContext';

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
import EventModal from './CalendarPage/components/EventModal'; // Assicurati che sia la versione aggiornata
import { FaCalendarCheck as FaCalendarCheckIcon } from 'react-icons/fa';

// Creiamo la lista dei calendari per il dropdown nel modale
// Questa lista ora usa gli ID e i nomi corretti da calendarUtils.js
const calendarListForModal = [
    { id: 'primary', name: calendarNameMap['primary'] },
    { id: calendarIds.ID_DE_ANTONI, name: calendarNameMap[calendarIds.ID_DE_ANTONI] },
    { id: calendarIds.ID_CASTRO, name: calendarNameMap[calendarIds.ID_CASTRO] },
    { id: calendarIds.ID_ANTONELLI, name: calendarNameMap[calendarIds.ID_ANTONELLI] },
].filter(cal => cal.id && cal.name); // Filtra per sicurezza se qualche ID/nome non è definito

function CalendarPage() {
  const { pratiche: praticheStandard, loading: loadingPraticheStandard } = usePratiche();
  const { pratiche: pratichePrivate, loading: loadingPratichePrivate } = usePratichePrivato();

  const tutteLePratiche = useMemo(() => {
    if (loadingPraticheStandard || loadingPratichePrivate) return [];
    const std = Array.isArray(praticheStandard) ? praticheStandard : [];
    const prv = Array.isArray(pratichePrivate) ? pratichePrivate : [];
    return [...std, ...prv];
  }, [praticheStandard, pratichePrivate, loadingPraticheStandard, loadingPratichePrivate]);

  // Filtra le pratiche per mostrare solo quelle "in corso" nel modale
  const praticheInCorsoPerModal = useMemo(() => {
    // Confermato che `pratica.stato === 'Completata'` è corretto dai tuoi file Context
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
    const eventResource = prepareEventForApi(); // Questo ora non include location/category
    const targetCalendar = formState.targetCalendarId;

    try {
      if (formState.id) { // Modifica evento
        // Per l'update, targetCalendarId dovrebbe essere event.sourceCalendarId (non modificabile nel form)
        await updateGoogleEvent(formState.id, eventResource, targetCalendar);
      } else { // Nuovo evento
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
        console.error("DEBUG CalendarPage handleDeleteEvent: ID evento o ID calendario mancante nel formState.", formState);
        alert("Impossibile eliminare l'evento: informazioni mancanti nel formState.");
        return;
    }
    // Quando un evento è selezionato, formState.targetCalendarId viene impostato su event.sourceCalendarId.
    // Questo è l'ID del calendario su cui l'evento risiede e deve essere usato per l'eliminazione.
    const calendarIdForDelete = formState.targetCalendarId;
    const eventIdToDelete = formState.id;

    if (window.confirm("Sei sicuro di voler eliminare questo evento?")) {
      try {
        // DEBUG per verificare l'ID del calendario usato per l'eliminazione
        console.log(`DEBUG CalendarPage: Chiamata a deleteGoogleEvent con eventId: ${eventIdToDelete} su calendarId: ${calendarIdForDelete}`);
        await deleteGoogleEvent(eventIdToDelete, calendarIdForDelete);
        resetFormAndCloseModal();
      } catch (error) {
        console.error("Errore nell'eliminare l'evento (CalendarPage):", error);
        // L'alert più specifico (es. 404) dovrebbe venire dall'hook API se l'errore viene rilanciato
        alert("Errore nell'eliminare l'evento. Controlla la console del browser per i dettagli specifici (scheda Console e Network).");
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
    // Non aggiungiamo più 'category' qui se non la usiamo più attivamente
    // Manteniamo la location se presente nell'evento originale
    const eventResource = {
        summary: event.title,
        description: event.description,
        ...(event.location && { location: event.location }),
        start: { dateTime: new Date(start).toISOString() },
        end: { dateTime: new Date(end).toISOString() },
        extendedProperties: { private: extendedPrivateProperties }
      };

    try {
      // Per drag/resize, l'evento deve essere aggiornato sul suo calendario originale (event.sourceCalendarId)
      await updateGoogleEvent(event.id, eventResource, event.sourceCalendarId);
    } catch (error) {
      console.error("Errore update drag/resize (CalendarPage):", error);
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
            if (gapiClientInitialized) loginToGoogle();
            else alert("L'API di Google Calendar non è ancora pronta. Riprova tra poco.");
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
            views={[Views.MONTH, Views.WORK_WEEK, Views.DAY, Views.AGENDA]} // Usa WORK_WEEK
            defaultView={Views.WORK_WEEK} // Imposta come vista predefinita
            selectable
            onSelectSlot={handleSelectSlot}
            onSelectEvent={handleSelectEvent}
            onEventDrop={handleEventDropOrResize}
            onEventResize={handleEventDropOrResize}
            resizable
            messages={messages} // Usa i messaggi aggiornati (con work_week)
            culture="it-IT"
            eventPropGetter={eventStyleGetter} // Usa il nuovo style getter basato su calendarColorMap
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
                else alert("L'API di Google Calendar non è ancora pronta. Riprova tra poco.");
              }}
              className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex items-center mx-auto"
              disabled={isLoadingGapi}
            >
              Connetti Google Calendar
            </button>
        </div>
      ) : null} {/* Non mostrare nulla se GAPI sta caricando E non c'è token, gestito sopra */}

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
          pratichePrivate={pratichePrivate} // Serve per l'etichetta (Priv.) nel dropdown pratiche
          calendarList={calendarListForModal}   // Passa la lista dei calendari per il dropdown
        />
      )}
    </div>
  );
}

export default CalendarPage;
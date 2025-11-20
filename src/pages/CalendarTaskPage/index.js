// src/pages/CalendarTaskPage/index.js
import React, { useState, useMemo, useCallback } from 'react';
import { Calendar, Views } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { usePratiche } from '../../contexts/PraticheContext';
import { usePratichePrivato } from '../../contexts/PratichePrivatoContext';
import { useGoogleCalendarApi } from '../CalendarPage/hooks/useGoogleCalendarApi';
import { useCalendarState } from '../CalendarPage/hooks/useCalendarState';
import {
  localizer,
  messages,
  eventStyleGetter,
  calendarNameMap,
  calendarIds,
} from '../CalendarPage/utils/calendarUtils';
import CalendarHeader from '../CalendarPage/components/CalendarHeader';
import EventModal from '../CalendarPage/components/EventModal';
import EnhancedTaskList from './components/EnhancedTaskList';
import { useEnhancedTodoList } from './hooks/useEnhancedTodoList';
import { FaCalendarAlt, FaTasks } from 'react-icons/fa';

// Lista calendari per il modale
const calendarListForModal = [
  { id: 'primary', name: calendarNameMap['primary'] },
  { id: calendarIds.ID_DE_ANTONI, name: calendarNameMap[calendarIds.ID_DE_ANTONI] },
  { id: calendarIds.ID_CASTRO, name: calendarNameMap[calendarIds.ID_CASTRO] },
  { id: calendarIds.ID_ANTONELLI, name: calendarNameMap[calendarIds.ID_ANTONELLI] },
].filter(cal => cal.id && cal.name);

function CalendarTaskPage() {
  const { pratiche: praticheStandard, loading: loadingPraticheStandard, updatePratica: updatePraticaStandard } = usePratiche();
  const { pratiche: pratichePrivate, loading: loadingPratichePrivate, updatePratica: updatePraticaPrivata } = usePratichePrivato();

  // Tab attivo per mobile
  const [activeTab, setActiveTab] = useState('tasks'); // 'tasks' | 'calendar'

  // Tutte le pratiche
  const tutteLePratiche = useMemo(() => {
    if (loadingPraticheStandard || loadingPratichePrivate) return [];
    const std = Array.isArray(praticheStandard) ? praticheStandard : [];
    const prv = Array.isArray(pratichePrivate) ? pratichePrivate : [];
    return [...std, ...prv];
  }, [praticheStandard, pratichePrivate, loadingPraticheStandard, loadingPratichePrivate]);

  // Pratiche in corso per modale
  const praticheInCorsoPerModal = useMemo(() => {
    return tutteLePratiche.filter(pratica => pratica.stato !== 'Completata');
  }, [tutteLePratiche]);

  // Google Calendar API
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

  // Calendar state management
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

  // Todo list hook con Firebase
  const {
    todoItems,
    isLoading: isLoadingTasks,
    toggleComplete,
    activeFilter,
    setActiveFilter,
    dateFilter,
    setDateFilter,
    agenziaFilter,
    setAgenziaFilter,
    praticaFilter,
    setPraticaFilter,
    refreshCalendarEvents,
    availableAgenzie,
    availablePratiche,
    pendingSyncCount,
  } = useEnhancedTodoList();

  // Helper per aggiornare pratica (standard o privata)
  const updatePratica = useCallback((praticaId, updates) => {
    const isPraticaPrivata = pratichePrivate.some(p => p.id === praticaId);
    if (isPraticaPrivata) {
      return updatePraticaPrivata(praticaId, updates);
    } else {
      return updatePraticaStandard(praticaId, updates);
    }
  }, [pratichePrivate, updatePraticaPrivata, updatePraticaStandard]);

  // Salva evento
  const handleSaveEvent = async () => {
    if (new Date(formState.end) <= new Date(formState.start)) {
      alert("L'ora di fine deve essere successiva all'ora di inizio.");
      return;
    }

    const eventResource = prepareEventForApi();
    const targetCalendar = formState.targetCalendarId;
    const praticaIdCollegata = formState.relatedPraticaId;

    try {
      let savedGoogleEvent;
      if (formState.id) {
        savedGoogleEvent = await updateGoogleEvent(formState.id, eventResource, targetCalendar);
      } else {
        savedGoogleEvent = await createGoogleEvent(eventResource, targetCalendar);
      }

      // SYNC BIDIREZIONALE: Se l'evento è collegato a una pratica, salva anche nel workflow
      if (savedGoogleEvent && praticaIdCollegata) {
        const praticaDaAggiornare = tutteLePratiche.find(p => p.id === praticaIdCollegata);
        if (praticaDaAggiornare) {
          const updatedWorkflow = JSON.parse(JSON.stringify(praticaDaAggiornare.workflow || {}));
          const stepId = 'inizioPratica'; // Step di default per task create dal Calendario

          // Inizializza lo step se non esiste
          if (!updatedWorkflow[stepId]) {
            updatedWorkflow[stepId] = { tasks: [], notes: [] };
          }
          if (!updatedWorkflow[stepId].tasks) {
            updatedWorkflow[stepId].tasks = [];
          }

          // Cerca se la task esiste già (nel caso di update)
          const taskIndex = updatedWorkflow[stepId].tasks.findIndex(
            (t) => t.googleCalendarEventId === savedGoogleEvent.id
          );

          // Determina sourceCalendarId
          let determinedSourceCalendarId = targetCalendar;
          if (savedGoogleEvent.organizer?.email) {
            determinedSourceCalendarId = 'primary';
          } else if (savedGoogleEvent.calendarId) {
            determinedSourceCalendarId = savedGoogleEvent.calendarId;
          }

          // Dati della task
          const taskData = {
            text: savedGoogleEvent.summary || eventResource.summary,
            dueDate: new Date(savedGoogleEvent.start?.dateTime || savedGoogleEvent.start?.date).toISOString(),
            endDate: savedGoogleEvent.end?.dateTime
              ? new Date(savedGoogleEvent.end.dateTime).toISOString()
              : new Date(new Date(savedGoogleEvent.start?.dateTime || savedGoogleEvent.start?.date).getTime() + (60 * 60 * 1000)).toISOString(),
            googleCalendarEventId: savedGoogleEvent.id,
            sourceCalendarId: determinedSourceCalendarId,
            priority: formState.priority || 'normal',
            reminder: formState.reminder || 60,
            completed: taskIndex > -1 ? (updatedWorkflow[stepId].tasks[taskIndex]?.completed || false) : false,
            relatedPraticaId: praticaIdCollegata,
            description: savedGoogleEvent.description || '',
            location: savedGoogleEvent.location || '',
            isPrivate: formState.isPrivate || false,
            stepId: stepId
          };

          // Aggiorna o aggiungi la task
          if (taskIndex > -1) {
            const existingTask = updatedWorkflow[stepId].tasks[taskIndex];
            updatedWorkflow[stepId].tasks[taskIndex] = {
              ...existingTask,
              ...taskData,
              updatedAt: new Date().toISOString(),
            };
          } else {
            updatedWorkflow[stepId].tasks.push({
              ...taskData,
              createdDate: new Date().toISOString(),
            });
          }

          // Salva il workflow aggiornato
          await updatePratica(praticaIdCollegata, { workflow: updatedWorkflow });
          console.log(`✓ Task sincronizzata nel workflow della pratica ${praticaIdCollegata} (step: ${stepId})`);
        }
      }

      resetFormAndCloseModal();
      // Aggiorna anche la task list
      refreshCalendarEvents();
    } catch (error) {
      console.error("Errore nel salvare l'evento:", error);
      alert("Si è verificato un errore nel salvare l'evento su Google Calendar.");
    }
  };

  // Elimina evento
  const handleDeleteEvent = async () => {
    if (!formState.id || !formState.targetCalendarId) {
      alert("Impossibile eliminare l'evento: informazioni mancanti.");
      return;
    }

    if (window.confirm("Sei sicuro di voler eliminare questo evento?")) {
      try {
        await deleteGoogleEvent(formState.id, formState.targetCalendarId);
        resetFormAndCloseModal();
        refreshCalendarEvents();
      } catch (error) {
        console.error("Errore nell'eliminare l'evento:", error);
        alert("Errore nell'eliminare l'evento.");
      }
    }
  };

  // Drag & Resize eventi
  const handleEventDropOrResize = useCallback(async ({ event, start, end }) => {
    if (!gapiClientInitialized || !googleApiToken) {
      fetchGoogleEvents();
      return;
    }

    if (!event.googleEvent && !event.id) {
      alert("Questa funzionalità è solo per eventi Google Calendar salvati.");
      fetchGoogleEvents();
      return;
    }

    const extendedPrivateProperties = { isPrivate: String(event.isPrivate || false) };
    if (event.relatedPraticaId) extendedPrivateProperties.relatedPraticaId = event.relatedPraticaId;

    const eventResource = {
      summary: event.title,
      description: event.description,
      ...(event.location && { location: event.location }),
      start: { dateTime: new Date(start).toISOString() },
      end: { dateTime: new Date(end).toISOString() },
      extendedProperties: { private: extendedPrivateProperties }
    };

    try {
      await updateGoogleEvent(event.id, eventResource, event.sourceCalendarId);
      refreshCalendarEvents();
    } catch (error) {
      console.error("Errore update drag/resize:", error);
      fetchGoogleEvents();
    }
  }, [gapiClientInitialized, googleApiToken, updateGoogleEvent, fetchGoogleEvents, refreshCalendarEvents]);

  return (
    <div className="container mx-auto p-4 h-screen flex flex-col">
      {/* Header */}
      <div className="mb-4">
        <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-dark-text-primary">
            Calendario & Task
          </h1>
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
            onRefreshEvents={refreshCalendarEvents}
            onShowCreationModal={() => openNewEventModal(new Date())}
          />
        </div>

        {/* Tabs mobile */}
        <div className="md:hidden flex border-b border-gray-200 dark:border-dark-border">
          <button
            onClick={() => setActiveTab('tasks')}
            className={`flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'tasks'
                ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                : 'text-gray-500 dark:text-dark-text-secondary hover:text-gray-700 dark:hover:text-dark-text-primary'
            }`}
          >
            <FaTasks />
            Task List
            {pendingSyncCount > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {pendingSyncCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('calendar')}
            className={`flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'calendar'
                ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                : 'text-gray-500 dark:text-dark-text-secondary hover:text-gray-700 dark:hover:text-dark-text-primary'
            }`}
          >
            <FaCalendarAlt />
            Calendario
          </button>
        </div>
      </div>

      {/* Loading API Google */}
      {(isLoadingGapi && !googleApiToken && !gapiClientInitialized) && (
        <div className="text-center py-4 text-gray-600 dark:text-dark-text-secondary bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-md">
          Inizializzazione API di Google in corso...
        </div>
      )}

      {/* Layout principale */}
      {(googleApiToken && gapiClientInitialized) ? (
        <div className="flex-1 flex gap-4 overflow-hidden">
          {/* TASK LIST - 40% (Sinistra) - Desktop sempre visibile, Mobile solo se tab attivo */}
          <div className={`${activeTab === 'tasks' ? 'block' : 'hidden'} md:block md:w-2/5 overflow-hidden`}>
            <EnhancedTaskList
              todoItems={todoItems}
              isLoading={isLoadingTasks}
              toggleComplete={toggleComplete}
              activeFilter={activeFilter}
              setActiveFilter={setActiveFilter}
              dateFilter={dateFilter}
              setDateFilter={setDateFilter}
              refreshCalendarEvents={refreshCalendarEvents}
              pendingSyncCount={pendingSyncCount}
            />
          </div>

          {/* CALENDARIO - 60% (Destra) - Desktop sempre visibile, Mobile solo se tab attivo */}
          <div className={`${activeTab === 'calendar' ? 'block' : 'hidden'} md:block md:w-3/5 bg-white dark:bg-dark-surface p-4 rounded-lg shadow overflow-hidden transition-colors duration-200`}>
            <Calendar
              localizer={localizer}
              events={calendarEvents}
              startAccessor="start"
              endAccessor="end"
              style={{ height: '100%' }}
              views={[Views.WORK_WEEK, Views.DAY, Views.AGENDA]}
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
                  `${local.format(s, 'dd MMM', culture)} – ${local.format(e, 'dd MMM', culture)}`,
                eventTimeRangeFormat: () => '', // Rimuove l'orario dalla visualizzazione degli eventi
                timeGutterFormat: (date, culture, local) => local.format(date, 'HH:mm', culture), // Mantiene orari nella colonna laterale
              }}
              step={15}
              timeslots={4}
            />
          </div>
        </div>
      ) : !googleApiToken && gapiClientInitialized ? (
        <div className="flex-1 flex items-center justify-center text-center text-gray-700 dark:text-dark-text-secondary bg-gray-50 dark:bg-dark-hover p-6 rounded-lg shadow">
          <div>
            <FaCalendarAlt className="mx-auto text-4xl text-blue-500 dark:text-blue-400 mb-3" />
            <p className="text-lg">Connetti il tuo Google Calendar per visualizzare e gestire gli eventi.</p>
            <button
              onClick={() => {
                if (gapiClientInitialized) loginToGoogle();
                else alert("L'API di Google Calendar non è ancora pronta. Riprova tra poco.");
              }}
              className="mt-4 bg-blue-500 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex items-center mx-auto transition-colors"
              disabled={isLoadingGapi}
            >
              Connetti Google Calendar
            </button>
          </div>
        </div>
      ) : null}

      {/* Modal evento */}
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
          tutteLePratiche={praticheInCorsoPerModal}
          pratichePrivate={pratichePrivate}
          calendarList={calendarListForModal}
        />
      )}
    </div>
  );
}

export default CalendarTaskPage;

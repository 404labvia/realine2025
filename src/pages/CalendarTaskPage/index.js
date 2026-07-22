// src/pages/CalendarTaskPage/index.js
// Pagina "Da fare": tabella task raggruppata per scadenza. Le task sono eventi Google
// Calendar del calendario De Antoni (backend server-side via Cloud Functions, vedi
// useGoogleCalendarApi). La griglia calendario è stata rimossa dalla UI ma le utility e
// il modale evento restano nel modulo CalendarPage per riuso futuro.
import React, { useMemo, useCallback } from 'react';
import { usePratiche } from '../../contexts/PraticheContext';
import { usePratichePrivato } from '../../contexts/PratichePrivatoContext';
import { useCalendarState } from '../CalendarPage/hooks/useCalendarState';
import EnhancedTaskList from './components/EnhancedTaskList';
import TaskModal from './components/TaskModal';
import { useEnhancedTodoList } from './hooks/useEnhancedTodoList';
import { calendarIds } from '../CalendarPage/utils/calendarUtils';

// Le task "Da fare" vivono esclusivamente sul calendario De Antoni.
const TASK_CALENDAR_ID = calendarIds.ID_DE_ANTONI;

function CalendarTaskPage() {
  const { pratiche: praticheStandard, loading: loadingPraticheStandard, updatePratica: updatePraticaStandard } = usePratiche();
  const { pratiche: pratichePrivate, loading: loadingPratichePrivate, updatePratica: updatePraticaPrivata } = usePratichePrivato();

  // Tutte le pratiche (standard + private)
  const tutteLePratiche = useMemo(() => {
    if (loadingPraticheStandard || loadingPratichePrivate) return [];
    const std = Array.isArray(praticheStandard) ? praticheStandard : [];
    const prv = Array.isArray(pratichePrivate) ? pratichePrivate : [];
    return [...std, ...prv];
  }, [praticheStandard, pratichePrivate, loadingPraticheStandard, loadingPratichePrivate]);

  // Pratiche in corso per la select del modale
  const praticheInCorsoPerModal = useMemo(
    () => tutteLePratiche.filter((pratica) => pratica.stato !== 'Completata'),
    [tutteLePratiche]
  );

  // Stato del form/modale
  const {
    showEventModal,
    formState,
    handleSelectEvent,
    resetFormAndCloseModal,
    openNewEventModal,
    handleFormChange,
    handleDateChange,
    handleTimeChange,
    handleRelatedPraticaChange,
    prepareEventForApi,
  } = useCalendarState(tutteLePratiche, pratichePrivate);

  // Task list + CRUD calendario (stessa istanza → un solo fetch) + helper ottimistici
  const {
    todoItems,
    isLoading: isLoadingTasks,
    toggleComplete,
    refreshCalendarEvents,
    pendingSyncCount,
    createGoogleEvent,
    updateGoogleEvent,
    deleteGoogleEvent,
    updateLocalItem,
    removeLocalItem,
  } = useEnhancedTodoList();

  // Aggiorna pratica (standard o privata)
  const updatePratica = useCallback(
    (praticaId, updates) => {
      const isPraticaPrivata = pratichePrivate.some((p) => p.id === praticaId);
      return isPraticaPrivata ? updatePraticaPrivata(praticaId, updates) : updatePraticaStandard(praticaId, updates);
    },
    [pratichePrivate, updatePraticaPrivata, updatePraticaStandard]
  );

  // Sincronizza una task collegata nel workflow della pratica (sync bidirezionale esistente).
  // meta = { priority, isPrivate } catturati prima del reset del form.
  const syncTaskToPratica = useCallback(
    async (savedGoogleEvent, eventResource, praticaIdCollegata, meta = {}) => {
      const praticaDaAggiornare = tutteLePratiche.find((p) => p.id === praticaIdCollegata);
      if (!praticaDaAggiornare) return;

      const updatedWorkflow = JSON.parse(JSON.stringify(praticaDaAggiornare.workflow || {}));
      const stepId = 'inizioPratica'; // Step di default per task create da "Da fare"
      if (!updatedWorkflow[stepId]) updatedWorkflow[stepId] = { tasks: [], notes: [] };
      if (!updatedWorkflow[stepId].tasks) updatedWorkflow[stepId].tasks = [];

      const taskIndex = updatedWorkflow[stepId].tasks.findIndex(
        (t) => t.googleCalendarEventId === savedGoogleEvent.id
      );

      const taskData = {
        text: savedGoogleEvent.summary || eventResource.summary,
        dueDate: new Date(savedGoogleEvent.start?.dateTime || savedGoogleEvent.start?.date).toISOString(),
        endDate: savedGoogleEvent.end?.dateTime
          ? new Date(savedGoogleEvent.end.dateTime).toISOString()
          : new Date(new Date(savedGoogleEvent.start?.dateTime || savedGoogleEvent.start?.date).getTime() + 60 * 60 * 1000).toISOString(),
        googleCalendarEventId: savedGoogleEvent.id,
        sourceCalendarId: TASK_CALENDAR_ID,
        priority: meta.priority || 'normale',
        completed: taskIndex > -1 ? updatedWorkflow[stepId].tasks[taskIndex]?.completed || false : false,
        relatedPraticaId: praticaIdCollegata,
        description: savedGoogleEvent.description || '',
        isPrivate: meta.isPrivate || false,
        stepId,
      };

      if (taskIndex > -1) {
        updatedWorkflow[stepId].tasks[taskIndex] = {
          ...updatedWorkflow[stepId].tasks[taskIndex],
          ...taskData,
          updatedAt: new Date().toISOString(),
        };
      } else {
        updatedWorkflow[stepId].tasks.push({ ...taskData, createdDate: new Date().toISOString() });
      }

      await updatePratica(praticaIdCollegata, { workflow: updatedWorkflow });
    },
    [tutteLePratiche, updatePratica]
  );

  // Salva task (crea/modifica evento De Antoni + eventuale sync pratica).
  // Ottimistico: chiude subito il modale, poi lavora in background.
  const handleSaveTask = useCallback(async () => {
    if (!formState.title.trim()) {
      alert('Inserisci un titolo per la task.');
      return;
    }
    // Cattura i valori prima del reset del form
    const eventResource = prepareEventForApi();
    const editingId = formState.id;
    const praticaIdCollegata = formState.relatedPraticaId;
    const meta = { priority: formState.priority, isPrivate: formState.isPrivate };

    resetFormAndCloseModal(); // chiusura immediata

    try {
      const savedGoogleEvent = editingId
        ? await updateGoogleEvent(editingId, eventResource, TASK_CALENDAR_ID)
        : await createGoogleEvent(eventResource, TASK_CALENDAR_ID);

      if (savedGoogleEvent && praticaIdCollegata) {
        await syncTaskToPratica(savedGoogleEvent, eventResource, praticaIdCollegata, meta);
      }
      // createGoogleEvent/updateGoogleEvent già rifanno il fetch della stessa istanza:
      // niente refresh ridondante.
    } catch (error) {
      console.error('Errore nel salvare la task:', error);
      alert('Si è verificato un errore nel salvare la task.');
      refreshCalendarEvents();
    }
  }, [formState, prepareEventForApi, updateGoogleEvent, createGoogleEvent, syncTaskToPratica, resetFormAndCloseModal, refreshCalendarEvents]);

  // Elimina la task aperta nel modale (ottimistico)
  const handleDeleteTaskInModal = useCallback(async () => {
    if (!formState.id) return;
    if (!window.confirm('Eliminare questa task?')) return;
    const eventId = formState.id;
    resetFormAndCloseModal();
    removeLocalItem(eventId);
    try {
      await deleteGoogleEvent(eventId, TASK_CALENDAR_ID);
    } catch (error) {
      console.error("Errore nell'eliminare la task:", error);
      alert("Errore nell'eliminare la task.");
      refreshCalendarEvents();
    }
  }, [formState.id, deleteGoogleEvent, resetFormAndCloseModal, removeLocalItem, refreshCalendarEvents]);

  // Cambia priorità direttamente dalla riga (pill inline)
  const handleUpdatePriority = useCallback(
    async (item, newPriority) => {
      const ev = item?.originalGCalEventData;
      if (!ev?.id) return;

      const priv = { isPrivate: String(ev.isPrivate || false) };
      if (ev.relatedPraticaId) priv.relatedPraticaId = ev.relatedPraticaId;
      if (ev.noDueDate) priv.noDueDate = 'true';
      if (newPriority && newPriority !== 'normale') priv.priority = newPriority;

      const eventResource = {
        summary: ev.title,
        description: ev.description || '',
        ...(ev.location && { location: ev.location }),
        start: { dateTime: new Date(ev.start).toISOString() },
        end: { dateTime: new Date(ev.end).toISOString() },
        extendedProperties: { private: priv },
      };

      updateLocalItem(ev.id, { priority: newPriority }); // pill cambia subito
      try {
        await updateGoogleEvent(ev.id, eventResource, TASK_CALENDAR_ID);
      } catch (error) {
        console.error('Errore aggiornamento priorità:', error);
        alert('Errore nel cambiare la priorità.');
        refreshCalendarEvents();
      }
    },
    [updateGoogleEvent, updateLocalItem, refreshCalendarEvents]
  );

  // Elimina task direttamente dalla riga (ottimistico)
  const handleDeleteTaskRow = useCallback(
    async (item) => {
      if (!item?.gCalEventId) return;
      if (!window.confirm(`Eliminare la task "${item.title}"?`)) return;
      removeLocalItem(item.gCalEventId);
      try {
        await deleteGoogleEvent(item.gCalEventId, item.gCalCalendarId || TASK_CALENDAR_ID);
      } catch (error) {
        console.error("Errore nell'eliminare la task:", error);
        alert("Errore nell'eliminare la task.");
        refreshCalendarEvents();
      }
    },
    [deleteGoogleEvent, removeLocalItem, refreshCalendarEvents]
  );

  return (
    <div className="h-full flex flex-col w-full">
      <div className="flex-1 min-h-0">
        <EnhancedTaskList
          todoItems={todoItems}
          isLoading={isLoadingTasks}
          toggleComplete={toggleComplete}
          refreshCalendarEvents={refreshCalendarEvents}
          pendingSyncCount={pendingSyncCount}
          onNewTask={() => openNewEventModal(new Date())}
          onEditTask={(event) => handleSelectEvent(event)}
          onDeleteTask={handleDeleteTaskRow}
          onChangePriority={handleUpdatePriority}
        />
      </div>

      <TaskModal
        show={showEventModal}
        onClose={resetFormAndCloseModal}
        formState={formState}
        onFormChange={handleFormChange}
        onDateChange={handleDateChange}
        onTimeChange={handleTimeChange}
        onRelatedPraticaChange={handleRelatedPraticaChange}
        onSave={handleSaveTask}
        onDelete={handleDeleteTaskInModal}
        pratiche={praticheInCorsoPerModal}
        pratichePrivate={pratichePrivate}
      />
    </div>
  );
}

export default CalendarTaskPage;

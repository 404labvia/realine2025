// src/pages/PraticheBoardPage/index.js
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { usePratiche } from '../../contexts/PraticheContext';
import { usePratichePrivato } from '../../contexts/PratichePrivatoContext';
import { FaFilter, FaFilePdf } from 'react-icons/fa';

import { useCalendarState } from '../CalendarPage/hooks/useCalendarState';
import { useGoogleCalendarApi } from '../CalendarPage/hooks/useGoogleCalendarApi';

import BoardTable from './components/BoardTable';
import EventModal from '../CalendarPage/components/EventModal';
import { EditPraticaForm } from '../PratichePage/components/forms';

import { agenzieCollaboratori } from '../PratichePage/utils';
import { calendarIds, calendarNameMap } from '../CalendarPage/utils/calendarUtils';
import { auth } from '../../firebase';

const calendarListForModal = [
  { id: 'primary', name: calendarNameMap['primary'] },
  { id: calendarIds.ID_DE_ANTONI, name: calendarNameMap[calendarIds.ID_DE_ANTONI] },
  { id: calendarIds.ID_CASTRO, name: calendarNameMap[calendarIds.ID_CASTRO] },
  { id: calendarIds.ID_ANTONELLI, name: calendarNameMap[calendarIds.ID_ANTONELLI] },
].filter(cal => cal.id && cal.name);

function PraticheBoardPage() {
  const { pratiche, loading, deletePratica, addPratica, updatePratica } = usePratiche();
  const { pratiche: pratichePrivateData, loading: loadingPratichePrivate } = usePratichePrivato();

  const [localPratiche, setLocalPratiche] = useState([]);
  const [filtroAgenzia, setFiltroAgenzia] = useState('');
  const [filtroStato, setFiltroStato] = useState('In Corso');
  const [editingPraticaId, setEditingPraticaId] = useState(null);
  const [currentStepIdForCalendar, setCurrentStepIdForCalendar] = useState(null);

  useEffect(() => {
    if (!loading) {
      setLocalPratiche(pratiche);
    }
  }, [pratiche, loading]);

  const tutteLePratichePerModal = useMemo(() => {
    if (loading || loadingPratichePrivate) return [];
    const std = Array.isArray(pratiche) ? pratiche : [];
    const prv = Array.isArray(pratichePrivateData) ? pratichePrivateData : [];
    return [...std, ...prv];
  }, [pratiche, pratichePrivateData, loading, loadingPratichePrivate]);

  const praticheInCorsoPerModal = useMemo(() => {
    return tutteLePratichePerModal.filter(pratica => pratica.stato !== 'Completata');
  }, [tutteLePratichePerModal]);

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
    deleteGoogleEvent: deleteGoogleCalendarEvent,
  } = useGoogleCalendarApi();

  const {
    showEventModal,
    formState: calendarFormState,
    handleSelectEvent: handleSelectCalendarEventForModal,
    resetFormAndCloseModal: resetCalendarFormAndCloseModal,
    openNewEventModal: openNewCalendarEventModal,
    handleFormChange: handleCalendarFormChange,
    handleDateChange: handleCalendarDateChange,
    handleTimeChange: handleCalendarTimeChange,
    handleRelatedPraticaChange: handleCalendarRelatedPraticaChange,
    prepareEventForApi: prepareCalendarEventForApi,
  } = useCalendarState(tutteLePratichePerModal, pratichePrivateData);

  const praticheFiltered = useMemo(() => {
    return localPratiche.filter(pratica => {
      const matchAgenzia = !filtroAgenzia || pratica.agenzia === filtroAgenzia;
      const matchStato = !filtroStato || pratica.stato === filtroStato;
      return matchAgenzia && matchStato;
    });
  }, [localPratiche, filtroAgenzia, filtroStato]);

  const handleEditPratica = (praticaId) => {
    setEditingPraticaId(praticaId);
  };

  const handleSaveEditedPratica = async (praticaId, updates) => {
    try {
      await updatePratica(praticaId, updates);
      setLocalPratiche(prev => prev.map(p => p.id === praticaId ? { ...p, ...updates } : p));
      setEditingPraticaId(null);
    } catch (error) {
      console.error('Errore durante l\'aggiornamento della pratica:', error);
      alert('Si è verificato un errore durante il salvataggio. Riprova.');
    }
  };

  const handleDeletePratica = async (praticaId) => {
    try {
      await deletePratica(praticaId);
      setLocalPratiche(prev => prev.filter(p => p.id !== praticaId));
      setEditingPraticaId(null);
    } catch (error) {
      console.error('Errore durante l\'eliminazione della pratica:', error);
      alert('Si è verificato un errore durante l\'eliminazione. Riprova.');
    }
  };

  const handleChangeStato = async (praticaId, nuovoStato) => {
    try {
      await updatePratica(praticaId, {
        stato: nuovoStato,
        updatedAt: new Date().toISOString()
      });
      setLocalPratiche(prev => prev.map(p => p.id === praticaId ? { ...p, stato: nuovoStato } : p));
    } catch (error) {
      console.error('Errore durante l\'aggiornamento dello stato:', error);
      alert('Si è verificato un errore durante la modifica dello stato. Riprova.');
    }
  };

  const handleOpenCalendarModalForTask = useCallback((praticaId, stepId) => {
    setCurrentStepIdForCalendar(stepId);
    openNewCalendarEventModal(new Date(), praticaId);
  }, [openNewCalendarEventModal]);

  const handleEditCalendarTask = useCallback((task, praticaIdOfTask, stepId) => {
    setCurrentStepIdForCalendar(stepId);
    const eventToEdit = calendarEvents.find(e => e.id === task.googleCalendarEventId);
    const praticaIdCollegata = task.relatedPraticaId || praticaIdOfTask;

    if (eventToEdit) {
      handleSelectCalendarEventForModal(eventToEdit);
    } else {
      const isPrivate = pratichePrivateData.some(p => p.id === praticaIdCollegata);
      let initialTitle = task.text;
      if (task.text && task.text.includes('(Pratica:')) {
        initialTitle = task.text.substring(0, task.text.indexOf('(Pratica:')).trim();
      }

      handleSelectCalendarEventForModal({
        id: task.googleCalendarEventId,
        title: initialTitle,
        start: new Date(task.dueDate),
        end: task.endDate ? new Date(task.endDate) : new Date(new Date(task.dueDate).getTime() + (60 * 60 * 1000)),
        description: task.description || '',
        relatedPraticaId: praticaIdCollegata,
        isPrivate: isPrivate,
        sourceCalendarId: task.sourceCalendarId || 'primary',
      });
    }
  }, [calendarEvents, handleSelectCalendarEventForModal, tutteLePratichePerModal, pratichePrivateData]);

  const handleSaveCalendarEvent = async () => {
    if (new Date(calendarFormState.end) <= new Date(calendarFormState.start)) {
      alert("L'ora di fine deve essere successiva all'ora di inizio.");
      return;
    }
    const eventResource = prepareCalendarEventForApi();
    const targetCalendarForApi = calendarFormState.targetCalendarId;
    const praticaIdCollegata = calendarFormState.relatedPraticaId;

    try {
      let savedGoogleEvent;
      if (calendarFormState.id) {
        savedGoogleEvent = await updateGoogleEvent(calendarFormState.id, eventResource, targetCalendarForApi);
      } else {
        savedGoogleEvent = await createGoogleEvent(eventResource, targetCalendarForApi);
      }

      if (savedGoogleEvent && praticaIdCollegata && currentStepIdForCalendar) {
        const praticaDaAggiornare = localPratiche.find(p => p.id === praticaIdCollegata);
        if (praticaDaAggiornare) {
          const updatedWorkflow = JSON.parse(JSON.stringify(praticaDaAggiornare.workflow || {}));

          if (!updatedWorkflow[currentStepIdForCalendar]) {
            updatedWorkflow[currentStepIdForCalendar] = { tasks: [], notes: [] };
          }
          if (!updatedWorkflow[currentStepIdForCalendar].tasks) {
            updatedWorkflow[currentStepIdForCalendar].tasks = [];
          }

          const taskIndex = updatedWorkflow[currentStepIdForCalendar].tasks.findIndex(
            (t) => t.googleCalendarEventId === savedGoogleEvent.id
          );

          let determinedSourceCalendarId = targetCalendarForApi;
          if (savedGoogleEvent.organizer && auth.currentUser && savedGoogleEvent.organizer.email === auth.currentUser.email) {
            determinedSourceCalendarId = 'primary';
          } else if (savedGoogleEvent.calendarId) {
            determinedSourceCalendarId = savedGoogleEvent.calendarId;
          }

          const taskData = {
            text: savedGoogleEvent.summary || eventResource.summary,
            dueDate: new Date(savedGoogleEvent.start?.dateTime || savedGoogleEvent.start?.date).toISOString(),
            endDate: savedGoogleEvent.end?.dateTime ? new Date(savedGoogleEvent.end.dateTime).toISOString() : new Date(new Date(savedGoogleEvent.start?.dateTime || savedGoogleEvent.start?.date).getTime() + (60 * 60 * 1000)).toISOString(),
            googleCalendarEventId: savedGoogleEvent.id,
            sourceCalendarId: determinedSourceCalendarId,
            priority: calendarFormState.priority || 'normal',
            reminder: calendarFormState.reminder || 60,
            completed: calendarFormState.id && taskIndex > -1 ? (updatedWorkflow[currentStepIdForCalendar].tasks[taskIndex]?.completed || false) : false,
            relatedPraticaId: praticaIdCollegata,
            description: savedGoogleEvent.description || '',
            location: savedGoogleEvent.location || '',
            isPrivate: calendarFormState.isPrivate || false,
            stepId: currentStepIdForCalendar
          };

          if (taskIndex > -1) {
            const existingTask = updatedWorkflow[currentStepIdForCalendar].tasks[taskIndex];
            updatedWorkflow[currentStepIdForCalendar].tasks[taskIndex] = {
              ...existingTask,
              ...taskData,
              updatedAt: new Date().toISOString(),
            };
          } else {
            updatedWorkflow[currentStepIdForCalendar].tasks.push({
              ...taskData,
              createdDate: new Date().toISOString(),
            });
          }

          setLocalPratiche(prevPratiche =>
            prevPratiche.map(p =>
              p.id === praticaIdCollegata
                ? { ...p, workflow: updatedWorkflow }
                : p
            )
          );
          await updatePratica(praticaIdCollegata, { workflow: updatedWorkflow });
        }
      }
      resetCalendarFormAndCloseModal();
    } catch (error) {
      console.error("Errore nel salvare l'evento di calendario e aggiornare la pratica:", error);
      alert("Si è verificato un errore nel salvare l'evento e aggiornare la pratica.");
    } finally {
      setCurrentStepIdForCalendar(null);
    }
  };

  const handleDeleteCalendarEventAndTask = async () => {
    if (!calendarFormState.id || !calendarFormState.targetCalendarId) {
      alert("Impossibile eliminare l'evento: informazioni mancanti.");
      return;
    }

    if (window.confirm("Sei sicuro di voler eliminare questo evento dal calendario e la task associata dalla pratica?")) {
      try {
        await deleteGoogleCalendarEvent(calendarFormState.id, calendarFormState.targetCalendarId);

        const praticaIdCollegata = calendarFormState.relatedPraticaId;
        const googleEventIdToDelete = calendarFormState.id;
        const stepIdDaCuiEliminare = currentStepIdForCalendar;

        if (praticaIdCollegata && stepIdDaCuiEliminare && googleEventIdToDelete) {
          const praticaDaAggiornare = localPratiche.find(p => p.id === praticaIdCollegata);
          if (praticaDaAggiornare && praticaDaAggiornare.workflow && praticaDaAggiornare.workflow[stepIdDaCuiEliminare] && praticaDaAggiornare.workflow[stepIdDaCuiEliminare].tasks) {
            const updatedWorkflow = JSON.parse(JSON.stringify(praticaDaAggiornare.workflow));
            updatedWorkflow[stepIdDaCuiEliminare].tasks = updatedWorkflow[stepIdDaCuiEliminare].tasks.filter(
              (task) => task.googleCalendarEventId !== googleEventIdToDelete
            );

            setLocalPratiche(prevPratiche =>
              prevPratiche.map(p =>
                p.id === praticaIdCollegata
                  ? { ...p, workflow: updatedWorkflow }
                  : p
              )
            );
            await updatePratica(praticaIdCollegata, { workflow: updatedWorkflow });
          }
        }
        resetCalendarFormAndCloseModal();
      } catch (error) {
        console.error("Errore nell'eliminare l'evento di calendario e/o la task:", error);
        alert("Errore nell'eliminare l'evento e/o la task associata.");
      } finally {
        setCurrentStepIdForCalendar(null);
      }
    }
  };

  if (loading || loadingPratichePrivate || (isLoadingGapi && !googleApiToken)) {
    return <div className="flex justify-center items-center h-full">Caricamento...</div>;
  }

  const isGoogleAuthenticated = gapiClientInitialized && !!googleApiToken;

  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-gray-800">Gestione Pratiche - Vista Board</h1>
      </div>

      <div className="bg-white p-3 rounded-lg shadow mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center mr-4">
            <FaFilter className="text-gray-500 mr-2" size={14} />
            <label className="text-sm font-medium text-gray-700 mr-2">Filtra per agenzia:</label>
            <select
              value={filtroAgenzia}
              onChange={(e) => setFiltroAgenzia(e.target.value)}
              className="p-1 text-sm border border-gray-300 rounded-md w-64"
            >
              <option value="">Tutte le agenzie</option>
              {agenzieCollaboratori.map(ac => (
                <option key={ac.agenzia} value={ac.agenzia}>{ac.agenzia}</option>
              ))}
            </select>

            {filtroAgenzia && (
              <button
                onClick={() => setFiltroAgenzia('')}
                className="ml-2 text-xs text-blue-600 hover:text-blue-800"
              >
                Rimuovi filtro
              </button>
            )}
          </div>
          <div className="flex items-center">
            <div className="mr-4">
              <label className="text-sm font-medium text-gray-700 mr-2">Stato:</label>
              <select
                value={filtroStato}
                onChange={(e) => setFiltroStato(e.target.value)}
                className="p-1 text-sm border border-gray-300 rounded-md w-64"
              >
                <option value="">Tutti gli stati</option>
                <option value="In Corso">In Corso</option>
                <option value="Completata">Completata</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <BoardTable
        pratiche={praticheFiltered}
        onEditPratica={handleEditPratica}
        onChangeStato={handleChangeStato}
        updatePratica={updatePratica}
        localPratiche={localPratiche}
        setLocalPratiche={setLocalPratiche}
        isGoogleAuthenticated={isGoogleAuthenticated}
        googleAuthLoading={isLoadingGapi || isLoadingEvents}
        loginToGoogleCalendar={loginToGoogle}
        onOpenCalendarModal={handleOpenCalendarModalForTask}
        onEditCalendarTask={handleEditCalendarTask}
        deleteGoogleCalendarEvent={deleteGoogleCalendarEvent}
      />

      {editingPraticaId && (
        <EditPraticaForm
          praticaId={editingPraticaId}
          pratica={localPratiche.find(p => p.id === editingPraticaId)}
          onClose={() => setEditingPraticaId(null)}
          onSave={handleSaveEditedPratica}
          onDelete={handleDeletePratica}
        />
      )}

      {showEventModal && (
        <EventModal
          showEventModal={showEventModal}
          onClose={() => {
            resetCalendarFormAndCloseModal();
            setCurrentStepIdForCalendar(null);
          }}
          formState={calendarFormState}
          onFormChange={handleCalendarFormChange}
          onDateChange={handleCalendarDateChange}
          onTimeChange={handleCalendarTimeChange}
          onRelatedPraticaChange={handleCalendarRelatedPraticaChange}
          onSave={handleSaveCalendarEvent}
          onDelete={handleDeleteCalendarEventAndTask}
          tutteLePratiche={praticheInCorsoPerModal}
          pratichePrivate={pratichePrivateData}
          calendarList={calendarListForModal}
        />
      )}
    </div>
  );
}

export default PraticheBoardPage;
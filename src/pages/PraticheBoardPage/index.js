// src/pages/PraticheBoardPage/index.js
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { usePratiche } from '../../contexts/PraticheContext';
import { usePratichePrivato } from '../../contexts/PratichePrivatoContext';
import { FaPlus, FaSearch, FaFilter, FaSort } from 'react-icons/fa';
import Fuse from 'fuse.js';
import { addDays } from 'date-fns';

import { useCalendarState } from '../CalendarPage/hooks/useCalendarState';
import { useGoogleCalendarApi } from '../CalendarPage/hooks/useGoogleCalendarApi';

import BoardTable from './components/BoardTable';
import EventModal from '../CalendarPage/components/EventModal';
import { NewPraticaForm, EditPraticaForm } from '../PratichePage/components/forms';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [ordinaPerScadenza, setOrdinaPerScadenza] = useState(true);
  const [editingPraticaId, setEditingPraticaId] = useState(null);
  const [showNewPraticaForm, setShowNewPraticaForm] = useState(false);
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

  const fuse = useMemo(() => {
    return new Fuse(localPratiche, {
      keys: ['indirizzo', 'cliente', 'codice'],
      threshold: 0.3,
      includeScore: true,
    });
  }, [localPratiche]);

  // Funzione per ordinare per scadenza
  const sortByScadenza = (pratiche) => {
    return [...pratiche].sort((a, b) => {
      const scadenzaA = a.workflow?.scadenze?.dataAttoConfermato || a.workflow?.scadenze?.dataCompromesso;
      const scadenzaB = b.workflow?.scadenze?.dataAttoConfermato || b.workflow?.scadenze?.dataCompromesso;

      if (!scadenzaA && !scadenzaB) return 0;
      if (!scadenzaA) return 1;
      if (!scadenzaB) return -1;

      return new Date(scadenzaA) - new Date(scadenzaB);
    });
  };

  const praticheFiltered = useMemo(() => {
    let filtered = localPratiche;

    if (filtroAgenzia) {
      filtered = filtered.filter(pratica => pratica.agenzia === filtroAgenzia);
    }

    if (filtroStato) {
      filtered = filtered.filter(pratica => pratica.stato === filtroStato);
    }

    if (searchQuery.trim()) {
      const fuseResults = fuse.search(searchQuery);
      const searchResultIds = fuseResults.map(result => result.item.id);
      filtered = filtered.filter(pratica => searchResultIds.includes(pratica.id));
    }

    if (ordinaPerScadenza) {
      filtered = sortByScadenza(filtered);
    }

    return filtered;
  }, [localPratiche, filtroAgenzia, filtroStato, searchQuery, fuse, ordinaPerScadenza]);

  const handleEditPratica = (praticaId) => {
    setEditingPraticaId(praticaId);
  };

  const handleAddNewPratica = async (praticaData) => {
    try {
      const newId = await addPratica(praticaData);
      setLocalPratiche(prev => [...prev, { ...praticaData, id: newId }]);
      setShowNewPraticaForm(false);
    } catch (error) {
      console.error('Errore durante l\'aggiunta della pratica:', error);
      alert('Si è verificato un errore durante il salvataggio. Riprova.');
    }
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

  // Funzione per creare task automatiche da checkbox incarico
  const handleCreateAutomationTask = async (praticaId, stepId, taskData) => {
    if (!gapiClientInitialized || !googleApiToken) {
      console.warn('Google Calendar non autenticato, impossibile creare task automatica');
      return;
    }

    try {
      const pratica = localPratiche.find(p => p.id === praticaId);
      if (!pratica) return;

      // Prepara evento per Google Calendar
      const eventResource = {
        summary: taskData.title,
        description: `Task automatica creata da controllo incarico per ${pratica.indirizzo}`,
        start: {
          dateTime: taskData.dueDate.toISOString(),
          timeZone: 'Europe/Rome'
        },
        end: {
          dateTime: addDays(taskData.dueDate, 0).toISOString(),
          timeZone: 'Europe/Rome'
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'popup', minutes: 60 }
          ]
        }
      };

      const savedGoogleEvent = await createGoogleEvent(eventResource, 'primary');

      if (savedGoogleEvent) {
        const updatedWorkflow = JSON.parse(JSON.stringify(pratica.workflow || {}));

        if (!updatedWorkflow[stepId]) {
          updatedWorkflow[stepId] = { tasks: [], notes: [] };
        }
        if (!updatedWorkflow[stepId].tasks) {
          updatedWorkflow[stepId].tasks = [];
        }

        const taskInfo = {
          text: taskData.title,
          dueDate: taskData.dueDate.toISOString(),
          endDate: addDays(taskData.dueDate, 0).toISOString(),
          googleCalendarEventId: savedGoogleEvent.id,
          sourceCalendarId: 'primary',
          priority: taskData.priority || 'normal',
          reminder: 60,
          completed: false,
          relatedPraticaId: praticaId,
          description: `Task automatica creata da controllo incarico`,
          createdDate: new Date().toISOString(),
          stepId: stepId
        };

        updatedWorkflow[stepId].tasks.push(taskInfo);

        setLocalPratiche(prevPratiche =>
          prevPratiche.map(p =>
            p.id === praticaId
              ? { ...p, workflow: updatedWorkflow }
              : p
          )
        );
        await updatePratica(praticaId, { workflow: updatedWorkflow });
      }
    } catch (error) {
      console.error("Errore durante la creazione della task automatica:", error);
    }
  };

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
      <div className="bg-white p-3 rounded-lg shadow mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <FaFilter className="text-gray-500" size={14} />
            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Filtra per agenzia:</label>
            <select
              value={filtroAgenzia}
              onChange={(e) => setFiltroAgenzia(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md w-48"
            >
              <option value="">Tutte le agenzie</option>
              {agenzieCollaboratori.map(ac => (
                <option key={ac.agenzia} value={ac.agenzia}>{ac.agenzia}</option>
              ))}
            </select>

            {filtroAgenzia && (
              <button
                onClick={() => setFiltroAgenzia('')}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                Rimuovi filtro
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Stato:</label>
            <select
              value={filtroStato}
              onChange={(e) => setFiltroStato(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md w-40"
            >
              <option value="">Tutti gli stati</option>
              <option value="In Corso">In Corso</option>
              <option value="Completata">Completata</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <FaSort className="text-gray-500" size={14} />
            <label className="inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={ordinaPerScadenza}
                onChange={(e) => setOrdinaPerScadenza(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm font-medium text-gray-700">Ordina per scadenza</span>
            </label>
          </div>

          <div className="flex-1 relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
            <input
              type="text"
              placeholder="Cerca pratiche..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={() => setShowNewPraticaForm(true)}
            className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-800 flex items-center gap-2 text-sm whitespace-nowrap"
          >
            <FaPlus size={12} /> Nuova Pratica
          </button>
        </div>

        {searchQuery && (
          <p className="text-xs text-gray-500 mt-2">
            {praticheFiltered.length} {praticheFiltered.length === 1 ? 'risultato trovato' : 'risultati trovati'}
          </p>
        )}
      </div>

      {praticheFiltered.length === 0 && searchQuery ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <FaSearch size={48} className="mx-auto mb-4 text-gray-300" />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Nessuna pratica trovata</h3>
          <p className="text-gray-600">
            Prova a modificare i termini di ricerca o rimuovi i filtri.
          </p>
        </div>
      ) : (
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
          onCreateAutomationTask={handleCreateAutomationTask}
        />
      )}

      {showNewPraticaForm && (
        <NewPraticaForm
          onClose={() => setShowNewPraticaForm(false)}
          onSave={handleAddNewPratica}
        />
      )}

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
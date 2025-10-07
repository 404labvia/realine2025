// src/pages/PratichePage/index.js
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { usePratiche } from '../../contexts/PraticheContext';
import { usePratichePrivato } from '../../contexts/PratichePrivatoContext';
import { FaPlus, FaFilter, FaFilePdf, FaClock, FaList } from 'react-icons/fa';

// Importa hooks personalizzati
import { useActiveCells, useLocalPratiche } from './hooks';
import { useCalendarState } from '../CalendarPage/hooks/useCalendarState';
import { useGoogleCalendarApi } from '../CalendarPage/hooks/useGoogleCalendarApi';

// Importa componenti UI
import { NewPraticaForm, EditPraticaForm } from './components/forms';
import WorkflowTable from './components/WorkflowTable';
import EventModal from '../CalendarPage/components/EventModal';

// Importa servizi
import automationService from '../../services/AutomationService';
import { auth } from '../../firebase';

// Importa utilità
import {
  customStyles,
  agenzieCollaboratori,
  generatePDF,
  generateListPDF,
} from './utils';
import { calendarIds, calendarNameMap } from '../CalendarPage/utils/calendarUtils';

// Importa handlers
import {
  handleAddNote,
  handleDeleteNote,
  handleUpdateNote,
  handleToggleTaskItem,
  handlePaymentChange,
  handleDateTimeChange,
  handleDeleteDateTime,
  handleToggleChecklistItem,
  handleChangeStato
} from './handlers';

// Lista dei calendari per il dropdown nel modale
const calendarListForModal = [
    { id: 'primary', name: calendarNameMap['primary'] },
    { id: calendarIds.ID_DE_ANTONI, name: calendarNameMap[calendarIds.ID_DE_ANTONI] },
    { id: calendarIds.ID_CASTRO, name: calendarNameMap[calendarIds.ID_CASTRO] },
    { id: calendarIds.ID_ANTONELLI, name: calendarNameMap[calendarIds.ID_ANTONELLI] },
].filter(cal => cal.id && cal.name);


function PratichePage() {
  const { pratiche, loading, deletePratica, addPratica, updatePratica } = usePratiche();
  const { pratiche: pratichePrivateData, loading: loadingPratichePrivate } = usePratichePrivato();

  // Stati locali di UI
  const [showNewPraticaForm, setShowNewPraticaForm] = useState(false);
  const [editingPraticaId, setEditingPraticaId] = useState(null);
  const [filtroAgenzia, setFiltroAgenzia] = useState('');
  const [filtroStato, setFiltroStato] = useState('In Corso');
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [lastTaskEvent, setLastTaskEvent] = useState(null);
  const [showTaskNotification, setShowTaskNotification] = useState(false);
  const [currentStepIdForCalendar, setCurrentStepIdForCalendar] = useState(null);

  // Usa i custom hooks
  const {
    activeCells,
    handleCellClick,
  } = useActiveCells();

  const {
    localPratiche,
    praticheFiltered,
    setLocalPratiche,
    updateLocalPratica,
    addLocalPratica,
    removeLocalPratica
  } = useLocalPratiche(pratiche, loading, filtroAgenzia, filtroStato);

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
      console.warn("Evento di calendario non trovato localmente per la modifica, apertura con i dati della task.");
      const praticaOriginale = tutteLePratichePerModal.find(p => p.id === praticaIdCollegata);
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

  const handleAddNewPratica = async (praticaData) => {
    try {
      const newId = await addPratica(praticaData);
      addLocalPratica({ ...praticaData, id: newId });
      setShowNewPraticaForm(false);
    } catch (error) {
      console.error('Errore durante l\'aggiunta della pratica:', error);
      alert('Si è verificato un errore durante il salvataggio. Riprova.');
    }
  };

  const handleEditPratica = (praticaId) => {
    setEditingPraticaId(praticaId);
  };

  const handleSaveEditedPratica = async (praticaId, updates) => {
    try {
      await updatePratica(praticaId, updates);
      updateLocalPratica(praticaId, updates);
      setEditingPraticaId(null);
      if (updates.dataFine) {
        const pratica = localPratiche.find(p => p.id === praticaId);
        if (pratica) {
          const tasks = await automationService.processTrigger(
            pratica, 'deadline', { dataFine: updates.dataFine }, updatePratica
          );
          if (tasks.length > 0) {
            setLastTaskEvent({ type: 'created', trigger: 'deadline', count: tasks.length });
            setShowTaskNotification(true);
          }
        }
      }
    } catch (error) {
      console.error('Errore durante l\'aggiornamento della pratica:', error);
      alert('Si è verificato un errore durante il salvataggio. Riprova.');
    }
  };

  const handleDeletePratica = async (praticaId) => {
    try {
      await deletePratica(praticaId);
      removeLocalPratica(praticaId);
      setEditingPraticaId(null);
    } catch (error) {
      console.error('Errore durante l\'eliminazione della pratica:', error);
      alert('Si è verificato un errore durante l\'eliminazione. Riprova.');
    }
  };

  const handleCellClickWrapper = (praticaId, stepId, stepType, isActive = true) => {
    handleCellClick(praticaId, stepId, stepType, isActive);
  };

  const handleAddActualNote = (praticaId, stepId, noteText) => {
    handleAddNote(praticaId, stepId, noteText, 'note', updatePratica, localPratiche, setLocalPratiche);
  };

  const handleDeleteNoteWrapper = (praticaId, stepId, noteIndex, type = 'note') => {
    handleDeleteNote(praticaId, stepId, noteIndex, updatePratica, localPratiche, setLocalPratiche, type);
  };

  const handleUpdateActualNote = (praticaId, stepId, noteIndex, newText) => {
    handleUpdateNote(praticaId, stepId, noteIndex, newText, 'note', updatePratica, localPratiche, setLocalPratiche);
  };

  const handleToggleTaskItemWrapper = (praticaId, stepId, taskIndex, completed) => {
    handleToggleTaskItem(praticaId, stepId, taskIndex, completed, updatePratica, localPratiche, setLocalPratiche);
  };

  const handleDeleteTaskFromWorkflow = async (praticaId, stepId, taskIndex, googleEventId, sourceCalendarId) => {
    if (googleEventId && sourceCalendarId) {
      if (window.confirm("Vuoi eliminare questa task anche da Google Calendar?")) {
        try {
          await deleteGoogleCalendarEvent(googleEventId, sourceCalendarId);
        } catch (error) {
          console.error("Errore eliminazione evento Google Calendar:", error);
          alert("Errore durante l'eliminazione dell'evento da Google Calendar. La task sarà rimossa solo localmente dalla pratica.");
        }
      }
    }
    handleDeleteNote(praticaId, stepId, taskIndex, updatePratica, localPratiche, setLocalPratiche, 'task');
  };

  const handleToggleChecklistItemWrapper = (praticaId, stepId, itemId, completed) => {
    handleToggleChecklistItem(praticaId, stepId, itemId, completed, updatePratica, localPratiche, setLocalPratiche);
  };

  const handleDateTimeChangeWrapper = async (praticaId, stepId, field, value) => {
    const pratica = localPratiche.find(p => p.id === praticaId);
    const oldData = pratica?.workflow?.[stepId] || {};
    await handleDateTimeChange(praticaId, stepId, field, value, updatePratica, localPratiche, setLocalPratiche);
    if ((stepId === 'incarico' || stepId === 'accessoAtti') && field === 'dataInvio') {
      const updatedPratica = localPratiche.find(p => p.id === praticaId);
      const updatedData = updatedPratica.workflow?.[stepId] || {};
      if (updatedData.dataInvio && (!oldData.dataInvio || oldData.dataInvio !== updatedData.dataInvio)) {
        const tasks = await automationService.processTrigger(
          updatedPratica, stepId, updatedData, updatePratica
        );
        if (tasks.length > 0) {
          setLastTaskEvent({ type: 'created', trigger: stepId, count: tasks.length });
          setShowTaskNotification(true);
        }
      }
    }
  };

  const handleDeleteDateTimeWrapper = (praticaId, stepId) => {
    handleDeleteDateTime(praticaId, stepId, updatePratica, localPratiche, setLocalPratiche);
  };

  const handlePaymentChangeWrapper = async (praticaId, stepId, field, value) => {
    const pratica = localPratiche.find(p => p.id === praticaId);
    const oldData = pratica?.workflow?.[stepId] || {};
    await handlePaymentChange(praticaId, stepId, field, value, updatePratica, localPratiche, setLocalPratiche);
    if (stepId.includes('acconto') || stepId === 'saldo') {
      const updatedPratica = localPratiche.find(p => p.id === praticaId);
      const updatedData = updatedPratica.workflow?.[stepId] || {};
      if (field.includes('importoCommittente') && updatedData.importoCommittente > 0 &&
          (!oldData.importoCommittente || oldData.importoCommittente !== updatedData.importoCommittente)) {
        const tasks = await automationService.processTrigger(
          updatedPratica, 'pagamento', updatedData, updatePratica
        );
        if (tasks.length > 0) {
          setLastTaskEvent({ type: 'created', trigger: 'pagamento', count: tasks.length });
          setShowTaskNotification(true);
        }
      }
    }
  };

  const handleChangeStatoWrapper = (praticaId, nuovoStato) => {
    handleChangeStato(praticaId, nuovoStato, updatePratica, localPratiche, setLocalPratiche);
  };

  const handleGeneratePDF = async (filtroAgenziaPerPdf = '') => {
    await generatePDF(localPratiche, filtroAgenziaPerPdf);
    setShowExportOptions(false);
  };

  const handleGenerateListPDF = async () => {
    await generateListPDF(localPratiche, '');
  };

  const TaskNotification = ({ event, onClose }) => {
    if (!event) return null;
    let message = '';
    switch (event.trigger) {
      case 'incarico': message = `${event.count} task create automaticamente dopo l'incarico`; break;
      case 'accessoAtti': message = `${event.count} task create automaticamente dopo l'accesso atti`; break;
      case 'pagamento': message = `${event.count} task create automaticamente dopo il pagamento`; break;
      case 'deadline': message = `${event.count} task create automaticamente per scadenza pratica`; break;
      default: message = `${event.count} task create automaticamente`;
    }
    return (
      <div className="fixed bottom-4 right-4 bg-green-50 border-l-4 border-green-500 p-4 rounded shadow-lg z-50 max-w-md">
        <div className="flex">
          <div className="flex-shrink-0"><FaClock className="h-5 w-5 text-green-500" /></div>
          <div className="ml-3">
            <p className="text-sm text-green-700">{message}</p>
            <p className="mt-1 text-xs text-green-700">Le task sono state aggiunte alla lista e/o sincronizzate con Google Calendar</p>
          </div>
          <button className="ml-auto text-green-500 hover:text-green-700" onClick={onClose}>&times;</button>
        </div>
      </div>
    );
  };

  if (loading || loadingPratichePrivate || (isLoadingGapi && !googleApiToken)) {
    return <div className="flex justify-center items-center h-full">Caricamento...</div>;
  }

  const isGoogleAuthenticated = gapiClientInitialized && !!googleApiToken;

  return (
    <div className="container mx-auto">
      <style>{customStyles}</style>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-gray-800">Gestione Pratiche</h1>
        <button
          onClick={() => setShowNewPraticaForm(true)}
          className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center text-sm"
        >
          <FaPlus className="mr-1" size={12} /> Nuova Pratica
        </button>
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
              <div className="flex items-center gap-2">
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

                  {/* Pulsante Esporta Lista Pratiche */}
                  <button
                      onClick={handleGenerateListPDF}
                      className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center text-sm"
                  >
                      <FaList className="mr-1" size={14} /> Esporta Lista Pratiche
                  </button>

                  {/* Pulsante Esporta PDF (schede) */}
                  <div className="relative">
                      <button
                          onClick={() => setShowExportOptions(!showExportOptions)}
                          className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center text-sm"
                      >
                          <FaFilePdf className="mr-1" size={14} /> Esporta PDF
                      </button>
                      {showExportOptions && (
                          <div className="absolute right-0 mt-1 bg-white shadow-lg rounded-md z-20 w-48 top-10">
                              <ul className="py-1">
                                  <li>
                                      <button
                                          onClick={() => handleGeneratePDF()}
                                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                      >
                                          Tutte le pratiche
                                      </button>
                                  </li>
                                  {agenzieCollaboratori.map(ac => (
                                      <li key={ac.agenzia}>
                                          <button
                                              onClick={() => handleGeneratePDF(ac.agenzia)}
                                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                          >
                                              {ac.agenzia}
                                          </button>
                                      </li>
                                  ))}
                              </ul>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      </div>

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

      <WorkflowTable
        pratiche={praticheFiltered}
        onEditPratica={handleEditPratica}
        onAddNote={handleAddActualNote}
        onDeleteNote={handleDeleteNoteWrapper}
        onToggleChecklistItem={handleToggleChecklistItemWrapper}
        onToggleTaskItem={handleToggleTaskItemWrapper}
        onUpdateNote={handleUpdateActualNote}
        onDateTimeChange={handleDateTimeChangeWrapper}
        onDeleteDateTime={handleDeleteDateTimeWrapper}
        onPaymentChange={handlePaymentChangeWrapper}
        onChangeStato={handleChangeStatoWrapper}
        onCellClick={handleCellClickWrapper}

        onOpenCalendarModal={handleOpenCalendarModalForTask}
        onEditCalendarTask={handleEditCalendarTask}
        onDeleteTaskFromWorkflow={handleDeleteTaskFromWorkflow}

        isGoogleAuthenticated={isGoogleAuthenticated}
        googleAuthLoading={isLoadingGapi || isLoadingEvents}
        loginToGoogleCalendar={loginToGoogle}
        activeCells={activeCells}
      />

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

      {showTaskNotification && (
        <TaskNotification event={lastTaskEvent} onClose={() => setShowTaskNotification(false)} />
      )}
    </div>
  );
}

export default PratichePage;
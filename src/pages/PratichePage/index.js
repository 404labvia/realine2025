// src/pages/PratichePage/index.js
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { usePratiche } from '../../contexts/PraticheContext';
import { usePratichePrivato } from '../../contexts/PratichePrivatoContext';
import { FaPlus, FaFilter, FaFilePdf, FaClock } from 'react-icons/fa';

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

// Importa utilità
import {
  customStyles,
  agenzieCollaboratori,
  generatePDF,
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

import {
  handleSetTaskDueDate,
  handleRemoveTaskDueDate,
  // handleSyncTaskWithCalendar // Rimosso
} from './handlers/taskHandlers';

// Lista dei calendari per il dropdown nel modale
const calendarListForModal = [
    { id: 'primary', name: calendarNameMap['primary'] },
    { id: calendarIds.ID_DE_ANTONI, name: calendarNameMap[calendarIds.ID_DE_ANTONI] },
    { id: calendarIds.ID_CASTRO, name: calendarNameMap[calendarIds.ID_CASTRO] },
    { id: calendarIds.ID_ANTONELLI, name: calendarNameMap[calendarIds.ID_ANTONELLI] },
].filter(cal => cal.id && cal.name);


function PratichePage() {
  const { pratiche, loading, deletePratica, addPratica, updatePratica } = usePratiche();
  const { pratiche: pratichePrivate, loading: loadingPratichePrivate } = usePratichePrivato();

  // Stati locali di UI
  const [showNewPraticaForm, setShowNewPraticaForm] = useState(false);
  const [editingPraticaId, setEditingPraticaId] = useState(null);
  const [filtroAgenzia, setFiltroAgenzia] = useState('');
  const [filtroStato, setFiltroStato] = useState('In Corso');
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [lastTaskEvent, setLastTaskEvent] = useState(null);
  const [showTaskNotification, setShowTaskNotification] = useState(false);

  // Usa i custom hooks
  const {
    activeCells,
    handleCellClick,
    // isCellActive // Non più usato direttamente
  } = useActiveCells();

  const {
    localPratiche,
    praticheFiltered,
    setLocalPratiche,
    updateLocalPratica,
    addLocalPratica,
    removeLocalPratica
  } = useLocalPratiche(pratiche, loading, filtroAgenzia, filtroStato);

    // Combina pratiche standard e private
    const tutteLePratiche = useMemo(() => {
        if (loading || loadingPratichePrivate) return [];
        const std = Array.isArray(pratiche) ? pratiche : [];
        const prv = Array.isArray(pratichePrivate) ? pratichePrivate : [];
        return [...std, ...prv];
    }, [pratiche, pratichePrivate, loading, loadingPratichePrivate]);

    // Filtra le pratiche per mostrare solo quelle "in corso"
    const praticheInCorsoPerModal = useMemo(() => {
        return tutteLePratiche.filter(pratica => pratica.stato !== 'Completata');
    }, [tutteLePratiche]);


  // Hooks per Google Calendar API e stato del modale
  const {
    googleApiToken,
    gapiClientInitialized,
    isLoadingGapi,
    isLoadingEvents,
    loginToGoogle,
    fetchGoogleEvents,
    createGoogleEvent,
    updateGoogleEvent,
    deleteGoogleEvent,
  } = useGoogleCalendarApi();

  const {
    showEventModal,
    formState: calendarFormState,
    resetFormAndCloseModal: resetCalendarFormAndCloseModal,
    openNewEventModal: openNewCalendarEventModal,
    handleFormChange: handleCalendarFormChange,
    handleDateChange: handleCalendarDateChange,
    handleTimeChange: handleCalendarTimeChange,
    handleRelatedPraticaChange: handleCalendarRelatedPraticaChange,
    prepareEventForApi: prepareCalendarEventForApi,
  } = useCalendarState(tutteLePratiche, pratichePrivate);

  // Wrapper per aprire il modale del calendario da TaskCell
  const handleOpenCalendarModalForTask = useCallback((praticaId, stepId) => {
      // Passa praticaId per pre-compilazione
      openNewCalendarEventModal(new Date(), praticaId);
  }, [openNewCalendarEventModal]);


  // Salva evento calendario
  const handleSaveCalendarEvent = async () => {
    if (new Date(calendarFormState.end) <= new Date(calendarFormState.start)) {
      alert("L'ora di fine deve essere successiva all'ora di inizio.");
      return;
    }
    const eventResource = prepareCalendarEventForApi();
    const targetCalendar = calendarFormState.targetCalendarId;

    try {
      if (calendarFormState.id) {
        await updateGoogleEvent(calendarFormState.id, eventResource, targetCalendar);
      } else {
        await createGoogleEvent(eventResource, targetCalendar);
      }
      resetCalendarFormAndCloseModal();
      fetchGoogleEvents(); // Ricarica gli eventi
    } catch (error) {
      console.error("Errore nel salvare l'evento:", error);
      alert("Si è verificato un errore nel salvare l'evento su Google Calendar.");
    }
  };

  // Handler per eliminare un evento (per coerenza, anche se non usato attivamente da qui)
  const handleDeleteCalendarEvent = async () => {
    if (!calendarFormState.id || !calendarFormState.targetCalendarId) return;
    if (window.confirm("Sei sicuro di voler eliminare questo evento dal calendario?")) {
      try {
        await deleteGoogleEvent(calendarFormState.id, calendarFormState.targetCalendarId);
        resetCalendarFormAndCloseModal();
        fetchGoogleEvents();
      } catch (error) {
        console.error("Errore nell'eliminare l'evento:", error);
        alert("Errore nell'eliminare l'evento.");
      }
    }
  };


  // Handler per aggiungere una nuova pratica
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

  // Handler per modificare una pratica
  const handleEditPratica = (praticaId) => {
    setEditingPraticaId(praticaId);
  };

  // Handler per salvare le modifiche
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

  // Handler per eliminare una pratica
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

  // Wrapper per handler di celle workflow
  const handleCellClickWrapper = (praticaId, stepId, stepType, isActive = true) => {
    handleCellClick(praticaId, stepId, stepType, isActive);
  };

  // Funzioni wrapper per handlers
  const handleAddNoteWrapper = (praticaId, stepId, noteText, type = 'task') => {
    handleAddNote(praticaId, stepId, noteText, type, updatePratica, localPratiche, setLocalPratiche);
  };

  const handleDeleteNoteWrapper = (praticaId, stepId, noteIndex) => {
    handleDeleteNote(praticaId, stepId, noteIndex, updatePratica, localPratiche, setLocalPratiche);
  };

  const handleUpdateNoteWrapper = (praticaId, stepId, noteIndex, newText, type) => {
    handleUpdateNote(praticaId, stepId, noteIndex, newText, type, updatePratica, localPratiche, setLocalPratiche);
  };

  const handleToggleTaskItemWrapper = (praticaId, stepId, taskIndex, completed) => {
    handleToggleTaskItem(praticaId, stepId, taskIndex, completed, updatePratica, localPratiche, setLocalPratiche);
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

  // Handlers specifici per task
  const handleSetTaskDueDateWrapper = (praticaId, stepId, taskIndex, dueDateInfo) => {
    handleSetTaskDueDate(praticaId, stepId, taskIndex, dueDateInfo, updatePratica, localPratiche, setLocalPratiche);
  };

  const handleRemoveTaskDueDateWrapper = (praticaId, stepId, taskIndex) => {
    handleRemoveTaskDueDate(praticaId, stepId, taskIndex, updatePratica, localPratiche, setLocalPratiche);
  };

  // Handler per generare PDF
  const handleGeneratePDF = async (filtroAgenziaPerPdf = '') => {
    await generatePDF(localPratiche, filtroAgenziaPerPdf);
    setShowExportOptions(false);
  };

  // Componente per notifica creazione task automatiche
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
            <p className="mt-1 text-xs text-green-700">Le task sono state aggiunte alla lista</p>
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
      {/* CSS personalizzato */}
      <style>{customStyles}</style>

      {/* Intestazione e bottone nuova pratica */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-gray-800">Gestione Pratiche</h1>
        <button
          onClick={() => setShowNewPraticaForm(true)}
          className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center text-sm"
        >
          <FaPlus className="mr-1" size={12} /> Nuova Pratica
        </button>
      </div>

      {/* Filtro per agenzia, stato ed esportazione */}
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

      {/* Form modale per nuova pratica */}
      {showNewPraticaForm && (
        <NewPraticaForm
          onClose={() => setShowNewPraticaForm(false)}
          onSave={handleAddNewPratica}
        />
      )}

      {/* Form modale per modifica pratica */}
      {editingPraticaId && (
        <EditPraticaForm
          praticaId={editingPraticaId}
          pratica={localPratiche.find(p => p.id === editingPraticaId)}
          onClose={() => setEditingPraticaId(null)}
          onSave={handleSaveEditedPratica}
          onDelete={handleDeletePratica}
        />
      )}

      {/* Tabella Workflow */}
      <WorkflowTable
        pratiche={praticheFiltered}
        onEditPratica={handleEditPratica}
        onAddNote={handleAddNoteWrapper}
        onDeleteNote={handleDeleteNoteWrapper}
        onToggleChecklistItem={handleToggleChecklistItemWrapper}
        onToggleTaskItem={handleToggleTaskItemWrapper}
        onUpdateNote={handleUpdateNoteWrapper}
        onDateTimeChange={handleDateTimeChangeWrapper}
        onDeleteDateTime={handleDeleteDateTimeWrapper}
        onPaymentChange={handlePaymentChangeWrapper}
        onChangeStato={handleChangeStatoWrapper}
        onCellClick={handleCellClickWrapper}
        onSetTaskDueDate={handleSetTaskDueDateWrapper}
        onRemoveTaskDueDate={handleRemoveTaskDueDateWrapper}
        // onSyncWithCalendar={handleSyncTaskWithCalendarWrapper} // Rimosso
        activeCells={activeCells}
        isGoogleAuthenticated={isGoogleAuthenticated}
        onOpenCalendarModal={handleOpenCalendarModalForTask}
        googleAuthLoading={isLoadingGapi || isLoadingEvents}
        loginToGoogleCalendar={loginToGoogle}
      />

      {/* Modale per Eventi Calendario */}
      {showEventModal && (
        <EventModal
          showEventModal={showEventModal}
          onClose={resetCalendarFormAndCloseModal}
          formState={calendarFormState}
          onFormChange={handleCalendarFormChange}
          onDateChange={handleCalendarDateChange}
          onTimeChange={handleCalendarTimeChange}
          onRelatedPraticaChange={handleCalendarRelatedPraticaChange}
          onSave={handleSaveCalendarEvent}
          onDelete={handleDeleteCalendarEvent}
          tutteLePratiche={praticheInCorsoPerModal}
          pratichePrivate={pratichePrivate} // Passa pratichePrivate
          calendarList={calendarListForModal}
        />
      )}


      {/* Notifica task automatiche */}
      {showTaskNotification && (
        <TaskNotification
          event={lastTaskEvent}
          onClose={() => setShowTaskNotification(false)}
        />
      )}
    </div>
  );
}

export default PratichePage;
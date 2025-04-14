// src/pages/PratichePage/handlers/index.js
import { handleAddNote, handleDeleteNote, handleUpdateNote } from './noteHandlers';
import { 
  handleToggleTaskItem, 
  handleSetTaskDueDate, 
  handleRemoveTaskDueDate, 
  handleSyncTaskWithCalendar,
  generateAutomaticTasks 
} from './taskHandlers';
import { handlePaymentChange } from './paymentHandlers';
import { handleDateTimeChange, handleDeleteDateTime } from './dateHandlers';

// Handler per toggle checklist item
const handleToggleChecklistItem = (praticaId, stepId, itemId, completed, updatePratica, localPratiche, setLocalPratiche) => {
  const updatedPratiche = localPratiche.map(pratica => {
    if (pratica.id === praticaId) {
      const updatedWorkflow = { ...pratica.workflow };
      if (!updatedWorkflow[stepId]) {
        updatedWorkflow[stepId] = { 
          completed: false, 
          checklist: {}, 
          notes: [] 
        };
      }
      
      if (!updatedWorkflow[stepId].checklist) {
        updatedWorkflow[stepId].checklist = {};
      }
      
      updatedWorkflow[stepId].checklist[itemId] = {
        completed,
        date: completed ? new Date().toISOString() : null
      };
      
      // Salva i dati aggiornati
      updatePratica(praticaId, { workflow: updatedWorkflow });
      
      return {
        ...pratica,
        workflow: updatedWorkflow
      };
    }
    return pratica;
  });
  
  setLocalPratiche(updatedPratiche);
};

// Handler per cambiare lo stato di una pratica
const handleChangeStato = (praticaId, nuovoStato, updatePratica, localPratiche, setLocalPratiche) => {
  try {
    // Aggiorna lo stato nel database
    updatePratica(praticaId, { 
      stato: nuovoStato,
      updatedAt: new Date().toISOString()
    });
    
    // Aggiorna lo stato localmente
    setLocalPratiche(prev => prev.map(pratica => 
      pratica.id === praticaId ? { ...pratica, stato: nuovoStato } : pratica
    ));
  } catch (error) {
    console.error('Errore durante l\'aggiornamento dello stato:', error);
    alert('Si è verificato un errore durante la modifica dello stato. Riprova.');
  }
};

export { 
  // Handlers note
  handleAddNote, 
  handleDeleteNote, 
  handleUpdateNote,
  
  // Handlers task
  handleToggleTaskItem,
  handleSetTaskDueDate,
  handleRemoveTaskDueDate,
  handleSyncTaskWithCalendar,
  generateAutomaticTasks,
  
  // Handlers pagamenti
  handlePaymentChange,
  
  // Handlers date
  handleDateTimeChange,
  handleDeleteDateTime,
  
  // Altri handlers
  handleToggleChecklistItem,
  handleChangeStato
};
// src/pages/PratichePage/handlers/noteHandlers.js
import { format } from 'date-fns';

// Handler per aggiungere una NOTA effettiva
export const handleAddNote = (praticaId, stepId, noteText, type = 'note', updatePratica, localPratiche, setLocalPratiche) => {
  if (!noteText.trim()) {
    return;
  }
  if (type !== 'note') { // Questa funzione ora gestisce solo note
    console.warn("handleAddNote chiamato con type diverso da 'note'. Per le task di calendario, usare il flusso apposito.");
    return;
  }

  const updatedPratiche = localPratiche.map(pratica => {
    if (pratica.id === praticaId) {
      const updatedWorkflow = { ...pratica.workflow };
      if (!updatedWorkflow[stepId]) {
        updatedWorkflow[stepId] = { completed: false, notes: [], tasks: [] }; // Assicura che esista tasks per compatibilità
      }

      if (!updatedWorkflow[stepId].notes) {
        updatedWorkflow[stepId].notes = [];
      }

      updatedWorkflow[stepId].notes.push({
        text: noteText,
        date: new Date().toISOString()
      });

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

// Handler per eliminare una NOTA o una TASK dal workflow
// Se type è 'task', si assume sia una task di calendario e l'eliminazione dell'evento Google è gestita altrove.
// Questa funzione rimuove solo l'elemento dall'array tasks o notes del workflow.
export const handleDeleteNote = (praticaId, stepId, itemIndex, updatePratica, localPratiche, setLocalPratiche, itemType = 'task') => {
  const updatedPratiche = localPratiche.map(pratica => {
    if (pratica.id === praticaId) {
      const updatedWorkflow = { ...pratica.workflow };

      if (itemType === 'task' && updatedWorkflow[stepId]?.tasks) {
        const updatedTasks = [...updatedWorkflow[stepId].tasks];
        updatedTasks.splice(itemIndex, 1);
        updatedWorkflow[stepId].tasks = updatedTasks;
      } else if (itemType === 'note' && updatedWorkflow[stepId]?.notes) {
        const updatedNotes = [...updatedWorkflow[stepId].notes];
        updatedNotes.splice(itemIndex, 1);
        updatedWorkflow[stepId].notes = updatedNotes;
      } else {
        console.warn(`Impossibile eliminare l'elemento: array ${itemType}s non trovato o indice non valido per step ${stepId}`);
        return pratica; // Nessuna modifica se non troviamo l'array o l'indice
      }

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


// Handler per aggiornare una NOTA
// L'aggiornamento del testo di una TASK CALENDARIO dovrebbe avvenire tramite EventModal e updateGoogleEvent.
export const handleUpdateNote = (praticaId, stepId, noteIndex, newText, type = 'note', updatePratica, localPratiche, setLocalPratiche) => {
  if (type !== 'note') {
      console.warn("handleUpdateNote chiamato con type != 'note'. La modifica del testo delle task di calendario avviene tramite EventModal.");
      return;
  }
  const updatedPratiche = localPratiche.map(pratica => {
    if (pratica.id === praticaId) {
      const updatedWorkflow = { ...pratica.workflow };

      if (updatedWorkflow[stepId]?.notes) {
        const updatedNotes = [...updatedWorkflow[stepId].notes];
        if (updatedNotes[noteIndex]) {
            updatedNotes[noteIndex] = {
            ...updatedNotes[noteIndex],
            text: newText,
            date: new Date().toISOString()
            };
            updatedWorkflow[stepId].notes = updatedNotes;
        } else {
            console.warn("Indice nota non valido per l'aggiornamento.");
            return pratica;
        }
      } else {
          console.warn("Array note non trovato per l'aggiornamento.");
          return pratica;
      }

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
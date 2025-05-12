// src/pages/PratichePage/handlers/noteHandlers.js
import { format } from 'date-fns';

// Handler per aggiungere una nota
export const handleAddNote = (praticaId, stepId, noteText, type = 'task', updatePratica, localPratiche, setLocalPratiche) => {
  if (!noteText.trim()) {
    return;
  }
  
  const updatedPratiche = localPratiche.map(pratica => {
    if (pratica.id === praticaId) {
      const updatedWorkflow = { ...pratica.workflow };
      if (!updatedWorkflow[stepId]) {
        updatedWorkflow[stepId] = { completed: false, notes: [], tasks: [] };
      }
      
      // Gestisci differentemente in base al tipo
      if (type === 'task') {
        // Per task, aggiungi come task
        if (!updatedWorkflow[stepId].tasks) {
          updatedWorkflow[stepId].tasks = [];
        }
        
        updatedWorkflow[stepId].tasks.push({
          text: noteText,
          completed: false,
          completedDate: null,
          createdDate: new Date().toISOString() // Aggiungi data di creazione
        });
      } else {
        // Per note, aggiungi come nota
        if (!updatedWorkflow[stepId].notes) {
          updatedWorkflow[stepId].notes = [];
        }
        
        updatedWorkflow[stepId].notes.push({
          text: noteText, 
          date: new Date().toISOString()
        });
      }
      
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

// Handler per eliminare una nota o una task
export const handleDeleteNote = (praticaId, stepId, noteIndex, updatePratica, localPratiche, setLocalPratiche) => {
  const updatedPratiche = localPratiche.map(pratica => {
    if (pratica.id === praticaId) {
      const updatedWorkflow = { ...pratica.workflow };
      
      // Controlla prima se è una task
      if (updatedWorkflow[stepId].tasks && updatedWorkflow[stepId].tasks.length > noteIndex) {
        // Rimuovi la task all'indice specificato
        const updatedTasks = [...updatedWorkflow[stepId].tasks];
        updatedTasks.splice(noteIndex, 1);
        updatedWorkflow[stepId].tasks = updatedTasks;
      } 
      // Altrimenti controlla se è una nota
      else if (updatedWorkflow[stepId].notes && updatedWorkflow[stepId].notes.length > 0) {
        // Rimuovi la nota all'indice specificato
        const updatedNotes = [...updatedWorkflow[stepId].notes];
        updatedNotes.splice(noteIndex, 1);
        updatedWorkflow[stepId].notes = updatedNotes;
      }
      
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

// Handler per aggiornare una nota o task
export const handleUpdateNote = (praticaId, stepId, noteIndex, newText, type = 'task', updatePratica, localPratiche, setLocalPratiche) => {
  const updatedPratiche = localPratiche.map(pratica => {
    if (pratica.id === praticaId) {
      const updatedWorkflow = { ...pratica.workflow };
      
      // Gestisci differentemente in base al tipo 
      if (type === 'task' && updatedWorkflow[stepId].tasks) {
        const updatedTasks = [...updatedWorkflow[stepId].tasks];
        
        // Aggiorna il testo della task mantenendo gli altri campi
        updatedTasks[noteIndex] = {
          ...updatedTasks[noteIndex],
          text: newText,
          updatedAt: new Date().toISOString() // Aggiungi data di aggiornamento
        };
        
        updatedWorkflow[stepId].tasks = updatedTasks;
      } else if (type === 'note' && updatedWorkflow[stepId].notes) {
        // Aggiorna nota normale
        const updatedNotes = [...updatedWorkflow[stepId].notes];
        
        updatedNotes[noteIndex] = {
          ...updatedNotes[noteIndex],
          text: newText,
          date: new Date().toISOString() // Aggiorna la data alla data di modifica
        };
        
        updatedWorkflow[stepId].notes = updatedNotes;
      }
      
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
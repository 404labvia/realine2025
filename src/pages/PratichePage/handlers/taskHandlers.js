import { format } from 'date-fns';
import googleCalendarService from '../../../services/GoogleCalendarService';

// Handler per toggle task item (completamento/incompletamento)
export const handleToggleTaskItem = async (praticaId, stepId, taskIndex, completed, updatePratica, localPratiche, setLocalPratiche) => {
  try {
    const pratica = localPratiche.find(p => p.id === praticaId);
    if (!pratica || !pratica.workflow || !pratica.workflow[stepId] || !pratica.workflow[stepId].tasks) {
      console.error('Pratica o task non trovata');
      return;
    }
    
    const updatedWorkflow = { ...pratica.workflow };
    const updatedTasks = [...updatedWorkflow[stepId].tasks];
    const taskToUpdate = { ...updatedTasks[taskIndex] };
    
    // Aggiorna lo stato della task
    taskToUpdate.completed = completed;
    taskToUpdate.completedDate = completed ? new Date().toISOString() : null;
    
    updatedTasks[taskIndex] = taskToUpdate;
    updatedWorkflow[stepId].tasks = updatedTasks;
    
    // Salva i dati aggiornati
    await updatePratica(pratica.id, { workflow: updatedWorkflow });
    
    // Aggiorna lo stato locale
    setLocalPratiche(prevPratiche => 
      prevPratiche.map(p => 
        p.id === praticaId 
          ? { ...p, workflow: updatedWorkflow }
          : p
      )
    );
  } catch (error) {
    console.error("Errore durante l'aggiornamento della task:", error);
  }
};

// Handler per impostare la scadenza di una task
export const handleSetTaskDueDate = async (praticaId, stepId, taskIndex, dueDateInfo, updatePratica, localPratiche, setLocalPratiche) => {
  try {
    const pratica = localPratiche.find(p => p.id === praticaId);
    if (!pratica || !pratica.workflow || !pratica.workflow[stepId] || !pratica.workflow[stepId].tasks) {
      console.error('Pratica o task non trovata');
      return;
    }
    
    const updatedWorkflow = { ...pratica.workflow };
    const updatedTasks = [...updatedWorkflow[stepId].tasks];
    const taskToUpdate = { ...updatedTasks[taskIndex] };
    
    // Aggiorna la scadenza e altre proprietà della task
    taskToUpdate.dueDate = dueDateInfo.dueDate;
    taskToUpdate.priority = dueDateInfo.priority || 'normal';
    taskToUpdate.reminder = dueDateInfo.reminder || 60;
    
    // Sincronizza automaticamente con Google Calendar
    if (googleCalendarService.isAuthenticated()) {
      try {
        const praticaInfo = `${pratica.codice || ''} ${pratica.indirizzo} - ${pratica.cliente}`;
        const eventId = await googleCalendarService.syncTaskWithCalendar(taskToUpdate, praticaInfo);
        taskToUpdate.googleCalendarEventId = eventId;
      } catch (error) {
        console.error('Errore sincronizzazione con Google Calendar:', error);
        // Continua comunque con l'aggiornamento locale
      }
    }
    
    updatedTasks[taskIndex] = taskToUpdate;
    updatedWorkflow[stepId].tasks = updatedTasks;
    
    // Salva i dati aggiornati
    await updatePratica(pratica.id, { workflow: updatedWorkflow });
    
    // Aggiorna lo stato locale
    setLocalPratiche(prevPratiche => 
      prevPratiche.map(p => 
        p.id === praticaId 
          ? { ...p, workflow: updatedWorkflow }
          : p
      )
    );
  } catch (error) {
    console.error("Errore durante l'impostazione della scadenza:", error);
  }
};

// Handler per rimuovere la scadenza di una task
export const handleRemoveTaskDueDate = async (praticaId, stepId, taskIndex, updatePratica, localPratiche, setLocalPratiche) => {
  try {
    const pratica = localPratiche.find(p => p.id === praticaId);
    if (!pratica || !pratica.workflow || !pratica.workflow[stepId] || !pratica.workflow[stepId].tasks) {
      console.error('Pratica o task non trovata');
      return;
    }
    
    const updatedWorkflow = { ...pratica.workflow };
    const updatedTasks = [...updatedWorkflow[stepId].tasks];
    const taskToUpdate = { ...updatedTasks[taskIndex] };
    
    // Se c'è un evento Google Calendar associato, eliminalo
    if (taskToUpdate.googleCalendarEventId && googleCalendarService.isAuthenticated()) {
      try {
        await googleCalendarService.deleteEvent(taskToUpdate.googleCalendarEventId);
      } catch (error) {
        console.error('Errore eliminazione evento Google Calendar:', error);
        // Continua comunque con l'aggiornamento locale
      }
    }
    
    // Rimuovi le proprietà relative alla scadenza
    delete taskToUpdate.dueDate;
    delete taskToUpdate.priority;
    delete taskToUpdate.reminder;
    delete taskToUpdate.googleCalendarEventId;
    
    updatedTasks[taskIndex] = taskToUpdate;
    updatedWorkflow[stepId].tasks = updatedTasks;
    
    // Salva i dati aggiornati
    await updatePratica(pratica.id, { workflow: updatedWorkflow });
    
    // Aggiorna lo stato locale
    setLocalPratiche(prevPratiche => 
      prevPratiche.map(p => 
        p.id === praticaId 
          ? { ...p, workflow: updatedWorkflow }
          : p
      )
    );
  } catch (error) {
    console.error("Errore durante la rimozione della scadenza:", error);
  }
};

// Handler per sincronizzare una task con Google Calendar
export const handleSyncTaskWithCalendar = async (praticaId, stepId, taskIndex, updatePratica, localPratiche, setLocalPratiche) => {
  try {
    const pratica = localPratiche.find(p => p.id === praticaId);
    if (!pratica || !pratica.workflow || !pratica.workflow[stepId] || !pratica.workflow[stepId].tasks) {
      console.error('Pratica o task non trovata');
      return;
    }
    
    if (!googleCalendarService.isAuthenticated()) {
      throw new Error('Non connesso a Google Calendar');
    }
    
    const updatedWorkflow = { ...pratica.workflow };
    const taskToSync = updatedWorkflow[stepId].tasks[taskIndex];
    
    if (!taskToSync.dueDate) {
      throw new Error('La task deve avere una data di scadenza per essere sincronizzata');
    }
    
    const praticaInfo = `${pratica.codice || ''} ${pratica.indirizzo} - ${pratica.cliente}`;
    const eventId = await googleCalendarService.syncTaskWithCalendar(taskToSync, praticaInfo);
    
    // Aggiorna l'ID dell'evento
    taskToSync.googleCalendarEventId = eventId;
    
    // Salva i dati aggiornati
    await updatePratica(pratica.id, { workflow: updatedWorkflow });
    
    // Aggiorna lo stato locale
    setLocalPratiche(prevPratiche => 
      prevPratiche.map(p => 
        p.id === praticaId 
          ? { ...p, workflow: updatedWorkflow }
          : p
      )
    );
  } catch (error) {
    console.error('Errore durante la sincronizzazione con Google Calendar:', error);
    throw error;
  }
};
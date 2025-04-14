// src/pages/PratichePage/handlers/taskHandlers.js
import { format, addDays } from 'date-fns';
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
    
    // Se la task è completata e ha un evento Google Calendar, aggiorniamo l'evento
    if (completed && taskToUpdate.googleCalendarEventId && googleCalendarService.isAuthenticated()) {
      try {
        // Aggiorna l'evento su Google Calendar (contrassegnandolo come completato)
        await googleCalendarService.updateEvent(taskToUpdate.googleCalendarEventId, {
          colorId: "5", // Verde per task completate
          status: "confirmed",
          summary: `✓ ${taskToUpdate.text}`
        });
      } catch (error) {
        console.error('Errore aggiornamento evento Google Calendar:', error);
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
    
    // Aggiorna la scadenza della task
    taskToUpdate.dueDate = dueDateInfo.dueDate;
    taskToUpdate.priority = dueDateInfo.priority || 'normal';
    taskToUpdate.reminder = dueDateInfo.reminder || 60;
    
    // Se richiesto, sincronizza con Google Calendar
    if (dueDateInfo.addToCalendar && googleCalendarService.isAuthenticated()) {
      try {
        // Crea evento in Google Calendar
        const praticaInfo = `${pratica.codice || ''} ${pratica.indirizzo} - ${pratica.cliente}`;
        const eventId = await googleCalendarService.syncTaskWithCalendar(taskToUpdate, praticaInfo);
        
        // Salva l'ID dell'evento creato
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
        // Elimina l'evento da Google Calendar
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
      throw new Error('Utente non autenticato con Google Calendar');
    }
    
    const updatedWorkflow = { ...pratica.workflow };
    const updatedTasks = [...updatedWorkflow[stepId].tasks];
    const taskToSync = { ...updatedTasks[taskIndex] };
    
    if (!taskToSync.dueDate) {
      throw new Error('La task deve avere una data di scadenza per essere sincronizzata');
    }
    
    // Crea evento in Google Calendar
    const praticaInfo = `${pratica.codice || ''} ${pratica.indirizzo} - ${pratica.cliente}`;
    const eventId = await googleCalendarService.syncTaskWithCalendar(taskToSync, praticaInfo);
    
    // Salva l'ID dell'evento creato
    taskToSync.googleCalendarEventId = eventId;
    updatedTasks[taskIndex] = taskToSync;
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
    
    return eventId;
  } catch (error) {
    console.error('Errore durante la sincronizzazione con Google Calendar:', error);
    throw error;
  }
};

// Utility per generare task automatiche in base a trigger
export const generateAutomaticTasks = async (praticaId, trigger, triggerData, updatePratica, localPratiche, setLocalPratiche) => {
  try {
    const pratica = localPratiche.find(p => p.id === praticaId);
    if (!pratica || !pratica.workflow) {
      console.error('Pratica non trovata');
      return;
    }
    
    const updatedWorkflow = { ...pratica.workflow };
    
    // Assicurati che esista l'array delle task
    if (!updatedWorkflow.inizioPratica) {
      updatedWorkflow.inizioPratica = { tasks: [] };
    }
    
    if (!updatedWorkflow.inizioPratica.tasks) {
      updatedWorkflow.inizioPratica.tasks = [];
    }
    
    const now = new Date();
    let tasksToAdd = [];
    
    // In base al trigger, genera task diverse
    switch (trigger) {
      case 'incarico': {
        const incaricoDueDate = new Date(triggerData.dataOraInvio);
        const followUpDate = addDays(incaricoDueDate, 7);
        tasksToAdd.push({
          text: `Follow-up dopo incarico per ${pratica.cliente}`,
          completed: false,
          createdDate: now.toISOString(),
          dueDate: followUpDate.toISOString(),
          priority: 'high',
          reminder: 1440,
          autoCreated: true,
          triggerSource: 'incarico'
        });
        if (pratica.agenzia && pratica.agenzia !== 'PRIVATO') {
          const reportDate = addDays(incaricoDueDate, 14);
          tasksToAdd.push({
            text: `Inviare report avanzamento pratica a ${pratica.agenzia}`,
            completed: false,
            createdDate: now.toISOString(),
            dueDate: reportDate.toISOString(),
            priority: 'normal',
            reminder: 1440,
            autoCreated: true,
            triggerSource: 'incarico'
          });
        }
        break;
      }
      case 'accessoAtti': {
        const verifyDate = addDays(new Date(), 7);
        tasksToAdd.push({
          text: `Verifica stato richiesta accesso atti per ${pratica.indirizzo}`,
          completed: false,
          createdDate: now.toISOString(),
          dueDate: verifyDate.toISOString(),
          priority: 'normal',
          reminder: 1440,
          autoCreated: true,
          triggerSource: 'accessoAtti'
        });
        break;
      }
      case 'pagamento': {
        const checkDate = addDays(new Date(), 3);
        tasksToAdd.push({
          text: `Verificare avvenuto pagamento di ${triggerData.importoCommittente}€ da ${pratica.cliente}`,
          completed: false,
          createdDate: now.toISOString(),
          dueDate: checkDate.toISOString(),
          priority: 'normal',
          reminder: 1440,
          autoCreated: true,
          triggerSource: 'pagamento'
        });
        if (pratica.collaboratore && triggerData.importoCollaboratore > 0) {
          const payDate = addDays(new Date(), 7);
          tasksToAdd.push({
            text: `Pagare ${triggerData.importoCollaboratore}€ a ${pratica.collaboratore}`,
            completed: false,
            createdDate: now.toISOString(),
            dueDate: payDate.toISOString(),
            priority: 'high',
            reminder: 1440,
            autoCreated: true,
            triggerSource: 'pagamento'
          });
        }
        break;
      }
      case 'deadline': {
        if (pratica.dataFine) {
          const dataFine = new Date(pratica.dataFine);
          const giorni30Prima = addDays(dataFine, -30);
          const giorni15Prima = addDays(dataFine, -15);
          const giorni7Prima = addDays(dataFine, -7);
          const oggi = new Date();
          if (giorni30Prima > oggi) {
            tasksToAdd.push({
              text: `Preparare documentazione finale per ${pratica.indirizzo} (30gg alla scadenza)`,
              completed: false,
              createdDate: now.toISOString(),
              dueDate: giorni30Prima.toISOString(),
              priority: 'normal',
              reminder: 1440,
              autoCreated: true,
              triggerSource: 'deadline'
            });
          }
          if (giorni15Prima > oggi) {
            tasksToAdd.push({
              text: `Verifica avanzamento pratica ${pratica.indirizzo} (15gg alla scadenza)`,
              completed: false,
              createdDate: now.toISOString(),
              dueDate: giorni15Prima.toISOString(),
              priority: 'high',
              reminder: 1440,
              autoCreated: true,
              triggerSource: 'deadline'
            });
          }
          if (giorni7Prima > oggi) {
            tasksToAdd.push({
              text: `URGENTE: Completare pratica ${pratica.indirizzo} (7gg alla scadenza)`,
              completed: false,
              createdDate: now.toISOString(),
              dueDate: giorni7Prima.toISOString(),
              priority: 'high',
              reminder: 1440,
              autoCreated: true,
              triggerSource: 'deadline'
            });
          }
        }
        break;
      }
      default:
        return;
    }
    if (tasksToAdd.length === 0) {
      return;
    }
    updatedWorkflow.inizioPratica.tasks = [...updatedWorkflow.inizioPratica.tasks, ...tasksToAdd];
    if (googleCalendarService.isAuthenticated()) {
      try {
        const praticaInfo = `${pratica.codice || ''} ${pratica.indirizzo} - ${pratica.cliente}`;
        for (let i = 0; i < tasksToAdd.length; i++) {
          const taskIndex = updatedWorkflow.inizioPratica.tasks.length - tasksToAdd.length + i;
          const task = updatedWorkflow.inizioPratica.tasks[taskIndex];
          const eventId = await googleCalendarService.syncTaskWithCalendar(task, praticaInfo);
          updatedWorkflow.inizioPratica.tasks[taskIndex].googleCalendarEventId = eventId;
        }
      } catch (error) {
        console.error('Errore sincronizzazione task automatiche con Google Calendar:', error);
      }
    }
    await updatePratica(pratica.id, { workflow: updatedWorkflow });
    setLocalPratiche(prevPratiche => 
      prevPratiche.map(p => 
        p.id === praticaId 
          ? { ...p, workflow: updatedWorkflow }
          : p
      )
    );
    return tasksToAdd.length;
  } catch (error) {
    console.error('Errore durante la generazione di task automatiche:', error);
    return 0;
  }
};

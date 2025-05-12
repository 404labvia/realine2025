import { format } from 'date-fns';

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

// Funzione dummy per mantenere la compatibilità con codice esistente
export const handleSyncTaskWithCalendar = async (praticaId, stepId, taskIndex, updatePratica, localPratiche, setLocalPratiche) => {
  console.log('La funzionalità di sincronizzazione con Google Calendar è stata rimossa');
  return null;
};
// src/services/todoStateService.js

const TODO_COMPLETED_STATE_KEY = 'todoListCompletedState';

/**
 * Recupera lo stato di completamento di tutti gli eventi dal localStorage.
 * @returns {Record<string, boolean>} Un oggetto dove le chiavi sono eventId e i valori sono booleani (true se completato).
 */
export const getAllCompletedStates = () => {
  try {
    const storedState = localStorage.getItem(TODO_COMPLETED_STATE_KEY);
    return storedState ? JSON.parse(storedState) : {};
  } catch (error) {
    console.error("Errore nel leggere lo stato di completamento dal localStorage:", error);
    return {};
  }
};

/**
 * Recupera lo stato di completamento di un singolo evento.
 * @param {string} eventId - L'ID dell'evento Google Calendar.
 * @returns {boolean} True se l'evento è segnato come completato, altrimenti false.
 */
export const getCompletedState = (eventId) => {
  if (!eventId) return false;
  const allStates = getAllCompletedStates();
  return !!allStates[eventId]; // Restituisce true/false
};

/**
 * Imposta lo stato di completamento per un singolo evento e lo salva nel localStorage.
 * @param {string} eventId - L'ID dell'evento Google Calendar.
 * @param {boolean} isCompleted - Il nuovo stato di completamento.
 */
export const setCompletedState = (eventId, isCompleted) => {
  if (!eventId) return;
  try {
    const allStates = getAllCompletedStates();
    if (isCompleted) {
      allStates[eventId] = true;
    } else {
      delete allStates[eventId]; // Rimuovi la chiave se non è completato per risparmiare spazio
    }
    localStorage.setItem(TODO_COMPLETED_STATE_KEY, JSON.stringify(allStates));
  } catch (error) {
    console.error("Errore nel salvare lo stato di completamento nel localStorage:", error);
  }
};
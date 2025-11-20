// src/services/taskStateFirebaseService.js
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

// UID hardcoded per tutte le operazioni Firebase
const FIREBASE_USER_ID = 'fSjGJAhUlsQwcCGJAzSWgp4Tpxi1';

// Keys per localStorage
const TASK_STATES_KEY = 'taskStates_local';
const PENDING_SYNC_KEY = 'taskStates_pendingSync';

// ============================================
// FUNZIONI LOCALSTORAGE (Fallback Offline)
// ============================================

/**
 * Salva lo stato di una task in localStorage
 */
const saveToLocalStorage = (eventId, state) => {
  try {
    const allStates = JSON.parse(localStorage.getItem(TASK_STATES_KEY) || '{}');
    allStates[eventId] = {
      ...state,
      lastModified: Date.now(),
    };
    localStorage.setItem(TASK_STATES_KEY, JSON.stringify(allStates));
  } catch (error) {
    console.error('Errore salvataggio localStorage:', error);
  }
};

/**
 * Legge lo stato di una task da localStorage
 */
const getFromLocalStorage = (eventId) => {
  try {
    const allStates = JSON.parse(localStorage.getItem(TASK_STATES_KEY) || '{}');
    return allStates[eventId] || { isCompleted: false, lastModified: 0 };
  } catch (error) {
    console.error('Errore lettura localStorage:', error);
    return { isCompleted: false, lastModified: 0 };
  }
};

/**
 * Legge tutti gli stati da localStorage
 */
const getAllFromLocalStorage = () => {
  try {
    return JSON.parse(localStorage.getItem(TASK_STATES_KEY) || '{}');
  } catch (error) {
    console.error('Errore lettura tutti gli stati da localStorage:', error);
    return {};
  }
};

// ============================================
// CODA DI SINCRONIZZAZIONE
// ============================================

/**
 * Aggiunge una modifica alla coda di sincronizzazione
 */
const addToPendingSync = (eventId, state) => {
  try {
    const queue = JSON.parse(localStorage.getItem(PENDING_SYNC_KEY) || '{}');
    queue[eventId] = {
      ...state,
      pendingSince: Date.now(),
    };
    localStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(queue));
  } catch (error) {
    console.error('Errore aggiunta a coda sync:', error);
  }
};

/**
 * Rimuove una modifica dalla coda di sincronizzazione
 */
const removeFromPendingSync = (eventId) => {
  try {
    const queue = JSON.parse(localStorage.getItem(PENDING_SYNC_KEY) || '{}');
    delete queue[eventId];
    localStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(queue));
  } catch (error) {
    console.error('Errore rimozione da coda sync:', error);
  }
};

/**
 * Legge la coda di sincronizzazione
 */
const getPendingQueue = () => {
  try {
    return JSON.parse(localStorage.getItem(PENDING_SYNC_KEY) || '{}');
  } catch (error) {
    console.error('Errore lettura coda sync:', error);
    return {};
  }
};

// ============================================
// FUNZIONI FIREBASE (Cloud Storage)
// ============================================

/**
 * Salva lo stato di una task su Firestore
 */
const saveToFirebase = async (userId, eventId, state) => {
  if (!userId) throw new Error('userId è richiesto');

  const docRef = doc(db, 'taskStates', userId);
  const timestamp = Date.now();

  await setDoc(docRef, {
    userId,
    tasks: {
      [eventId]: {
        isCompleted: state.isCompleted,
        completedAt: state.isCompleted ? new Date().toISOString() : null,
        completedBy: userId,
        lastModified: timestamp,
      }
    },
    lastSync: new Date().toISOString(),
  }, { merge: true });

  return timestamp;
};

/**
 * Legge lo stato di una task da Firestore
 */
const getFromFirebase = async (userId, eventId) => {
  if (!userId) throw new Error('userId è richiesto');

  const docRef = doc(db, 'taskStates', userId);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const data = docSnap.data();
    return data.tasks?.[eventId] || { isCompleted: false, lastModified: 0 };
  }

  return { isCompleted: false, lastModified: 0 };
};

/**
 * Legge tutti gli stati delle task da Firestore
 */
const getAllFromFirebase = async (userId) => {
  if (!userId) throw new Error('userId è richiesto');

  const docRef = doc(db, 'taskStates', userId);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return docSnap.data().tasks || {};
  }

  return {};
};

// ============================================
// API PUBBLICA CON FALLBACK
// ============================================

/**
 * Legge lo stato di una task (con fallback automatico)
 * Prova prima Firebase, se fallisce usa localStorage
 * Nota: userId non è più necessario, usa FIREBASE_USER_ID hardcoded
 */
export const getTaskState = async (eventId) => {
  try {
    // TENTATIVO 1: Firebase (cloud) con UID hardcoded
    const firebaseState = await getFromFirebase(FIREBASE_USER_ID, eventId);

    // Aggiorna cache locale
    saveToLocalStorage(eventId, firebaseState);

    return firebaseState;

  } catch (error) {
    // FALLBACK: localStorage (offline)
    console.warn('Firebase non disponibile, uso cache locale:', error.message);
    return getFromLocalStorage(eventId);
  }
};

/**
 * Salva lo stato di una task (con fallback automatico)
 * Salva sempre su localStorage, poi prova Firebase
 * Nota: userId non è più necessario, usa FIREBASE_USER_ID hardcoded
 */
export const setTaskState = async (eventId, isCompleted) => {
  const state = { isCompleted, lastModified: Date.now() };

  // SEMPRE: Salva subito in localStorage (feedback istantaneo)
  saveToLocalStorage(eventId, state);

  try {
    // POI: Prova a salvare su Firebase con UID hardcoded
    const timestamp = await saveToFirebase(FIREBASE_USER_ID, eventId, state);

    // Successo: rimuovi dalla coda di sync se presente
    removeFromPendingSync(eventId);

    return { success: true, timestamp };

  } catch (error) {
    // FALLBACK: Aggiungi alla coda di sincronizzazione
    console.warn('Firebase non disponibile, aggiunto a coda sync:', error.message);
    addToPendingSync(eventId, state);

    return { success: false, queued: true, error: error.message };
  }
};

/**
 * Sincronizza tutte le modifiche in sospeso con Firebase
 * Chiamata automaticamente quando si torna online
 * Nota: usa FIREBASE_USER_ID hardcoded
 */
export const syncPendingChanges = async () => {
  const queue = getPendingQueue();
  const eventIds = Object.keys(queue);

  if (eventIds.length === 0) {
    return { synced: 0, failed: 0 };
  }

  console.log(`🔄 Sincronizzazione di ${eventIds.length} task in coda...`);

  let synced = 0;
  let failed = 0;

  for (const eventId of eventIds) {
    const localState = queue[eventId];

    try {
      // Leggi stato remoto con UID hardcoded
      const remoteState = await getFromFirebase(FIREBASE_USER_ID, eventId);

      // Risoluzione conflitto: vince il più recente
      if (remoteState.lastModified > localState.lastModified) {
        // Remoto più recente: sovrascrivi locale
        console.log(`⚠️ Conflitto ${eventId}: remoto più recente`);
        saveToLocalStorage(eventId, remoteState);
      } else {
        // Locale più recente: carica su Firebase
        await saveToFirebase(FIREBASE_USER_ID, eventId, localState);
        console.log(`✓ Sincronizzato ${eventId}`);
      }

      // Rimuovi dalla coda
      removeFromPendingSync(eventId);
      synced++;

    } catch (error) {
      console.error(`❌ Errore sync ${eventId}:`, error.message);
      failed++;
    }
  }

  console.log(`✓ Sync completata: ${synced} successi, ${failed} fallimenti`);
  return { synced, failed };
};

/**
 * Sincronizza tutti gli stati da Firebase al localStorage
 * Utile per il primo caricamento o refresh completo
 * Nota: usa FIREBASE_USER_ID hardcoded
 */
export const syncAllFromFirebase = async () => {
  try {
    console.log('📥 Sincronizzazione completa da Firebase...');
    const remoteStates = await getAllFromFirebase(FIREBASE_USER_ID);

    // Sovrascrivi localStorage con dati remoti
    localStorage.setItem(TASK_STATES_KEY, JSON.stringify(remoteStates));

    console.log(`✓ Sincronizzati ${Object.keys(remoteStates).length} stati da Firebase`);

    return remoteStates;
  } catch (error) {
    console.error('Errore sincronizzazione completa:', error);
    throw error;
  }
};

/**
 * Ottiene il contatore di modifiche in coda
 */
export const getPendingCount = () => {
  return Object.keys(getPendingQueue()).length;
};

/**
 * Setup listener per sincronizzazione automatica quando si torna online
 * Nota: usa FIREBASE_USER_ID hardcoded
 */
export const setupAutoSync = () => {
  // Listener per evento online
  const handleOnline = async () => {
    console.log('📡 Connessione ripristinata, avvio sincronizzazione...');
    const result = await syncPendingChanges();

    if (result.synced > 0) {
      console.log(`✓ Sincronizzate ${result.synced} modifiche`);
    }
  };

  window.addEventListener('online', handleOnline);

  // Ritorna funzione per cleanup
  return () => {
    window.removeEventListener('online', handleOnline);
  };
};

// ============================================
// RETROCOMPATIBILITÀ CON SERVIZIO VECCHIO
// ============================================

/**
 * Migra dati dal vecchio todoStateService al nuovo sistema
 * Nota: usa FIREBASE_USER_ID hardcoded
 */
export const migrateFromOldService = async () => {
  try {
    const oldData = localStorage.getItem('todoListCompletedState');
    if (!oldData) return;

    const oldStates = JSON.parse(oldData);
    console.log('🔄 Migrazione dati vecchio servizio...');

    const timestamp = Date.now();

    // Converti al nuovo formato
    for (const [eventId, isCompleted] of Object.entries(oldStates)) {
      if (isCompleted) {
        const state = { isCompleted: true, lastModified: timestamp };
        saveToLocalStorage(eventId, state);

        // Prova a salvare su Firebase con UID hardcoded
        try {
          await saveToFirebase(FIREBASE_USER_ID, eventId, state);
        } catch (error) {
          // Ignora errori, verrà sincronizzato dopo
          addToPendingSync(eventId, state);
        }
      }
    }

    console.log(`✓ Migrati ${Object.keys(oldStates).length} stati`);

    // Rimuovi vecchi dati
    localStorage.removeItem('todoListCompletedState');

  } catch (error) {
    console.error('Errore migrazione:', error);
  }
};

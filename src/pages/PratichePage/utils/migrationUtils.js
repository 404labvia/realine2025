// src/pages/PratichePage/utils/migrationUtils.js
import { format } from 'date-fns';
import { workflowSteps } from './praticheUtils';

// Utility per migrare e preparare dati
export const migratePraticaData = (pratica) => {
  // Copia l'oggetto pratica
  let updatedPratica = {...pratica};

  // Migra i campi degli importi se necessario
  if (pratica.importoTotale && !pratica.importoBaseCommittente) {
    // Calcolare l'importo base dal totale (assumendo che includa cassa e IVA)
    // Inversione della formula: importoBase = importoTotale / (1 + 0.05 + 0.22*1.05)
    const divisor = 1.271; // 1 + 0.05 + (0.22 * 1.05)
    const importoBase = Math.round((pratica.importoTotale / divisor) * 100) / 100;
    
    updatedPratica = {
      ...updatedPratica,
      importoBaseCommittente: importoBase,
      applyCassaCommittente: false, // Modificato: ora il valore di default è false
      applyIVACommittente: true,
      // Manteniamo importoTotale per compatibilità
    };
  }

  // Migra importo collaboratore se necessario
  if (pratica.importoCollaboratore && !pratica.importoBaseCollaboratore) {
    // Calcolare l'importo base dal totale (assumendo che includa cassa)
    // Inversione della formula: importoBase = importoCollaboratore / 1.05
    const importoBase = Math.round((pratica.importoCollaboratore / 1.05) * 100) / 100;
    
    updatedPratica = {
      ...updatedPratica,
      importoBaseCollaboratore: importoBase,
      applyCassaCollaboratore: false, // Modificato: ora il valore di default è false
      // Manteniamo importoCollaboratore per compatibilità
    };
  }

  // Inizializza la struttura workflow se non esiste
  if (!updatedPratica.workflow) {
    const workflow = {};
    
    // Mappa i dati esistenti nei passi corrispondenti del workflow
    workflowSteps.forEach(step => {
      if (step.id === 'intestazione') return;
      
      // Inizializza ogni step con valori di default
      workflow[step.id] = {
        completed: false,
        completedDate: null,
        notes: []
      };
      
      // Aggiungi proprietà specifiche per alcuni tipi di step
      if (step.type === 'checklist') {
        workflow[step.id].checklist = {};
        if (step.checklistItems) {
          step.checklistItems.forEach(item => {
            const itemId = item.toLowerCase().replace(/\s+/g, '');
            workflow[step.id].checklist[itemId] = { completed: false, date: null };
          });
        }
      }
      
      // Inizializza le task per il tipo task (Inizio Pratica)
      if (step.type === 'task') {
        workflow[step.id].tasks = [];
      }
      
      if (step.type === 'payment') {
        workflow[step.id].importoBaseCommittente = 0;
        workflow[step.id].applyCassaCommittente = false; // Modificato: ora il valore di default è false
        workflow[step.id].applyIVACommittente = true;
        workflow[step.id].importoCommittente = 0;
        
        workflow[step.id].importoBaseCollaboratore = 0;
        workflow[step.id].applyCassaCollaboratore = false; // Modificato: ora il valore di default è false
        workflow[step.id].importoCollaboratore = 0;
      }
      
      if (step.type === 'date') {
        workflow[step.id].dataInvio = null;
        workflow[step.id].oraInvio = null;
      }
      
      // Migrazione dati esistenti dagli steps al nuovo formato workflow
      if (pratica.steps && pratica.steps[step.id]) {
        workflow[step.id].completed = pratica.steps[step.id].completed || false;
        workflow[step.id].completedDate = pratica.steps[step.id].completedDate || null;
        
        if (pratica.steps[step.id].note) {
          if (step.type === 'task') {
            // Per i task, converte le note in task
            if (!workflow[step.id].tasks) {
              workflow[step.id].tasks = [];
            }
            
            workflow[step.id].tasks.push({
              text: pratica.steps[step.id].note,
              completed: false,
              completedDate: null,
              createdDate: new Date().toISOString() // Aggiungi data di creazione
            });
          } else {
            // Per altri tipi, mantieni le note come note
            if (!workflow[step.id].notes) {
              workflow[step.id].notes = [];
            }
            
            workflow[step.id].notes.push({
              text: pratica.steps[step.id].note,
              date: pratica.steps[step.id].completedDate || pratica.dataInizio
            });
          }
        }
        
        // Migrazione dati pagamenti
        if (step.type === 'payment' && pratica.steps[step.id].importo) {
          // Calcola l'importo base dal totale (assumendo che includa cassa e IVA)
          const divisor = 1.271; // 1 + 0.05 + (0.22 * 1.05)
          const importoBase = Math.round((pratica.steps[step.id].importo / divisor) * 100) / 100;
          
          workflow[step.id].importoBaseCommittente = importoBase;
          workflow[step.id].applyCassaCommittente = false; // Modificato: ora il valore di default è false
          workflow[step.id].applyIVACommittente = true;
          workflow[step.id].importoCommittente = pratica.steps[step.id].importo;
        }
      }
    });
    
    updatedPratica.workflow = workflow;
  } else {
    // Se il workflow esiste ma non ha la struttura tasks per Inizio Pratica
    if (updatedPratica.workflow.inizioPratica && !updatedPratica.workflow.inizioPratica.tasks) {
      updatedPratica.workflow.inizioPratica.tasks = [];
      
      // Migra le note esistenti in task
      if (updatedPratica.workflow.inizioPratica.notes && updatedPratica.workflow.inizioPratica.notes.length > 0) {
        updatedPratica.workflow.inizioPratica.notes.forEach(note => {
          updatedPratica.workflow.inizioPratica.tasks.push({
            text: note.text,
            completed: false,
            completedDate: null
          });
        });
      }
    }
  }
  
  return updatedPratica;
};
// src/pages/PratichePrivatoPage/utils/migrationUtils.js
// MODIFICATO: Importa da pratichePrivatoUtils.js
import { workflowSteps } from './pratichePrivatoUtils';

export const migratePraticaData = (pratica) => {
  let updatedPratica = {...pratica};

  if (pratica.importoTotale && !pratica.importoBaseCommittente) {
    const divisor = 1.271;
    const importoBase = Math.round((pratica.importoTotale / divisor) * 100) / 100;
    updatedPratica = {
      ...updatedPratica,
      importoBaseCommittente: importoBase,
      applyCassaCommittente: false,
      applyIVACommittente: true,
    };
  }

  if (pratica.importoCollaboratore && !pratica.importoBaseCollaboratore) {
    const importoBase = Math.round((pratica.importoCollaboratore / 1.05) * 100) / 100;
    updatedPratica = {
      ...updatedPratica,
      importoBaseCollaboratore: importoBase,
      applyCassaCollaboratore: false,
    };
  }

  if (!updatedPratica.workflow) {
    const workflow = {};
    workflowSteps.forEach(step => {
      if (step.id === 'intestazione') return;
      workflow[step.id] = { completed: false, completedDate: null, notes: [] };
      if (step.type === 'checklist') {
        workflow[step.id].checklist = {};
        if (step.checklistItems) {
          step.checklistItems.forEach(item => {
            const itemId = item.toLowerCase().replace(/\s+/g, '');
            workflow[step.id].checklist[itemId] = { completed: false, date: null };
          });
        }
      }
      if (step.type === 'task') workflow[step.id].tasks = [];
      if (step.type === 'payment') {
        workflow[step.id].importoBaseCommittente = 0;
        workflow[step.id].applyCassaCommittente = false;
        workflow[step.id].applyIVACommittente = true;
        workflow[step.id].importoCommittente = 0;
        workflow[step.id].importoBaseCollaboratore = 0;
        workflow[step.id].applyCassaCollaboratore = false;
        workflow[step.id].importoCollaboratore = 0;
      }
      if (step.type === 'date') {
        workflow[step.id].dataInvio = null;
        workflow[step.id].oraInvio = null;
      }
      if (pratica.steps && pratica.steps[step.id]) {
        workflow[step.id].completed = pratica.steps[step.id].completed || false;
        workflow[step.id].completedDate = pratica.steps[step.id].completedDate || null;
        if (pratica.steps[step.id].note) {
          if (step.type === 'task') {
            if (!workflow[step.id].tasks) workflow[step.id].tasks = [];
            workflow[step.id].tasks.push({
              text: pratica.steps[step.id].note,
              completed: false,
              completedDate: null,
              createdDate: new Date().toISOString()
            });
          } else {
            if (!workflow[step.id].notes) workflow[step.id].notes = [];
            workflow[step.id].notes.push({
              text: pratica.steps[step.id].note,
              date: pratica.steps[step.id].completedDate || pratica.dataInizio
            });
          }
        }
        if (step.type === 'payment' && pratica.steps[step.id].importo) {
          const divisor = 1.271;
          const importoBase = Math.round((pratica.steps[step.id].importo / divisor) * 100) / 100;
          workflow[step.id].importoBaseCommittente = importoBase;
          workflow[step.id].applyCassaCommittente = false;
          workflow[step.id].applyIVACommittente = true;
          workflow[step.id].importoCommittente = pratica.steps[step.id].importo;
        }
      }
    });
    updatedPratica.workflow = workflow;
  } else {
    if (updatedPratica.workflow.inizioPratica && !updatedPratica.workflow.inizioPratica.tasks) {
      updatedPratica.workflow.inizioPratica.tasks = [];
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
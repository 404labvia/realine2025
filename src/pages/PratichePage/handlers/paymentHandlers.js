// src/pages/PratichePage/handlers/paymentHandlers.js

// Handler per gestire gli importi dei pagamenti
export const handlePaymentChange = (praticaId, stepId, field, value, updatePratica, localPratiche, setLocalPratiche) => {
  const updatedPratiche = localPratiche.map(pratica => {
    if (pratica.id === praticaId) {
      const updatedWorkflow = { ...pratica.workflow };
      if (!updatedWorkflow[stepId]) {
        updatedWorkflow[stepId] = {
          completed: false,
          importoBaseCommittente: 0,
          applyCassaCommittente: true,
          applyIVACommittente: true,
          importoCommittente: 0,
          
          importoBaseCollaboratore: 0,
          applyCassaCollaboratore: true,
          importoCollaboratore: 0,
          
          notes: []
        };
      }
      
      // Aggiorna il valore specifico
      if (field.includes('importoBase')) {
        updatedWorkflow[stepId][field] = parseFloat(value) || 0;
      } else if (field.includes('applyCassa') || field.includes('applyIVA')) {
        updatedWorkflow[stepId][field] = value; // value è un boolean
      } else if (field.includes('importoCommittente') || field.includes('importoCollaboratore')) {
        // Questi campi vengono aggiornati direttamente quando si usa l'approccio lordo
        updatedWorkflow[stepId][field] = parseFloat(value) || 0;
      }
      
      // Ricalcola gli importi totali (solo se non sono stati passati direttamente)
      // Per committente
      if (field.includes('Committente') && !field.includes('importoCommittente')) {
        const importoBase = updatedWorkflow[stepId].importoBaseCommittente || 0;
        const applyCassa = updatedWorkflow[stepId].applyCassaCommittente !== false;
        const applyIVA = updatedWorkflow[stepId].applyIVACommittente !== false;
        
        let totale = importoBase;
        if (applyCassa) {
          totale += totale * 0.05; // +5% cassa
        }
        if (applyIVA) {
          totale += totale * 0.22; // +22% IVA
        }
        
        updatedWorkflow[stepId].importoCommittente = totale;
      }
      
      // Per collaboratore
      if (field.includes('Collaboratore') && !field.includes('importoCollaboratore')) {
        const importoBase = updatedWorkflow[stepId].importoBaseCollaboratore || 0;
        const applyCassa = updatedWorkflow[stepId].applyCassaCollaboratore !== false;
        
        let totale = importoBase;
        if (applyCassa) {
          totale += totale * 0.05; // +5% cassa
        }
        
        updatedWorkflow[stepId].importoCollaboratore = totale;
      }
      
      updatedWorkflow[stepId][`${field}Date`] = new Date().toISOString(); // Aggiungi data dell'immissione
      
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
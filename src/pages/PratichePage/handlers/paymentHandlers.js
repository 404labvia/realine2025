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
          applyCassaCommittente: false, 
          applyIVACommittente: true, // Di default solo IVA selezionata
          importoCommittente: 0,
          pagamentoCommittenteDate: null,
          
          importoBaseCollaboratore: 0,
          applyCassaCollaboratore: false,
          importoCollaboratore: 0,
          pagamentoCollaboratoreDate: null,

          importoBaseFirmatario: 0,
          applyCassaFirmatario: false,
          importoFirmatario: 0,
          pagamentoFirmatarioDate: null,
          
          notes: []
        };
      }
      
      // Aggiorna il valore specifico
      if (field.includes('importoBase')) {
        updatedWorkflow[stepId][field] = parseFloat(value) || 0;
        
        // Aggiorna automaticamente la data di pagamento quando si modifica l'importo base
        if (field.includes('Committente')) {
          updatedWorkflow[stepId]['pagamentoCommittenteDate'] = new Date().toISOString();
        } else if (field.includes('Collaboratore')) {
          updatedWorkflow[stepId]['pagamentoCollaboratoreDate'] = new Date().toISOString();
        } else if (field.includes('Firmatario')) {
          updatedWorkflow[stepId]['pagamentoFirmatarioDate'] = new Date().toISOString();
        }
      } else if (field.includes('applyCassa') || field.includes('applyIVA')) {
        updatedWorkflow[stepId][field] = value; // value è un boolean
      } else if (field.includes('importoCommittente') || field.includes('importoCollaboratore') || field.includes('importoFirmatario')) {
        // Questi campi vengono aggiornati direttamente quando si usa l'approccio lordo
        updatedWorkflow[stepId][field] = parseFloat(value) || 0;
        
        // Aggiorna automaticamente la data di pagamento quando si modifica l'importo lordo
        if (field.includes('Committente')) {
          updatedWorkflow[stepId]['pagamentoCommittenteDate'] = new Date().toISOString();
        } else if (field.includes('Collaboratore')) {
          updatedWorkflow[stepId]['pagamentoCollaboratoreDate'] = new Date().toISOString();
        } else if (field.includes('Firmatario')) {
          updatedWorkflow[stepId]['pagamentoFirmatarioDate'] = new Date().toISOString();
        }
      }
      
      // Ricalcola gli importi totali (solo se non sono stati passati direttamente)
      // Per committente
      if (field.includes('Committente') && !field.includes('importoCommittente') && !field.includes('pagamento')) {
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
      if (field.includes('Collaboratore') && !field.includes('importoCollaboratore') && !field.includes('pagamento')) {
        const importoBase = updatedWorkflow[stepId].importoBaseCollaboratore || 0;
        const applyCassa = updatedWorkflow[stepId].applyCassaCollaboratore !== false;
        
        let totale = importoBase;
        if (applyCassa) {
          totale += totale * 0.05; // +5% cassa
        }
        
        updatedWorkflow[stepId].importoCollaboratore = totale;
      }

      // Per firmatario
      if (field.includes('Firmatario') && !field.includes('importoFirmatario') && !field.includes('pagamento')) {
        const importoBase = updatedWorkflow[stepId].importoBaseFirmatario || 0;
        const applyCassa = updatedWorkflow[stepId].applyCassaFirmatario !== false;
        
        let totale = importoBase;
        if (applyCassa) {
          totale += totale * 0.05; // +5% cassa
        }
        
        updatedWorkflow[stepId].importoFirmatario = totale;
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
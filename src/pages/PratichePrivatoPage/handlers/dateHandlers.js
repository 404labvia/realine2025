// src/pages/PratichePage/handlers/dateHandlers.js

// Handler per date/time change
export const handleDateTimeChange = (praticaId, stepId, field, value, updatePratica, localPratiche, setLocalPratiche) => {
  const updatedPratiche = localPratiche.map(pratica => {
    if (pratica.id === praticaId) {
      const updatedWorkflow = { ...pratica.workflow };
      if (!updatedWorkflow[stepId]) {
        updatedWorkflow[stepId] = { 
          completed: false, 
          dataInvio: null, 
          oraInvio: null,
          notes: [] 
        };
      }
      
      updatedWorkflow[stepId][field] = value;
      
      // Se abbiamo sia data che ora, combiniamo in un timestamp ISO
      if (updatedWorkflow[stepId].dataInvio && updatedWorkflow[stepId].oraInvio) {
        const [anno, mese, giorno] = updatedWorkflow[stepId].dataInvio.split('-');
        const [ore, minuti] = updatedWorkflow[stepId].oraInvio.split(':');
        
        updatedWorkflow[stepId].dataOraInvio = new Date(
          parseInt(anno),
          parseInt(mese) - 1,
          parseInt(giorno),
          parseInt(ore),
          parseInt(minuti)
        ).toISOString();
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

// Handler per eliminare la data/ora
export const handleDeleteDateTime = (praticaId, stepId, updatePratica, localPratiche, setLocalPratiche) => {
  const updatedPratiche = localPratiche.map(pratica => {
    if (pratica.id === praticaId) {
      const updatedWorkflow = { ...pratica.workflow };
      if (updatedWorkflow[stepId]) {
        updatedWorkflow[stepId].dataInvio = null;
        updatedWorkflow[stepId].oraInvio = null;
        updatedWorkflow[stepId].dataOraInvio = null;
        
        // Salva i dati aggiornati
        updatePratica(praticaId, { workflow: updatedWorkflow });
      }
      
      return {
        ...pratica,
        workflow: updatedWorkflow
      };
    }
    return pratica;
  });
  
  setLocalPratiche(updatedPratiche);
};
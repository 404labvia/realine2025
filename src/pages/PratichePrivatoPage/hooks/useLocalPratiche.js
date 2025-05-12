// src/pages/PratichePage/hooks/useLocalPratiche.js
import { useState, useEffect } from 'react';
import { migratePraticaData } from '../utils/migrationUtils';

/**
 * Custom hook per gestire lo stato locale delle pratiche
 * 
 * @param {Array} pratiche - Array delle pratiche dal context
 * @param {boolean} loading - Stato di caricamento delle pratiche
 * @param {string} filtroAgenzia - Filtro per agenzia
 * @param {string} filtroStato - Filtro per stato
 * @returns {object} Oggetto contenente le pratiche locali, filtrate e funzioni per manipolarle
 */
const useLocalPratiche = (pratiche, loading, filtroAgenzia = '', filtroStato = 'In Corso') => {
  // Stato locale delle pratiche
  const [localPratiche, setLocalPratiche] = useState([]);
  
  // Carica e migra i dati delle pratiche quando cambiano i dati dall'API
  useEffect(() => {
    if (!loading) {
      // Migrazione del modello dati esistente alla nuova struttura
      const migratedPratiche = pratiche.map(pratica => migratePraticaData(pratica));
      setLocalPratiche(migratedPratiche);
    }
  }, [pratiche, loading]);
  
  // Filtra le pratiche in base all'agenzia e allo stato selezionati
  const praticheFiltered = localPratiche.filter(pratica => {
    const matchAgenzia = !filtroAgenzia || pratica.agenzia === filtroAgenzia;
    const matchStato = !filtroStato || pratica.stato === filtroStato;
    return matchAgenzia && matchStato;
  });
  
  /**
   * Aggiorna una pratica locale
   * 
   * @param {string} praticaId - ID della pratica da aggiornare
   * @param {object} updates - Oggetto con gli aggiornamenti da applicare
   */
  const updateLocalPratica = (praticaId, updates) => {
    setLocalPratiche(prev => prev.map(pratica => 
      pratica.id === praticaId ? { ...pratica, ...updates } : pratica
    ));
  };
  
  /**
   * Aggiunge una nuova pratica all'elenco locale
   * 
   * @param {object} newPratica - Nuova pratica da aggiungere
   */
  const addLocalPratica = (newPratica) => {
    setLocalPratiche(prev => [...prev, newPratica]);
  };
  
  /**
   * Rimuove una pratica dall'elenco locale
   * 
   * @param {string} praticaId - ID della pratica da rimuovere
   */
  const removeLocalPratica = (praticaId) => {
    setLocalPratiche(prev => prev.filter(pratica => pratica.id !== praticaId));
  };
  
  /**
   * Aggiorna una sezione specifica del workflow di una pratica
   * 
   * @param {string} praticaId - ID della pratica
   * @param {string} stepId - ID del passo del workflow
   * @param {object} workflowUpdates - Aggiornamenti da applicare al workflow
   */
  const updateWorkflowStep = (praticaId, stepId, workflowUpdates) => {
    setLocalPratiche(prev => prev.map(pratica => {
      if (pratica.id === praticaId) {
        const updatedWorkflow = { ...pratica.workflow };
        
        // Inizializza lo step se non esiste
        if (!updatedWorkflow[stepId]) {
          updatedWorkflow[stepId] = { completed: false, notes: [] };
        }
        
        // Applica gli aggiornamenti
        updatedWorkflow[stepId] = {
          ...updatedWorkflow[stepId],
          ...workflowUpdates
        };
        
        return {
          ...pratica,
          workflow: updatedWorkflow
        };
      }
      return pratica;
    }));
  };
  
  return {
    localPratiche,
    praticheFiltered,
    setLocalPratiche,
    updateLocalPratica,
    addLocalPratica,
    removeLocalPratica,
    updateWorkflowStep
  };
};

export default useLocalPratiche;
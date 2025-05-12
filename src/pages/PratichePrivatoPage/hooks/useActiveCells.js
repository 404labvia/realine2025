// src/pages/PratichePage/hooks/useActiveCells.js
import { useState } from 'react';

/**
 * Custom hook per gestire lo stato delle celle attive nella tabella workflow
 * 
 * @returns {object} Oggetto contenente lo stato delle celle attive e funzioni per manipolarle
 */
const useActiveCells = () => {
  // Stato per tenere traccia delle celle attualmente attive
  const [activeCells, setActiveCells] = useState({});

  /**
   * Attiva o disattiva una cella specifica
   * 
   * @param {string} praticaId - ID della pratica
   * @param {string} stepId - ID del passo del workflow
   * @param {string} stepType - Tipo di passo (task, note, payment, etc.)
   * @param {boolean} isActive - Se la cella deve essere attiva o no
   */
  const handleCellClick = (praticaId, stepId, stepType, isActive = true) => {
    const cellId = `${praticaId}-${stepId}`;
    
    // Disattiva tutte le altre celle se ne stiamo attivando una nuova
    if (isActive) {
      const otherActiveCells = Object.keys(activeCells).filter(key => activeCells[key] && key !== cellId);
      
      // Se ci sono altre celle attive, le disattiviamo prima di attivare la nuova
      if (otherActiveCells.length > 0) {
        const updatedCells = { ...activeCells };
        
        // Disattiva tutte le altre celle
        otherActiveCells.forEach(key => {
          updatedCells[key] = false;
        });
        
        // Attiva la nuova cella
        updatedCells[cellId] = isActive;
        
        setActiveCells(updatedCells);
      } else {
        // Semplicemente attiva/disattiva la cella richiesta
        setActiveCells(prev => ({
          ...prev,
          [cellId]: isActive
        }));
      }
    } else {
      // Semplicemente disattiva la cella richiesta
      setActiveCells(prev => ({
        ...prev,
        [cellId]: isActive
      }));
    }
  };

  /**
   * Controlla se una cella è attualmente attiva
   * 
   * @param {string} praticaId - ID della pratica
   * @param {string} stepId - ID del passo del workflow
   * @returns {boolean} true se la cella è attiva, false altrimenti
   */
  const isCellActive = (praticaId, stepId) => {
    const cellId = `${praticaId}-${stepId}`;
    return !!activeCells[cellId];
  };

  /**
   * Disattiva tutte le celle attive
   */
  const deactivateAllCells = () => {
    setActiveCells({});
  };

  return {
    activeCells,
    handleCellClick,
    isCellActive,
    deactivateAllCells
  };
};

export default useActiveCells;
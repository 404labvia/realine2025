// src/pages/PratichePage/components/cells/StateCell.js
import React from 'react';

// Cella per stato
const StateCell = ({ pratica, onChangeStato }) => {
  return (
    <div className="p-1 text-center">
      <select
        value={pratica.stato || 'In Corso'}
        onChange={(e) => onChangeStato(pratica.id, e.target.value)}
        className="w-full p-0.5 text-xs bg-transparent border-0 text-center focus:ring-0 focus:outline-none"
      >
        <option value="In Corso">In Corso</option>
        <option value="Completata">Completata</option>
      </select>
    </div>
  );
};

export default StateCell;
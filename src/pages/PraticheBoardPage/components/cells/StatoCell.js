// src/pages/PraticheBoardPage/components/cells/StatoCell.js
import React from 'react';

const StatoCell = ({ pratica, onChangeStato }) => {
  return (
    <div className="text-center">
      <select
        value={pratica.stato || 'In Corso'}
        onChange={(e) => onChangeStato(pratica.id, e.target.value)}
        className={`w-full p-1 text-xs rounded border-0 text-center focus:ring-2 focus:ring-blue-500 ${
          pratica.stato === 'Completata' ? 'bg-green-500 text-white' : 'bg-yellow-100 text-gray-800'
        }`}
      >
        <option value="In Corso">In Corso</option>
        <option value="Completata">Completata</option>
      </select>
    </div>
  );
};

export default StatoCell;
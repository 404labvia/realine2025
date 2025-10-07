import React from 'react';

const StatoCell = ({ pratica, onChangeStato }) => {
  return (
    <div className="text-center">
      <select
        value={pratica.stato || 'In Corso'}
        onChange={(e) => onChangeStato(pratica.id, e.target.value)}
        className={`w-full px-2 py-1.5 text-xs rounded-md border-0 text-center focus:ring-2 focus:ring-ring transition-colors ${
          pratica.stato === 'Completata'
            ? 'bg-green-600 text-white hover:bg-green-700'
            : 'bg-amber-100 text-amber-900 hover:bg-amber-200'
        }`}
      >
        <option value="In Corso">In Corso</option>
        <option value="Completata">Completata</option>
      </select>
    </div>
  );
};

export default StatoCell;
// src/pages/PraticheGridPage/components/cellRenderers/StateCellRenderer.js
import React from 'react';

const StateCellRenderer = (props) => {
  const pratica = props.data;
  const { onChangeStato } = props;

  const handleChange = (e) => {
    if (onChangeStato) {
      onChangeStato(pratica.id, e.target.value);
    }
  };

  return (
    <div className="p-2 text-center h-full flex items-center justify-center">
      <select
        value={pratica.stato || 'In Corso'}
        onChange={handleChange}
        className="w-full p-2 text-sm bg-transparent border border-gray-300 rounded text-center focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
        onClick={(e) => e.stopPropagation()}
      >
        <option value="In Corso">In Corso</option>
        <option value="Completata">Completata</option>
        <option value="In Attesa">In Attesa</option>
        <option value="Annullata">Annullata</option>
      </select>
    </div>
  );
};

export default StateCellRenderer;
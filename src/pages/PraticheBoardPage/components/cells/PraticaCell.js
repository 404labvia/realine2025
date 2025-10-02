// src/pages/PraticheBoardPage/components/cells/PraticaCell.js
import React from 'react';

const PraticaCell = ({ pratica, onEditPratica }) => {
  return (
    <div
      className="cursor-pointer hover:text-blue-600"
      onClick={() => onEditPratica(pratica.id)}
    >
      <div className="font-bold text-sm text-gray-800 mb-1">{pratica.indirizzo}</div>
      <div className="text-xs text-gray-600 mb-1">{pratica.cliente}</div>
      <div className="text-xs font-medium text-gray-600">{pratica.codice}</div>
    </div>
  );
};

export default PraticaCell;
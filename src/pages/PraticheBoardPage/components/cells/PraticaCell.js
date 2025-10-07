import React from 'react';
import { FaBuilding, FaUser } from 'react-icons/fa';

const PraticaCell = ({ pratica, onEditPratica }) => {
  return (
    <div
      className="cursor-pointer hover:text-blue-600"
      onClick={() => onEditPratica(pratica.id)}
    >
      <div className="text-xs font-medium text-gray-600 mb-1">{pratica.codice}</div>
      <div className="font-bold text-sm text-gray-800 mb-1">{pratica.indirizzo}</div>
      <div className="text-xs text-gray-600 mb-2">{pratica.cliente}</div>

      {pratica.agenzia && (
        <div className="flex items-center gap-1 text-xs text-gray-700 mb-1">
          <FaBuilding className="text-gray-700" size={10} />
          <span>{pratica.agenzia}</span>
        </div>
      )}

      {pratica.collaboratore && (
        <div className="flex items-center gap-1 text-xs text-gray-600">
          <FaUser className="text-gray-700" size={10} />
          <span>{pratica.collaboratore}</span>
        </div>
      )}
    </div>
  );
};

export default PraticaCell;
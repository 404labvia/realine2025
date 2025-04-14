// src/pages/PratichePage/components/cells/HeaderCell.js
import React from 'react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

// Cella per intestazione pratica
const HeaderCell = ({ pratica, onEditPratica }) => {
  return (
    <div className="p-1 text-center">
      <div className="text-xs font-medium text-gray-600">{pratica.codice}</div>
      <div 
        className="font-bold text-sm text-gray-800 cursor-pointer hover:text-blue-600"
        onClick={() => onEditPratica(pratica.id)}
      >
        {pratica.indirizzo}
      </div>
      <div className="text-xs text-gray-600">{pratica.cliente}</div>
      
      {/* Atto/Fine spostato qui e leggermente staccato */}
      {pratica.dataFine && (
        <div className="text-xs text-gray-600 mt-2 border-t pt-1">
          <span className="font-bold">Atto/Fine:</span> {format(new Date(pratica.dataFine), 'dd/MM/yyyy HH:mm', { locale: it })}
        </div>
      )}
    </div>
  );
};

export default HeaderCell;
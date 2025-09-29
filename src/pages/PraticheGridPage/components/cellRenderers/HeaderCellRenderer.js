// src/pages/PraticheGridPage/components/cellRenderers/HeaderCellRenderer.js
import React from 'react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

const HeaderCellRenderer = (props) => {
  const pratica = props.data;
  const { onUpdatePratica } = props;

  const handleEditClick = () => {
    // Qui puoi aprire una modale per modificare la pratica
    console.log('Modifica pratica:', pratica.id);
  };

  return (
    <div className="p-2 text-center h-full flex flex-col justify-between">
      <div>
        <div className="text-xs font-medium text-gray-600">{pratica.codice}</div>
        <div
          className="font-bold text-sm text-gray-800 cursor-pointer hover:text-blue-600 mb-1"
          onClick={handleEditClick}
          title="Clicca per modificare"
        >
          {pratica.indirizzo}
        </div>
        <div className="text-xs text-gray-600 mb-2">{pratica.cliente}</div>
      </div>

      {pratica.dataFine && (
        <div className="text-xs text-gray-600 border-t pt-1 mt-auto">
          <span className="font-bold">Atto/Fine:</span><br />
          {format(new Date(pratica.dataFine), 'dd/MM/yyyy HH:mm', { locale: it })}
        </div>
      )}
    </div>
  );
};

export default HeaderCellRenderer;
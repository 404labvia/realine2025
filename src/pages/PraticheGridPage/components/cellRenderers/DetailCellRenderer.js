// src/pages/PraticheGridPage/components/cellRenderers/DetailCellRenderer.js
import React from 'react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

const DetailCellRenderer = (props) => {
  const pratica = props.data;

  const tooltipText = pratica.importoBaseCommittente > 0
    ? `Base: €${pratica.importoBaseCommittente.toLocaleString('it-IT', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}${pratica.applyCassaCommittente ? " +5% cassa" : ""}${pratica.applyIVACommittente ? " +22% IVA" : ""}`
    : '';

  return (
    <div className="p-2 text-center h-full">
      <div className="text-xs text-gray-600 mb-1">
        {pratica.collaboratore || 'Nessun collaboratore'}
      </div>

      <div className="text-xs text-gray-600 mb-2">
        Inizio: {pratica.dataInizio ? format(new Date(pratica.dataInizio), 'dd/MM/yyyy', { locale: it }) : 'N/D'}
      </div>

      {pratica.importoTotale > 0 && (
        <div className="relative group text-sm font-bold text-gray-800 mb-1 cursor-help">
          €{pratica.importoTotale.toLocaleString('it-IT', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}
          {tooltipText && (
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10">
              <div className="bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                {tooltipText}
              </div>
            </div>
          )}
        </div>
      )}

      {pratica.importoCollaboratore > 0 && (
        <div className="text-xs text-gray-600">
          Coll: €{pratica.importoCollaboratore.toLocaleString('it-IT', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}
        </div>
      )}
    </div>
  );
};

export default DetailCellRenderer;
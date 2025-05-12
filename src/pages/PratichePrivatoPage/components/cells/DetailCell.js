// src/pages/PratichePage/components/cells/DetailCell.js
import React from 'react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

// Cella per dettagli pratica
const DetailCell = ({ pratica }) => {
  // Crea il testo per il tooltip
  const tooltipText = pratica.importoBaseCommittente > 0 
    ? `Base: €${pratica.importoBaseCommittente.toLocaleString('it-IT', {minimumFractionDigits: 2, maximumFractionDigits: 2})}${pratica.applyCassaCommittente ? " +5% cassa" : ""}${pratica.applyIVACommittente ? " +22% IVA" : ""}`
    : '';
    
  return (
    <div className="p-1 text-center">
      {/* Solo nome collaboratore */}
      <div className="text-xs text-gray-600">
        {pratica.collaboratore || ''}
      </div>
      
      {/* Inizio pratica compattato */}
      <div className="text-xs text-gray-600 mt-1">
        Inizio: {pratica.dataInizio ? format(new Date(pratica.dataInizio), 'dd/MM/yyyy', { locale: it }) : 'N/D'}
      </div>
      
      {/* Importo totale con tooltip - spostato qui dalla HeaderCell */}
      {pratica.importoTotale > 0 && (
        <div className="tooltip text-sm font-bold text-gray-800 mt-2">
          €{pratica.importoTotale.toLocaleString('it-IT', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
          <span className="tooltiptext">{tooltipText}</span>
        </div>
      )}
      
      {/* Importo collaboratore */}
      {pratica.importoCollaboratore > 0 && (
        <div className="text-xs text-gray-600">
          Coll: €{pratica.importoCollaboratore.toLocaleString('it-IT', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
        </div>
      )}
    </div>
  );
};

export default DetailCell;
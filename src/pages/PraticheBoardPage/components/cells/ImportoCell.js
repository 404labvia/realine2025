// src/pages/PraticheBoardPage/components/cells/ImportoCell.js
import React from 'react';

const ImportoCell = ({ pratica, onEditPratica }) => {
  const formatCurrency = (amount) => {
    if (!amount || amount === 0) return '€0,00';
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const getTooltip = (base, applyCassa, applyIVA = false) => {
    let tooltip = `Base: ${formatCurrency(base)}`;
    if (applyCassa) tooltip += ' +5% cassa';
    if (applyIVA) tooltip += ' +22% IVA';
    return tooltip;
  };

  return (
    <div
      className="text-center space-y-1 cursor-pointer hover:bg-blue-50 p-2 rounded transition-colors"
      onClick={() => onEditPratica(pratica.id)}
      title="Click per modificare"
    >
      <style>{`
        .tooltip-down {
          position: relative;
          display: inline-block;
        }
        .tooltip-down .tooltiptext-down {
          visibility: hidden;
          width: 180px;
          background-color: rgba(97, 97, 97, 0.9);
          color: #fff;
          text-align: center;
          border-radius: 6px;
          padding: 8px;
          position: absolute;
          z-index: 100;
          top: 125%;
          left: 50%;
          transform: translateX(-50%);
          opacity: 0;
          transition: opacity 0.3s;
          font-size: 0.7rem;
          white-space: nowrap;
        }
        .tooltip-down:hover .tooltiptext-down {
          visibility: visible;
          opacity: 1;
        }
      `}</style>

      {pratica.importoTotale > 0 && (
        <div className="tooltip-down">
          <div className="font-bold text-sm text-gray-800">
            {formatCurrency(pratica.importoTotale)}
          </div>
          <span className="tooltiptext-down">
            {getTooltip(pratica.importoBaseCommittente || 0, pratica.applyCassaCommittente, pratica.applyIVACommittente !== false)}
          </span>
        </div>
      )}
      {pratica.importoCollaboratore > 0 && (
        <div className="tooltip-down">
          <div className="text-xs text-gray-600">
            Coll: {formatCurrency(pratica.importoCollaboratore)}
          </div>
          <span className="tooltiptext-down">
            {getTooltip(pratica.importoBaseCollaboratore || 0, pratica.applyCassaCollaboratore)}
          </span>
        </div>
      )}
      {pratica.importoFirmatario > 0 && (
        <div className="tooltip-down">
          <div className="text-xs text-gray-600">
            Firm: {formatCurrency(pratica.importoFirmatario)}
          </div>
          <span className="tooltiptext-down">
            {getTooltip(pratica.importoBaseFirmatario || 0, pratica.applyCassaFirmatario)}
          </span>
        </div>
      )}
    </div>
  );
};

export default ImportoCell;
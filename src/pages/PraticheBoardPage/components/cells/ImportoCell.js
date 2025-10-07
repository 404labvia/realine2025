import React from 'react';

const ImportoCell = ({ pratica }) => {
  const formatCurrency = (amount) => {
    if (!amount || amount === 0) return '€0,00';
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const getTooltipCommittente = () => {
    const base = pratica.importoBaseCommittente || 0;
    const applyCassa = pratica.applyCassaCommittente;
    const applyIVA = pratica.applyIVACommittente !== false;

    let tooltip = `Base: ${formatCurrency(base)}`;
    if (applyCassa) tooltip += ' +5% cassa';
    if (applyIVA) tooltip += ' +22% IVA';

    return tooltip;
  };

  const getTooltipCollaboratore = () => {
    const base = pratica.importoBaseCollaboratore || 0;
    const applyCassa = pratica.applyCassaCollaboratore;

    let tooltip = `Base: ${formatCurrency(base)}`;
    if (applyCassa) tooltip += ' +5% cassa';

    return tooltip;
  };

  const getTooltipFirmatario = () => {
    const base = pratica.importoBaseFirmatario || 0;
    const applyCassa = pratica.applyCassaFirmatario;

    let tooltip = `Base: ${formatCurrency(base)}`;
    if (applyCassa) tooltip += ' +5% cassa';

    return tooltip;
  };

  return (
    <div className="text-center space-y-1">
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
          <span className="tooltiptext-down">{getTooltipCommittente()}</span>
        </div>
      )}
      {pratica.importoCollaboratore > 0 && (
        <div className="text-xs text-gray-600">
          Coll: {formatCurrency(pratica.importoCollaboratore)}
        </div>
      )}
      {pratica.importoFirmatario > 0 && (
        <div className="text-xs text-gray-600">
          Firm: {formatCurrency(pratica.importoFirmatario)}
        </div>
      )}
    </div>
  );
};

export default ImportoCell;
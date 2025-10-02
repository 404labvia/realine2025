// src/pages/PraticheBoardPage/components/cells/ImportoCell.js
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
      {pratica.importoTotale > 0 && (
        <div className="tooltip relative">
          <div className="font-bold text-sm text-gray-800">
            {formatCurrency(pratica.importoTotale)}
          </div>
          <span className="tooltiptext">{getTooltipCommittente()}</span>
        </div>
      )}
      {pratica.importoCollaboratore > 0 && (
        <div className="tooltip relative">
          <div className="text-xs text-gray-600">
            Coll: {formatCurrency(pratica.importoCollaboratore)}
          </div>
          <span className="tooltiptext">{getTooltipCollaboratore()}</span>
        </div>
      )}
      {pratica.importoFirmatario > 0 && (
        <div className="tooltip relative">
          <div className="text-xs text-gray-600">
            Firm: {formatCurrency(pratica.importoFirmatario)}
          </div>
          <span className="tooltiptext">{getTooltipFirmatario()}</span>
        </div>
      )}
    </div>
  );
};

export default ImportoCell;
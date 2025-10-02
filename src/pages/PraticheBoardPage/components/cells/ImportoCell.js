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

  let totaleFirmatario = 0;
  if (pratica.workflow) {
    Object.values(pratica.workflow).forEach(step => {
      if (typeof step.importoFirmatario === 'number') {
        totaleFirmatario += step.importoFirmatario;
      }
    });
  }

  return (
    <div className="text-center space-y-1">
      <div className="font-bold text-sm text-gray-800">
        {formatCurrency(pratica.importoTotale)}
      </div>
      {pratica.importoCollaboratore > 0 && (
        <div className="text-xs text-gray-600">
          Coll: {formatCurrency(pratica.importoCollaboratore)}
        </div>
      )}
      {totaleFirmatario > 0 && (
        <div className="text-xs text-gray-600">
          Firm: {formatCurrency(totaleFirmatario)}
        </div>
      )}
    </div>
  );
};

export default ImportoCell;
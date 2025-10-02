// src/pages/PraticheBoardPage/components/cells/PagamentiCell.js
import React, { useState } from 'react';
import PaymentModal from './PaymentModal';

const PagamentiCell = ({ pratica, updatePratica, localPratiche, setLocalPratiche }) => {
  const [showModal, setShowModal] = useState(false);

  const formatCurrency = (amount) => {
    if (!amount || amount === 0) return '€0,00';
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const workflow = pratica.workflow || {};

  const acconto50Data = workflow.acconto1 || {};
  const saldoData = workflow.saldo || {};

  const totaleCommittente = (acconto50Data.importoCommittente || 0) + (saldoData.importoCommittente || 0);
  const totaleCollaboratore = (acconto50Data.importoCollaboratore || 0) + (saldoData.importoCollaboratore || 0);
  const totaleFirmatario = (acconto50Data.importoFirmatario || 0) + (saldoData.importoFirmatario || 0);

  const hasSomePayment = totaleCommittente > 0 || totaleCollaboratore > 0 || totaleFirmatario > 0;

  return (
    <>
      <div
        className="text-center space-y-1 cursor-pointer hover:bg-gray-100 p-2 rounded"
        onClick={() => setShowModal(true)}
      >
        {hasSomePayment ? (
          <>
            {totaleCommittente > 0 && (
              <div className="text-xs">
                <span className="text-gray-600">Comm:</span>{' '}
                <span className="font-semibold text-gray-800">{formatCurrency(totaleCommittente)}</span>
              </div>
            )}
            {totaleCollaboratore > 0 && (
              <div className="text-xs text-gray-600">
                Coll: {formatCurrency(totaleCollaboratore)}
              </div>
            )}
            {totaleFirmatario > 0 && (
              <div className="text-xs text-gray-600">
                Firm: {formatCurrency(totaleFirmatario)}
              </div>
            )}
          </>
        ) : (
          <div className="text-xs text-gray-400">Nessun pagamento</div>
        )}
      </div>

      {showModal && (
        <PaymentModal
          pratica={pratica}
          onClose={() => setShowModal(false)}
          updatePratica={updatePratica}
          localPratiche={localPratiche}
          setLocalPratiche={setLocalPratiche}
        />
      )}
    </>
  );
};

export default PagamentiCell;
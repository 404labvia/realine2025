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

  const getTooltip = (base, applyCassa, applyIVA = false) => {
    let tooltip = `Base: ${formatCurrency(base)}`;
    if (applyCassa) tooltip += ' +5% cassa';
    if (applyIVA) tooltip += ' +22% IVA';
    return tooltip;
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
        <style>{`
          .tooltip-payment {
            position: relative;
            display: inline-block;
          }
          .tooltip-payment .tooltiptext-payment {
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
          .tooltip-payment:hover .tooltiptext-payment {
            visibility: visible;
            opacity: 1;
          }
        `}</style>

        {hasSomePayment ? (
          <>
            {totaleCommittente > 0 && (
              <div className="tooltip-payment text-xs">
                <span className="text-gray-600">Comm:</span>{' '}
                <span className="font-semibold text-gray-800">{formatCurrency(totaleCommittente)}</span>
                <span className="tooltiptext-payment">
                  {getTooltip(
                    (acconto50Data.importoBaseCommittente || 0) + (saldoData.importoBaseCommittente || 0),
                    acconto50Data.applyCassaCommittente || saldoData.applyCassaCommittente,
                    acconto50Data.applyIVACommittente !== false || saldoData.applyIVACommittente !== false
                  )}
                </span>
              </div>
            )}
            {totaleCollaboratore > 0 && (
              <div className="tooltip-payment text-xs text-gray-600">
                Coll: {formatCurrency(totaleCollaboratore)}
                <span className="tooltiptext-payment">
                  {getTooltip(
                    (acconto50Data.importoBaseCollaboratore || 0) + (saldoData.importoBaseCollaboratore || 0),
                    acconto50Data.applyCassaCollaboratore || saldoData.applyCassaCollaboratore
                  )}
                </span>
              </div>
            )}
            {totaleFirmatario > 0 && (
              <div className="tooltip-payment text-xs text-gray-600">
                Firm: {formatCurrency(totaleFirmatario)}
                <span className="tooltiptext-payment">
                  {getTooltip(
                    (acconto50Data.importoBaseFirmatario || 0) + (saldoData.importoBaseFirmatario || 0),
                    acconto50Data.applyCassaFirmatario || saldoData.applyCassaFirmatario
                  )}
                </span>
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
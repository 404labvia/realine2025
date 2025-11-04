// src/pages/PraticheBoardPage/components/cells/PaymentModal.js
import React, { useState } from 'react';
import {
  calcolaBaseCommittente,
  calcolaBaseCollaboratore
} from '../../../PratichePage/utils/calculationUtils';

const PaymentModal = ({ pratica, onClose, updatePratica, localPratiche, setLocalPratiche }) => {
  const workflow = pratica.workflow || {};
  const acconto50Data = workflow.acconto1 || {};
  const saldoData = workflow.saldo || {};

  const [acconto50Committente, setAcconto50Committente] = useState(acconto50Data.importoCommittente || 0);
  const [acconto50CassaCommittente, setAcconto50CassaCommittente] = useState(acconto50Data.applyCassaCommittente !== false);
  const [acconto50IVACommittente, setAcconto50IVACommittente] = useState(acconto50Data.applyIVACommittente !== false);

  const [acconto50Collaboratore, setAcconto50Collaboratore] = useState(acconto50Data.importoCollaboratore || 0);
  const [acconto50CassaCollaboratore, setAcconto50CassaCollaboratore] = useState(acconto50Data.applyCassaCollaboratore !== false);

  const [acconto50Firmatario, setAcconto50Firmatario] = useState(acconto50Data.importoFirmatario || 0);
  const [acconto50CassaFirmatario, setAcconto50CassaFirmatario] = useState(acconto50Data.applyCassaFirmatario !== false);

  const [saldoCommittente, setSaldoCommittente] = useState(saldoData.importoCommittente || 0);
  const [saldoCassaCommittente, setSaldoCassaCommittente] = useState(saldoData.applyCassaCommittente !== false);
  const [saldoIVACommittente, setSaldoIVACommittente] = useState(saldoData.applyIVACommittente !== false);

  const [saldoCollaboratore, setSaldoCollaboratore] = useState(saldoData.importoCollaboratore || 0);
  const [saldoCassaCollaboratore, setSaldoCassaCollaboratore] = useState(saldoData.applyCassaCollaboratore !== false);

  const [saldoFirmatario, setSaldoFirmatario] = useState(saldoData.importoFirmatario || 0);
  const [saldoCassaFirmatario, setSaldoCassaFirmatario] = useState(saldoData.applyCassaFirmatario !== false);

  const formatCurrency = (amount) => {
    return parseFloat(amount || 0).toFixed(2);
  };

  // Calcola i valori netto
  const acconto50NettoCommittente = calcolaBaseCommittente(
    acconto50Committente, acconto50CassaCommittente, acconto50IVACommittente
  );
  const acconto50NettoCollaboratore = calcolaBaseCollaboratore(
    acconto50Collaboratore, acconto50CassaCollaboratore
  );
  const acconto50NettoFirmatario = calcolaBaseCollaboratore(
    acconto50Firmatario, acconto50CassaFirmatario
  );

  const saldoNettoCommittente = calcolaBaseCommittente(
    saldoCommittente, saldoCassaCommittente, saldoIVACommittente
  );
  const saldoNettoCollaboratore = calcolaBaseCollaboratore(
    saldoCollaboratore, saldoCassaCollaboratore
  );
  const saldoNettoFirmatario = calcolaBaseCollaboratore(
    saldoFirmatario, saldoCassaFirmatario
  );

  const handleSave = async () => {
    const updatedWorkflow = { ...workflow };

    const importoBaseAcconto50Committente = calcolaBaseCommittente(
      acconto50Committente, acconto50CassaCommittente, acconto50IVACommittente
    );
    const importoBaseAcconto50Collaboratore = calcolaBaseCollaboratore(
      acconto50Collaboratore, acconto50CassaCollaboratore
    );
    const importoBaseAcconto50Firmatario = calcolaBaseCollaboratore(
      acconto50Firmatario, acconto50CassaFirmatario
    );

    updatedWorkflow.acconto1 = {
      ...updatedWorkflow.acconto1,
      importoBaseCommittente: importoBaseAcconto50Committente,
      importoCommittente: acconto50Committente,
      applyCassaCommittente: acconto50CassaCommittente,
      applyIVACommittente: acconto50IVACommittente,
      pagamentoCommittenteDate: acconto50Committente > 0 ? (updatedWorkflow.acconto1?.pagamentoCommittenteDate || new Date().toISOString()) : null,

      importoBaseCollaboratore: importoBaseAcconto50Collaboratore,
      importoCollaboratore: acconto50Collaboratore,
      applyCassaCollaboratore: acconto50CassaCollaboratore,
      pagamentoCollaboratoreDate: acconto50Collaboratore > 0 ? (updatedWorkflow.acconto1?.pagamentoCollaboratoreDate || new Date().toISOString()) : null,

      importoBaseFirmatario: importoBaseAcconto50Firmatario,
      importoFirmatario: acconto50Firmatario,
      applyCassaFirmatario: acconto50CassaFirmatario,
      pagamentoFirmatarioDate: acconto50Firmatario > 0 ? (updatedWorkflow.acconto1?.pagamentoFirmatarioDate || new Date().toISOString()) : null,
    };

    const importoBaseSaldoCommittente = calcolaBaseCommittente(
      saldoCommittente, saldoCassaCommittente, saldoIVACommittente
    );
    const importoBaseSaldoCollaboratore = calcolaBaseCollaboratore(
      saldoCollaboratore, saldoCassaCollaboratore
    );
    const importoBaseSaldoFirmatario = calcolaBaseCollaboratore(
      saldoFirmatario, saldoCassaFirmatario
    );

    updatedWorkflow.saldo = {
      ...updatedWorkflow.saldo,
      importoBaseCommittente: importoBaseSaldoCommittente,
      importoCommittente: saldoCommittente,
      applyCassaCommittente: saldoCassaCommittente,
      applyIVACommittente: saldoIVACommittente,
      pagamentoCommittenteDate: saldoCommittente > 0 ? (updatedWorkflow.saldo?.pagamentoCommittenteDate || new Date().toISOString()) : null,

      importoBaseCollaboratore: importoBaseSaldoCollaboratore,
      importoCollaboratore: saldoCollaboratore,
      applyCassaCollaboratore: saldoCassaCollaboratore,
      pagamentoCollaboratoreDate: saldoCollaboratore > 0 ? (updatedWorkflow.saldo?.pagamentoCollaboratoreDate || new Date().toISOString()) : null,

      importoBaseFirmatario: importoBaseSaldoFirmatario,
      importoFirmatario: saldoFirmatario,
      applyCassaFirmatario: saldoCassaFirmatario,
      pagamentoFirmatarioDate: saldoFirmatario > 0 ? (updatedWorkflow.saldo?.pagamentoFirmatarioDate || new Date().toISOString()) : null,
    };

    setLocalPratiche(prev => prev.map(p =>
      p.id === pratica.id ? { ...p, workflow: updatedWorkflow } : p
    ));

    await updatePratica(pratica.id, { workflow: updatedWorkflow });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white dark:bg-dark-surface p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-dark-text-primary">Gestione Pagamenti - {pratica.indirizzo}</h2>

        <div className="mb-6 p-4 border border-gray-200 dark:border-dark-border rounded-lg">
          <h3 className="text-lg font-semibold mb-3 text-blue-600 dark:text-blue-400">Acconto 50%</h3>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-primary mb-2">Committente</label>
            <div className="space-y-2">
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500 dark:text-dark-text-muted text-sm">€</span>
                    <input
                      type="number"
                      value={formatCurrency(acconto50Committente)}
                      onChange={(e) => setAcconto50Committente(parseFloat(e.target.value) || 0)}
                      className="pl-7 w-full p-2 text-sm border border-gray-300 dark:border-dark-border dark:bg-dark-hover dark:text-dark-text-primary rounded"
                      step="0.01"
                    />
                  </div>
                </div>
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={acconto50CassaCommittente}
                    onChange={(e) => setAcconto50CassaCommittente(e.target.checked)}
                    className="mr-1"
                  />
                  <span className="text-sm dark:text-dark-text-secondary">+5% Cassa</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={acconto50IVACommittente}
                    onChange={(e) => setAcconto50IVACommittente(e.target.checked)}
                    className="mr-1"
                  />
                  <span className="text-sm dark:text-dark-text-secondary">+22% IVA</span>
                </label>
              </div>
              <div className="text-sm text-gray-600 dark:text-dark-text-secondary font-medium">
                Netto: €{acconto50NettoCommittente.toFixed(2)}
              </div>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-primary mb-2">Collaboratore</label>
            <div className="space-y-2">
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500 dark:text-dark-text-muted text-sm">€</span>
                    <input
                      type="number"
                      value={formatCurrency(acconto50Collaboratore)}
                      onChange={(e) => setAcconto50Collaboratore(parseFloat(e.target.value) || 0)}
                      className="pl-7 w-full p-2 text-sm border border-gray-300 dark:border-dark-border dark:bg-dark-hover dark:text-dark-text-primary rounded"
                      step="0.01"
                    />
                  </div>
                </div>
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={acconto50CassaCollaboratore}
                    onChange={(e) => setAcconto50CassaCollaboratore(e.target.checked)}
                    className="mr-1"
                  />
                  <span className="text-sm dark:text-dark-text-secondary">+5% Cassa</span>
                </label>
              </div>
              <div className="text-sm text-gray-600 dark:text-dark-text-secondary font-medium">
                Netto: €{acconto50NettoCollaboratore.toFixed(2)}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-primary mb-2">Collaboratore Firmatario</label>
            <div className="space-y-2">
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500 dark:text-dark-text-muted text-sm">€</span>
                    <input
                      type="number"
                      value={formatCurrency(acconto50Firmatario)}
                      onChange={(e) => setAcconto50Firmatario(parseFloat(e.target.value) || 0)}
                      className="pl-7 w-full p-2 text-sm border border-gray-300 dark:border-dark-border dark:bg-dark-hover dark:text-dark-text-primary rounded"
                      step="0.01"
                    />
                  </div>
                </div>
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={acconto50CassaFirmatario}
                    onChange={(e) => setAcconto50CassaFirmatario(e.target.checked)}
                    className="mr-1"
                  />
                  <span className="text-sm dark:text-dark-text-secondary">+5% Cassa</span>
                </label>
              </div>
              <div className="text-sm text-gray-600 dark:text-dark-text-secondary font-medium">
                Netto: €{acconto50NettoFirmatario.toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6 p-4 border border-gray-200 dark:border-dark-border rounded-lg">
          <h3 className="text-lg font-semibold mb-3 text-green-600 dark:text-green-400">Saldo</h3>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-primary mb-2">Committente</label>
            <div className="space-y-2">
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500 dark:text-dark-text-muted text-sm">€</span>
                    <input
                      type="number"
                      value={formatCurrency(saldoCommittente)}
                      onChange={(e) => setSaldoCommittente(parseFloat(e.target.value) || 0)}
                      className="pl-7 w-full p-2 text-sm border border-gray-300 dark:border-dark-border dark:bg-dark-hover dark:text-dark-text-primary rounded"
                      step="0.01"
                    />
                  </div>
                </div>
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={saldoCassaCommittente}
                    onChange={(e) => setSaldoCassaCommittente(e.target.checked)}
                    className="mr-1"
                  />
                  <span className="text-sm dark:text-dark-text-secondary">+5% Cassa</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={saldoIVACommittente}
                    onChange={(e) => setSaldoIVACommittente(e.target.checked)}
                    className="mr-1"
                  />
                  <span className="text-sm dark:text-dark-text-secondary">+22% IVA</span>
                </label>
              </div>
              <div className="text-sm text-gray-600 dark:text-dark-text-secondary font-medium">
                Netto: €{saldoNettoCommittente.toFixed(2)}
              </div>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-primary mb-2">Collaboratore</label>
            <div className="space-y-2">
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500 dark:text-dark-text-muted text-sm">€</span>
                    <input
                      type="number"
                      value={formatCurrency(saldoCollaboratore)}
                      onChange={(e) => setSaldoCollaboratore(parseFloat(e.target.value) || 0)}
                      className="pl-7 w-full p-2 text-sm border border-gray-300 dark:border-dark-border dark:bg-dark-hover dark:text-dark-text-primary rounded"
                      step="0.01"
                    />
                  </div>
                </div>
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={saldoCassaCollaboratore}
                    onChange={(e) => setSaldoCassaCollaboratore(e.target.checked)}
                    className="mr-1"
                  />
                  <span className="text-sm dark:text-dark-text-secondary">+5% Cassa</span>
                </label>
              </div>
              <div className="text-sm text-gray-600 dark:text-dark-text-secondary font-medium">
                Netto: €{saldoNettoCollaboratore.toFixed(2)}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-primary mb-2">Collaboratore Firmatario</label>
            <div className="space-y-2">
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500 dark:text-dark-text-muted text-sm">€</span>
                    <input
                      type="number"
                      value={formatCurrency(saldoFirmatario)}
                      onChange={(e) => setSaldoFirmatario(parseFloat(e.target.value) || 0)}
                      className="pl-7 w-full p-2 text-sm border border-gray-300 dark:border-dark-border dark:bg-dark-hover dark:text-dark-text-primary rounded"
                      step="0.01"
                    />
                  </div>
                </div>
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={saldoCassaFirmatario}
                    onChange={(e) => setSaldoCassaFirmatario(e.target.checked)}
                    className="mr-1"
                  />
                  <span className="text-sm dark:text-dark-text-secondary">+5% Cassa</span>
                </label>
              </div>
              <div className="text-sm text-gray-600 dark:text-dark-text-secondary font-medium">
                Netto: €{saldoNettoFirmatario.toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-dark-border text-gray-700 dark:text-dark-text-primary rounded hover:bg-gray-100 dark:hover:bg-dark-hover transition-colors"
          >
            Annulla
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors"
          >
            Salva
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
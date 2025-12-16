// src/pages/GeneraIncaricoPage/components/Step5Pagamento.js
import React, { useState, useEffect } from 'react';
import { FaEuroSign, FaPercentage, FaCalculator } from 'react-icons/fa';

function Step5Pagamento({ incaricoData, updateIncaricoData, onNext, onPrev }) {
  const [formData, setFormData] = useState({
    importoNetto: incaricoData.importoNetto || 0,
    iva: incaricoData.iva || 22,
    importoAcconto: incaricoData.importoAcconto || 0,
    tempistica: incaricoData.tempistica || '',
  });

  const [errors, setErrors] = useState({});

  // Calcola automaticamente importi
  useEffect(() => {
    const netto = parseFloat(formData.importoNetto) || 0;
    const ivaPercent = parseFloat(formData.iva) || 0;
    const acconto = parseFloat(formData.importoAcconto) || 0;

    const importoTotale = netto + (netto * ivaPercent / 100);
    const importoSaldo = importoTotale - acconto;

    updateIncaricoData({
      ...formData,
      importoTotale: Math.round(importoTotale * 100) / 100,
      importoSaldo: Math.round(importoSaldo * 100) / 100,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.importoNetto, formData.iva, formData.importoAcconto]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    const netto = parseFloat(formData.importoNetto);
    if (isNaN(netto) || netto <= 0) {
      newErrors.importoNetto = 'Importo netto obbligatorio e deve essere maggiore di 0';
    }

    const iva = parseFloat(formData.iva);
    if (isNaN(iva) || iva < 0) {
      newErrors.iva = 'IVA deve essere un valore valido (0-100)';
    }

    const acconto = parseFloat(formData.importoAcconto);
    if (isNaN(acconto) || acconto < 0) {
      newErrors.importoAcconto = 'Acconto deve essere un valore valido';
    }

    const totale = netto + (netto * iva / 100);
    if (acconto > totale) {
      newErrors.importoAcconto = 'L\'acconto non può essere maggiore del totale';
    }

    if (!formData.tempistica || formData.tempistica.trim().length < 5) {
      newErrors.tempistica = 'Specifica la tempistica di realizzazione (min. 5 caratteri)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = () => {
    if (validateForm()) {
      // Assicurati che tutti i valori numerici siano convertiti correttamente
      updateIncaricoData({
        importoNetto: parseFloat(formData.importoNetto) || 0,
        iva: parseFloat(formData.iva) || 22,
        importoAcconto: parseFloat(formData.importoAcconto) || 0,
        tempistica: formData.tempistica,
      });
      onNext();
    }
  };

  const importoTotale = incaricoData.importoTotale || 0;
  const importoSaldo = incaricoData.importoSaldo || 0;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white dark:bg-dark-surface rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-dark-text-primary mb-2">
          Dati Pagamento
        </h2>
        <p className="text-gray-600 dark:text-dark-text-secondary mb-6">
          Inserisci i dettagli economici e la tempistica dell'incarico
        </p>

        {/* Importo Netto */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-primary mb-2">
            Importo Netto (€) <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaEuroSign className="text-gray-400" />
            </div>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.importoNetto}
              onChange={(e) => handleChange('importoNetto', e.target.value)}
              placeholder="1500.00"
              className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-dark-bg dark:text-dark-text-primary dark:border-dark-border ${
                errors.importoNetto ? 'border-red-500' : 'border-gray-300'
              }`}
            />
          </div>
          {errors.importoNetto && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.importoNetto}</p>
          )}
        </div>

        {/* IVA */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-primary mb-2">
            IVA (%) <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaPercentage className="text-gray-400" />
            </div>
            <input
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={formData.iva}
              onChange={(e) => handleChange('iva', e.target.value)}
              placeholder="22"
              className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-dark-bg dark:text-dark-text-primary dark:border-dark-border ${
                errors.iva ? 'border-red-500' : 'border-gray-300'
              }`}
            />
          </div>
          {errors.iva && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.iva}</p>
          )}
        </div>

        {/* Importo Totale (calcolato) */}
        <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FaCalculator className="text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                Importo Totale (IVA inclusa):
              </span>
            </div>
            <span className="text-xl font-bold text-blue-700 dark:text-blue-300">
              € {importoTotale.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Acconto */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-primary mb-2">
            Acconto (€)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaEuroSign className="text-gray-400" />
            </div>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.importoAcconto}
              onChange={(e) => handleChange('importoAcconto', e.target.value)}
              placeholder="0.00"
              className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-dark-bg dark:text-dark-text-primary dark:border-dark-border ${
                errors.importoAcconto ? 'border-red-500' : 'border-gray-300'
              }`}
            />
          </div>
          {errors.importoAcconto && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.importoAcconto}</p>
          )}
          <p className="mt-1 text-xs text-gray-500 dark:text-dark-text-muted">
            Lascia 0 se non è previsto un acconto
          </p>
        </div>

        {/* Saldo (calcolato) */}
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-green-700 dark:text-green-300">
              Saldo rimanente:
            </span>
            <span className="text-xl font-bold text-green-700 dark:text-green-300">
              € {importoSaldo.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Tempistica */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-primary mb-2">
            Tempistica di realizzazione <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.tempistica}
            onChange={(e) => handleChange('tempistica', e.target.value)}
            placeholder="Es: 30 giorni dalla firma dell'incarico per la consegna del rilievo definitivo e della documentazione completa"
            rows={3}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-dark-bg dark:text-dark-text-primary dark:border-dark-border ${
              errors.tempistica ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.tempistica && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.tempistica}</p>
          )}
          <p className="mt-1 text-xs text-gray-500 dark:text-dark-text-muted">
            Specifica i tempi di realizzazione dell'incarico
          </p>
        </div>

        {/* Riepilogo calcoli */}
        <div className="mt-6 p-4 bg-gray-50 dark:bg-dark-hover border border-gray-200 dark:border-dark-border rounded-lg">
          <h3 className="font-semibold text-gray-800 dark:text-dark-text-primary mb-3">
            Riepilogo Economico
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-dark-text-secondary">Importo Netto:</span>
              <span className="font-medium text-gray-900 dark:text-dark-text-primary">
                € {(parseFloat(formData.importoNetto) || 0).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-dark-text-secondary">
                IVA ({formData.iva}%):
              </span>
              <span className="font-medium text-gray-900 dark:text-dark-text-primary">
                € {((parseFloat(formData.importoNetto) || 0) * (parseFloat(formData.iva) || 0) / 100).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-300 dark:border-dark-border">
              <span className="font-semibold text-gray-800 dark:text-dark-text-primary">Totale:</span>
              <span className="font-bold text-gray-900 dark:text-dark-text-primary">
                € {importoTotale.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-blue-700 dark:text-blue-300">
              <span>Acconto:</span>
              <span>- € {(parseFloat(formData.importoAcconto) || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-300 dark:border-dark-border font-bold text-green-700 dark:text-green-300">
              <span>Saldo:</span>
              <span>€ {importoSaldo.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottoni navigazione */}
      <div className="flex justify-between">
        <button
          onClick={onPrev}
          className="px-6 py-3 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-700 text-gray-800 dark:text-white font-semibold rounded-lg shadow-md transition-colors"
        >
          ← Indietro
        </button>

        <button
          onClick={handleContinue}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition-colors"
        >
          Continua →
        </button>
      </div>
    </div>
  );
}

export default Step5Pagamento;

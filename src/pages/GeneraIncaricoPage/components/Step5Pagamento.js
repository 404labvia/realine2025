// src/pages/GeneraIncaricoPage/components/Step5Pagamento.js
import React, { useState, useEffect } from 'react';
import { FaEuroSign, FaCalculator, FaClock, FaCheckCircle, FaCircle } from 'react-icons/fa';

// Dati bancari fissi
const DATI_BANCARI = {
  intestatario: 'REALINE STUDIO di Alessandro De Antoni & C. sas',
  iban: 'IT49Z0306924606100000002815',
};

// Opzioni tempistica predefinite
const OPZIONI_TEMPISTICA = [
  { id: '30_giorni', label: '30 giorni dalla firma dell\'incarico', value: '30 giorni dalla firma dell\'incarico per la consegna della documentazione completa' },
  { id: '60_giorni', label: '60 giorni dalla firma dell\'incarico', value: '60 giorni dalla firma dell\'incarico per la consegna della documentazione completa' },
  { id: 'rogito', label: 'Prima del rogito notarile', value: 'Prima del rogito notarile' },
  { id: 'custom', label: 'Inserimento manuale', value: '' },
];

// Modalità di pagamento
const MODALITA_PAGAMENTO = [
  {
    id: 'standard',
    label: 'Pagamento Standard',
    descrizione: '50% all\'accettazione dell\'incarico, 50% al deposito della pratica',
    accontoPercentuale: 50,
  },
  {
    id: 'rogito',
    label: 'Pagamento al Rogito',
    descrizione: '100% alla chiusura del rogito notarile',
    accontoPercentuale: 0,
  },
];

function Step5Pagamento({ incaricoData, updateIncaricoData, onNext, onPrev }) {
  const [formData, setFormData] = useState({
    importoNetto: incaricoData.importoNetto || '',
    modalitaPagamento: incaricoData.modalitaPagamento || 'standard',
    tempisticaId: incaricoData.tempisticaId || '30_giorni',
    tempisticaCustom: incaricoData.tempisticaCustom || '',
  });

  const [errors, setErrors] = useState({});

  // IVA fissa al 22%
  const IVA_PERCENTUALE = 22;

  // Calcola importi
  const netto = parseFloat(formData.importoNetto) || 0;
  const importoIva = netto * IVA_PERCENTUALE / 100;
  const importoTotale = netto + importoIva;

  // Calcola acconto e saldo basati sulla modalità
  const modalitaSelezionata = MODALITA_PAGAMENTO.find(m => m.id === formData.modalitaPagamento);
  const accontoPercentuale = modalitaSelezionata?.accontoPercentuale || 50;
  const importoAcconto = importoTotale * accontoPercentuale / 100;
  const importoSaldo = importoTotale - importoAcconto;

  // Determina la tempistica
  const getTempistica = () => {
    if (formData.tempisticaId === 'custom') {
      return formData.tempisticaCustom;
    }
    const opzione = OPZIONI_TEMPISTICA.find(o => o.id === formData.tempisticaId);
    return opzione?.value || '';
  };

  // Genera la causale (speciale per relazione tecnica)
  const getCausale = () => {
    if (incaricoData.hasRelazioneTecnica) {
      return 'Acconto per redazione relazione tecnica';
    }
    return 'Acconto per prestazione professionale';
  };

  // Aggiorna dati incarico quando cambiano i valori calcolati
  useEffect(() => {
    const tempistica = getTempistica();

    updateIncaricoData({
      importoNetto: netto,
      iva: IVA_PERCENTUALE,
      importoTotale: Math.round(importoTotale * 100) / 100,
      importoAcconto: Math.round(importoAcconto * 100) / 100,
      importoSaldo: Math.round(importoSaldo * 100) / 100,
      modalitaPagamento: formData.modalitaPagamento,
      tempistica,
      tempisticaId: formData.tempisticaId,
      tempisticaCustom: formData.tempisticaCustom,
      datiBancari: DATI_BANCARI,
      causale: getCausale(),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.importoNetto, formData.modalitaPagamento, formData.tempisticaId, formData.tempisticaCustom]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.importoNetto || netto <= 0) {
      newErrors.importoNetto = 'Importo netto obbligatorio e deve essere maggiore di 0';
    }

    if (formData.tempisticaId === 'custom' && (!formData.tempisticaCustom || formData.tempisticaCustom.trim().length < 5)) {
      newErrors.tempisticaCustom = 'Specifica la tempistica (min. 5 caratteri)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = () => {
    if (validateForm()) {
      onNext();
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white dark:bg-dark-surface rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-dark-text-primary mb-2">
          Dati Pagamento
        </h2>
        <p className="text-gray-600 dark:text-dark-text-secondary mb-6">
          Inserisci l'importo e seleziona le modalità di pagamento
        </p>

        {/* Importo Netto */}
        <div className="mb-6">
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
              placeholder="Es: 1500.00"
              className={`w-full pl-10 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-dark-bg dark:text-dark-text-primary dark:border-dark-border text-lg ${
                errors.importoNetto ? 'border-red-500' : 'border-gray-300'
              }`}
            />
          </div>
          {errors.importoNetto && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.importoNetto}</p>
          )}
          <p className="mt-1 text-xs text-gray-500 dark:text-dark-text-muted">
            IVA al {IVA_PERCENTUALE}% calcolata automaticamente
          </p>
        </div>

        {/* Riepilogo Economico */}
        {netto > 0 && (
          <div className="mb-6 p-4 bg-gray-50 dark:bg-dark-hover border border-gray-200 dark:border-dark-border rounded-lg">
            <div className="flex items-center space-x-2 mb-3">
              <FaCalculator className="text-blue-600 dark:text-blue-400" />
              <h3 className="font-semibold text-gray-800 dark:text-dark-text-primary">
                Riepilogo Economico
              </h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-dark-text-secondary">Importo Netto:</span>
                <span className="font-medium text-gray-900 dark:text-dark-text-primary">
                  € {netto.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-dark-text-secondary">IVA ({IVA_PERCENTUALE}%):</span>
                <span className="font-medium text-gray-900 dark:text-dark-text-primary">
                  € {importoIva.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-300 dark:border-dark-border">
                <span className="font-semibold text-gray-800 dark:text-dark-text-primary">Totale:</span>
                <span className="font-bold text-lg text-blue-700 dark:text-blue-300">
                  € {importoTotale.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Modalità di Pagamento */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-primary mb-3">
            Modalità di Pagamento
          </label>
          <div className="space-y-3">
            {MODALITA_PAGAMENTO.map((modalita) => {
              const isSelected = formData.modalitaPagamento === modalita.id;
              return (
                <button
                  key={modalita.id}
                  onClick={() => handleChange('modalitaPagamento', modalita.id)}
                  className={`
                    w-full p-4 border-2 rounded-lg text-left transition-all
                    ${isSelected
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-dark-border hover:border-blue-300 dark:hover:border-blue-600'
                    }
                  `}
                >
                  <div className="flex items-start space-x-3">
                    <div className="pt-0.5">
                      {isSelected ? (
                        <FaCheckCircle className="text-blue-600 dark:text-blue-400" size={20} />
                      ) : (
                        <FaCircle className="text-gray-300 dark:text-gray-600" size={20} />
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className={`font-semibold ${
                        isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-gray-800 dark:text-dark-text-primary'
                      }`}>
                        {modalita.label}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-dark-text-secondary mt-1">
                        {modalita.descrizione}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dettaglio Acconto e Saldo */}
        {netto > 0 && (
          <div className="mb-6 grid grid-cols-2 gap-4">
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <p className="text-sm text-amber-700 dark:text-amber-300 font-medium mb-1">
                Acconto ({accontoPercentuale}%)
              </p>
              <p className="text-2xl font-bold text-amber-800 dark:text-amber-200">
                € {importoAcconto.toFixed(2)}
              </p>
              {accontoPercentuale > 0 && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                  Alla firma dell'incarico
                </p>
              )}
            </div>
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-sm text-green-700 dark:text-green-300 font-medium mb-1">
                Saldo ({100 - accontoPercentuale}%)
              </p>
              <p className="text-2xl font-bold text-green-800 dark:text-green-200">
                € {importoSaldo.toFixed(2)}
              </p>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                {formData.modalitaPagamento === 'rogito' ? 'Al rogito notarile' : 'Al deposito pratica'}
              </p>
            </div>
          </div>
        )}

        {/* Tempistica */}
        <div className="mb-6">
          <div className="flex items-center space-x-2 mb-3">
            <FaClock className="text-gray-600 dark:text-dark-text-secondary" />
            <label className="text-sm font-medium text-gray-700 dark:text-dark-text-primary">
              Tempistica di realizzazione
            </label>
          </div>
          <div className="space-y-2">
            {OPZIONI_TEMPISTICA.map((opzione) => {
              const isSelected = formData.tempisticaId === opzione.id;
              return (
                <button
                  key={opzione.id}
                  onClick={() => handleChange('tempisticaId', opzione.id)}
                  className={`
                    w-full p-3 border rounded-lg text-left transition-all flex items-center space-x-3
                    ${isSelected
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-dark-border hover:border-blue-300 dark:hover:border-blue-600'
                    }
                  `}
                >
                  {isSelected ? (
                    <FaCheckCircle className="text-blue-600 dark:text-blue-400 flex-shrink-0" size={18} />
                  ) : (
                    <FaCircle className="text-gray-300 dark:text-gray-600 flex-shrink-0" size={18} />
                  )}
                  <span className={`text-sm ${
                    isSelected ? 'text-blue-700 dark:text-blue-300 font-medium' : 'text-gray-700 dark:text-dark-text-secondary'
                  }`}>
                    {opzione.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Campo custom per tempistica */}
          {formData.tempisticaId === 'custom' && (
            <div className="mt-3">
              <textarea
                value={formData.tempisticaCustom}
                onChange={(e) => handleChange('tempisticaCustom', e.target.value)}
                placeholder="Inserisci la tempistica personalizzata..."
                rows={2}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-dark-bg dark:text-dark-text-primary dark:border-dark-border ${
                  errors.tempisticaCustom ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.tempisticaCustom && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.tempisticaCustom}</p>
              )}
            </div>
          )}
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
          disabled={!formData.importoNetto || netto <= 0}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continua →
        </button>
      </div>
    </div>
  );
}

export default Step5Pagamento;

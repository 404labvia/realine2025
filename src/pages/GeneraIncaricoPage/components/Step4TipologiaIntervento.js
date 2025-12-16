// src/pages/GeneraIncaricoPage/components/Step4TipologiaIntervento.js
import React, { useState } from 'react';
import { FaCheckCircle, FaCircle } from 'react-icons/fa';

const interventiDisponibili = [
  { id: 'rilievo', label: 'Rilievo metrico-planimetrico', descrizione: 'Misurazione e rappresentazione dell\'immobile' },
  { id: 'pratica_edilizia', label: 'Pratica edilizia', descrizione: 'CILA, SCIA, Permesso di Costruire' },
  { id: 'agibilita', label: 'Certificato di agibilità', descrizione: 'Attestazione della conformità dell\'immobile' },
  { id: 'accatastamento', label: 'Accatastamento', descrizione: 'Inserimento in catasto o variazione catastale' },
  { id: 'planimetria', label: 'Planimetria catastale', descrizione: 'Aggiornamento planimetria catastale' },
  { id: 'sanatoria', label: 'Sanatoria edilizia', descrizione: 'Regolarizzazione difformità edilizie' },
  { id: 'condono', label: 'Condono edilizio', descrizione: 'Regolarizzazione abusi edilizi' },
  { id: 'ape', label: 'APE - Attestato Prestazione Energetica', descrizione: 'Certificazione energetica dell\'immobile' },
  { id: 'frazionamento', label: 'Frazionamento catastale', descrizione: 'Divisione dell\'unità immobiliare' },
  { id: 'consulenza', label: 'Consulenza tecnica', descrizione: 'Supporto tecnico specialistico' },
  { id: 'perizia', label: 'Perizia estimativa', descrizione: 'Valutazione immobiliare' },
  { id: 'altro', label: 'Altro', descrizione: 'Altra prestazione professionale' },
];

function Step4TipologiaIntervento({ incaricoData, updateIncaricoData, onNext, onPrev }) {
  const [selectedInterventi, setSelectedInterventi] = useState(incaricoData.tipologiaIntervento || []);
  const [customIntervento, setCustomIntervento] = useState('');
  const [error, setError] = useState('');

  const toggleIntervento = (interventoId) => {
    setError('');
    setSelectedInterventi(prev => {
      if (prev.includes(interventoId)) {
        return prev.filter(id => id !== interventoId);
      } else {
        return [...prev, interventoId];
      }
    });
  };

  const addCustomIntervento = () => {
    if (customIntervento.trim() && !selectedInterventi.includes(customIntervento.trim())) {
      setSelectedInterventi(prev => [...prev, customIntervento.trim()]);
      setCustomIntervento('');
      setError('');
    }
  };

  const removeCustomIntervento = (intervento) => {
    setSelectedInterventi(prev => prev.filter(i => i !== intervento));
  };

  const handleContinue = () => {
    if (selectedInterventi.length === 0) {
      setError('Seleziona almeno una tipologia di intervento');
      return;
    }

    updateIncaricoData({ tipologiaIntervento: selectedInterventi });
    onNext();
  };

  // Separa interventi predefiniti da quelli custom
  const custom = selectedInterventi.filter(s => !interventiDisponibili.some(i => i.id === s));

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white dark:bg-dark-surface rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-dark-text-primary mb-2">
          Tipologia Intervento
        </h2>
        <p className="text-gray-600 dark:text-dark-text-secondary mb-6">
          Seleziona una o più tipologie di intervento previste per questo incarico
        </p>

        {/* Lista interventi predefiniti */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
          {interventiDisponibili.map((intervento) => {
            const isSelected = selectedInterventi.includes(intervento.id);

            return (
              <button
                key={intervento.id}
                onClick={() => toggleIntervento(intervento.id)}
                className={`
                  p-4 border-2 rounded-lg text-left transition-all
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
                    <h3 className={`font-semibold ${
                      isSelected
                        ? 'text-blue-700 dark:text-blue-300'
                        : 'text-gray-800 dark:text-dark-text-primary'
                    }`}>
                      {intervento.label}
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-dark-text-secondary mt-1">
                      {intervento.descrizione}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Interventi custom aggiunti */}
        {custom.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 dark:text-dark-text-primary mb-2">
              Interventi personalizzati:
            </h3>
            <div className="flex flex-wrap gap-2">
              {custom.map((intervento, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-2 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-full"
                >
                  <span className="text-sm text-green-800 dark:text-green-300">{intervento}</span>
                  <button
                    onClick={() => removeCustomIntervento(intervento)}
                    className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Campo per aggiungere intervento custom */}
        <div className="border-t pt-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-primary mb-2">
            Aggiungi intervento personalizzato
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              value={customIntervento}
              onChange={(e) => setCustomIntervento(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addCustomIntervento();
                }
              }}
              placeholder="Es: Progetto impianto fotovoltaico"
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-dark-bg dark:text-dark-text-primary"
            />
            <button
              onClick={addCustomIntervento}
              disabled={!customIntervento.trim()}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Aggiungi
            </button>
          </div>
        </div>

        {/* Messaggio di errore */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
          </div>
        )}

        {/* Riepilogo selezioni */}
        {selectedInterventi.length > 0 && (
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-blue-700 dark:text-blue-300 font-medium">
              {selectedInterventi.length} {selectedInterventi.length === 1 ? 'intervento selezionato' : 'interventi selezionati'}
            </p>
          </div>
        )}
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
          disabled={selectedInterventi.length === 0}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continua →
        </button>
      </div>
    </div>
  );
}

export default Step4TipologiaIntervento;

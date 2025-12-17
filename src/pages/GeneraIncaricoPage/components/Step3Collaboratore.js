// src/pages/GeneraIncaricoPage/components/Step3Collaboratore.js
import React, { useState } from 'react';
import { FaCheckCircle, FaCircle, FaUserTie, FaInfoCircle } from 'react-icons/fa';
import { COLLABORATORI } from '../hooks/useIncaricoWizard';

function Step3Collaboratore({ incaricoData, setCollaboratore, onNext, onPrev }) {
  const [error, setError] = useState('');

  const handleSelect = (collaboratoreId) => {
    setError('');
    setCollaboratore(collaboratoreId);
  };

  const handleContinue = () => {
    if (!incaricoData.collaboratoreId) {
      setError('Seleziona un collaboratore per continuare');
      return;
    }
    onNext();
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white dark:bg-dark-surface rounded-lg shadow-lg p-6">
        <div className="flex items-center space-x-2 mb-2">
          <FaUserTie className="text-purple-600 dark:text-purple-400" size={24} />
          <h2 className="text-2xl font-bold text-gray-800 dark:text-dark-text-primary">
            Seleziona Collaboratore
          </h2>
        </div>
        <p className="text-gray-600 dark:text-dark-text-secondary mb-6">
          Seleziona il tecnico che seguirà la pratica. I suoi dati verranno inseriti nel documento.
        </p>

        {/* Lista Collaboratori */}
        <div className="space-y-3">
          {COLLABORATORI.map((collaboratore) => {
            const isSelected = incaricoData.collaboratoreId === collaboratore.id;

            return (
              <button
                key={collaboratore.id}
                onClick={() => handleSelect(collaboratore.id)}
                className={`
                  w-full p-4 border-2 rounded-lg text-left transition-all
                  ${isSelected
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                    : 'border-gray-200 dark:border-dark-border hover:border-purple-300 dark:hover:border-purple-600'
                  }
                `}
              >
                <div className="flex items-start space-x-3">
                  <div className="pt-1">
                    {isSelected ? (
                      <FaCheckCircle className="text-purple-600 dark:text-purple-400" size={22} />
                    ) : (
                      <FaCircle className="text-gray-300 dark:text-gray-600" size={22} />
                    )}
                  </div>

                  <div className="flex-1">
                    <h3 className={`font-semibold text-lg ${
                      isSelected
                        ? 'text-purple-700 dark:text-purple-300'
                        : 'text-gray-800 dark:text-dark-text-primary'
                    }`}>
                      {collaboratore.nome}
                    </h3>

                    <div className="mt-2 text-sm space-y-1">
                      <p className="text-gray-600 dark:text-dark-text-secondary">
                        <span className="font-medium">Iscrizione:</span> {collaboratore.collegio} n. {collaboratore.matricola}
                      </p>
                      <p className="text-gray-600 dark:text-dark-text-secondary">
                        <span className="font-medium">Polizza:</span> {collaboratore.polizza}
                      </p>
                      <p className="text-gray-500 dark:text-dark-text-muted text-xs">
                        CF: {collaboratore.codiceFiscale}
                      </p>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Messaggio di errore */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
          </div>
        )}

        {/* Riepilogo selezione */}
        {incaricoData.collaboratore && (
          <div className="mt-6 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
            <p className="text-purple-700 dark:text-purple-300 font-medium mb-2">
              Collaboratore selezionato:
            </p>
            <p className="text-sm text-purple-800 dark:text-purple-200">
              {incaricoData.collaboratore.descrizioneCompleta}
            </p>
          </div>
        )}

        {/* Info */}
        <div className="mt-6 flex items-start space-x-2 text-xs text-gray-600 dark:text-dark-text-secondary">
          <FaInfoCircle className="mt-0.5 flex-shrink-0" />
          <p>
            I dati del collaboratore selezionato verranno inseriti automaticamente nel documento di incarico.
          </p>
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
          disabled={!incaricoData.collaboratoreId}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continua →
        </button>
      </div>
    </div>
  );
}

export default Step3Collaboratore;

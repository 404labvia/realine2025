// src/pages/GeneraIncaricoPage/components/Step2Visura.js
import React, { useState } from 'react';
import FileUploadZone from './FileUploadZone';
import { extractDataFromVisura, validateVisuraData } from '../utils/ocrUtils';
import { FaSpinner, FaExclamationTriangle } from 'react-icons/fa';

function Step2Visura({ incaricoData, updateIncaricoData, onNext, onPrev }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [error, setError] = useState(null);
  const [extractedData, setExtractedData] = useState(null);

  const handleFileSelect = async (file) => {
    setError(null);
    setIsProcessing(true);
    setOcrProgress(0);

    try {
      // Salva il file
      updateIncaricoData({ visuraFile: file });

      // Esegui OCR
      const data = await extractDataFromVisura(file, (progress) => {
        setOcrProgress(progress);
      });

      setExtractedData(data);

      // Valida dati estratti
      const validation = validateVisuraData(data);

      if (!validation.isValid) {
        setError({
          type: 'warning',
          message: 'Alcuni dati potrebbero non essere stati estratti correttamente. Verifica e modifica manualmente se necessario.',
          details: validation.errors
        });
      }

      // Aggiorna i dati anche se la validazione ha warnings
      updateIncaricoData({
        comuneImmobile: data.comuneImmobile,
        frazioneImmobile: data.frazioneImmobile,
        viaImmobile: data.viaImmobile,
      });

    } catch (err) {
      console.error('Errore durante l\'elaborazione:', err);
      setError({
        type: 'error',
        message: 'Errore durante l\'elaborazione del documento',
        details: [err.message]
      });
    } finally {
      setIsProcessing(false);
      setOcrProgress(0);
    }
  };

  const handleFileRemove = () => {
    updateIncaricoData({
      visuraFile: null,
      comuneImmobile: '',
      frazioneImmobile: '',
      viaImmobile: '',
    });
    setExtractedData(null);
    setError(null);
  };

  const handleContinue = () => {
    if (!incaricoData.visuraFile) {
      setError({
        type: 'error',
        message: 'Carica una visura catastale per continuare',
        details: []
      });
      return;
    }

    onNext();
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white dark:bg-dark-surface rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-dark-text-primary mb-2">
          Carica Visura Catastale
        </h2>
        <p className="text-gray-600 dark:text-dark-text-secondary mb-6">
          Carica la visura catastale dell'immobile. Il sistema estrarrà automaticamente i dati dell'immobile.
        </p>

        <FileUploadZone
          file={incaricoData.visuraFile}
          onFileSelect={handleFileSelect}
          onFileRemove={handleFileRemove}
          label="Visura Catastale"
          description="Assicurati che il documento sia leggibile e ben illuminato"
          acceptedFormats={['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']}
          disabled={isProcessing}
        />

        {/* Progress Bar durante OCR */}
        {isProcessing && (
          <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-3">
              <FaSpinner className="animate-spin text-blue-600 dark:text-blue-400" size={20} />
              <p className="text-blue-700 dark:text-blue-300 font-medium">
                Elaborazione in corso...
              </p>
            </div>

            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${ocrProgress}%` }}
              />
            </div>

            <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
              {ocrProgress}% completato
            </p>
          </div>
        )}

        {/* Messaggio di errore o warning */}
        {error && (
          <div className={`mt-6 border rounded-lg p-4 ${
            error.type === 'error'
              ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
              : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
          }`}>
            <div className="flex items-start space-x-3">
              <FaExclamationTriangle
                className={error.type === 'error' ? 'text-red-600 dark:text-red-400' : 'text-yellow-600 dark:text-yellow-400'}
                size={20}
              />
              <div className="flex-1">
                <p className={`font-medium ${
                  error.type === 'error'
                    ? 'text-red-700 dark:text-red-300'
                    : 'text-yellow-700 dark:text-yellow-300'
                }`}>
                  {error.message}
                </p>
                {error.details && error.details.length > 0 && (
                  <ul className="mt-2 text-sm space-y-1">
                    {error.details.map((detail, index) => (
                      <li key={index} className={
                        error.type === 'error'
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-yellow-600 dark:text-yellow-400'
                      }>
                        • {detail}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Anteprima dati estratti */}
        {extractedData && incaricoData.visuraFile && (
          <div className="mt-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <h3 className="text-green-800 dark:text-green-300 font-semibold mb-3">
              ✓ Dati estratti con successo
            </h3>

            <div className="grid grid-cols-1 gap-3 text-sm">
              <div>
                <span className="text-gray-600 dark:text-dark-text-secondary">Comune:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-dark-text-primary">
                  {incaricoData.comuneImmobile || 'Non rilevato'}
                </span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-dark-text-secondary">Frazione:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-dark-text-primary">
                  {incaricoData.frazioneImmobile || 'Non rilevato'}
                </span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-dark-text-secondary">Indirizzo:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-dark-text-primary">
                  {incaricoData.viaImmobile || 'Non rilevato'}
                </span>
              </div>
            </div>

            <p className="text-xs text-green-700 dark:text-green-400 mt-3 italic">
              Potrai modificare questi dati nel passaggio successivo
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
          disabled={!incaricoData.visuraFile || isProcessing}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continua →
        </button>
      </div>
    </div>
  );
}

export default Step2Visura;

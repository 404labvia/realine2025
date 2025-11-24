// src/pages/GeneraIncaricoPage/components/Step1CartaIdentita.js
import React, { useState } from 'react';
import FileUploadZone from './FileUploadZone';
import { extractDataFromCartaIdentita, validateCartaIdentitaData } from '../utils/ocrUtils';
import { FaSpinner, FaExclamationTriangle } from 'react-icons/fa';

function Step1CartaIdentita({ incaricoData, updateIncaricoData, onNext }) {
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
      updateIncaricoData({ cartaIdentitaFile: file });

      // Esegui OCR
      const data = await extractDataFromCartaIdentita(file, (progress) => {
        setOcrProgress(progress);
      });

      setExtractedData(data);

      // Valida dati estratti
      const validation = validateCartaIdentitaData(data);

      if (!validation.isValid) {
        setError({
          type: 'warning',
          message: 'Alcuni dati potrebbero non essere stati estratti correttamente. Verifica e modifica manualmente se necessario.',
          details: validation.errors
        });
      }

      // Aggiorna i dati anche se la validazione ha warnings
      updateIncaricoData({
        nomeCommittente: data.nomeCommittente,
        cognomeCommittente: data.cognomeCommittente,
        codiceFiscale: data.codiceFiscale,
        dataNascita: data.dataNascita,
        luogoNascita: data.luogoNascita,
        residenza: data.residenza,
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
      cartaIdentitaFile: null,
      nomeCommittente: '',
      cognomeCommittente: '',
      codiceFiscale: '',
      dataNascita: '',
      luogoNascita: '',
      residenza: '',
    });
    setExtractedData(null);
    setError(null);
  };

  const handleContinue = () => {
    if (!incaricoData.cartaIdentitaFile) {
      setError({
        type: 'error',
        message: 'Carica una carta d\'identità per continuare',
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
          Carica Carta d'Identità
        </h2>
        <p className="text-gray-600 dark:text-dark-text-secondary mb-6">
          Carica la carta d'identità del committente. Il sistema estrarrà automaticamente i dati anagrafici.
        </p>

        <FileUploadZone
          file={incaricoData.cartaIdentitaFile}
          onFileSelect={handleFileSelect}
          onFileRemove={handleFileRemove}
          label="Carta d'Identità"
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
        {extractedData && incaricoData.cartaIdentitaFile && (
          <div className="mt-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <h3 className="text-green-800 dark:text-green-300 font-semibold mb-3">
              ✓ Dati estratti con successo
            </h3>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-600 dark:text-dark-text-secondary">Nome:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-dark-text-primary">
                  {incaricoData.nomeCommittente || 'Non rilevato'}
                </span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-dark-text-secondary">Cognome:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-dark-text-primary">
                  {incaricoData.cognomeCommittente || 'Non rilevato'}
                </span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-dark-text-secondary">Codice Fiscale:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-dark-text-primary">
                  {incaricoData.codiceFiscale || 'Non rilevato'}
                </span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-dark-text-secondary">Data Nascita:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-dark-text-primary">
                  {incaricoData.dataNascita || 'Non rilevato'}
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
      <div className="flex justify-end">
        <button
          onClick={handleContinue}
          disabled={!incaricoData.cartaIdentitaFile || isProcessing}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continua →
        </button>
      </div>
    </div>
  );
}

export default Step1CartaIdentita;

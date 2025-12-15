// src/pages/GeneraIncaricoPage/components/Step2CartaIdentita.js
import React, { useState } from 'react';
import FileUploadZone from './FileUploadZone';
import { extractResidenzaFromCartaIdentita } from '../../../services/claudeService';
import { validateResidenzaData } from '../utils/validationUtils';
import { FaSpinner, FaExclamationTriangle, FaCheckCircle, FaHome, FaForward, FaInfoCircle, FaPlus, FaTrash } from 'react-icons/fa';

function Step2CartaIdentita({
  incaricoData,
  updateIncaricoData,
  setResidenzaExtractedData,
  skipCartaIdentita,
  onNext,
  onPrev,
}) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [validation, setValidation] = useState(null);
  const [files, setFiles] = useState(incaricoData.cartaIdentitaFiles || []);

  const handleFileSelect = (file) => {
    // Aggiungi il file all'array (max 2: fronte e retro)
    if (files.length >= 2) {
      setError({
        type: 'warning',
        message: 'Puoi caricare massimo 2 immagini (fronte e retro). Rimuovi una per aggiungerne un\'altra.',
      });
      return;
    }

    const newFiles = [...files, file];
    setFiles(newFiles);
    updateIncaricoData({ cartaIdentitaFiles: newFiles });
    setError(null);
  };

  const handleFileRemove = (index) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    updateIncaricoData({
      cartaIdentitaFiles: newFiles,
      residenzaData: null,
    });
    setError(null);
    setValidation(null);
  };

  const handleProcess = async () => {
    if (files.length === 0) {
      setError({
        type: 'error',
        message: 'Carica almeno un\'immagine della carta d\'identità',
      });
      return;
    }

    setError(null);
    setValidation(null);
    setIsProcessing(true);
    setProgress(0);

    try {
      // Estrai la residenza con Claude Vision
      const result = await extractResidenzaFromCartaIdentita(files, (p) => setProgress(p));

      if (!result.success) {
        setError({
          type: 'warning',
          message: result.error || 'Non è stato possibile estrarre la residenza. Puoi continuare senza o caricare un\'altra immagine.',
        });
        return;
      }

      // Valida i dati
      const validationResult = validateResidenzaData(result.data);
      setValidation(validationResult);

      // Imposta i dati estratti
      setResidenzaExtractedData(result.data);

      if (!validationResult.isValid) {
        setError({
          type: 'warning',
          message: 'Residenza estratta parzialmente. Verifica i dati.',
          details: [...validationResult.errors, ...validationResult.warnings],
        });
      }

    } catch (err) {
      console.error('Errore durante l\'elaborazione:', err);
      setError({
        type: 'error',
        message: err.message || 'Errore durante l\'elaborazione del documento',
      });
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const handleSkip = () => {
    skipCartaIdentita();
    onNext();
  };

  const handleContinue = () => {
    // Se ha caricato file ma non elaborato, chiedi di elaborare
    if (files.length > 0 && !incaricoData.residenzaData) {
      setError({
        type: 'warning',
        message: 'Hai caricato delle immagini ma non le hai elaborate. Clicca "Estrai Residenza" oppure "Salta" per continuare.',
      });
      return;
    }

    onNext();
  };

  const hasResidenza = incaricoData.residenzaData?.residenza;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white dark:bg-dark-surface rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-dark-text-primary mb-2">
              Carta d'Identità
            </h2>
            <p className="text-gray-600 dark:text-dark-text-secondary">
              Carica la carta d'identità per estrarre la residenza del committente.
            </p>
          </div>

          {/* Badge opzionale */}
          <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-3 py-1 rounded-full">
            Opzionale
          </span>
        </div>

        {/* Info box */}
        <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <div className="flex items-start space-x-2">
            <FaInfoCircle className="text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-blue-700 dark:text-blue-300">
              La residenza serve per il documento di incarico. Se non carichi la CI, verrà usato l'indirizzo dell'immobile come residenza.
            </p>
          </div>
        </div>

        {/* File caricati */}
        {files.length > 0 && (
          <div className="mb-4 space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-primary">
              Immagini caricate ({files.length}/2)
            </label>
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-hover rounded-lg border border-gray-200 dark:border-dark-border"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                    {index === 0 ? 'Fronte' : 'Retro'}
                  </span>
                  <span className="text-sm text-gray-700 dark:text-dark-text-primary truncate max-w-[200px]">
                    {file.name}
                  </span>
                </div>
                <button
                  onClick={() => handleFileRemove(index)}
                  disabled={isProcessing}
                  className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 disabled:opacity-50"
                >
                  <FaTrash size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Upload zone se meno di 2 file */}
        {files.length < 2 && (
          <div className="mb-4">
            <FileUploadZone
              file={null}
              onFileSelect={handleFileSelect}
              onFileRemove={() => { }}
              label={files.length === 0 ? "Carica Fronte CI" : "Aggiungi Retro CI"}
              description="Carica il fronte e/o retro della carta d'identità"
              acceptedFormats={['image/jpeg', 'image/png', 'image/jpg']}
              disabled={isProcessing}
            />
          </div>
        )}

        {/* Pulsante Estrai */}
        {files.length > 0 && !hasResidenza && (
          <button
            onClick={handleProcess}
            disabled={isProcessing}
            className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isProcessing ? (
              <>
                <FaSpinner className="animate-spin" />
                <span>Elaborazione in corso...</span>
              </>
            ) : (
              <>
                <FaHome />
                <span>Estrai Residenza</span>
              </>
            )}
          </button>
        )}

        {/* Progress Bar durante elaborazione */}
        {isProcessing && (
          <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-2 text-center">
              Analisi immagine con AI...
            </p>
          </div>
        )}

        {/* Messaggio di errore o warning */}
        {error && (
          <div className={`mt-4 border rounded-lg p-4 ${error.type === 'error'
              ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
              : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
            }`}>
            <div className="flex items-start space-x-3">
              <FaExclamationTriangle
                className={error.type === 'error' ? 'text-red-600 dark:text-red-400' : 'text-yellow-600 dark:text-yellow-400'}
                size={20}
              />
              <div className="flex-1">
                <p className={`font-medium ${error.type === 'error'
                    ? 'text-red-700 dark:text-red-300'
                    : 'text-yellow-700 dark:text-yellow-300'
                  }`}>
                  {error.message}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Anteprima residenza estratta */}
        {hasResidenza && (
          <div className="mt-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <FaCheckCircle className="text-green-600 dark:text-green-400" />
              <h3 className="text-green-800 dark:text-green-300 font-semibold">
                Residenza estratta
              </h3>
            </div>

            <div className="text-sm space-y-1">
              <p className="text-gray-900 dark:text-dark-text-primary">
                <span className="text-gray-600 dark:text-dark-text-secondary">Indirizzo: </span>
                <strong>{incaricoData.residenzaData.residenza.indirizzoCompleto || 'N/D'}</strong>
              </p>
              <p className="text-gray-900 dark:text-dark-text-primary">
                <span className="text-gray-600 dark:text-dark-text-secondary">Comune: </span>
                {incaricoData.residenzaData.residenza.comune || 'N/D'}
                {incaricoData.residenzaData.residenza.provincia && ` (${incaricoData.residenzaData.residenza.provincia})`}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Bottoni navigazione */}
      <div className="flex justify-between">
        <button
          onClick={onPrev}
          disabled={isProcessing}
          className="px-6 py-3 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-700 text-gray-800 dark:text-white font-semibold rounded-lg shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ← Indietro
        </button>

        <div className="flex space-x-3">
          {/* Pulsante Salta */}
          <button
            onClick={handleSkip}
            disabled={isProcessing}
            className="px-6 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-semibold rounded-lg shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <FaForward size={14} />
            <span>Salta</span>
          </button>

          {/* Pulsante Continua */}
          <button
            onClick={handleContinue}
            disabled={isProcessing}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continua →
          </button>
        </div>
      </div>
    </div>
  );
}

export default Step2CartaIdentita;

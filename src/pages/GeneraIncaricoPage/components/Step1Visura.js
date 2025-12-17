// src/pages/GeneraIncaricoPage/components/Step1Visura.js
import React, { useState } from 'react';
import FileUploadZone from './FileUploadZone';
import { extractDataFromVisuraCatastale } from '../../../services/claudeService';
import { validateVisuraData, formatIntestatarioName, formatQuotaProprieta } from '../utils/validationUtils';
import { usePratichePrivato } from '../../../contexts/PratichePrivatoContext';
import { FaSpinner, FaExclamationTriangle, FaCheckCircle, FaUser, FaHome, FaInfoCircle, FaEdit, FaCalendarAlt, FaFolderOpen } from 'react-icons/fa';

function Step1Visura({ incaricoData, setVisuraExtractedData, updateIncaricoData, updateImmobileData, updateClassamentoData, setPratica, onNext }) {
  const { pratiche, loading: praticheLoading } = usePratichePrivato();
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [validation, setValidation] = useState(null);
  const [isEditingImmobile, setIsEditingImmobile] = useState(false);

  const handlePraticaSelect = (e) => {
    const praticaId = e.target.value;
    if (praticaId) {
      const pratica = pratiche.find(p => p.id === praticaId);
      setPratica(praticaId, pratica?.titolo || pratica?.nome || `Pratica ${praticaId}`);
    } else {
      setPratica(null, '');
    }
  };

  const handleFileSelect = async (file) => {
    setError(null);
    setValidation(null);
    setIsProcessing(true);
    setProgress(0);

    try {
      // Salva il file
      updateIncaricoData({ visuraFile: file });

      // Estrai i dati con Claude
      const result = await extractDataFromVisuraCatastale(file, (p) => setProgress(p));

      if (!result.success) {
        setError({
          type: 'error',
          message: result.error || 'Errore durante l\'elaborazione della visura',
          allowManual: true,
        });

        // Imposta template vuoto per inserimento manuale
        if (result.emptyTemplate) {
          setVisuraExtractedData(result.emptyTemplate);
        }
        return;
      }

      // Valida i dati estratti
      const validationResult = validateVisuraData(result.data);
      setValidation(validationResult);

      // Imposta i dati estratti
      setVisuraExtractedData(result.data);

      if (!validationResult.isValid) {
        setError({
          type: 'warning',
          message: 'Alcuni dati potrebbero essere incompleti. Verifica e completa manualmente se necessario.',
          details: [...validationResult.errors, ...validationResult.warnings],
        });
      }

    } catch (err) {
      console.error('Errore durante l\'elaborazione:', err);
      setError({
        type: 'error',
        message: err.message || 'Errore durante l\'elaborazione del documento',
        allowManual: true,
      });
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const handleFileRemove = () => {
    updateIncaricoData({
      visuraFile: null,
      visuraData: null,
      intestatari: [],
      immobile: {
        comune: '',
        provincia: '',
        foglio: '',
        particella: '',
        subalterno: '',
        indirizzo: '',
        interno: '',
        piano: '',
      },
      classamento: {
        categoria: '',
        classe: '',
        consistenza: '',
        superficieCatastale: '',
        rendita: '',
      },
      datiDerivanti: '',
    });
    setError(null);
    setValidation(null);
    setIsEditingImmobile(false);
  };

  const handleContinue = () => {
    if (!incaricoData.praticaId) {
      setError({
        type: 'error',
        message: 'Seleziona una pratica per continuare',
      });
      return;
    }

    if (!incaricoData.visuraFile) {
      setError({
        type: 'error',
        message: 'Carica una visura catastale per continuare',
      });
      return;
    }

    if (incaricoData.intestatari.length === 0) {
      setError({
        type: 'error',
        message: 'Nessun intestatario trovato. Verifica che il documento sia una visura catastale valida.',
      });
      return;
    }

    onNext();
  };

  const handleImmobileChange = (field, value) => {
    updateImmobileData({ [field]: value });
  };

  const handleClassamentoChange = (field, value) => {
    updateClassamentoData({ [field]: value });
  };

  const handleDatiDerivantiChange = (value) => {
    updateIncaricoData({ datiDerivanti: value });
  };

  const handleDataIncaricoChange = (e) => {
    updateIncaricoData({ dataIncarico: e.target.value });
  };

  const hasExtractedData = incaricoData.intestatari && incaricoData.intestatari.length > 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Selezione Pratica */}
      <div className="bg-white dark:bg-dark-surface rounded-lg shadow-lg p-6">
        <div className="flex items-center space-x-2 mb-4">
          <FaFolderOpen className="text-blue-600 dark:text-blue-400" size={20} />
          <h2 className="text-xl font-bold text-gray-800 dark:text-dark-text-primary">
            Seleziona Pratica
          </h2>
        </div>
        <p className="text-gray-600 dark:text-dark-text-secondary mb-4 text-sm">
          Associa questo incarico a una pratica esistente
        </p>

        {praticheLoading ? (
          <div className="flex items-center space-x-2 text-gray-500">
            <FaSpinner className="animate-spin" />
            <span>Caricamento pratiche...</span>
          </div>
        ) : (
          <select
            value={incaricoData.praticaId || ''}
            onChange={handlePraticaSelect}
            className="w-full px-4 py-3 border border-gray-300 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-dark-bg dark:text-dark-text-primary"
          >
            <option value="">-- Seleziona una pratica --</option>
            {pratiche.map((pratica) => (
              <option key={pratica.id} value={pratica.id}>
                {pratica.titolo || pratica.nome || `Pratica ${pratica.id}`}
                {pratica.committente && ` - ${pratica.committente}`}
              </option>
            ))}
          </select>
        )}

        {incaricoData.praticaId && (
          <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-green-700 dark:text-green-300 text-sm">
              <FaCheckCircle className="inline mr-2" />
              Pratica selezionata: <strong>{incaricoData.praticaNome}</strong>
            </p>
          </div>
        )}
      </div>

      {/* Data Incarico */}
      <div className="bg-white dark:bg-dark-surface rounded-lg shadow-lg p-6">
        <div className="flex items-center space-x-2 mb-4">
          <FaCalendarAlt className="text-purple-600 dark:text-purple-400" size={20} />
          <h2 className="text-xl font-bold text-gray-800 dark:text-dark-text-primary">
            Data Incarico
          </h2>
        </div>
        <input
          type="text"
          value={incaricoData.dataIncarico}
          onChange={handleDataIncaricoChange}
          placeholder="DD/MM/YYYY"
          className="w-full max-w-xs px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-dark-bg dark:text-dark-text-primary"
        />
        <p className="text-xs text-gray-500 dark:text-dark-text-muted mt-2">
          Formato: GG/MM/AAAA (es: 17/12/2025)
        </p>
      </div>

      {/* Upload Visura */}
      <div className="bg-white dark:bg-dark-surface rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-dark-text-primary mb-2">
          Carica Visura Catastale
        </h2>
        <p className="text-gray-600 dark:text-dark-text-secondary mb-6">
          Carica la visura catastale dell'immobile. Il sistema estrarrà automaticamente i dati degli intestatari e dell'immobile.
        </p>

        <FileUploadZone
          file={incaricoData.visuraFile}
          onFileSelect={handleFileSelect}
          onFileRemove={handleFileRemove}
          label="Visura Catastale"
          description="PDF preferito (estrazione testo più precisa). Supporta anche immagini."
          acceptedFormats={['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']}
          disabled={isProcessing}
        />

        {/* Progress Bar durante elaborazione */}
        {isProcessing && (
          <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-3">
              <FaSpinner className="animate-spin text-blue-600 dark:text-blue-400" size={20} />
              <p className="text-blue-700 dark:text-blue-300 font-medium">
                Analisi in corso con AI...
              </p>
            </div>

            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>

            <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
              {progress < 30 ? 'Preparazione documento...' :
                progress < 60 ? 'Invio a Claude AI...' :
                  progress < 90 ? 'Elaborazione risposta...' : 'Completamento...'}
            </p>
          </div>
        )}

        {/* Messaggio di errore o warning */}
        {error && (
          <div className={`mt-6 border rounded-lg p-4 ${error.type === 'error'
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
                {error.allowManual && (
                  <p className="mt-2 text-sm italic">
                    Potrai inserire i dati manualmente.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Anteprima dati estratti */}
        {hasExtractedData && incaricoData.visuraFile && (
          <div className="mt-6 space-y-4">
            {/* Intestatari */}
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <FaUser className="text-green-600 dark:text-green-400" />
                <h3 className="text-green-800 dark:text-green-300 font-semibold">
                  Intestatari trovati: {incaricoData.intestatari.length}
                </h3>
              </div>

              <div className="space-y-2">
                {incaricoData.intestatari.map((intestatario, index) => (
                  <div key={index} className="bg-white dark:bg-dark-bg rounded p-3 text-sm">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-dark-text-primary">
                          {formatIntestatarioName(intestatario)}
                        </p>
                        <p className="text-gray-600 dark:text-dark-text-secondary text-xs mt-1">
                          CF: {intestatario.codiceFiscale || 'N/D'} |
                          Nato/a: {intestatario.luogoNascita || 'N/D'} ({intestatario.provinciaNascita || ''}) il {intestatario.dataNascita || 'N/D'}
                        </p>
                      </div>
                      <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                        {formatQuotaProprieta(intestatario.quotaProprieta)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Dati Immobile Completi */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <FaHome className="text-blue-600 dark:text-blue-400" />
                  <h3 className="text-blue-800 dark:text-blue-300 font-semibold">
                    Dati Immobile
                  </h3>
                </div>
                <button
                  onClick={() => setIsEditingImmobile(!isEditingImmobile)}
                  className="flex items-center space-x-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                >
                  <FaEdit size={14} />
                  <span>{isEditingImmobile ? 'Chiudi' : 'Modifica'}</span>
                </button>
              </div>

              {isEditingImmobile ? (
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <label className="block text-gray-600 dark:text-dark-text-secondary mb-1">Comune</label>
                    <input
                      type="text"
                      value={incaricoData.immobile.comune}
                      onChange={(e) => handleImmobileChange('comune', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 dark:border-dark-border rounded dark:bg-dark-bg dark:text-dark-text-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-600 dark:text-dark-text-secondary mb-1">Provincia</label>
                    <input
                      type="text"
                      value={incaricoData.immobile.provincia}
                      onChange={(e) => handleImmobileChange('provincia', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 dark:border-dark-border rounded dark:bg-dark-bg dark:text-dark-text-primary"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-gray-600 dark:text-dark-text-secondary mb-1">Indirizzo</label>
                    <input
                      type="text"
                      value={incaricoData.immobile.indirizzo}
                      onChange={(e) => handleImmobileChange('indirizzo', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 dark:border-dark-border rounded dark:bg-dark-bg dark:text-dark-text-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-600 dark:text-dark-text-secondary mb-1">Interno</label>
                    <input
                      type="text"
                      value={incaricoData.immobile.interno}
                      onChange={(e) => handleImmobileChange('interno', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 dark:border-dark-border rounded dark:bg-dark-bg dark:text-dark-text-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-600 dark:text-dark-text-secondary mb-1">Piano</label>
                    <input
                      type="text"
                      value={incaricoData.immobile.piano}
                      onChange={(e) => handleImmobileChange('piano', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 dark:border-dark-border rounded dark:bg-dark-bg dark:text-dark-text-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-600 dark:text-dark-text-secondary mb-1">Foglio</label>
                    <input
                      type="text"
                      value={incaricoData.immobile.foglio}
                      onChange={(e) => handleImmobileChange('foglio', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 dark:border-dark-border rounded dark:bg-dark-bg dark:text-dark-text-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-600 dark:text-dark-text-secondary mb-1">Particella</label>
                    <input
                      type="text"
                      value={incaricoData.immobile.particella}
                      onChange={(e) => handleImmobileChange('particella', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 dark:border-dark-border rounded dark:bg-dark-bg dark:text-dark-text-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-600 dark:text-dark-text-secondary mb-1">Subalterno</label>
                    <input
                      type="text"
                      value={incaricoData.immobile.subalterno}
                      onChange={(e) => handleImmobileChange('subalterno', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 dark:border-dark-border rounded dark:bg-dark-bg dark:text-dark-text-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-600 dark:text-dark-text-secondary mb-1">Categoria</label>
                    <input
                      type="text"
                      value={incaricoData.classamento.categoria}
                      onChange={(e) => handleClassamentoChange('categoria', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 dark:border-dark-border rounded dark:bg-dark-bg dark:text-dark-text-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-600 dark:text-dark-text-secondary mb-1">Classe</label>
                    <input
                      type="text"
                      value={incaricoData.classamento.classe}
                      onChange={(e) => handleClassamentoChange('classe', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 dark:border-dark-border rounded dark:bg-dark-bg dark:text-dark-text-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-600 dark:text-dark-text-secondary mb-1">Consistenza</label>
                    <input
                      type="text"
                      value={incaricoData.classamento.consistenza}
                      onChange={(e) => handleClassamentoChange('consistenza', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 dark:border-dark-border rounded dark:bg-dark-bg dark:text-dark-text-primary"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-gray-600 dark:text-dark-text-secondary mb-1">Superficie Catastale</label>
                    <input
                      type="text"
                      value={incaricoData.classamento.superficieCatastale}
                      onChange={(e) => handleClassamentoChange('superficieCatastale', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 dark:border-dark-border rounded dark:bg-dark-bg dark:text-dark-text-primary"
                      placeholder="Es: Totale: 69 m² Totale escluse aree scoperte: 61 m²"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-600 dark:text-dark-text-secondary mb-1">Rendita (€)</label>
                    <input
                      type="text"
                      value={incaricoData.classamento.rendita}
                      onChange={(e) => handleClassamentoChange('rendita', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 dark:border-dark-border rounded dark:bg-dark-bg dark:text-dark-text-primary"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-gray-600 dark:text-dark-text-secondary mb-1">Dati Derivanti Da</label>
                    <textarea
                      value={incaricoData.datiDerivanti}
                      onChange={(e) => handleDatiDerivantiChange(e.target.value)}
                      rows={2}
                      className="w-full px-2 py-1 border border-gray-300 dark:border-dark-border rounded dark:bg-dark-bg dark:text-dark-text-primary"
                      placeholder="Es: Variazione del 09/11/2015 - Inserimento in visura dei dati di superficie."
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-dark-text-secondary">Comune:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-dark-text-primary">
                      {incaricoData.immobile.comune || 'N/D'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-dark-text-secondary">Provincia:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-dark-text-primary">
                      {incaricoData.immobile.provincia || 'N/D'}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-600 dark:text-dark-text-secondary">Indirizzo:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-dark-text-primary">
                      {incaricoData.immobile.indirizzo || 'N/D'}
                      {incaricoData.immobile.interno && ` - Int. ${incaricoData.immobile.interno}`}
                      {incaricoData.immobile.piano && ` - Piano ${incaricoData.immobile.piano}`}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-dark-text-secondary">Foglio:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-dark-text-primary">
                      {incaricoData.immobile.foglio || 'N/D'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-dark-text-secondary">Particella:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-dark-text-primary">
                      {incaricoData.immobile.particella || 'N/D'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-dark-text-secondary">Sub:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-dark-text-primary">
                      {incaricoData.immobile.subalterno || 'N/D'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-dark-text-secondary">Categoria:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-dark-text-primary">
                      {incaricoData.classamento.categoria || 'N/D'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-dark-text-secondary">Classe:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-dark-text-primary">
                      {incaricoData.classamento.classe || 'N/D'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-dark-text-secondary">Consistenza:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-dark-text-primary">
                      {incaricoData.classamento.consistenza || 'N/D'}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-600 dark:text-dark-text-secondary">Superficie Catastale:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-dark-text-primary">
                      {incaricoData.classamento.superficieCatastale || 'N/D'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-dark-text-secondary">Rendita:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-dark-text-primary">
                      {incaricoData.classamento.rendita ? `€ ${incaricoData.classamento.rendita}` : 'N/D'}
                    </span>
                  </div>
                  {incaricoData.datiDerivanti && (
                    <div className="col-span-2 pt-2 border-t border-blue-200 dark:border-blue-700">
                      <span className="text-gray-600 dark:text-dark-text-secondary">Dati Derivanti Da:</span>
                      <p className="mt-1 font-medium text-gray-900 dark:text-dark-text-primary text-xs">
                        {incaricoData.datiDerivanti}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex items-start space-x-2 text-xs text-gray-600 dark:text-dark-text-secondary">
              <FaInfoCircle className="mt-0.5 flex-shrink-0" />
              <p>
                Nello step successivo potrai selezionare il committente tra gli intestatari trovati.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Bottoni navigazione */}
      <div className="flex justify-end">
        <button
          onClick={handleContinue}
          disabled={!incaricoData.visuraFile || isProcessing || !incaricoData.praticaId}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continua →
        </button>
      </div>
    </div>
  );
}

export default Step1Visura;

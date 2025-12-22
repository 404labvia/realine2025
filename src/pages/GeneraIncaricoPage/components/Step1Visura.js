// src/pages/GeneraIncaricoPage/components/Step1Visura.js
import React, { useState, useMemo } from 'react';
import FileUploadZone from './FileUploadZone';
import { extractDataFromVisuraCatastale, extractDataFromCartaIdentita } from '../../../services/claudeService';
import { validateVisuraData, formatIntestatarioName, formatQuotaProprieta } from '../utils/validationUtils';
import { usePratiche } from '../../../contexts/PraticheContext';
import { usePratichePrivato } from '../../../contexts/PratichePrivatoContext';
import { FaSpinner, FaExclamationTriangle, FaCheckCircle, FaUser, FaHome, FaInfoCircle, FaEdit, FaCalendarAlt, FaFolderOpen, FaSave, FaIdCard, FaFileAlt } from 'react-icons/fa';

function Step1Visura({ incaricoData, setVisuraExtractedData, updateIncaricoData, updateImmobileData, updateClassamentoData, setPratica, onNext }) {
  // Usa entrambi i context come nel Calendario
  const { pratiche: praticheStandard, loading: loadingPraticheStandard, updatePratica: updatePraticaStandard } = usePratiche();
  const { pratiche: pratichePrivate, loading: loadingPratichePrivate, updatePratica: updatePraticaPrivato } = usePratichePrivato();

  const [isProcessingVisura, setIsProcessingVisura] = useState(false);
  const [isProcessingCI, setIsProcessingCI] = useState(false);
  const [progressVisura, setProgressVisura] = useState(0);
  const [progressCI, setProgressCI] = useState(0);
  const [error, setError] = useState(null);
  const [ciError, setCiError] = useState(null);
  const [validation, setValidation] = useState(null);
  const [isEditingImmobile, setIsEditingImmobile] = useState(false);
  const [isSavingToFirebase, setIsSavingToFirebase] = useState(false);
  const [savedToFirebase, setSavedToFirebase] = useState(false);

  // Stato per carta d'identità
  const [ciFile, setCiFile] = useState(null);
  const [ciExtractedData, setCiExtractedData] = useState(null);

  // Combina le pratiche come nel Calendario
  const tutteLePratiche = useMemo(() => {
    if (loadingPraticheStandard || loadingPratichePrivate) return [];
    const std = Array.isArray(praticheStandard) ? praticheStandard : [];
    const prv = Array.isArray(pratichePrivate) ? pratichePrivate : [];
    return [...std, ...prv];
  }, [praticheStandard, pratichePrivate, loadingPraticheStandard, loadingPratichePrivate]);

  // Filtra solo pratiche "in corso" (non completate)
  const praticheInCorso = useMemo(() => {
    return tutteLePratiche.filter(pratica => pratica.stato !== 'Completata');
  }, [tutteLePratiche]);

  // Verifica se una pratica è privata
  const isPraticaPrivata = (praticaId) => {
    return pratichePrivate.some(p => p.id === praticaId);
  };

  // Formatta la label della pratica come nel Calendario
  const formatPraticaLabel = (pratica) => {
    const codice = pratica.codice || `ID:${pratica.id.substring(0, 5)}`;
    const indirizzo = pratica.indirizzo || pratica.titolo || pratica.nome || '';
    const cliente = pratica.cliente || pratica.committente || 'N/D';
    const isPrivata = isPraticaPrivata(pratica.id);
    return `${codice} - ${indirizzo} (${cliente})${isPrivata ? ' (Priv.)' : ''}`;
  };

  // Carica i dati visura salvati nella pratica
  const loadVisuraDataFromPratica = (pratica) => {
    if (pratica.visuraData) {
      setVisuraExtractedData({
        intestatari: pratica.visuraData.intestatari || [],
        datiIdentificativi: {
          comune: pratica.visuraData.immobile?.comune || '',
          provincia: pratica.visuraData.immobile?.provincia || '',
          foglio: pratica.visuraData.immobile?.foglio || '',
          particella: pratica.visuraData.immobile?.particella || '',
          subalterno: pratica.visuraData.immobile?.subalterno || '',
          indirizzo: pratica.visuraData.immobile?.indirizzo || '',
          interno: pratica.visuraData.immobile?.interno || '',
          piano: pratica.visuraData.immobile?.piano || '',
        },
        datiClassamento: {
          categoria: pratica.visuraData.classamento?.categoria || '',
          classe: pratica.visuraData.classamento?.classe || '',
          consistenza: pratica.visuraData.classamento?.consistenza || '',
          superficieCatastale: pratica.visuraData.classamento?.superficieCatastale || '',
          rendita: pratica.visuraData.classamento?.rendita || '',
        },
        datiDerivanti: pratica.visuraData.datiDerivanti || '',
      });

      // Imposta un file "virtuale" per indicare che i dati sono stati caricati
      updateIncaricoData({
        visuraFile: { name: 'Dati caricati dalla pratica', type: 'saved' },
      });

      setError({
        type: 'success',
        message: `Dati visura caricati dalla pratica (salvati il ${new Date(pratica.visuraData.dataEstrazione).toLocaleDateString('it-IT')})`,
      });
      setSavedToFirebase(true);
    }
  };

  const handlePraticaSelect = (e) => {
    const praticaId = e.target.value;
    if (praticaId) {
      const pratica = tutteLePratiche.find(p => p.id === praticaId);
      const isPrivata = isPraticaPrivata(praticaId);
      setPratica(praticaId, formatPraticaLabel(pratica), isPrivata);
      setSavedToFirebase(false);
      setError(null);

      // Auto-load visuraData se presente (Option A)
      if (pratica.visuraData) {
        loadVisuraDataFromPratica(pratica);
      }
    } else {
      setPratica(null, '', false);
    }
  };

  // Salva i dati della visura nella pratica su Firebase
  const saveVisuraToFirebase = async () => {
    if (!incaricoData.praticaId || !incaricoData.intestatari.length) {
      setError({
        type: 'error',
        message: 'Seleziona una pratica e carica una visura prima di salvare',
      });
      return;
    }

    setIsSavingToFirebase(true);
    setError(null);

    try {
      const visuraData = {
        intestatari: incaricoData.intestatari,
        immobile: incaricoData.immobile,
        classamento: incaricoData.classamento,
        datiDerivanti: incaricoData.datiDerivanti,
        dataEstrazione: new Date().toISOString(),
      };

      // Usa il context corretto in base al tipo di pratica
      if (incaricoData.isPraticaPrivata) {
        await updatePraticaPrivato(incaricoData.praticaId, { visuraData });
      } else {
        await updatePraticaStandard(incaricoData.praticaId, { visuraData });
      }

      setSavedToFirebase(true);
      setError({
        type: 'success',
        message: 'Dati visura salvati nella pratica con successo!',
      });
    } catch (err) {
      console.error('Errore salvataggio Firebase:', err);
      setError({
        type: 'error',
        message: 'Errore durante il salvataggio dei dati nella pratica: ' + err.message,
      });
    } finally {
      setIsSavingToFirebase(false);
    }
  };

  // === GESTIONE VISURA ===
  const handleVisuraFileSelect = async (file) => {
    setError(null);
    setValidation(null);
    setIsProcessingVisura(true);
    setProgressVisura(0);
    setSavedToFirebase(false);

    // Se c'è una carta d'identità, rimuovila (logica esclusiva)
    if (ciFile) {
      setCiFile(null);
      setCiExtractedData(null);
      setCiError(null);
    }

    try {
      updateIncaricoData({ visuraFile: file });

      const result = await extractDataFromVisuraCatastale(file, (p) => setProgressVisura(p));

      if (!result.success) {
        setError({
          type: 'error',
          message: result.error || 'Errore durante l\'elaborazione della visura',
          allowManual: true,
        });

        if (result.emptyTemplate) {
          setVisuraExtractedData(result.emptyTemplate);
        }
        return;
      }

      const validationResult = validateVisuraData(result.data);
      setValidation(validationResult);
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
      setIsProcessingVisura(false);
      setProgressVisura(0);
    }
  };

  const handleVisuraFileRemove = () => {
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
    setSavedToFirebase(false);
  };

  // === GESTIONE CARTA D'IDENTITÀ ===
  const handleCIFileSelect = async (file) => {
    setCiError(null);
    setIsProcessingCI(true);
    setProgressCI(0);

    // Se c'è una visura, rimuovila (logica esclusiva)
    if (incaricoData.visuraFile) {
      handleVisuraFileRemove();
    }

    try {
      setCiFile(file);

      const result = await extractDataFromCartaIdentita(file, (p) => setProgressCI(p));

      if (!result.success) {
        setCiError({
          type: 'error',
          message: result.error || 'Errore durante l\'elaborazione della carta d\'identità',
        });
        return;
      }

      // Salva i dati estratti
      setCiExtractedData(result.data);

      // Crea un intestatario dai dati della CI
      const nuovoIntestatario = {
        nome: result.data.nome || '',
        cognome: result.data.cognome || '',
        luogoNascita: result.data.luogoNascita || '',
        provinciaNascita: result.data.provinciaNascita || '',
        dataNascita: result.data.dataNascita || '',
        codiceFiscale: result.data.codiceFiscale || '',
        quotaProprieta: '1/1', // Default per acquirente
        residenza: result.data.residenza || null,
      };

      // Aggiorna gli intestatari con il nuovo
      updateIncaricoData({
        intestatari: [nuovoIntestatario],
        visuraFile: { name: 'Dati da Carta d\'Identità', type: 'ci' },
      });

      setCiError({
        type: 'success',
        message: 'Dati estratti dalla carta d\'identità con successo!',
      });

    } catch (err) {
      console.error('Errore durante l\'elaborazione CI:', err);
      setCiError({
        type: 'error',
        message: err.message || 'Errore durante l\'elaborazione della carta d\'identità',
      });
    } finally {
      setIsProcessingCI(false);
      setProgressCI(0);
    }
  };

  const handleCIFileRemove = () => {
    setCiFile(null);
    setCiExtractedData(null);
    setCiError(null);
    updateIncaricoData({
      visuraFile: null,
      intestatari: [],
    });
  };

  const handleContinue = () => {
    if (!incaricoData.praticaId) {
      setError({
        type: 'error',
        message: 'Seleziona una pratica per continuare',
      });
      return;
    }

    if (!incaricoData.visuraFile && !ciFile) {
      setError({
        type: 'error',
        message: 'Carica una visura catastale o una carta d\'identità per continuare',
      });
      return;
    }

    if (incaricoData.intestatari.length === 0) {
      setError({
        type: 'error',
        message: 'Nessun intestatario trovato. Verifica che il documento sia valido.',
      });
      return;
    }

    onNext();
  };

  const handleImmobileChange = (field, value) => {
    updateImmobileData({ [field]: value });
    setSavedToFirebase(false);
  };

  const handleClassamentoChange = (field, value) => {
    updateClassamentoData({ [field]: value });
    setSavedToFirebase(false);
  };

  const handleDatiDerivantiChange = (value) => {
    updateIncaricoData({ datiDerivanti: value });
    setSavedToFirebase(false);
  };

  const handleDataIncaricoChange = (e) => {
    updateIncaricoData({ dataIncarico: e.target.value });
  };

  const isLoading = loadingPraticheStandard || loadingPratichePrivate;
  const hasExtractedData = incaricoData.intestatari && incaricoData.intestatari.length > 0;
  const isFromVisura = incaricoData.visuraFile?.type !== 'ci';

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Riga 1: Pratica (sx) + Data Incarico (dx) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Selezione Pratica */}
        <div className="bg-white dark:bg-dark-surface rounded-lg shadow-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <FaFolderOpen className="text-blue-600 dark:text-blue-400" size={20} />
            <h2 className="text-lg font-bold text-gray-800 dark:text-dark-text-primary">
              Seleziona Pratica
            </h2>
          </div>

          {isLoading ? (
            <div className="flex items-center space-x-2 text-gray-500">
              <FaSpinner className="animate-spin" />
              <span>Caricamento...</span>
            </div>
          ) : (
            <select
              value={incaricoData.praticaId || ''}
              onChange={handlePraticaSelect}
              className="w-full px-4 py-3 border border-gray-300 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-dark-bg dark:text-dark-text-primary"
            >
              <option value="">-- Seleziona pratica --</option>
              {praticheInCorso.map((pratica) => (
                <option key={pratica.id} value={pratica.id}>
                  {formatPraticaLabel(pratica)}
                </option>
              ))}
            </select>
          )}

          {incaricoData.praticaId && (
            <p className="mt-2 text-xs text-green-600 dark:text-green-400">
              <FaCheckCircle className="inline mr-1" />
              {incaricoData.isPraticaPrivata ? 'Pratica Privata' : 'Pratica Standard'}
            </p>
          )}
        </div>

        {/* Data Incarico */}
        <div className="bg-white dark:bg-dark-surface rounded-lg shadow-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <FaCalendarAlt className="text-purple-600 dark:text-purple-400" size={20} />
            <h2 className="text-lg font-bold text-gray-800 dark:text-dark-text-primary">
              Data Incarico
            </h2>
          </div>
          <input
            type="text"
            value={incaricoData.dataIncarico}
            onChange={handleDataIncaricoChange}
            placeholder="DD/MM/YYYY"
            className="w-full px-4 py-3 border border-gray-300 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-dark-bg dark:text-dark-text-primary"
          />
          <p className="text-xs text-gray-500 dark:text-dark-text-muted mt-2">
            Formato: GG/MM/AAAA
          </p>
        </div>
      </div>

      {/* Riga 2: Visura (sx) + Carta d'Identità (dx) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Upload Visura */}
        <div className="bg-white dark:bg-dark-surface rounded-lg shadow-lg p-6">
          <div className="flex items-center space-x-2 mb-2">
            <FaFileAlt className="text-blue-600 dark:text-blue-400" size={20} />
            <h2 className="text-lg font-bold text-gray-800 dark:text-dark-text-primary">
              Visura Catastale
            </h2>
          </div>
          <p className="text-xs text-gray-600 dark:text-dark-text-secondary mb-4">
            Per il <strong>venditore</strong>: estrae intestatari e dati immobile
          </p>

          <FileUploadZone
            file={incaricoData.visuraFile?.type !== 'ci' ? incaricoData.visuraFile : null}
            onFileSelect={handleVisuraFileSelect}
            onFileRemove={handleVisuraFileRemove}
            label="Visura"
            description="PDF o immagine"
            acceptedFormats={['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']}
            disabled={isProcessingVisura || isProcessingCI || !!ciFile}
            compact
          />

          {/* Progress Visura */}
          {isProcessingVisura && (
            <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-2">
                <FaSpinner className="animate-spin text-blue-600 dark:text-blue-400" size={16} />
                <p className="text-blue-700 dark:text-blue-300 text-sm font-medium">
                  Analisi con AI...
                </p>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                <div
                  className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${progressVisura}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Upload Carta d'Identità */}
        <div className="bg-white dark:bg-dark-surface rounded-lg shadow-lg p-6">
          <div className="flex items-center space-x-2 mb-2">
            <FaIdCard className="text-green-600 dark:text-green-400" size={20} />
            <h2 className="text-lg font-bold text-gray-800 dark:text-dark-text-primary">
              Carta d'Identità
            </h2>
          </div>
          <p className="text-xs text-gray-600 dark:text-dark-text-secondary mb-4">
            Per l'<strong>acquirente</strong>: estrae dati anagrafici e residenza
          </p>

          <FileUploadZone
            file={ciFile}
            onFileSelect={handleCIFileSelect}
            onFileRemove={handleCIFileRemove}
            label="Carta d'Identità"
            description="Immagine fronte/retro"
            acceptedFormats={['image/jpeg', 'image/png', 'image/jpg']}
            disabled={isProcessingCI || isProcessingVisura || !!incaricoData.visuraFile}
            compact
          />

          {/* Progress CI */}
          {isProcessingCI && (
            <div className="mt-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-2">
                <FaSpinner className="animate-spin text-green-600 dark:text-green-400" size={16} />
                <p className="text-green-700 dark:text-green-300 text-sm font-medium">
                  Analisi con AI...
                </p>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                <div
                  className="bg-green-600 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${progressCI}%` }}
                />
              </div>
            </div>
          )}

          {/* Errore/Success CI */}
          {ciError && (
            <div className={`mt-4 p-3 rounded-lg text-sm ${
              ciError.type === 'success'
                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300'
                : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
            }`}>
              {ciError.type === 'success' ? <FaCheckCircle className="inline mr-2" /> : <FaExclamationTriangle className="inline mr-2" />}
              {ciError.message}
            </div>
          )}
        </div>
      </div>

      {/* Messaggio di errore/warning/success globale */}
      {error && (
        <div className={`border rounded-lg p-4 ${
          error.type === 'error'
            ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
            : error.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
              : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
          }`}>
          <div className="flex items-start space-x-3">
            {error.type === 'success' ? (
              <FaCheckCircle className="text-green-600 dark:text-green-400" size={20} />
            ) : (
              <FaExclamationTriangle
                className={error.type === 'error' ? 'text-red-600 dark:text-red-400' : 'text-yellow-600 dark:text-yellow-400'}
                size={20}
              />
            )}
            <div className="flex-1">
              <p className={`font-medium ${
                error.type === 'error'
                  ? 'text-red-700 dark:text-red-300'
                  : error.type === 'success'
                    ? 'text-green-700 dark:text-green-300'
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
      {hasExtractedData && (
        <div className="space-y-4">
          {/* Intestatari */}
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <FaUser className="text-green-600 dark:text-green-400" />
              <h3 className="text-green-800 dark:text-green-300 font-semibold">
                {isFromVisura ? 'Intestatari trovati' : 'Dati Acquirente'}: {incaricoData.intestatari.length}
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
                      {intestatario.residenza && (
                        <p className="text-gray-500 dark:text-dark-text-muted text-xs mt-1">
                          Residenza: {intestatario.residenza.indirizzoCompleto}, {intestatario.residenza.comune} ({intestatario.residenza.provincia})
                        </p>
                      )}
                    </div>
                    <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                      {formatQuotaProprieta(intestatario.quotaProprieta)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dati Immobile (solo per visura) */}
          {isFromVisura && (
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
                    <span className="text-gray-600 dark:text-dark-text-secondary">Superficie:</span>
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
          )}

          {/* Bottone Salva in Firebase (solo per visura) */}
          {isFromVisura && incaricoData.praticaId && (
            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-purple-800 dark:text-purple-300">
                    Salva dati visura nella pratica
                  </h4>
                  <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                    I dati verranno salvati per riutilizzi futuri
                  </p>
                </div>
                <button
                  onClick={saveVisuraToFirebase}
                  disabled={isSavingToFirebase || savedToFirebase}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    savedToFirebase
                      ? 'bg-green-600 text-white cursor-default'
                      : 'bg-purple-600 hover:bg-purple-700 text-white'
                  } disabled:opacity-50`}
                >
                  {isSavingToFirebase ? (
                    <>
                      <FaSpinner className="animate-spin" />
                      <span>Salvataggio...</span>
                    </>
                  ) : savedToFirebase ? (
                    <>
                      <FaCheckCircle />
                      <span>Salvato!</span>
                    </>
                  ) : (
                    <>
                      <FaSave />
                      <span>Salva</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Info */}
          <div className="flex items-start space-x-2 text-xs text-gray-600 dark:text-dark-text-secondary">
            <FaInfoCircle className="mt-0.5 flex-shrink-0" />
            <p>
              Nello step successivo potrai selezionare il committente tra {isFromVisura ? 'gli intestatari trovati' : 'i dati estratti'}.
            </p>
          </div>
        </div>
      )}

      {/* Bottoni navigazione */}
      <div className="flex justify-end">
        <button
          onClick={handleContinue}
          disabled={(!incaricoData.visuraFile && !ciFile) || isProcessingVisura || isProcessingCI || !incaricoData.praticaId}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continua →
        </button>
      </div>
    </div>
  );
}

export default Step1Visura;

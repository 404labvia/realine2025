// src/pages/GeneraIncaricoPage/components/Step6Riepilogo.js
import React, { useState } from 'react';
import { FaFileDownload, FaCheckCircle, FaSpinner, FaExclamationTriangle, FaRedo } from 'react-icons/fa';
import { generateAndDownloadIncarico, validateIncaricoData } from '../utils/pdfGenerator';

function Step6Riepilogo({ incaricoData, onPrev, onReset }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [error, setError] = useState(null);

  const handleGenerateDocument = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      // Valida i dati prima di generare
      const validation = validateIncaricoData(incaricoData);
      if (!validation.isValid) {
        throw new Error(`Dati incompleti:\n${validation.errors.join('\n')}`);
      }

      // Genera e scarica il documento
      await generateAndDownloadIncarico(incaricoData);

      setGenerated(true);
    } catch (err) {
      console.error('Errore generazione:', err);
      setError(err.message || 'Errore durante la generazione del documento');
    } finally {
      setIsGenerating(false);
    }
  };

  // Mappa gli ID degli interventi a descrizioni leggibili
  const getInterventoLabel = (id) => {
    const map = {
      'rilievo': 'Rilievo metrico-planimetrico',
      'pratica_edilizia': 'Pratica edilizia',
      'agibilita': 'Certificato di agibilità',
      'accatastamento': 'Accatastamento',
      'planimetria': 'Planimetria catastale',
      'sanatoria': 'Sanatoria edilizia',
      'condono': 'Condono edilizio',
      'ape': 'APE - Attestato Prestazione Energetica',
      'frazionamento': 'Frazionamento catastale',
      'consulenza': 'Consulenza tecnica',
      'perizia': 'Perizia estimativa',
      'altro': 'Altro',
    };
    return map[id] || id;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white dark:bg-dark-surface rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-dark-text-primary mb-2">
          Riepilogo Incarico
        </h2>
        <p className="text-gray-600 dark:text-dark-text-secondary mb-6">
          Verifica tutti i dati prima di generare il documento
        </p>

        <div className="space-y-6">
          {/* Dati Committente */}
          <div className="border-b pb-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-dark-text-primary mb-3">
              Dati Committente
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500 dark:text-dark-text-secondary">Nome:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-dark-text-primary">
                  {incaricoData.nomeCommittente}
                </span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-dark-text-secondary">Cognome:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-dark-text-primary">
                  {incaricoData.cognomeCommittente}
                </span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-dark-text-secondary">Codice Fiscale:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-dark-text-primary">
                  {incaricoData.codiceFiscale}
                </span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-dark-text-secondary">Data Nascita:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-dark-text-primary">
                  {incaricoData.dataNascita}
                </span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-dark-text-secondary">Luogo Nascita:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-dark-text-primary">
                  {incaricoData.luogoNascita}
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-gray-500 dark:text-dark-text-secondary">Residenza:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-dark-text-primary">
                  {incaricoData.residenza}
                </span>
              </div>
            </div>
          </div>

          {/* Dati Immobile */}
          <div className="border-b pb-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-dark-text-primary mb-3">
              Dati Immobile
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500 dark:text-dark-text-secondary">Comune:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-dark-text-primary">
                  {incaricoData.comuneImmobile}
                </span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-dark-text-secondary">Frazione:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-dark-text-primary">
                  {incaricoData.frazioneImmobile || 'N/D'}
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-gray-500 dark:text-dark-text-secondary">Indirizzo:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-dark-text-primary">
                  {incaricoData.viaImmobile}
                </span>
              </div>
            </div>
          </div>

          {/* Tipologia Intervento */}
          <div className="border-b pb-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-dark-text-primary mb-3">
              Tipologia Intervento
            </h3>
            <ul className="list-disc list-inside space-y-1">
              {incaricoData.tipologiaIntervento.map((intervento, index) => (
                <li key={index} className="text-sm text-gray-700 dark:text-dark-text-primary">
                  {getInterventoLabel(intervento)}
                </li>
              ))}
            </ul>
          </div>

          {/* Dati Economici */}
          <div className="border-b pb-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-dark-text-primary mb-3">
              Dati Economici
            </h3>
            <div className="bg-gray-50 dark:bg-dark-hover rounded-lg p-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500 dark:text-dark-text-secondary">Importo Netto:</span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-dark-text-primary">
                    € {incaricoData.importoNetto.toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-dark-text-secondary">IVA:</span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-dark-text-primary">
                    {incaricoData.iva}%
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-500 dark:text-dark-text-secondary font-semibold">Totale:</span>
                  <span className="ml-2 font-bold text-lg text-blue-700 dark:text-blue-400">
                    € {incaricoData.importoTotale.toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-dark-text-secondary">Acconto:</span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-dark-text-primary">
                    € {incaricoData.importoAcconto.toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-dark-text-secondary">Saldo:</span>
                  <span className="ml-2 font-medium text-green-700 dark:text-green-400">
                    € {incaricoData.importoSaldo.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Tempistica */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-dark-text-primary mb-3">
              Tempistica
            </h3>
            <p className="text-sm text-gray-700 dark:text-dark-text-primary bg-gray-50 dark:bg-dark-hover rounded-lg p-3">
              {incaricoData.tempistica}
            </p>
          </div>
        </div>

        {/* Messaggio di errore */}
        {error && (
          <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-start space-x-3">
              <FaExclamationTriangle className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-700 dark:text-red-300">Errore</p>
                <p className="text-sm text-red-600 dark:text-red-400 mt-1 whitespace-pre-line">
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Messaggio di successo */}
        {generated && !error && (
          <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-start space-x-3">
              <FaCheckCircle className="text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-medium text-green-700 dark:text-green-300">
                  Documento generato con successo!
                </p>
                <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                  Il documento è stato scaricato. Controlla la cartella dei download.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Bottone Genera Documento */}
        <div className="mt-6 flex justify-center">
          <button
            onClick={handleGenerateDocument}
            disabled={isGenerating || generated}
            className={`
              flex items-center space-x-3 px-8 py-4 rounded-lg font-semibold text-lg shadow-lg transition-all
              ${generated && !error
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
              }
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          >
            {isGenerating ? (
              <>
                <FaSpinner className="animate-spin" size={24} />
                <span>Generazione in corso...</span>
              </>
            ) : generated ? (
              <>
                <FaCheckCircle size={24} />
                <span>Documento Generato</span>
              </>
            ) : (
              <>
                <FaFileDownload size={24} />
                <span>Genera Documento</span>
              </>
            )}
          </button>
        </div>

        {/* Bottone per rigenerare */}
        {generated && (
          <div className="mt-4 flex justify-center">
            <button
              onClick={() => {
                setGenerated(false);
                setError(null);
              }}
              className="flex items-center space-x-2 px-4 py-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
            >
              <FaRedo size={16} />
              <span>Genera nuovamente</span>
            </button>
          </div>
        )}
      </div>

      {/* Bottoni navigazione */}
      <div className="flex justify-between">
        <button
          onClick={onPrev}
          disabled={isGenerating}
          className="px-6 py-3 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-700 text-gray-800 dark:text-white font-semibold rounded-lg shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ← Indietro
        </button>

        <button
          onClick={onReset}
          disabled={isGenerating}
          className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Nuovo Incarico
        </button>
      </div>
    </div>
  );
}

export default Step6Riepilogo;

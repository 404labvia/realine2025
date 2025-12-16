// src/pages/GeneraIncaricoPage/components/Step6Riepilogo.js
import React, { useState } from 'react';
import { FaFileDownload, FaCheckCircle, FaSpinner, FaExclamationTriangle, FaRedo, FaUser, FaHome, FaUniversity, FaClipboardList } from 'react-icons/fa';
import { generateAndDownloadIncarico, validateIncaricoData } from '../utils/pdfGenerator';
import { formatIntestatarioName } from '../utils/validationUtils';

// Mappa degli interventi per ottenere le label
const INTERVENTI_MAP = {
  'scia_sanatoria': 'SCIA in Sanatoria ai sensi dell\'art. 206/bis',
  'aggiornamento_planimetria': 'Aggiornamento planimetria catastale',
  'agibilita': 'Attestazione asseverata di agibilità',
  'stato_legittimo': 'Redazione di Stato legittimo urbanistico',
  'idoneita_statica': 'Certificato di Idoneità Statica',
  'relazione_tecnica': 'Redazione relazione tecnica',
  'permesso_sanatoria': 'Permesso di Costruire in Sanatoria',
  'accertamento_conformita': 'Accertamento di conformità (art.209 L.R. 65/2014)',
  'compatibilita_paesaggistica': 'Compatibilità Paesaggistica (art.167 Dlgs 42/2004)',
  'cila': 'C.I.L.A.',
};

function Step6Riepilogo({ incaricoData, prepareDataForDocument, onPrev, onReset }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [error, setError] = useState(null);

  const handleGenerateDocument = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      // Prepara i dati nel formato atteso dal generatore
      const documentData = prepareDataForDocument();

      // Valida i dati prima di generare
      const validation = validateIncaricoData(documentData);
      if (!validation.isValid) {
        throw new Error(`Dati incompleti:\n${validation.errors.join('\n')}`);
      }

      // Genera e scarica il documento
      await generateAndDownloadIncarico(documentData);

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
    return INTERVENTI_MAP[id] || id;
  };

  // Ottieni residenza formattata
  const getResidenza = (committente) => {
    if (committente.residenza) return committente.residenza;
    if (incaricoData.residenzaData?.residenza) {
      const r = incaricoData.residenzaData.residenza;
      return `${r.indirizzoCompleto}, ${r.comune} (${r.provincia})`;
    }
    return `${incaricoData.immobile.indirizzo}, ${incaricoData.immobile.comune}`;
  };

  // Ottieni descrizione modalità pagamento
  const getModalitaPagamentoLabel = () => {
    if (incaricoData.modalitaPagamento === 'rogito') {
      return '100% alla chiusura del rogito notarile';
    }
    return '50% all\'accettazione, 50% al deposito pratica';
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
          {/* Committenti */}
          <div className="border-b pb-4">
            <div className="flex items-center space-x-2 mb-3">
              <FaUser className="text-blue-600 dark:text-blue-400" />
              <h3 className="text-lg font-semibold text-gray-800 dark:text-dark-text-primary">
                Committente/i ({incaricoData.committentiSelezionati.length})
              </h3>
            </div>

            <div className="space-y-3">
              {incaricoData.committentiSelezionati.map((committente, index) => (
                <div key={index} className="bg-gray-50 dark:bg-dark-hover rounded-lg p-3">
                  <p className="font-semibold text-gray-900 dark:text-dark-text-primary">
                    {formatIntestatarioName(committente)}
                  </p>
                  <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-dark-text-secondary">CF: </span>
                      <span className="text-gray-900 dark:text-dark-text-primary">{committente.codiceFiscale || 'N/D'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-dark-text-secondary">Nato/a: </span>
                      <span className="text-gray-900 dark:text-dark-text-primary">
                        {committente.luogoNascita || 'N/D'} ({committente.provinciaNascita || ''}) il {committente.dataNascita || 'N/D'}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-500 dark:text-dark-text-secondary">Residenza: </span>
                      <span className="text-gray-900 dark:text-dark-text-primary">{getResidenza(committente)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dati Immobile */}
          <div className="border-b pb-4">
            <div className="flex items-center space-x-2 mb-3">
              <FaHome className="text-green-600 dark:text-green-400" />
              <h3 className="text-lg font-semibold text-gray-800 dark:text-dark-text-primary">
                Dati Immobile
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500 dark:text-dark-text-secondary">Comune:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-dark-text-primary">
                  {incaricoData.immobile.comune} ({incaricoData.immobile.provincia})
                </span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-dark-text-secondary">Indirizzo:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-dark-text-primary">
                  {incaricoData.immobile.indirizzo}
                  {incaricoData.immobile.interno && ` - Int. ${incaricoData.immobile.interno}`}
                </span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-dark-text-secondary">Foglio/Part/Sub:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-dark-text-primary">
                  {incaricoData.immobile.foglio || 'N/D'} / {incaricoData.immobile.particella || 'N/D'} / {incaricoData.immobile.subalterno || 'N/D'}
                </span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-dark-text-secondary">Categoria:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-dark-text-primary">
                  {incaricoData.classamento?.categoria || 'N/D'}
                </span>
              </div>
            </div>
          </div>

          {/* Tipologia Intervento */}
          <div className="border-b pb-4">
            <div className="flex items-center space-x-2 mb-3">
              <FaClipboardList className="text-purple-600 dark:text-purple-400" />
              <h3 className="text-lg font-semibold text-gray-800 dark:text-dark-text-primary">
                Tipologia Intervento
              </h3>
            </div>
            <ul className="space-y-2">
              {incaricoData.tipologiaIntervento.map((intervento, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <FaCheckCircle className="text-green-500 mt-0.5 flex-shrink-0" size={14} />
                  <span className="text-sm text-gray-700 dark:text-dark-text-primary">
                    {getInterventoLabel(intervento)}
                  </span>
                </li>
              ))}
            </ul>
            {incaricoData.hasRelazioneTecnica && (
              <div className="mt-3 p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded">
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  <strong>Nota:</strong> Include "Redazione relazione tecnica" - verrà applicata causale speciale
                </p>
              </div>
            )}
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
                    € {parseFloat(incaricoData.importoNetto || 0).toFixed(2)}
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
                    € {parseFloat(incaricoData.importoTotale || 0).toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-dark-text-secondary">Acconto:</span>
                  <span className="ml-2 font-medium text-amber-700 dark:text-amber-400">
                    € {parseFloat(incaricoData.importoAcconto || 0).toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-dark-text-secondary">Saldo:</span>
                  <span className="ml-2 font-medium text-green-700 dark:text-green-400">
                    € {parseFloat(incaricoData.importoSaldo || 0).toFixed(2)}
                  </span>
                </div>
                <div className="col-span-2 pt-2 border-t border-gray-200 dark:border-dark-border">
                  <span className="text-gray-500 dark:text-dark-text-secondary">Modalità:</span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-dark-text-primary">
                    {getModalitaPagamentoLabel()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Dati Bancari */}
          <div className="border-b pb-4">
            <div className="flex items-center space-x-2 mb-3">
              <FaUniversity className="text-blue-600 dark:text-blue-400" />
              <h3 className="text-lg font-semibold text-gray-800 dark:text-dark-text-primary">
                Dati per il Bonifico
              </h3>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-sm">
              <div className="mb-2">
                <span className="text-blue-600 dark:text-blue-400">Intestatario: </span>
                <span className="font-medium text-blue-900 dark:text-blue-200">
                  {incaricoData.datiBancari?.intestatario}
                </span>
              </div>
              <div>
                <span className="text-blue-600 dark:text-blue-400">IBAN: </span>
                <span className="font-mono font-medium text-blue-900 dark:text-blue-200">
                  {incaricoData.datiBancari?.iban}
                </span>
              </div>
              {incaricoData.causale && (
                <div className="mt-2 pt-2 border-t border-blue-200 dark:border-blue-700">
                  <span className="text-blue-600 dark:text-blue-400">Causale: </span>
                  <span className="font-medium text-blue-900 dark:text-blue-200">
                    {incaricoData.causale}
                  </span>
                </div>
              )}
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

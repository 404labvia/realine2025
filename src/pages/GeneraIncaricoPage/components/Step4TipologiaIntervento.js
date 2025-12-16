// src/pages/GeneraIncaricoPage/components/Step4TipologiaIntervento.js
import React, { useState } from 'react';
import { FaCheckCircle, FaCircle, FaChevronDown, FaChevronUp } from 'react-icons/fa';

// 10 tipologie di intervento con sotto-voci
const interventiDisponibili = [
  {
    id: 'scia_sanatoria',
    label: 'SCIA in Sanatoria ai sensi dell\'art. 206/bis',
    sottovoci: [
      'Ricerca e recupero pratiche edilizie presso Comune',
      'Reperimento documenti catastali',
      'Visure catastali',
      'Rilievo Architettonico',
      'Redazione Elaborati grafici stato dei luoghi',
      'Redazione Elaborati grafici ante-operam',
      'Redazione e Deposito Pratica SCIA in Sanatoria ai sensi dell\'art. 206/bis L.R. 65/2014',
      'Aggiornamento planimetria catastale Doc.Fa',
      'Accatastamento (se necessario)',
    ],
  },
  {
    id: 'aggiornamento_planimetria',
    label: 'Aggiornamento planimetria catastale',
    sottovoci: [
      'Rilievo Architettonico',
      'Redazione Elaborati grafici stato dei luoghi',
      'Redazione Doc.Fa',
      'Deposito pratica catastale',
    ],
  },
  {
    id: 'agibilita',
    label: 'Attestazione asseverata di agibilità',
    sottovoci: [
      'Verifica documentazione esistente',
      'Sopralluogo tecnico',
      'Redazione attestazione asseverata',
      'Deposito pratica',
    ],
  },
  {
    id: 'stato_legittimo',
    label: 'Redazione di Stato legittimo urbanistico',
    sottovoci: [
      'Ricerca pratiche edilizie presso archivi comunali',
      'Reperimento documenti catastali storici',
      'Analisi conformità urbanistica',
      'Redazione relazione stato legittimo',
    ],
  },
  {
    id: 'idoneita_statica',
    label: 'Certificato di Idoneità Statica',
    sottovoci: [
      'Sopralluogo e verifica strutturale',
      'Analisi documentazione esistente',
      'Prove e verifiche (se necessarie)',
      'Redazione certificato di idoneità statica',
    ],
  },
  {
    id: 'relazione_tecnica',
    label: 'Redazione relazione tecnica',
    sottovoci: [
      'Sopralluogo',
      'Analisi documentazione',
      'Redazione relazione tecnica dettagliata',
    ],
    isSpecial: true, // Flag per causale speciale nel pagamento
  },
  {
    id: 'permesso_sanatoria',
    label: 'Permesso di Costruire in Sanatoria',
    sottovoci: [
      'Ricerca e recupero pratiche edilizie presso Comune',
      'Reperimento documenti catastali',
      'Rilievo Architettonico completo',
      'Redazione Elaborati grafici stato dei luoghi',
      'Redazione Elaborati grafici ante-operam',
      'Redazione e Deposito Permesso di Costruire in Sanatoria',
      'Aggiornamento catastale (se necessario)',
    ],
  },
  {
    id: 'accertamento_conformita',
    label: 'Accertamento di conformità (art.209 L.R. 65/2014)',
    sottovoci: [
      'Ricerca pratiche edilizie',
      'Rilievo architettonico',
      'Redazione elaborati grafici',
      'Predisposizione istanza accertamento conformità',
      'Deposito pratica',
    ],
  },
  {
    id: 'compatibilita_paesaggistica',
    label: 'Compatibilità Paesaggistica (art.167 Dlgs 42/2004)',
    sottovoci: [
      'Analisi vincoli paesaggistici',
      'Rilievo fotografico',
      'Redazione relazione paesaggistica',
      'Predisposizione istanza compatibilità',
      'Deposito pratica presso Soprintendenza',
    ],
  },
  {
    id: 'cila',
    label: 'C.I.L.A.',
    sottovoci: [
      'Rilievo architettonico',
      'Redazione elaborati grafici stato attuale',
      'Redazione elaborati grafici di progetto',
      'Compilazione e deposito CILA',
    ],
  },
];

function Step4TipologiaIntervento({ incaricoData, updateIncaricoData, onNext, onPrev }) {
  const [selectedInterventi, setSelectedInterventi] = useState(
    incaricoData.tipologiaIntervento || []
  );
  const [expandedIntervento, setExpandedIntervento] = useState(null);
  const [error, setError] = useState('');

  const toggleIntervento = (interventoId) => {
    setError('');
    setSelectedInterventi((prev) => {
      if (prev.includes(interventoId)) {
        return prev.filter((id) => id !== interventoId);
      } else {
        return [...prev, interventoId];
      }
    });
  };

  const toggleExpand = (interventoId) => {
    setExpandedIntervento((prev) => (prev === interventoId ? null : interventoId));
  };

  const handleContinue = () => {
    if (selectedInterventi.length === 0) {
      setError('Seleziona almeno una tipologia di intervento');
      return;
    }

    // Salva anche i dati completi degli interventi selezionati per il documento
    const interventiSelezionatiCompleti = interventiDisponibili.filter((i) =>
      selectedInterventi.includes(i.id)
    );

    // Controlla se c'è la relazione tecnica (caso speciale)
    const hasRelazioneTecnica = selectedInterventi.includes('relazione_tecnica');

    updateIncaricoData({
      tipologiaIntervento: selectedInterventi,
      interventiCompleti: interventiSelezionatiCompleti,
      hasRelazioneTecnica,
    });
    onNext();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white dark:bg-dark-surface rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-dark-text-primary mb-2">
          Tipologia Intervento
        </h2>
        <p className="text-gray-600 dark:text-dark-text-secondary mb-6">
          Seleziona una o più tipologie di intervento previste per questo incarico.
          Clicca sulla freccia per vedere le sotto-voci incluse.
        </p>

        {/* Lista interventi */}
        <div className="space-y-3">
          {interventiDisponibili.map((intervento) => {
            const isSelected = selectedInterventi.includes(intervento.id);
            const isExpanded = expandedIntervento === intervento.id;

            return (
              <div
                key={intervento.id}
                className={`
                  border-2 rounded-lg transition-all overflow-hidden
                  ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-dark-border hover:border-blue-300 dark:hover:border-blue-600'
                  }
                `}
              >
                {/* Header intervento */}
                <div className="p-4 flex items-center justify-between">
                  <button
                    onClick={() => toggleIntervento(intervento.id)}
                    className="flex items-center space-x-3 flex-1 text-left"
                  >
                    <div>
                      {isSelected ? (
                        <FaCheckCircle className="text-blue-600 dark:text-blue-400" size={22} />
                      ) : (
                        <FaCircle className="text-gray-300 dark:text-gray-600" size={22} />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3
                        className={`font-semibold ${
                          isSelected
                            ? 'text-blue-700 dark:text-blue-300'
                            : 'text-gray-800 dark:text-dark-text-primary'
                        }`}
                      >
                        {intervento.label}
                        {intervento.isSpecial && (
                          <span className="ml-2 text-xs px-2 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 rounded">
                            Causale speciale
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-dark-text-muted mt-1">
                        {intervento.sottovoci.length} attività incluse
                      </p>
                    </div>
                  </button>

                  {/* Bottone espandi/comprimi */}
                  <button
                    onClick={() => toggleExpand(intervento.id)}
                    className="p-2 text-gray-500 hover:text-gray-700 dark:text-dark-text-secondary dark:hover:text-dark-text-primary transition-colors"
                    aria-label={isExpanded ? 'Comprimi' : 'Espandi'}
                  >
                    {isExpanded ? <FaChevronUp size={16} /> : <FaChevronDown size={16} />}
                  </button>
                </div>

                {/* Sotto-voci (espandibili) */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-gray-200 dark:border-dark-border">
                    <p className="text-xs font-medium text-gray-500 dark:text-dark-text-muted mt-3 mb-2 uppercase tracking-wide">
                      Attività incluse:
                    </p>
                    <ul className="space-y-1.5">
                      {intervento.sottovoci.map((sottovoce, index) => (
                        <li
                          key={index}
                          className="flex items-start space-x-2 text-sm text-gray-700 dark:text-dark-text-secondary"
                        >
                          <span className="text-blue-500 mt-1">•</span>
                          <span>{sottovoce}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
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
            <p className="text-blue-700 dark:text-blue-300 font-medium mb-2">
              {selectedInterventi.length}{' '}
              {selectedInterventi.length === 1 ? 'intervento selezionato' : 'interventi selezionati'}
            </p>
            <div className="flex flex-wrap gap-2">
              {selectedInterventi.map((id) => {
                const intervento = interventiDisponibili.find((i) => i.id === id);
                return (
                  <span
                    key={id}
                    className="inline-flex items-center px-2.5 py-1 bg-blue-100 dark:bg-blue-800/40 text-blue-800 dark:text-blue-200 text-xs rounded-full"
                  >
                    {intervento?.label || id}
                  </span>
                );
              })}
            </div>
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

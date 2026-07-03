// src/pages/GeneraReportPage/index.js
import React, { useState, useMemo } from 'react';
import { FaList, FaCalendarDay, FaFilePdf, FaBuilding } from 'react-icons/fa';

import { usePratiche } from '../../contexts/PraticheContext';
import { usePratichePrivato } from '../../contexts/PratichePrivatoContext';

import {
  agenzieCollaboratori,
  generatePDF,
  generateListPDF,
  generateDailyPDF,
  generateMonthlyAttiPDF,
} from '../PratichePage/utils';
import { agenzieCollaboratoriPrivato } from '../PratichePrivatoPage/utils';

// Helper date locali (no UTC shift) per i valori di default dei picker
const oggiISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const meseCorrenteISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

function GeneraReportPage({ mode = 'lista' }) {
  const { pratiche, loading } = usePratiche();
  const { pratiche: pratichePrivato, loading: loadingPrivato } = usePratichePrivato();

  const [giorno, setGiorno] = useState(oggiISO);
  const [mese, setMese] = useState(meseCorrenteISO);
  const [agenziaSel, setAgenziaSel] = useState('');
  const [generating, setGenerating] = useState(false);

  // Standard + Privato uniti (per lista, atti mese e singola agenzia)
  const tutte = useMemo(
    () => [...(pratiche || []), ...(pratichePrivato || [])],
    [pratiche, pratichePrivato]
  );

  // Elenco agenzie = unione deduplicata di standard + privato
  const agenzieUnion = useMemo(() => {
    const set = new Set();
    [...agenzieCollaboratori, ...agenzieCollaboratoriPrivato].forEach((ac) => {
      if (ac?.agenzia) set.add(ac.agenzia);
    });
    return Array.from(set).sort();
  }, []);

  const runExport = async (fn) => {
    setGenerating(true);
    try {
      await fn();
    } finally {
      setGenerating(false);
    }
  };

  if (loading || loadingPrivato) {
    return (
      <div className="flex justify-center items-center h-64 text-gray-600 dark:text-dark-text-secondary">
        Caricamento pratiche...
      </div>
    );
  }

  const conteggio = tutte.length;

  // Configurazione per modalità
  const config = {
    lista: {
      icon: FaList,
      titolo: 'Esporta Lista Tutte le Pratiche',
      descrizione: `Elenco completo di tutte le pratiche (standard + privato). ${conteggio} pratiche totali.`,
      action: () => generateListPDF(tutte, ''),
      bottone: 'Esporta Lista PDF',
    },
    giornaliero: {
      icon: FaCalendarDay,
      titolo: 'Esporta Giornaliero',
      descrizione: 'Elenco delle aggiunte del giorno (note, task e nuove pratiche), standard + privato.',
      control: (
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700 dark:text-dark-text-primary">Giorno</label>
          <input
            type="date"
            value={giorno}
            onChange={(e) => setGiorno(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-dark-border dark:bg-dark-hover dark:text-dark-text-primary rounded-md"
          />
        </div>
      ),
      action: () => generateDailyPDF(pratiche, pratichePrivato, new Date(`${giorno}T00:00:00`)),
      bottone: 'Esporta Giornaliero',
    },
    attiMese: {
      icon: FaFilePdf,
      titolo: 'Esporta Atti del Mese',
      descrizione: 'Elenco cronologico degli atti fissati nel mese selezionato (standard + privato).',
      control: (
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700 dark:text-dark-text-primary">Mese</label>
          <input
            type="month"
            value={mese}
            onChange={(e) => setMese(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-dark-border dark:bg-dark-hover dark:text-dark-text-primary rounded-md"
          />
        </div>
      ),
      action: () => {
        const [anno, m] = mese.split('-').map(Number);
        return generateMonthlyAttiPDF(tutte, new Date(anno, m - 1, 1));
      },
      bottone: 'Esporta Atti Mese',
    },
    agenzia: {
      icon: FaBuilding,
      titolo: 'Esporta Singola Agenzia',
      descrizione: "PDF delle pratiche di una specifica agenzia (standard + privato).",
      control: (
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700 dark:text-dark-text-primary">Agenzia</label>
          <select
            value={agenziaSel}
            onChange={(e) => setAgenziaSel(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-dark-border dark:bg-dark-hover dark:text-dark-text-primary rounded-md w-64"
          >
            <option value="">Tutte le agenzie</option>
            {agenzieUnion.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
      ),
      action: () => generatePDF(tutte, agenziaSel),
      bottone: 'Esporta PDF Agenzia',
    },
  };

  const current = config[mode] || config.lista;
  const Icon = current.icon;

  return (
    <div className="container mx-auto max-w-2xl">
      <div className="bg-white dark:bg-dark-surface p-6 rounded-lg shadow transition-colors duration-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
            <Icon className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-dark-text-primary">{current.titolo}</h2>
        </div>

        <p className="text-sm text-gray-600 dark:text-dark-text-secondary mb-6">{current.descrizione}</p>

        {current.control && <div className="mb-6">{current.control}</div>}

        <button
          onClick={() => runExport(current.action)}
          disabled={generating}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 text-sm transition-colors"
        >
          <FaFilePdf size={14} />
          {generating ? 'Generazione in corso...' : current.bottone}
        </button>
      </div>
    </div>
  );
}

export default GeneraReportPage;

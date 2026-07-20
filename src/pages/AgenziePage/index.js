// src/pages/AgenziePage/index.js
// Gestione invio aggiornamenti settimanali: email per agenzia (standard + privato),
// invio manuale/test e storico delle run. L'invio automatico è la Cloud Function
// schedulata weeklyAgencyDigest (giovedì 17:00 Europe/Rome) — vedi functions/digest.js.
import React from 'react';
import { MdBusiness } from 'react-icons/md';
import { useAgenzie } from './hooks/useAgenzie';
import AgenziaRow from './components/AgenziaRow';
import InviaOraPanel from './components/InviaOraPanel';
import DigestLogList from './components/DigestLogList';

const AgenziePage = () => {
  const { agenzie, loading, saveAgenzia } = useAgenzie();

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div className="bg-white dark:bg-dark-surface rounded-lg shadow p-4">
        <div className="flex items-center gap-2 mb-1">
          <MdBusiness className="text-blue-600" size={20} />
          <h2 className="text-base font-semibold text-gray-800 dark:text-dark-text-primary">Email agenzie</h2>
        </div>
        <p className="text-xs text-gray-500 dark:text-dark-text-muted mb-3">
          Ogni giovedì alle 17:00 le agenzie <strong>attive</strong> ricevono via email le note ufficiali
          delle proprie pratiche (mai i task, che restano interni) e, in coda, gli aggiornamenti dei propri
          accessi agli atti ancora aperti. I committenti con email compilata sulla pratica ricevono gli
          aggiornamenti della sola propria pratica.
        </p>
        {loading ? (
          <p className="text-sm text-gray-500 dark:text-dark-text-muted py-4">Caricamento…</p>
        ) : (
          <div className="border-t border-gray-200 dark:border-dark-border">
            {agenzie.map((agenzia) => (
              <AgenziaRow key={agenzia.nome} agenzia={agenzia} onSave={saveAgenzia} />
            ))}
          </div>
        )}
      </div>

      <InviaOraPanel />
      <DigestLogList />
    </div>
  );
};

export default AgenziePage;

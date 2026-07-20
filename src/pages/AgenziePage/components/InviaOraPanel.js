// src/pages/AgenziePage/components/InviaOraPanel.js
// Invio manuale del digest: modalità test (tutto verso una singola email di prova)
// oppure invio reale a agenzie attive + committenti con email compilata.
import React, { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../../firebase';

const callSendDigest = httpsCallable(functions, 'sendAgencyDigestNow', { timeout: 540000 });

const STATUS_LABELS = {
  sent: { label: 'Inviata', cls: 'text-green-600 dark:text-green-400' },
  error: { label: 'Errore', cls: 'text-red-600 dark:text-red-400' },
  skipped_inactive: { label: 'Saltata (non attiva)', cls: 'text-gray-500 dark:text-dark-text-muted' },
  skipped_no_email: { label: 'Saltata (nessuna email)', cls: 'text-gray-500 dark:text-dark-text-muted' },
  skipped_invalid_email: { label: 'Saltata (email non valida)', cls: 'text-amber-600 dark:text-amber-400' },
};

const StatusBadge = ({ status }) => {
  const s = STATUS_LABELS[status] || { label: status, cls: 'text-gray-500' };
  return <span className={`text-xs font-medium ${s.cls}`}>{s.label}</span>;
};

const InviaOraPanel = () => {
  const [testMode, setTestMode] = useState(true);
  const [testEmail, setTestEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleSend = async () => {
    setError(null);
    if (testMode && !testEmail.trim()) {
      setError('Inserisci l\'email di prova per la modalità test.');
      return;
    }
    if (!testMode && !window.confirm(
      'Verranno inviate email REALI alle agenzie attive e ai committenti con email compilata. Continuare?'
    )) {
      return;
    }
    setSending(true);
    setResult(null);
    try {
      const res = await callSendDigest({ testEmail: testMode ? testEmail.trim() : null });
      setResult(res.data);
    } catch (err) {
      console.error('Errore invio digest:', err);
      setError(err.message || 'Errore durante l\'invio.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-white dark:bg-dark-surface rounded-lg shadow p-4">
      <h2 className="text-base font-semibold text-gray-800 dark:text-dark-text-primary mb-1">Invia ora</h2>
      <p className="text-xs text-gray-500 dark:text-dark-text-muted mb-3">
        Invia subito il riepilogo di tutte le note ufficiali di ogni pratica, più gli aggiornamenti
        degli accessi agli atti ancora aperti. L'invio automatico avviene ogni giovedì alle 17:00.
      </p>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
        <label className="inline-flex items-center gap-1.5 text-sm text-gray-700 dark:text-dark-text-secondary">
          <input
            type="checkbox"
            checked={testMode}
            onChange={(e) => setTestMode(e.target.checked)}
            className="rounded text-blue-600"
          />
          Modalità test
        </label>
        {testMode && (
          <input
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="email di prova (riceve tutto)"
            className="flex-1 max-w-xs p-1.5 text-sm border border-gray-300 rounded-md dark:bg-dark-bg dark:border-dark-border dark:text-dark-text-primary"
          />
        )}
        <button
          onClick={handleSend}
          disabled={sending}
          className={`px-4 py-1.5 text-sm rounded-md text-white disabled:opacity-50 ${testMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-700'}`}
        >
          {sending ? 'Invio in corso…' : testMode ? 'Invia test' : 'Invia REALE'}
        </button>
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400 mb-2">{error}</p>}

      {result && (
        <div className="space-y-4">
          <p className="text-sm text-gray-700 dark:text-dark-text-secondary">
            <strong>{result.totals.sent}</strong> inviate, {result.totals.skipped} saltate, {result.totals.errors} errori.
            {result.totals.unknownAgencies?.length > 0 && (
              <span className="block text-amber-600 dark:text-amber-400">
                Agenzie non configurate trovate nelle pratiche: {result.totals.unknownAgencies.join(', ')}
              </span>
            )}
          </p>

          {result.agencyResults.length > 0 && (
            <div className="overflow-x-auto">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-dark-text-primary mb-1">Agenzie</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 dark:text-dark-text-muted border-b border-gray-200 dark:border-dark-border">
                    <th className="py-1 pr-3">Agenzia</th>
                    <th className="py-1 pr-3">Pratiche</th>
                    <th className="py-1 pr-3">Note</th>
                    <th className="py-1 pr-3">Accessi</th>
                    <th className="py-1">Stato</th>
                  </tr>
                </thead>
                <tbody>
                  {result.agencyResults.map((r) => (
                    <tr key={r.agenzia} className="border-b border-gray-100 dark:border-dark-border">
                      <td className="py-1 pr-3 text-gray-800 dark:text-dark-text-primary">{r.agenzia}</td>
                      <td className="py-1 pr-3 text-gray-600 dark:text-dark-text-secondary">{r.praticheCount}</td>
                      <td className="py-1 pr-3 text-gray-600 dark:text-dark-text-secondary">{r.noteCount}</td>
                      <td className="py-1 pr-3 text-gray-600 dark:text-dark-text-secondary">{r.accessiCount ?? 0}</td>
                      <td className="py-1"><StatusBadge status={r.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {result.clientResults.length > 0 && (
            <div className="overflow-x-auto">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-dark-text-primary mb-1">Committenti</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 dark:text-dark-text-muted border-b border-gray-200 dark:border-dark-border">
                    <th className="py-1 pr-3">Pratica</th>
                    <th className="py-1 pr-3">Email</th>
                    <th className="py-1 pr-3">Note</th>
                    <th className="py-1">Stato</th>
                  </tr>
                </thead>
                <tbody>
                  {result.clientResults.map((r) => (
                    <tr key={r.praticaId} className="border-b border-gray-100 dark:border-dark-border">
                      <td className="py-1 pr-3 text-gray-800 dark:text-dark-text-primary">{r.titolo}</td>
                      <td className="py-1 pr-3 text-gray-600 dark:text-dark-text-secondary">{r.emailCliente}</td>
                      <td className="py-1 pr-3 text-gray-600 dark:text-dark-text-secondary">{r.noteCount}</td>
                      <td className="py-1"><StatusBadge status={r.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {result.agencyResults.length === 0 && result.clientResults.length === 0 && (
            <p className="text-sm text-gray-500 dark:text-dark-text-muted">Nessuna nota ufficiale presente: nessuna email da inviare.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default InviaOraPanel;

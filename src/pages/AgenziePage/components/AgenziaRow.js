// src/pages/AgenziePage/components/AgenziaRow.js
// Riga di configurazione di una singola agenzia: email (separate da virgola),
// toggle attiva, salvataggio con feedback.
import React, { useState, useEffect } from 'react';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const AgenziaRow = ({ agenzia, onSave }) => {
  const [emailsText, setEmailsText] = useState(agenzia.emails.join(', '));
  const [attiva, setAttiva] = useState(agenzia.attiva);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null); // 'ok' | 'error' | 'invalid'

  // Riallinea lo stato locale quando arriva un aggiornamento da Firestore
  useEffect(() => {
    setEmailsText(agenzia.emails.join(', '));
    setAttiva(agenzia.attiva);
  }, [agenzia.emails, agenzia.attiva]); // eslint-disable-line react-hooks/exhaustive-deps

  const parseEmails = () =>
    emailsText
      .split(/[,;\s]+/)
      .map((e) => e.trim())
      .filter(Boolean);

  const handleSave = async () => {
    const emails = parseEmails();
    const invalid = emails.filter((e) => !EMAIL_REGEX.test(e));
    if (invalid.length > 0) {
      setFeedback('invalid');
      return;
    }
    setSaving(true);
    setFeedback(null);
    try {
      await onSave(agenzia.nome, { emails, attiva });
      setFeedback('ok');
      setTimeout(() => setFeedback(null), 2500);
    } catch (err) {
      console.error('Errore salvataggio agenzia:', err);
      setFeedback('error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 py-3 px-4 border-b border-gray-200 dark:border-dark-border">
      <div className="sm:w-56 flex items-center gap-2">
        <span className="text-sm font-medium text-gray-800 dark:text-dark-text-primary">{agenzia.nome}</span>
        {agenzia.privato && (
          <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200">Privato</span>
        )}
      </div>
      <input
        type="text"
        value={emailsText}
        onChange={(e) => setEmailsText(e.target.value)}
        placeholder="email1@esempio.it, email2@esempio.it"
        className="flex-1 p-1.5 text-sm border border-gray-300 rounded-md dark:bg-dark-bg dark:border-dark-border dark:text-dark-text-primary"
      />
      <label className="inline-flex items-center gap-1.5 text-sm text-gray-700 dark:text-dark-text-secondary whitespace-nowrap">
        <input
          type="checkbox"
          checked={attiva}
          onChange={(e) => setAttiva(e.target.checked)}
          className="rounded text-blue-600"
        />
        Attiva
      </label>
      <button
        onClick={handleSave}
        disabled={saving}
        className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {saving ? 'Salvo…' : 'Salva'}
      </button>
      <span className="text-xs w-32">
        {feedback === 'ok' && <span className="text-green-600 dark:text-green-400">Salvata ✓</span>}
        {feedback === 'error' && <span className="text-red-600 dark:text-red-400">Errore salvataggio</span>}
        {feedback === 'invalid' && <span className="text-red-600 dark:text-red-400">Email non valida</span>}
      </span>
    </div>
  );
};

export default AgenziaRow;

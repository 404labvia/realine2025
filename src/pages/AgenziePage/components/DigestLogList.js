// src/pages/AgenziePage/components/DigestLogList.js
// Ultime run del digest (collection digest_log, scritta solo dalle Cloud Functions).
import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../../firebase';

const DigestLogList = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDocs(
          query(collection(db, 'digest_log'), orderBy('runAt', 'desc'), limit(5))
        );
        setLogs(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error('Errore lettura digest_log:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="bg-white dark:bg-dark-surface rounded-lg shadow p-4">
      <h2 className="text-base font-semibold text-gray-800 dark:text-dark-text-primary mb-3">Ultimi invii</h2>
      {loading ? (
        <p className="text-sm text-gray-500 dark:text-dark-text-muted">Caricamento…</p>
      ) : logs.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-dark-text-muted">Nessun invio effettuato finora.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 dark:text-dark-text-muted border-b border-gray-200 dark:border-dark-border">
                <th className="py-1 pr-3">Data</th>
                <th className="py-1 pr-3">Tipo</th>
                <th className="py-1 pr-3">Inviate</th>
                <th className="py-1 pr-3">Saltate</th>
                <th className="py-1">Errori</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-gray-100 dark:border-dark-border">
                  <td className="py-1 pr-3 text-gray-800 dark:text-dark-text-primary">
                    {new Date(log.runAt).toLocaleString('it-IT')}
                  </td>
                  <td className="py-1 pr-3 text-gray-600 dark:text-dark-text-secondary">
                    {log.trigger === 'scheduled' ? 'Automatico' : 'Manuale'}
                    {log.testEmail ? ' (test)' : ''}
                  </td>
                  <td className="py-1 pr-3 text-gray-600 dark:text-dark-text-secondary">{log.totals?.sent ?? '-'}</td>
                  <td className="py-1 pr-3 text-gray-600 dark:text-dark-text-secondary">{log.totals?.skipped ?? '-'}</td>
                  <td className={`py-1 ${log.totals?.errors ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-dark-text-secondary'}`}>
                    {log.totals?.errors ?? '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DigestLogList;

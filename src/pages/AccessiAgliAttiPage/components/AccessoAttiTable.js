// src/pages/AccessiAgliAttiPage/components/AccessoAttiTable.js
import React from 'react';
import AccessoAttiTableRow from './AccessoAttiTableRow';

const ITEMS_PER_PAGE = 5;

function AccessoAttiTable({ accessi, onEdit, onDelete, onUpdate }) {
  const accessiDaVisualizzare = accessi.slice(0, ITEMS_PER_PAGE);

  if (!accessi || accessi.length === 0) {
    return <p className="text-sm text-gray-500 text-center py-4">Nessun accesso agli atti da visualizzare.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Codice
            </th>
            <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Indirizzo
            </th>
            <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Proprietà
            </th>
            {/* Colonna Stato Rimossa */}
            <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Progresso
            </th>
            <th scope="col" className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              Azioni
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {accessiDaVisualizzare.map((accesso) => (
            <AccessoAttiTableRow
              key={accesso.id}
              accesso={accesso}
              onEdit={onEdit}
              onDelete={onDelete}
              onUpdate={onUpdate}
            />
          ))}
        </tbody>
      </table>
      {accessi.length > ITEMS_PER_PAGE && (
        <div className="pt-2 text-center text-xs text-gray-500">
          Visualizzati {ITEMS_PER_PAGE} di {accessi.length} accessi. (Paginazione/Scroll da implementare)
        </div>
      )}
    </div>
  );
}

export default AccessoAttiTable;
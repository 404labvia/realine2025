// src/pages/AccessiAgliAttiPage/components/AccessoAttiTable.js
import React from 'react';
import AccessoAttiTableRow from './AccessoAttiTableRow';

function AccessoAttiTable({ accessi, onEdit, onDelete, onUpdate, filtroStato }) {
  // Filtra accessi in base al filtro stato
  const accessiFiltrati = accessi.filter(accesso => {
    if (filtroStato === 'completata') return accesso.completata;
    if (filtroStato === 'in_corso') return !accesso.completata;
    return true; // tutti
  });

  if (!accessiFiltrati || accessiFiltrati.length === 0) {
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
              Indirizzo/Proprietà
            </th>
            <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Progresso
            </th>
            <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Note
            </th>
            <th scope="col" className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              Tempo
            </th>
            <th scope="col" className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              Completata
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {accessiFiltrati.map((accesso) => (
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
    </div>
  );
}

export default AccessoAttiTable;
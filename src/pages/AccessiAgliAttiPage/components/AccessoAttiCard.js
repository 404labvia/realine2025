// src/pages/AccessiAgliAttiPage/components/AccessoAttiCard.js
import React from 'react';
import AccessoAttiTable from './AccessoAttiTable';
import { FaPlus } from 'react-icons/fa'; // Importa l'icona del più

// Aggiungi 'onAddNew' alle props che il componente riceve
function AccessoAttiCard({ titolo, accessi, onEdit, onDelete, onUpdate, onAddNew }) {
  // Logica per il colore di sfondo (se presente, lasciala com'è)
  let bgColorClass = 'bg-gray-100'; // Default
  if (titolo.includes("LUCCA")) bgColorClass = 'bg-red-100';
  else if (titolo.includes("ALTOPASCIO")) bgColorClass = 'bg-green-100';
  else if (titolo.includes("MASSA")) bgColorClass = 'bg-blue-100';
  else if (titolo.includes("QUERCETA")) bgColorClass = 'bg-yellow-100';

  return (
    <div className={`rounded-lg shadow-lg overflow-hidden ${bgColorClass}`}>
      {/* Modifica l'header della card per includere il pulsante */}
      <div className="px-4 sm:px-6 py-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-700 truncate pr-2">
          {titolo} ({accessi.length})
        </h3>
        <button
          onClick={onAddNew} // Chiama la nuova funzione passata come prop
          className="p-1.5 sm:px-3 sm:py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center text-sm transition-colors shadow-sm"
          title="Aggiungi nuovo accesso atti per questa agenzia"
        >
          <FaPlus className="h-4 w-4" />
          <span className="hidden sm:inline ml-2 font-semibold">Nuovo</span>
        </button>
      </div>
      <div className="p-2 sm:p-4 bg-white">
        {accessi.length > 0 ? (
          <AccessoAttiTable
            accessi={accessi}
            onEdit={onEdit}
            onDelete={onDelete}
            onUpdate={onUpdate}
          />
        ) : (
          <p className="text-sm text-gray-500 text-center py-4">Nessun accesso agli atti per questa agenzia.</p>
        )}
      </div>
    </div>
  );
}

export default AccessoAttiCard;
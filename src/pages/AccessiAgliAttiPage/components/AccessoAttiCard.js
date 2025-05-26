// src/pages/AccessiAgliAttiPage/components/AccessoAttiCard.js
import React from 'react';
import AccessoAttiTable from './AccessoAttiTable'; // Creeremo questo file successivamente

function AccessoAttiCard({ titolo, accessi, onEdit, onDelete, onUpdate }) {
  // Determina il colore di sfondo della card in base al titolo (nome agenzia)
  // Questi colori sono di esempio, puoi personalizzarli come preferisci
  let bgColorClass = 'bg-gray-100'; // Default per "Altro"
  if (titolo.includes("LUCCA")) bgColorClass = 'bg-red-100'; // Esempio colore
  else if (titolo.includes("ALTOPASCIO")) bgColorClass = 'bg-green-100'; // Esempio colore
  else if (titolo.includes("MASSA")) bgColorClass = 'bg-blue-100'; // Esempio colore
  else if (titolo.includes("QUERCETA")) bgColorClass = 'bg-yellow-100'; // Esempio colore

  return (
    <div className={`rounded-lg shadow-lg overflow-hidden ${bgColorClass}`}>
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-700">{titolo} ({accessi.length})</h3>
      </div>
      <div className="p-2 sm:p-4 bg-white"> {/* Aggiunto bg-white per la tabella */}
        {accessi.length > 0 ? (
          <AccessoAttiTable
            accessi={accessi}
            onEdit={onEdit}
            onDelete={onDelete}
            onUpdate={onUpdate} // Per aggiornamenti rapidi di stato/progresso
          />
        ) : (
          <p className="text-sm text-gray-500 text-center py-4">
            Nessun accesso agli atti per questa categoria.
          </p>
        )}
      </div>
    </div>
  );
}

export default AccessoAttiCard;
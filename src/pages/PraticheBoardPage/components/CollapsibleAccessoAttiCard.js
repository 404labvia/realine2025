// src/pages/PraticheBoardPage/components/CollapsibleAccessoAttiCard.js
import React, { useState } from 'react';
import { FaChevronDown, FaChevronRight, FaPlus, FaFilter } from 'react-icons/fa';
import AccessoAttiTable from '../../AccessiAgliAttiPage/components/AccessoAttiTable';

function CollapsibleAccessoAttiCard({ titolo, accessi, onEdit, onDelete, onUpdate, onAddNew }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filtroStato, setFiltroStato] = useState('in_corso');

  // Conta accessi per stato
  const accessiInCorso = accessi.filter(a => !a.completata).length;
  const accessiCompletati = accessi.filter(a => a.completata).length;
  const totaleAccessi = accessi.length;

  // Determina il colore di sfondo della card in base al titolo (nome agenzia)
  let bgColorClass = 'bg-gray-100';
  if (titolo.includes("LUCCA")) bgColorClass = 'bg-red-100';
  else if (titolo.includes("ALTOPASCIO")) bgColorClass = 'bg-green-100';
  else if (titolo.includes("MASSA")) bgColorClass = 'bg-blue-100';
  else if (titolo.includes("QUERCETA")) bgColorClass = 'bg-yellow-100';

  return (
    <div className={`rounded-lg shadow-lg overflow-hidden ${bgColorClass} mb-4`}>
      {/* Header - sempre visibile */}
      <div
        className="px-6 py-4 bg-gray-50 border-b border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            {/* Icona collapse/expand */}
            <button
              className="text-gray-600 hover:text-gray-800 focus:outline-none"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
            >
              {isExpanded ? <FaChevronDown size={16} /> : <FaChevronRight size={16} />}
            </button>

            <h3 className="text-lg font-semibold text-gray-700">
              {titolo} ({accessiInCorso} in corso, {accessiCompletati} completati)
            </h3>
          </div>

          <div className="flex items-center space-x-3" onClick={(e) => e.stopPropagation()}>
            {/* Filtro Stati */}
            <div className="flex items-center space-x-2">
              <FaFilter className="text-gray-500 text-sm" />
              <select
                value={filtroStato}
                onChange={(e) => setFiltroStato(e.target.value)}
                className="text-sm border border-gray-300 rounded px-2 py-1 bg-white"
              >
                <option value="in_corso">In corso ({accessiInCorso})</option>
                <option value="completata">Completati ({accessiCompletati})</option>
                <option value="tutti">Tutti ({totaleAccessi})</option>
              </select>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddNew();
              }}
              className="flex items-center bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded text-sm"
            >
              <FaPlus className="mr-2" />
              Nuovo
            </button>
          </div>
        </div>
      </div>

      {/* Contenuto - visibile solo quando espanso */}
      {isExpanded && (
        <div className="p-2 sm:p-4 bg-white">
          {accessi.length > 0 ? (
            <AccessoAttiTable
              accessi={accessi}
              onEdit={onEdit}
              onDelete={onDelete}
              onUpdate={onUpdate}
              filtroStato={filtroStato}
            />
          ) : (
            <p className="text-center text-gray-500 py-4">Nessun accesso agli atti per questa agenzia.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default CollapsibleAccessoAttiCard;

// src/pages/AccessiAgliAttiPage/components/AccessoAttiTableRow.js
import React, { useState, useEffect } from 'react';
import { FaEdit, FaTrashAlt } from 'react-icons/fa';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';

const STATI_DISPONIBILI = ["In Attesa", "In Corso", "Completato (Accesso Eseguito)", "Richiede Integrazioni", "Respinto"];
const PROGRESSO_FASI = ["Documenti/Delega", "Richiesta Inviata", "Documenti Ricevuti"];

// Funzione per ottenere classi Tailwind per i badge di stato
const getStatoBadgeClass = (stato) => {
  switch (stato) {
    case "In Attesa": return "bg-yellow-100 text-yellow-800";
    case "In Corso": return "bg-blue-100 text-blue-800";
    case "Completato (Accesso Eseguito)": return "bg-green-100 text-green-800";
    case "Richiede Integrazioni": return "bg-orange-100 text-orange-800";
    case "Respinto": return "bg-red-100 text-red-800";
    default: return "bg-gray-100 text-gray-800";
  }
};

// Funzione per ottenere classi Tailwind per i badge di progresso
const getProgressoBadgeClass = (progresso) => {
    // Puoi personalizzare i colori per ogni fase se vuoi
    switch (progresso) {
        case "Documenti/Delega": return "bg-purple-100 text-purple-800";
        case "Richiesta Inviata": return "bg-indigo-100 text-indigo-800";
        case "Documenti Ricevuti": return "bg-teal-100 text-teal-800";
        default: return "bg-gray-100 text-gray-800";
    }
};


function AccessoAttiTableRow({ accesso, onEdit, onDelete, onUpdate }) {
  const [currentStato, setCurrentStato] = useState(accesso.stato);
  const [currentProgresso, setCurrentProgresso] = useState(accesso.progresso);

  // Aggiorna stato e progresso locali se l'oggetto accesso cambia dall'esterno
  useEffect(() => {
    setCurrentStato(accesso.stato);
    setCurrentProgresso(accesso.progresso);
  }, [accesso.stato, accesso.progresso]);

  const handleStatoChange = (e) => {
    const newStato = e.target.value;
    setCurrentStato(newStato);
    onUpdate(accesso.id, { stato: newStato });
  };

  const handleProgressoChange = (e) => {
    const newProgresso = e.target.value;
    setCurrentProgresso(newProgresso);
    onUpdate(accesso.id, { progresso: newProgresso });
  };

  const dataUltimaModificaFormattata = accesso.dataUltimaModifica
    ? formatDistanceToNow(accesso.dataUltimaModifica, { addSuffix: true, locale: it })
    : 'N/D';


  return (
    <tr className="hover:bg-gray-50">
      <td className="px-3 py-3 whitespace-nowrap">
        <div className="text-sm font-medium text-gray-900">{accesso.codice}</div>
        <div className="text-xs text-gray-500">ID: {accesso.id.substring(0, 5)}...</div>
      </td>
      <td className="px-3 py-3 whitespace-nowrap">
        <div className="text-sm text-gray-900">{accesso.indirizzo}</div>
      </td>
      <td className="px-3 py-3 whitespace-nowrap">
        <div className="text-sm text-gray-900">{accesso.proprieta}</div>
        {accesso.agenzia && <div className="text-xs text-gray-500">{accesso.agenzia}</div>}
      </td>
      <td className="px-3 py-3 whitespace-nowrap">
        <select
          value={currentStato}
          onChange={handleStatoChange}
          className={`text-xs font-semibold p-1 border-none rounded-md focus:outline-none focus:ring-0 appearance-none ${getStatoBadgeClass(currentStato)}`}
          style={{ minWidth: '120px' }} // Per dare spazio al testo
        >
          {STATI_DISPONIBILI.map(stato => (
            <option key={stato} value={stato} className="bg-white text-gray-800">
              {stato}
            </option>
          ))}
        </select>
      </td>
      <td className="px-3 py-3 whitespace-nowrap">
         <select
          value={currentProgresso}
          onChange={handleProgressoChange}
          className={`text-xs font-semibold p-1 border-none rounded-md focus:outline-none focus:ring-0 appearance-none ${getProgressoBadgeClass(currentProgresso)}`}
          style={{ minWidth: '140px' }} // Per dare spazio al testo
        >
          {PROGRESSO_FASI.map(fase => (
            <option key={fase} value={fase} className="bg-white text-gray-800">
              {fase}
            </option>
          ))}
        </select>
      </td>
      <td className="px-3 py-3 whitespace-nowrap text-center text-sm">
        <button
          onClick={() => onEdit(accesso)}
          className="text-blue-600 hover:text-blue-800 mr-3"
          title="Modifica Dettagli"
        >
          <FaEdit />
        </button>
        <button
          onClick={() => onDelete(accesso.id)}
          className="text-red-600 hover:text-red-800"
          title="Elimina Accesso"
        >
          <FaTrashAlt />
        </button>
         <div className="text-xs text-gray-400 mt-1 italic" title={`Ultima modifica: ${accesso.dataUltimaModifica ? accesso.dataUltimaModifica.toLocaleString('it-IT') : 'N/D'}`}>
            {dataUltimaModificaFormattata}
        </div>
      </td>
    </tr>
  );
}

export default AccessoAttiTableRow;
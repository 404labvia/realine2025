import React from 'react';
import { FaBuilding, FaUser, FaArrowRight } from 'react-icons/fa';

// onSpostaInNuovaGestione: passato solo dalle pagine "Da Completare" (pratiche storiche).
// Stesso schema del checkbox condizionale in AccessoAttiTableRow: se l'handler manca,
// il comando non compare (nelle pagine della nuova gestione non avrebbe senso).
const PraticaCell = ({ pratica, onEditPratica, onSpostaInNuovaGestione }) => {
  return (
    <div>
      <div
        className="cursor-pointer hover:text-blue-600"
        onClick={() => onEditPratica(pratica.id)}
      >
        <div className="text-xs font-medium text-gray-600 mb-1">{pratica.codice}</div>
        <div className="font-bold text-sm text-gray-800 mb-1">{pratica.indirizzo}</div>
        <div className="text-xs text-gray-600 mb-2">{pratica.cliente}</div>

        {pratica.agenzia && (
          <div className="flex items-center gap-1 text-xs text-gray-700 mb-1">
            <FaBuilding className="text-gray-700" size={10} />
            <span>{pratica.agenzia}</span>
          </div>
        )}

        {pratica.collaboratore && (
          <div className="flex items-center gap-1 text-xs text-gray-600">
            <FaUser className="text-gray-700" size={10} />
            <span>{pratica.collaboratore}</span>
          </div>
        )}
      </div>

      {onSpostaInNuovaGestione && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSpostaInNuovaGestione(pratica.id);
          }}
          className="mt-2 flex items-center gap-1 text-[11px] text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-300 hover:underline"
          title="Sposta questa pratica nella nuova gestione: comparirà nella pagina Pratiche e i suoi aggiornamenti entreranno nelle email settimanali"
        >
          <FaArrowRight size={9} />
          Sposta in nuova gestione
        </button>
      )}
    </div>
  );
};

export default PraticaCell;

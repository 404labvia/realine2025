// src/pages/PraticheBoardPage/components/cells/StatoCell.js
import React from 'react';
import { differenceInDays, differenceInCalendarDays } from 'date-fns';
import { FaPlay, FaClock } from 'react-icons/fa';

const StatoCell = ({ pratica, onChangeStato }) => {
  const dataInizio = pratica.dataInizio ? new Date(pratica.dataInizio) : null;
  const dataAtto = pratica.workflow?.scadenze?.dataAttoConfermato
    ? new Date(pratica.workflow.scadenze.dataAttoConfermato)
    : null;
  const dataCompromesso = pratica.workflow?.scadenze?.dataCompromesso
    ? new Date(pratica.workflow.scadenze.dataCompromesso)
    : null;

  const oggi = new Date();
  oggi.setHours(0, 0, 0, 0);

  // Calcola giorni in corso
  const giorniInCorso = dataInizio ? differenceInCalendarDays(oggi, dataInizio) : 0;

  // Usa atto come priorità, altrimenti compromesso
  const scadenza = dataAtto || dataCompromesso;
  let giorniMancanti = null;
  let badgeColor = 'bg-gray-500';

  if (scadenza) {
    const scadenzaDate = new Date(scadenza);
    scadenzaDate.setHours(0, 0, 0, 0);
    giorniMancanti = differenceInCalendarDays(scadenzaDate, oggi);

    if (giorniMancanti <= 7) {
      badgeColor = 'bg-red-500';
    } else if (giorniMancanti <= 15) {
      badgeColor = 'bg-yellow-500';
    } else {
      badgeColor = 'bg-green-500';
    }
  }

  return (
    <div className="text-center space-y-2 p-2">
      <div className="flex items-center justify-center gap-1">
        <FaPlay className="text-gray-600" size={12} />
        <select
          value={pratica.stato || 'In Corso'}
          onChange={(e) => onChangeStato(pratica.id, e.target.value)}
          className="text-xs border-0 bg-transparent focus:ring-0 focus:outline-none text-gray-700 font-medium"
        >
          <option value="In Corso">In Corso</option>
          <option value="Completata">Completata</option>
        </select>
      </div>

      {pratica.stato !== 'Completata' && (
        <>
          <div className="flex items-center justify-center gap-1 text-xs">
            <FaClock className="text-gray-500" size={10} />
            <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
              {giorniInCorso} {giorniInCorso === 1 ? 'giorno' : 'giorni'}
            </span>
          </div>

          {scadenza && giorniMancanti !== null && (
            <div className="text-xs">
              <span className={`inline-block px-2 py-1 ${badgeColor} text-white rounded-full font-medium`}>
                {giorniMancanti > 0 ? (
                  <>Scadenza: {giorniMancanti} {giorniMancanti === 1 ? 'giorno' : 'giorni'}</>
                ) : giorniMancanti === 0 ? (
                  <>Scadenza: OGGI</>
                ) : (
                  <>SCADUTO: {Math.abs(giorniMancanti)} {Math.abs(giorniMancanti) === 1 ? 'giorno' : 'giorni'}</>
                )}
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default StatoCell;
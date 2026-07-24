// src/pages/PraticheBoardPage/components/AttiApeTabs.js
// Sezione a tabs mostrata nella singola agenzia della NUOVA gestione: sulla stessa riga
// Accesso Atti (giallo, coerente col digest email) e APE (viola, coerente con la card
// statistiche APE). Il tab fa da titolo, sostituendo l'header "Agenzia (N in corso...)".
// Riusa le tabelle esistenti AccessoAttiTable (con "Sposta in pratica") e ApeTable.
import React, { useState } from 'react';
import { FaPlus, FaFilter, FaFileAlt, FaBolt, FaChevronDown, FaChevronRight } from 'react-icons/fa';
import AccessoAttiTable from '../../AccessiAgliAttiPage/components/AccessoAttiTable';
import ApeTable from '../../ApePage/components/ApeTable';

// Palette coerente col resto della webapp:
// - atti = GIALLO (functions/digest.js renderAccessoCard)
// - ape  = VIOLA (ApePage/components/ApeStatisticsBox)
const TAB_STYLES = {
  atti: {
    active: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    toolbar: 'bg-yellow-50',
    btn: 'bg-yellow-500 hover:bg-yellow-600',
    border: 'border-yellow-200',
  },
  ape: {
    active: 'bg-purple-100 text-purple-800 border-purple-300',
    toolbar: 'bg-purple-50',
    btn: 'bg-purple-500 hover:bg-purple-600',
    border: 'border-purple-200',
  },
};

function AttiApeTabs({
  accessi = [],
  ape = [],
  onEditAccesso,
  onDeleteAccesso,
  onUpdateAccesso,
  onAddNewAccesso,
  onSpostaInPratica,
  onEditApe,
  onDeleteApe,
  onUpdateApe,
  onAddNewApe,
}) {
  const [activeTab, setActiveTab] = useState('atti');
  const [isExpanded, setIsExpanded] = useState(false);
  const [filtroStatoAtti, setFiltroStatoAtti] = useState('in_corso');
  const [filtroStatoApe, setFiltroStatoApe] = useState('in_corso');

  const accessiInCorso = accessi.filter(a => !a.completata).length;
  const accessiCompletati = accessi.filter(a => a.completata).length;
  const apeInCorso = ape.filter(a => !a.completata).length;
  const apeCompletati = ape.filter(a => a.completata).length;

  const isAtti = activeTab === 'atti';
  const style = isAtti ? TAB_STYLES.atti : TAB_STYLES.ape;
  const filtroStato = isAtti ? filtroStatoAtti : filtroStatoApe;
  const setFiltroStato = isAtti ? setFiltroStatoAtti : setFiltroStatoApe;
  const inCorso = isAtti ? accessiInCorso : apeInCorso;
  const completati = isAtti ? accessiCompletati : apeCompletati;
  const totale = isAtti ? accessi.length : ape.length;

  // Clic su un tab: se chiuso apre; se già aperto sul tab attivo, chiude (toggle).
  const handleTabClick = (id) => {
    if (activeTab === id && isExpanded) {
      setIsExpanded(false);
    } else {
      setActiveTab(id);
      setIsExpanded(true);
    }
  };

  const renderTab = (id, icon, label, count, styleActive) => {
    const active = activeTab === id;
    return (
      <button
        onClick={() => handleTabClick(id)}
        className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-t-lg border-b-2 transition-colors ${
          active ? styleActive : 'bg-gray-50 text-gray-500 border-transparent hover:bg-gray-100'
        }`}
      >
        {icon}
        <span>{label}</span>
        <span className={`text-xs font-normal ${active ? '' : 'text-gray-400'}`}>({count} in corso)</span>
      </button>
    );
  };

  return (
    <div className={`rounded-lg shadow-lg overflow-hidden bg-white mb-4 border ${style.border}`}>
      {/* Tab bar = titolo della sezione (sempre visibile). Il chevron a destra apre/chiude. */}
      <div className="flex items-end justify-between gap-1 px-2 pt-2 bg-gray-50 border-b border-gray-200">
        <div className="flex items-end gap-1">
          {renderTab('atti', <FaFileAlt />, 'Accesso Atti', accessiInCorso, TAB_STYLES.atti.active)}
          {renderTab('ape', <FaBolt />, 'APE', apeInCorso, TAB_STYLES.ape.active)}
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center text-gray-600 hover:text-gray-900 px-3 py-2 focus:outline-none"
          title={isExpanded ? 'Riduci' : 'Espandi'}
        >
          {isExpanded ? <FaChevronDown size={16} /> : <FaChevronRight size={16} />}
        </button>
      </div>

      {isExpanded && (
        <>
          {/* Toolbar: filtro stato + Nuovo (colore della sezione attiva) */}
          <div className={`flex justify-end items-center gap-3 px-4 py-2 ${style.toolbar}`}>
            <div className="flex items-center gap-2">
              <FaFilter className="text-gray-500 text-sm" />
              <select
                value={filtroStato}
                onChange={(e) => setFiltroStato(e.target.value)}
                className="text-sm border border-gray-300 rounded px-2 py-1 bg-white"
              >
                <option value="in_corso">In corso ({inCorso})</option>
                <option value="completata">Completati ({completati})</option>
                <option value="tutti">Tutti ({totale})</option>
              </select>
            </div>
            <button
              onClick={() => (isAtti ? onAddNewAccesso() : onAddNewApe())}
              className={`flex items-center text-white font-bold py-1 px-3 rounded text-sm ${style.btn}`}
            >
              <FaPlus className="mr-2" /> Nuovo
            </button>
          </div>

          {/* Body: tabella della sezione attiva */}
          <div className="p-2 sm:p-4 bg-white">
            {isAtti ? (
              accessi.length > 0 ? (
                <AccessoAttiTable
                  accessi={accessi}
                  onEdit={onEditAccesso}
                  onDelete={onDeleteAccesso}
                  onUpdate={onUpdateAccesso}
                  onSpostaInPratica={onSpostaInPratica}
                  filtroStato={filtroStatoAtti}
                />
              ) : (
                <p className="text-center text-gray-500 py-4">Nessun accesso agli atti per questa agenzia.</p>
              )
            ) : ape.length > 0 ? (
              <ApeTable
                ape={ape}
                onEdit={onEditApe}
                onDelete={onDeleteApe}
                onUpdate={onUpdateApe}
                filtroStato={filtroStatoApe}
              />
            ) : (
              <p className="text-center text-gray-500 py-4">Nessun APE per questa agenzia.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default AttiApeTabs;

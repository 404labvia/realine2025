// src/pages/FinanzePage/DistribuzioneProfitti.js
import React, { useState, useEffect } from 'react';
import { FaMoneyBillWave, FaCheckSquare, FaRegSquare } from 'react-icons/fa';
import { MdAccountBalanceWallet, MdAttachMoney, MdMoneyOff } from 'react-icons/md';

function DistribuzioneProfitti({ profittoSociData, pratiche, pagamentiProfittiState, onTogglePagamento }) {

  // Combina titolare e soci in un unico array per iterare
  const allSoci = [
    profittoSociData.titolare,
    ...profittoSociData.soci
  ].filter(s => s && s.id); // Filtra eventuali soci null/undefined e assicurati che abbiano un ID

  const [activeSocioId, setActiveSocioId] = useState(allSoci[0]?.id || ''); // Stato per la tab attiva

  // Imposta il primo socio come attivo all'avvio o se l'attivo non è più valido
  useEffect(() => {
    const firstValidSocioId = allSoci[0]?.id;
    if (allSoci.length > 0 && (!activeSocioId || !allSoci.some(s => s.id === activeSocioId))) {
      setActiveSocioId(firstValidSocioId);
    }
  }, [allSoci, activeSocioId]);

  // Funzione per formattare l'etichetta della tab (Titolo + Cognome)
  const formatTabLabel = (fullName) => {
    if (!fullName) return '';
    const parts = fullName.split(' ');
    if (parts.length < 2) return fullName;
    const title = parts[0];
    const lastName = parts[parts.length - 1];
    // Gestione "De Antoni"
    if (lastName === 'Antoni' && parts.length > 2 && parts[parts.length - 2].toLowerCase() === 'de') {
        return `${title} De ${lastName}`;
    }
    return `${title} ${lastName}`;
  };


  return (
    <div className="bg-white p-6 rounded-lg shadow mb-8">
      <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
        <FaMoneyBillWave className="text-green-600 mr-2 text-xl" />
        Distribuzione Profitti Soci (Solo Pratiche Concluse) {/* Titolo aggiornato */}
      </h2>

      {allSoci.length > 0 ? (
        <div>
          {/* Navigazione Tabs Soci */}
          <div className="border-b border-gray-200">
            <ul className="flex flex-nowrap overflow-x-auto -mb-px text-sm font-medium text-center" role="tablist">
              {allSoci.map((socio) => (
                <li key={socio.id} className="mr-2 flex-shrink-0" role="presentation">
                  <button
                    className={`inline-block p-3 rounded-t-lg border-b-2 whitespace-nowrap ${
                      activeSocioId === socio.id
                        ? 'text-blue-600 border-blue-600 active'
                        : 'border-transparent hover:text-gray-600 hover:border-gray-300'
                    }`}
                    id={`${socio.id}-profitti-tab`} // ID univoco per la tab
                    type="button"
                    role="tab"
                    aria-controls={`${socio.id}-profitti-content`} // Controlla il pannello corretto
                    aria-selected={activeSocioId === socio.id}
                    onClick={() => setActiveSocioId(socio.id)}
                  >
                    {formatTabLabel(socio.nome)} {/* Usa la funzione per formattare */}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Contenuto Tab per Socio Attivo */}
          <div id="tabContentProfitti" className="pt-4">
             {allSoci.map((socio) => {
                const isCurrentTab = activeSocioId === socio.id;
                let currentSocioData = null;

                // Trova i dati del socio attivo CORRETTAMENTE
                // Utilizza i dati passati da `profittoSociData` che sono già stati calcolati
                // in `index.js` considerando solo le pratiche concluse per i totali.
                if (socio.id === profittoSociData.titolare.id) {
                    currentSocioData = profittoSociData.titolare;
                } else {
                    currentSocioData = profittoSociData.soci.find(s => s.id === socio.id);
                }

                // Calcola totali per il riepilogo della tab corrente (usa i dati già calcolati)
                const totaleDovutoTab = currentSocioData?.totale || 0;
                const totalePagatoTab = currentSocioData?.pagato || 0;
                const totaleDaPagareTab = totaleDovutoTab - totalePagatoTab;

                // --- MODIFICA: Filtra le pratiche da visualizzare qui ---
                const praticheDaVisualizzare = currentSocioData?.pratiche
                    ?.filter(praticaSocio => praticaSocio.stato === 'Completata') // Filtra per stato 'Completata'
                    .filter(p => p.quota > 0.01) // Mantieni filtro quota se necessario
                    .sort((a, b) => (a.codice || '').localeCompare(b.codice || '')) || []; // Ordina per codice


                return (
                    <div
                        key={`${socio.id}-profitti-content`}
                        className={`${isCurrentTab ? '' : 'hidden'} p-4 rounded-lg bg-gray-50`}
                        id={`${socio.id}-profitti-content`} // ID univoco per il pannello
                        role="tabpanel"
                        aria-labelledby={`${socio.id}-profitti-tab`}
                    >
                        {/* Mostra contenuto solo se la tab è attiva */}
                        {isCurrentTab && currentSocioData ? (
                            <>
                                {/* Titolo con Nome Completo Socio */}
                                <h3 className="text-lg font-semibold text-gray-700 mb-4">
                                    {socio.nome} - Riepilogo Distribuzione (Pratiche Concluse)
                                </h3>

                                {/* Riepilogo Totali per il socio attivo */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                    {/* Totale Profitto Socio */}
                                    <div className="flex items-center p-4 bg-blue-50 rounded-lg shadow-sm">
                                        <div className="p-3 rounded-full bg-blue-100 mr-3">
                                        <MdAccountBalanceWallet className="text-blue-600 text-xl" />
                                        </div>
                                        <div>
                                        <p className="text-xs text-gray-500">Profitto Totale ({ (socio.percentuale * 100).toFixed(0) }%)</p>
                                        <h3 className="text-lg font-bold text-gray-800">
                                            €{totaleDovutoTab.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </h3>
                                        </div>
                                    </div>
                                    {/* Totale Già Distribuito */}
                                    <div className="flex items-center p-4 bg-green-50 rounded-lg shadow-sm">
                                        <div className="p-3 rounded-full bg-green-100 mr-3">
                                        <MdAttachMoney className="text-green-600 text-xl" />
                                        </div>
                                        <div>
                                        <p className="text-xs text-gray-500">Già Distribuito</p>
                                        <h3 className="text-lg font-bold text-green-600">
                                            €{totalePagatoTab.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </h3>
                                        </div>
                                    </div>
                                    {/* Da Distribuire */}
                                    <div className="flex items-center p-4 bg-red-50 rounded-lg shadow-sm">
                                        <div className="p-3 rounded-full bg-red-100 mr-3">
                                        <MdMoneyOff className="text-red-600 text-xl" />
                                        </div>
                                        <div>
                                        <p className="text-xs text-gray-500">Da Distribuire</p>
                                        <h3 className="text-lg font-bold text-red-600">
                                            €{totaleDaPagareTab.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </h3>
                                        </div>
                                    </div>
                                </div>

                                {/* Dettaglio Pratiche per Socio Attivo */}
                                <h4 className="text-md font-semibold text-gray-600 mb-3">Dettaglio Quote Pratiche Concluse</h4>
                                <div className="max-h-80 overflow-y-auto border rounded-md bg-white"> {/* Scroll per la lista pratiche */}
                                    <ul className="divide-y divide-gray-200">
                                    {praticheDaVisualizzare.length > 0 ? ( // Usa la lista filtrata
                                        praticheDaVisualizzare.map((praticaSocio) => (
                                        <li key={praticaSocio.id} className="flex items-center justify-between text-sm px-4 py-3 hover:bg-gray-50">
                                            {/* Info Pratica */}
                                            <div className="flex-1 mr-4 truncate">
                                            {/* Non serve più la formattazione condizionale per 'Completata' */}
                                            <span className={`font-medium text-gray-900`}>
                                                {praticaSocio.codice || 'N/D'} - {praticaSocio.indirizzo} ({praticaSocio.cliente})
                                            </span>
                                            </div>
                                            {/* Quota e Checkbox */}
                                            <div className="flex items-center flex-shrink-0">
                                            <span className="text-gray-700 mr-4 text-xs sm:text-sm">
                                                Quota: <span className="font-semibold">€{praticaSocio.quota.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                            </span>
                                            <button
                                                // Usa l'ID del socio corrente (dalla mappa esterna) per l'handler
                                                onClick={() => onTogglePagamento(praticaSocio.id, socio.id)}
                                                // Determina lo stato pagato usando lo stato locale aggiornato passato come prop
                                                className={`p-1 rounded ${pagamentiProfittiState[praticaSocio.id]?.[socio.id] ? 'text-green-600 hover:text-green-700' : 'text-gray-400 hover:text-gray-600'}`}
                                                title={pagamentiProfittiState[praticaSocio.id]?.[socio.id] ? 'Segna come non pagato' : 'Segna come pagato'}
                                            >
                                                {pagamentiProfittiState[praticaSocio.id]?.[socio.id] ? <FaCheckSquare size={16} /> : <FaRegSquare size={16} />}
                                            </button>
                                            </div>
                                        </li>
                                        ))
                                    ) : (
                                        <li className="px-4 py-6 text-sm text-gray-500 text-center">Nessuna pratica conclusa con profitto assegnata a questo socio.</li>
                                    )}
                                    </ul>
                                </div>
                            </>
                        ) : (
                             isCurrentTab && <div className="text-center py-10 text-gray-500">Caricamento dati socio...</div>
                        )}
                    </div>
                 );
             })}
          </div>
        </div>
      ) : (
        <div className="text-center py-10 text-gray-500">
          Nessun socio configurato.
        </div>
      )}
    </div>
  );
}

export default DistribuzioneProfitti;

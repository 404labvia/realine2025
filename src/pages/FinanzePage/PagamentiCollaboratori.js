// src/pages/FinanzePage/PagamentiCollaboratori.js
import React, { useState, useEffect } from 'react';
import { FaUsers, FaFolderOpen } from 'react-icons/fa';
import { MdAccountBalanceWallet, MdAttachMoney, MdMoneyOff } from 'react-icons/md';
import { usePratiche } from '../../contexts/PraticheContext';
import { agenzieCollaboratori, collaboratoriAggiuntivi } from '../../pages/PratichePage/utils/praticheUtils';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

// Componente per la barra di progresso con importo mancante e colori personalizzati
const ProgressBar = ({ percentage, dovuto, ricevuto }) => {
  const cappedPercentage = Math.min(Math.max(percentage, 0), 100); // Limita tra 0 e 100
  const mancante = Math.max(0, dovuto - ricevuto); // Calcola l'importo mancante

  return (
    <div className="w-1/3 mx-2"> {/* Barra più corta (w-1/3) e con margine orizzontale */}
      {/* Sfondo della barra rosso chiaro */}
      <div className="w-full bg-red-100 rounded-full h-1.5 dark:bg-red-700 relative"> {/* Sfondo rosso chiaro */}
        {/* Barra di avanzamento verde */}
        <div
          className="bg-green-600 h-1.5 rounded-full" // Barra verde
          style={{ width: `${cappedPercentage}%` }}
        ></div>
      </div>
      {/* Mostra importo mancante sotto la barra */}
      <div className="text-center text-[10px] text-red-600 mt-0.5"> {/* Testo piccolo e rosso */}
        Mancante: €{mancante.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </div>
    </div>
  );
};


function PagamentiCollaboratori({ finanze }) {
  const { pratiche } = usePratiche();
  const [activeTab, setActiveTab] = useState('');

  // Ordine desiderato per le tabs
  const desiredOrder = [
    'Geom. Alessandro De Antoni', // Corretto nome
    'Geom. Alessandro Castro',
    'Geom. Matteo Antonelli',
    'Geom. Tiziano Martini',
    'Ing. Marco Moschetti',
    'Per. Ind. Emanuele Donati',
    'Geom. Andrea Ricci',
    'Geom. Giacomo Landi'
  ];

  // Collaboratori unici presenti nelle pratiche (sia come principale che firmatario)
  const collaboratoriUnici = [
    ...new Set([
      ...pratiche.map(p => p.collaboratore).filter(c => c),
      ...pratiche.map(p => p.collaboratoreFirmatario).filter(c => c) // Aggiungi firmatari
    ])
  ];

  // Ordina i collaboratori presenti secondo l'ordine desiderato
  const collaboratoriOrdinati = collaboratoriUnici.sort((a, b) => {
    const indexA = desiredOrder.indexOf(a);
    const indexB = desiredOrder.indexOf(b);
    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    return a.localeCompare(b);
  });


  // Imposta la prima scheda come attiva all'avvio
  useEffect(() => {
    if (collaboratoriOrdinati.length > 0 && !activeTab) {
      const firstCollaboratorWithPratiche = collaboratoriOrdinati.find(collab =>
        pratiche.some(p =>
            (p.collaboratore === collab && (p.importoCollaboratore || 0) > 0) || // Controllo importo > 0
            (p.collaboratoreFirmatario === collab && (p.importoFirmatario || 0) > 0) // Controllo importo > 0
        )
      );
      setActiveTab(firstCollaboratorWithPratiche || collaboratoriOrdinati[0]);
    }
     else if (activeTab && !collaboratoriOrdinati.includes(activeTab)) {
        const firstValid = collaboratoriOrdinati.length > 0 ? collaboratoriOrdinati[0] : '';
        setActiveTab(firstValid);
     }
  }, [collaboratoriOrdinati, pratiche, activeTab]);


  /**
   * Calcola l'importo totale dovuto al collaboratore attivo per una specifica pratica,
   * considerando sia il ruolo di collaboratore principale che di firmatario.
   * @param {object} pratica - L'oggetto della pratica.
   * @param {string} currentCollaborator - Il nome del collaboratore attivo nella tab.
   * @returns {number} L'importo totale dovuto.
   */
  const calcolaImportoDovutoPratica = (pratica, currentCollaborator) => {
      let dovuto = 0;
      if (pratica.collaboratore === currentCollaborator) {
          dovuto += pratica.importoCollaboratore || 0;
      }
      if (pratica.collaboratoreFirmatario === currentCollaborator) {
          dovuto += pratica.importoFirmatario || 0;
      }
      return dovuto;
  };

  /**
   * Calcola l'importo totale già pagato al collaboratore attivo per una specifica pratica,
   * considerando sia il ruolo di collaboratore principale che di firmatario.
   * Somma gli importi dagli step di pagamento se l'importo > 0.
   * @param {object} pratica - L'oggetto della pratica.
   * @param {string} currentCollaborator - Il nome del collaboratore attivo nella tab.
   * @returns {number} L'importo totale ricevuto.
   */
  const calcolaImportoRicevutoPratica = (pratica, currentCollaborator) => {
    let importoRicevuto = 0;
    // console.log(`Calcolo Ricevuto per Pratica: ${pratica.codice} - Collaboratore Attivo: ${currentCollaborator}`);
    if (pratica.workflow) {
      const passiPagamento = ['acconto1', 'acconto2', 'saldo'];
      passiPagamento.forEach(passo => {
        const stepData = pratica.workflow[passo];
        // console.log(`  - Controllo Step: ${passo}`);
        if (stepData) {
            // console.log(`    > Step Data: importoCollab=${stepData.importoCollaboratore}, importoFirm=${stepData.importoFirmatario}`);
            // Somma importoCollaboratore se il collaboratore attivo è il principale e importo > 0
            if (pratica.collaboratore === currentCollaborator && stepData.importoCollaboratore > 0) {
                // console.log(`    >> AGGIUNGO importo COLLABORATORE: ${stepData.importoCollaboratore}`);
                importoRicevuto += stepData.importoCollaboratore;
            }
            // Somma importoFirmatario se il collaboratore attivo è il firmatario e importo > 0
            if (pratica.collaboratoreFirmatario === currentCollaborator && stepData.importoFirmatario > 0) {
                 // console.log(`    >> AGGIUNGO importo FIRMATARIO: ${stepData.importoFirmatario}`);
                 importoRicevuto += stepData.importoFirmatario;
            }
        } else {
            //  console.log(`    > Step ${passo} non trovato nel workflow.`);
        }
      });
    } else {
        // console.log(`  - Workflow non trovato per la pratica.`);
    }
    // console.log(`  -> Totale Ricevuto Calcolato: ${importoRicevuto}`);
    return importoRicevuto;
  };

  // Funzione per formattare l'etichetta della tab (Titolo + Cognome)
  const formatTabLabel = (fullName) => {
    if (!fullName) return '';
    const parts = fullName.split(' ');
    if (parts.length < 2) return fullName;
    const title = parts[0];
    const lastName = parts[parts.length - 1];
    // Correzione specifica per De Antoni
    if (lastName === 'Antoni' && parts.length > 2 && parts[parts.length - 2].toLowerCase() === 'de') {
        return `${title} De ${lastName}`;
    }
    return `${title} ${lastName}`;
  };

  // Filtra TUTTE le pratiche per il collaboratore attivo (per calcolo totali)
  const tuttePraticheCollaboratoreAttivo = pratiche.filter(
    (p) => (p.collaboratore === activeTab && (p.importoCollaboratore || 0) > 0) || // Controllo importo > 0
           (p.collaboratoreFirmatario === activeTab && (p.importoFirmatario || 0) > 0) // Controllo importo > 0
  );

  // Filtra le pratiche IN CORSO per il collaboratore attivo (per visualizzazione lista)
  const praticheInCorsoCollaboratoreAttivo = tuttePraticheCollaboratoreAttivo.filter(
      p => p.stato === 'In Corso'
  );


  // Calcola totali per il collaboratore attivo considerando entrambi i ruoli e TUTTE le pratiche (anche completate)
  const totaleDovutoAttivo = tuttePraticheCollaboratoreAttivo.reduce((sum, p) => sum + calcolaImportoDovutoPratica(p, activeTab), 0);
  const totaleRicevutoAttivo = tuttePraticheCollaboratoreAttivo.reduce((sum, p) => sum + calcolaImportoRicevutoPratica(p, activeTab), 0);
  const totaleDaPagareAttivo = totaleDovutoAttivo - totaleRicevutoAttivo;

  return (
    <div className="bg-white p-6 rounded-lg shadow mb-8">
      <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
        <FaUsers className="text-purple-600 mr-2 text-xl" />
        Pagamenti Collaboratori
      </h2>

      {collaboratoriOrdinati.length > 0 ? (
        <div>
          {/* Navigazione Tabs */}
          <div className="border-b border-gray-200">
            <ul className="flex flex-nowrap overflow-x-auto -mb-px text-sm font-medium text-center" role="tablist">
              {collaboratoriOrdinati.map((collaboratore) => (
                <li key={collaboratore} className="mr-2 flex-shrink-0" role="presentation">
                  <button
                    className={`inline-block p-3 rounded-t-lg border-b-2 whitespace-nowrap ${
                      activeTab === collaboratore
                        ? 'text-blue-600 border-blue-600 active'
                        : 'border-transparent hover:text-gray-600 hover:border-gray-300'
                    }`}
                    id={`${collaboratore}-tab`}
                    type="button"
                    role="tab"
                    aria-controls={collaboratore}
                    aria-selected={activeTab === collaboratore}
                    onClick={() => setActiveTab(collaboratore)}
                  >
                    {formatTabLabel(collaboratore)}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Contenuto Tab */}
          <div id="tabContentExample" className="pt-4">
            {collaboratoriOrdinati.map((collaboratore) => (
              <div
                key={`${collaboratore}-content`}
                className={`${activeTab === collaboratore ? '' : 'hidden'} p-4 rounded-lg bg-gray-50`}
                id={collaboratore}
                role="tabpanel"
                aria-labelledby={`${collaboratore}-tab`}
              >
                {/* Titolo con Nome Completo Collaboratore */}
                <h3 className="text-lg font-semibold text-gray-700 mb-4">
                   {activeTab} {/* Mostra il nome completo */}
                </h3>

                {/* Riepilogo Totali per il collaboratore attivo - Stile Dashboard */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                   {/* Totale Dovuto */}
                  <div className="flex items-center p-4 bg-blue-50 rounded-lg shadow-sm">
                    <div className="p-3 rounded-full bg-blue-100 mr-3">
                       <MdAccountBalanceWallet className="text-blue-600 text-xl" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Totale Dovuto (Tutte)</p> {/* Etichetta modificata */}
                      <h3 className="text-lg font-bold text-gray-800">
                        €{totaleDovutoAttivo.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </h3>
                    </div>
                  </div>
                   {/* Totale Ricevuto */}
                  <div className="flex items-center p-4 bg-green-50 rounded-lg shadow-sm">
                    <div className="p-3 rounded-full bg-green-100 mr-3">
                      <MdAttachMoney className="text-green-600 text-xl" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Totale Ricevuto (Tutte)</p> {/* Etichetta modificata */}
                      <h3 className="text-lg font-bold text-green-600">
                        €{totaleRicevutoAttivo.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </h3>
                    </div>
                  </div>
                  {/* Da Pagare */}
                  <div className="flex items-center p-4 bg-red-50 rounded-lg shadow-sm">
                     <div className="p-3 rounded-full bg-red-100 mr-3">
                       <MdMoneyOff className="text-red-600 text-xl" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Da Pagare (Tutte)</p> {/* Etichetta modificata */}
                      <h3 className="text-lg font-bold text-red-600">
                        €{totaleDaPagareAttivo.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </h3>
                    </div>
                  </div>
                </div>

                {/* Lista Pratiche IN CORSO */}
                 <h4 className="text-md font-semibold text-gray-600 mb-3">Pratiche in Corso</h4>
                <ul className="space-y-4">
                  {praticheInCorsoCollaboratoreAttivo.length > 0 ? ( // Usa la lista filtrata per stato
                    praticheInCorsoCollaboratoreAttivo.map((pratica) => {
                      // Calcola dovuto e ricevuto per QUESTA pratica e QUESTO collaboratore
                      const importoDovutoPratica = calcolaImportoDovutoPratica(pratica, activeTab);
                      const importoRicevutoPratica = calcolaImportoRicevutoPratica(pratica, activeTab);
                      const percentage = importoDovutoPratica > 0 ? (importoRicevutoPratica / importoDovutoPratica) * 100 : 0;

                      return (
                        <li key={pratica.id} className="p-4 border border-gray-200 rounded-md bg-white hover:bg-gray-50 shadow-sm">
                          {/* Dettagli Pratica, Barra e Totali Pratica */}
                          <div className="flex justify-between items-center">
                            {/* Info Pratica */}
                            <div className="flex-1 mr-2 flex items-center min-w-0">
                              <FaFolderOpen className="mr-2 text-blue-500 flex-shrink-0" />
                              <span className="text-sm font-medium text-gray-900 truncate">
                                {pratica.codice} - {pratica.indirizzo} ({pratica.cliente})
                              </span>
                            </div>
                            {/* Barra di Progresso (con colori aggiornati) */}
                            <ProgressBar
                                percentage={percentage}
                                dovuto={importoDovutoPratica}
                                ricevuto={importoRicevutoPratica}
                            />
                            {/* Totali Pratica (con colori aggiornati) */}
                            <div className="text-xs text-right space-y-1 flex-shrink-0 ml-2">
                              <p className="text-gray-700 whitespace-nowrap"> {/* Colore nero */}
                                Dovuto: <span className="font-semibold">€{importoDovutoPratica.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                              </p>
                              <p className="text-green-600 whitespace-nowrap"> {/* Colore verde */}
                                Ricevuto: <span className="font-semibold">€{importoRicevutoPratica.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                              </p>
                            </div>
                          </div>
                        </li>
                      );
                    })
                  ) : (
                    <li className="px-4 py-6 text-sm text-gray-500 text-center">
                      Nessuna pratica in corso assegnata a questo collaboratore.
                    </li>
                  )}
                </ul>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-10 text-gray-500">
          Nessun collaboratore trovato con pratiche assegnate.
        </div>
      )}
    </div>
  );
}

export default PagamentiCollaboratori;

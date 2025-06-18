// src/pages/FinanzePage/index.js
import React, { useState, useRef, useEffect, useMemo } from 'react'; // Import useMemo
import { usePratiche } from '../../contexts/PraticheContext';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { FaFileDownload } from 'react-icons/fa';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// Import dei componenti
import FiltriFinanze from './FiltriFinanze';
import SituazioneFinanziaria from './SituazioneFinanziaria';
import PagamentiCollaboratori from './PagamentiCollaboratori';
import DistribuzioneProfitti from './DistribuzioneProfitti';
import UltimiPagamenti from './UltimiPagamenti';

// Importa la configurazione di Chart.js
import './ChartConfig';

// Struttura iniziale dei soci (per percentuali e nomi)
const sociConfig = {
    titolare: {
        id: 'alessandro_de_antoni', // ID univoco
        nome: 'Alessandro de Antoni',
        percentuale: 0.79
    },
    soci: [
        { id: 'roberto_ritorto', nome: 'Roberto Ritorto', percentuale: 0.07 },
        { id: 'andrea_pardini', nome: 'Andrea Pardini', percentuale: 0.07 },
        { id: 'andrea_proscia', nome: 'Andrea Proscia', percentuale: 0.07 }
    ]
};

// --- Funzioni Helper spostate fuori dal componente per chiarezza ---

// Calcola incassi committente EFFETTIVI (con completedDate) per una pratica
const calcolaIncassiEffettiviCommittentePratica = (pratica) => {
    let incassi = 0;
    if (pratica?.workflow) { // Aggiunto controllo esistenza workflow
        const passi = ['acconto1', 'acconto2', 'saldo'];
        passi.forEach(passo => {
            if (pratica.workflow[passo]?.importoCommittente > 0 && pratica.workflow[passo]?.completedDate) {
                incassi += pratica.workflow[passo].importoCommittente;
            }
        });
    }
    return incassi;
};

// Calcola pagamenti collaboratori/firmatari EFFETTIVI (con completedDate) per una pratica
 const calcolaPagamentiEffettiviCollaboratoriPratica = (pratica) => {
    let pagamenti = 0;
    if (pratica?.workflow) { // Aggiunto controllo esistenza workflow
        const passi = ['acconto1', 'acconto2', 'saldo'];
        passi.forEach(passo => {
            if (pratica.workflow[passo]?.importoCollaboratore > 0 && pratica.workflow[passo]?.completedDate) {
                pagamenti += pratica.workflow[passo].importoCollaboratore;
            }
            if (pratica.workflow[passo]?.importoFirmatario > 0 && pratica.workflow[passo]?.completedDate) {
                pagamenti += pratica.workflow[passo].importoFirmatario;
            }
        });
    }
    return pagamenti;
 };

// Calcola pagamenti collaboratori/firmatari TOTALI PREVISTI (importi inseriti negli step)
const calcolaPagamentiInseritiCollaboratoriPratica = (pratica) => {
    let pagamenti = 0;
    if (pratica?.workflow) { // Aggiunto controllo esistenza workflow
        const passi = ['acconto1', 'acconto2', 'saldo'];
        passi.forEach(passo => {
            if (pratica.workflow[passo]?.importoCollaboratore > 0) {
                pagamenti += pratica.workflow[passo].importoCollaboratore;
            }
            if (pratica.workflow[passo]?.importoFirmatario > 0) {
                pagamenti += pratica.workflow[passo].importoFirmatario;
            }
        });
    }
    return pagamenti;
};

// Logica Calcolo Profitto Pratica per Distribuzione Soci (basata su importo base committente e importi LORDI collaboratori)
const calcolaProfittoPraticaPerSoci = (pratica) => {
    const baseCommittente = pratica?.importoBaseCommittente || 0; // Aggiunto controllo esistenza pratica
    if (baseCommittente <= 0) {
        return 0;
    }
    // Modifica: Utilizzo degli importi totali (lordi) dei collaboratori invece degli importi base (netti)
    const costoCollaboratore = pratica.importoCollaboratore || 0;
    const costoFirmatario = pratica.importoFirmatario || 0;
    // Il profitto da distribuire è calcolato sottraendo i costi lordi dei collaboratori dal ricavo base.
    const profitto = baseCommittente - (costoCollaboratore + costoFirmatario);
    return profitto > 0 ? profitto : 0;
};

// Valore iniziale vuoto per finanze (usato durante il loading o se pratiche non è ancora definito)
const initialFinanzeState = {
  totalePagamenti: 0,
  totaleDaPagare: 0,
  pagamentiPerMese: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 0 },
  pagamentiCollaboratoriPerMese: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 0 },
  profittoPerMese: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 0 },
  totaliCollaboratori: { totale: 0, pagato: 0, daPagare: 0 },
  esposizioneFinanziaria: { margineOperativo: 0, margineOperativoPercentuale: 0, margineNetto: 0 },
  pagamentiCollaboratori: {},
  profittoSoci: {
    titolare: { ...sociConfig.titolare, totale: 0, pagato: 0, pratiche: [] },
    soci: sociConfig.soci.map(s => ({ ...s, totale: 0, pagato: 0, pratiche: [] }))
  },
  pagamentiRecenti: [],
};


function FinanzePage() {
  // --- 1. Hooks ---
  const { pratiche, loading, updatePratica } = usePratiche();
  const [filtroMese, setFiltroMese] = useState('');
  const [filtroAnno, setFiltroAnno] = useState(new Date().getFullYear().toString());
  const reportRef = useRef(null);
  const [pagamentiProfittiSoci, setPagamentiProfittiSoci] = useState({});

  // Carica stato pagamenti soci da localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('pagamentiProfittiSociState');
    if (savedState) {
      try {
        setPagamentiProfittiSoci(JSON.parse(savedState));
      } catch (e) { console.error("Errore caricamento stato pagamenti soci:", e); }
    }
  }, []); // Esegui solo al mount

  // Salva stato pagamenti soci in localStorage
  useEffect(() => {
    localStorage.setItem('pagamentiProfittiSociState', JSON.stringify(pagamentiProfittiSoci));
  }, [pagamentiProfittiSoci]); // Esegui quando pagamentiProfittiSoci cambia


  // --- 2. Funzione di Calcolo Finanze (definita all'interno per accedere a state/props se necessario) ---
  // Questa funzione ora dipende da pratiche, filtroAnno, filtroMese, pagamentiProfittiSoci
  const calcolaFinanze = (praticheData, annoFiltro, meseFiltro, profittiPagatiState) => {
    // Se non ci sono pratiche (es. durante il caricamento iniziale), ritorna lo stato iniziale
    if (!praticheData || praticheData.length === 0) {
        return initialFinanzeState;
    }

    let totalePagamentiCommittenteEffettivi = 0;
    let totaleDaPagareCommittente = 0;
    let pagamentiPerMese = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 0 };
    let pagamentiCollaboratoriPerMese = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 0 };
    let totalePagatoCollaboratoriEffettivo = 0;
    let totaleDovutoCollaboratori = 0;
    let pagamentiCollaboratoriMap = {};
    let pagamentiRecenti = [];

    // Resetta i totali dei soci prima di ricalcolare
    const profittoSociCalcolato = {
        titolare: { ...sociConfig.titolare, totale: 0, pagato: 0, pratiche: [] },
        soci: sociConfig.soci.map(s => ({ ...s, totale: 0, pagato: 0, pratiche: [] }))
    };

    praticheData.forEach(pratica => {
      // Assicurati che la pratica non sia null/undefined
      if (!pratica) return;

      const importoTotaleCommittentePratica = pratica.importoTotale || 0;
      const importoTotaleCollaboratorePratica = pratica.importoCollaboratore || 0;
      const importoTotaleFirmatarioPratica = pratica.importoFirmatario || 0;

      const importoRicevutoCommittenteEffettivo = calcolaIncassiEffettiviCommittentePratica(pratica);
      const importoPagatoCollaboratoriEffettivo = calcolaPagamentiEffettiviCollaboratoriPratica(pratica);

      let importoPagatoCollaboratoreStep = 0;
      let importoPagatoFirmatarioStep = 0;

      // Popola pagamenti mensili e recenti e calcola importi step
      if (pratica.workflow) {
          const passi = ['acconto1', 'acconto2', 'saldo'];
          passi.forEach(passo => {
              const stepData = pratica.workflow[passo];
              if(stepData){
                  // Entrate Mensili (effettive)
                  if (stepData.importoCommittente > 0 && stepData.completedDate) {
                      try {
                          const dataPagamento = new Date(stepData.completedDate);
                          if (!annoFiltro || dataPagamento.getFullYear().toString() === annoFiltro) {
                              pagamentiPerMese[dataPagamento.getMonth() + 1] += stepData.importoCommittente;
                              if (!meseFiltro || (dataPagamento.getMonth() + 1).toString() === meseFiltro) {
                                  pagamentiRecenti.push({
                                      id: `${pratica.id}-${passo}-comm`, data: dataPagamento, pratica: pratica.indirizzo, comune: pratica.comune, committente: pratica.cliente, tipo: passo, importo: stepData.importoCommittente
                                  });
                              }
                          }
                      } catch (e) { console.error("Data pagamento committente non valida:", stepData.completedDate, e); }
                  }
                  // Uscite Mensili (previste/inserite) e somma per importi step
                  let importoUscitaStep = 0;
                  if(stepData.importoCollaboratore > 0){
                      importoPagatoCollaboratoreStep += stepData.importoCollaboratore;
                      importoUscitaStep += stepData.importoCollaboratore;
                  }
                  if(stepData.importoFirmatario > 0){
                      importoPagatoFirmatarioStep += stepData.importoFirmatario;
                      importoUscitaStep += stepData.importoFirmatario;
                  }
                  // Aggiungi alle uscite mensili
                  if(importoUscitaStep > 0){
                      try {
                          // Usa la data di completamento se disponibile, altrimenti la data di inizio pratica
                          const dataRiferimento = stepData.completedDate ? new Date(stepData.completedDate) : new Date(pratica.dataInizio);
                           if (!annoFiltro || dataRiferimento.getFullYear().toString() === annoFiltro) {
                               pagamentiCollaboratoriPerMese[dataRiferimento.getMonth() + 1] += importoUscitaStep;
                           }
                      } catch(e) { console.error("Data riferimento uscita non valida:", stepData.completedDate, pratica.dataInizio, e); }
                  }
              }
          });
      }


      // Aggiorna totali generali
      totalePagamentiCommittenteEffettivi += importoRicevutoCommittenteEffettivo;
      totaleDaPagareCommittente += Math.max(0, importoTotaleCommittentePratica - importoRicevutoCommittenteEffettivo);
      totaleDovutoCollaboratori += (importoTotaleCollaboratorePratica + importoTotaleFirmatarioPratica);
      totalePagatoCollaboratoriEffettivo += importoPagatoCollaboratoriEffettivo;


      // Calcola profitto della pratica per soci (basato su importi BASE)
      const profittoPraticaCorrente = calcolaProfittoPraticaPerSoci(pratica);
      const isPraticaCompletata = pratica.stato === 'Completata';

      // Distribuisci profitto e traccia pagamenti ai soci per questa pratica
      if (profittoPraticaCorrente > 0) {
          // Titolare
          const quotaTitolare = profittoPraticaCorrente * profittoSociCalcolato.titolare.percentuale;
          const isTitolarePagato = profittiPagatiState[pratica.id]?.[profittoSociCalcolato.titolare.id] === true;

          if (isPraticaCompletata) {
              profittoSociCalcolato.titolare.totale += quotaTitolare;
              if (isTitolarePagato) {
                  profittoSociCalcolato.titolare.pagato += quotaTitolare;
              }
          }
          profittoSociCalcolato.titolare.pratiche.push({
              id: pratica.id, codice: pratica.codice, indirizzo: pratica.indirizzo, cliente: pratica.cliente, stato: pratica.stato, quota: quotaTitolare, pagato: isTitolarePagato // Lo stato 'pagato' qui riflette lo stato AL MOMENTO del calcolo
          });

          // Altri Soci
          profittoSociCalcolato.soci.forEach(socio => {
              const quotaSocio = profittoPraticaCorrente * socio.percentuale;
              const isSocioPagato = profittiPagatiState[pratica.id]?.[socio.id] === true;

               if (isPraticaCompletata) {
                    socio.totale += quotaSocio;
                    if (isSocioPagato) {
                        socio.pagato += quotaSocio;
                    }
               }
               socio.pratiche.push({
                  id: pratica.id, codice: pratica.codice, indirizzo: pratica.indirizzo, cliente: pratica.cliente, stato: pratica.stato, quota: quotaSocio, pagato: isSocioPagato // Lo stato 'pagato' qui riflette lo stato AL MOMENTO del calcolo
              });
          });
      }

      // Aggiorna mappa per PagamentiCollaboratori component
      if (pratica.collaboratore) {
        if (!pagamentiCollaboratoriMap[pratica.collaboratore]) {
          pagamentiCollaboratoriMap[pratica.collaboratore] = { totale: 0, pagato: 0 };
        }
        pagamentiCollaboratoriMap[pratica.collaboratore].totale += importoTotaleCollaboratorePratica;
        pagamentiCollaboratoriMap[pratica.collaboratore].pagato += importoPagatoCollaboratoreStep;
      }
       if (pratica.collaboratoreFirmatario) {
         if (!pagamentiCollaboratoriMap[pratica.collaboratoreFirmatario]) {
           pagamentiCollaboratoriMap[pratica.collaboratoreFirmatario] = { totale: 0, pagato: 0 };
         }
         pagamentiCollaboratoriMap[pratica.collaboratoreFirmatario].totale += importoTotaleFirmatarioPratica;
         pagamentiCollaboratoriMap[pratica.collaboratoreFirmatario].pagato += importoPagatoFirmatarioStep;
       }

    }); // Fine ciclo forEach pratiche

    // Calcola totali finali per i collaboratori (per PagamentiCollaboratori)
    const totaliCollaboratoriMap = Object.entries(pagamentiCollaboratoriMap).reduce((acc, [nome, data]) => {
        acc[nome] = { ...data, daPagare: Math.max(0, data.totale - data.pagato) };
        return acc;
    }, {});
     const totaliGeneraliCollaboratori = {
         totale: Object.values(totaliCollaboratoriMap).reduce((sum, collab) => sum + collab.totale, 0),
         pagato: Object.values(totaliCollaboratoriMap).reduce((sum, collab) => sum + collab.pagato, 0),
         daPagare: Object.values(totaliCollaboratoriMap).reduce((sum, collab) => sum + collab.daPagare, 0),
     };

    pagamentiRecenti.sort((a, b) => b.data - a.data);

    // Calcola profitto per mese
    let profittoPerMese = {};
    for (let mese = 1; mese <= 12; mese++) {
      profittoPerMese[mese] = pagamentiPerMese[mese] - pagamentiCollaboratoriPerMese[mese];
    }

    // Calcola esposizione finanziaria generale
    const margineOperativo = totalePagamentiCommittenteEffettivi - totaleDovutoCollaboratori;
    const margineOperativoPercentuale = totalePagamentiCommittenteEffettivi > 0 ? (margineOperativo / totalePagamentiCommittenteEffettivi) * 100 : 0;
    const margineNetto = totalePagamentiCommittenteEffettivi - totalePagatoCollaboratoriEffettivo;

    return {
      totalePagamenti: totalePagamentiCommittenteEffettivi,
      totaleDaPagare: totaleDaPagareCommittente,
      pagamentiPerMese,
      pagamentiCollaboratoriPerMese,
      profittoPerMese,
      totaliCollaboratori: { // Riepilogo per SituazioneFinanziaria (basato su effettivo pagato)
            totale: totaleDovutoCollaboratori, // Dovuto LORDO
            pagato: totalePagatoCollaboratoriEffettivo, // Pagato EFFETTIVO
            daPagare: Math.max(0, totaleDovutoCollaboratori - totalePagatoCollaboratoriEffettivo)
      },
      esposizioneFinanziaria: { margineOperativo, margineOperativoPercentuale, margineNetto },
      pagamentiCollaboratori: totaliCollaboratoriMap, // Per PagamentiCollaboratori (basato su LORDO dovuto e LORDO inserito step)
      profittoSoci: profittoSociCalcolato, // Per DistribuzioneProfitti (basato su profitto potenziale pratica BASE e stato pagamenti)
      pagamentiRecenti: pagamentiRecenti.slice(0, 10), // Limita a 10 pagamenti recenti
    };
  };

  // --- 3. useMemo per calcolare le finanze solo quando le dipendenze cambiano ---
  // Chiamato DOPO la definizione della funzione ma PRIMA del return condizionale
  const finanze = useMemo(() => {
      // Passa le dipendenze direttamente alla funzione di calcolo
      return calcolaFinanze(pratiche, filtroAnno, filtroMese, pagamentiProfittiSoci);
  }, [pratiche, filtroAnno, filtroMese, pagamentiProfittiSoci]); // Le dipendenze di useMemo


  // --- 4. Gestione Loading (Return condizionale) ---
  if (loading) {
    return <div className="flex justify-center items-center h-full text-gray-600">Caricamento dati finanziari...</div>;
  }

  // --- 5. Funzioni Handler e Derivazioni (definite dopo il loading check) ---
  const handleTogglePagamentoSocio = (praticaId, socioId) => {
    setPagamentiProfittiSoci(prev => {
      const newState = { ...prev };
      if (!newState[praticaId]) newState[praticaId] = {};
      newState[praticaId][socioId] = !newState[praticaId]?.[socioId];
      // Non è necessario ricalcolare finanze qui, useMemo lo farà automaticamente
      return newState;
    });
  };

  const generaPDF = async () => {
    if (!reportRef.current) return;
    const content = reportRef.current; // Riferimento all'elemento da catturare

    // Temporaneamente mostra tutte le tab per la cattura (se necessario)
    const tabContentsProfitti = content.querySelectorAll('#tabContentProfitti [role="tabpanel"]');
    const tabContentsColl = content.querySelectorAll('#tabContentExample [role="tabpanel"]');
    const activeTabIdProfitti = content.querySelector('#tabContentProfitti [role="tabpanel"]:not(.hidden)')?.id;
    const activeTabIdColl = content.querySelector('#tabContentExample [role="tabpanel"]:not(.hidden)')?.id;

    const makeVisible = (elements) => elements.forEach(el => el.classList.remove('hidden'));
    const restoreVisibility = (elements, activeId) => {
        elements.forEach(el => {
            if (el.id !== activeId) {
                el.classList.add('hidden');
            }
        });
    };

    makeVisible(tabContentsProfitti);
    makeVisible(tabContentsColl);

    try {
      console.log("Inizio generazione PDF...");
      const canvas = await html2canvas(content, {
        scale: 1.5, // Aumenta la scala per una migliore risoluzione
        useCORS: true,
        logging: true, // Abilita log per debug
        windowWidth: content.scrollWidth,
        windowHeight: content.scrollHeight,
        scrollX: 0, // Assicurati che parta dall'inizio orizzontale
        scrollY: 0, // Assicurati che parta dall'inizio verticale
        backgroundColor: '#ffffff' // Imposta uno sfondo bianco
      });
      console.log("Canvas creato.");

      // Ripristina la visibilità delle tab PRIMA di creare il PDF
      restoreVisibility(tabContentsProfitti, activeTabIdProfitti);
      restoreVisibility(tabContentsColl, activeTabIdColl);

      const imgWidth = 210; // Larghezza A4 in mm
      const pageHeight = 297; // Altezza A4 in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      const pdf = new jsPDF('p', 'mm', 'a4'); // p = portrait
      const imgData = canvas.toDataURL('image/png');
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      console.log(`Aggiunta prima pagina. Altezza rimanente: ${heightLeft}`);

      while (heightLeft > 0) {
        position = - (imgHeight - heightLeft - pageHeight); // Calcola la posizione per la pagina successiva
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
        console.log(`Aggiunta nuova pagina. Altezza rimanente: ${heightLeft}`);
      }
      pdf.save(`Report_Finanziario_${format(new Date(), 'dd-MM-yyyy')}.pdf`);
      console.log("PDF salvato.");

    } catch (error) {
      console.error("Errore durante la generazione del PDF:", error);
       // Assicurati di ripristinare la visibilità anche in caso di errore
       restoreVisibility(tabContentsProfitti, activeTabIdProfitti);
       restoreVisibility(tabContentsColl, activeTabIdColl);
       alert("Si è verificato un errore durante la generazione del PDF. Controlla la console per i dettagli."); // Usa un alert o un sistema di notifiche migliore
    }
  };

  // Calcola anni disponibili per il filtro (assicurati che pratiche sia un array)
  const anni = [...new Set((pratiche || []).map(p => {
      try {
          return new Date(p.dataInizio).getFullYear();
      } catch(e) {
          console.warn("Data inizio pratica non valida:", p.dataInizio);
          return null; // Ignora anni non validi
      }
  }).filter(anno => anno !== null))] // Filtra eventuali null
  .sort((a, b) => b - a);


  // --- 6. Return JSX ---
  return (
    <div className="container mx-auto mb-10 px-4"> {/* Aggiunto padding orizzontale */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4"> {/* Responsive flex e gap */}
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 text-center sm:text-left">Gestione Finanziaria</h1>
        <button
            onClick={generaPDF}
            className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-150 ease-in-out w-full sm:w-auto" // Responsive width
            aria-label="Esporta report finanziario in PDF"
        >
          <FaFileDownload className="mr-2" /> Esporta PDF
        </button>
      </div>
      <FiltriFinanze
          filtroAnno={filtroAnno}
          setFiltroAnno={setFiltroAnno}
          filtroMese={filtroMese}
          setFiltroMese={setFiltroMese}
          anni={anni}
      />
      {/* Contenuto del report da esportare */}
      <div id="report-content" ref={reportRef} className="bg-gray-50 p-4 rounded-lg"> {/* Sfondo e padding per il contenitore del report */}
        <SituazioneFinanziaria finanze={finanze} />
        <PagamentiCollaboratori finanze={finanze} />
        <DistribuzioneProfitti
            profittoSociData={finanze.profittoSoci}
            pratiche={pratiche} // Passa pratiche per riferimento se necessario nel componente figlio
            pagamentiProfittiState={pagamentiProfittiSoci} // Passa lo stato aggiornato
            onTogglePagamento={handleTogglePagamentoSocio}
        />
        <UltimiPagamenti pagamentiRecenti={finanze.pagamentiRecenti} />
      </div>
    </div>
  );
}

export default FinanzePage;
import React, { useState, useRef } from 'react';
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

function FinanzePage() {
  const { pratiche, loading } = usePratiche();
  const [filtroMese, setFiltroMese] = useState('');
  const [filtroAnno, setFiltroAnno] = useState(new Date().getFullYear().toString());
  const reportRef = useRef(null);
  
  if (loading) {
    return <div className="flex justify-center items-center h-full">Caricamento...</div>;
  }
  
  // Get unique years from pratiche
  const anni = [...new Set(pratiche.map(pratica => 
    new Date(pratica.dataInizio).getFullYear()
  ))].sort((a, b) => b - a);

  // Calculate financial data
  const calcolaFinanze = () => {
    let totalePagamenti = 0;
    let totaleDaPagare = 0;
    let pagamentiPerMese = {
      1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 
      7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 0
    };
    
    let pagamentiCollaboratoriPerMese = {
      1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 
      7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 0
    };
    
    // Per l'esposizione finanziaria
    let totaleCommittenti = 0;
    let totalePagatoCommittenti = 0;
    let totaleCollaboratori = 0;
    let totalePagatoCollaboratori = 0;
    
    let pagamentiCollaboratori = {};
    let pagamentiRecenti = [];
    
    const praticheFiltered = pratiche.filter(pratica => {
      const dataInizio = new Date(pratica.dataInizio);
      const anno = dataInizio.getFullYear().toString();
      const mese = (dataInizio.getMonth() + 1).toString();
      
      return (!filtroAnno || anno === filtroAnno) && 
             (!filtroMese || mese === filtroMese);
    });
    
    praticheFiltered.forEach(pratica => {
      const importoTotale = pratica.importoTotale || 0;
      const importoCollaboratoreTotale = pratica.importoCollaboratore || 0;
      
      // Aggiungi al totale dei committenti e collaboratori
      totaleCommittenti += importoTotale;
      totaleCollaboratori += importoCollaboratoreTotale;
      
      // Calculate received payments - supporta sia la vecchia struttura "steps" che la nuova "workflow"
      let importoRicevuto = 0;
      let importoCollaboratorePagato = 0;
      
      // Controlla se la pratica usa la struttura "workflow"
      if (pratica.workflow) {
        // Leggi i dati dalla struttura workflow
        const passiPagamento = ['acconto1', 'acconto2', 'saldo'];
        
        passiPagamento.forEach(passo => {
          // Importi committente
          if (pratica.workflow[passo] && pratica.workflow[passo].importoCommittente > 0) {
            const importoCommittente = pratica.workflow[passo].importoCommittente;
            importoRicevuto += importoCommittente;
            
            // Aggiungi ai pagamenti mensili se c'è una data di completamento
            // altrimenti usa la data di inizio pratica
            let dataPagamento;
            
            if (pratica.workflow[passo].completedDate) {
              dataPagamento = new Date(pratica.workflow[passo].completedDate);
            } else {
              // Se non c'è data di completamento, usa la data di inizio pratica
              dataPagamento = new Date(pratica.dataInizio);
            }
            
            if (dataPagamento && (dataPagamento.getFullYear().toString() === filtroAnno || !filtroAnno)) {
              const mese = dataPagamento.getMonth() + 1;
              pagamentiPerMese[mese] += importoCommittente;
            }
            
            // Aggiungi ai pagamenti recenti
            pagamentiRecenti.push({
              id: `${pratica.id}-${passo}`,
              data: new Date(pratica.workflow[passo].completedDate || pratica.dataInizio),
              pratica: pratica.indirizzo,
              comune: pratica.comune,
              committente: pratica.cliente,
              tipo: passo === 'acconto1' ? 'Acconto 1 (30%)' : 
                   passo === 'acconto2' ? 'Acconto 2 (30%)' : 'Saldo (40%)',
              importo: importoCommittente
            });
          }
          
          // Importi collaboratore
          if (pratica.workflow[passo] && pratica.workflow[passo].importoCollaboratore > 0) {
            const importoCollab = pratica.workflow[passo].importoCollaboratore;
            importoCollaboratorePagato += importoCollab;
            
            // Aggiungi ai pagamenti collaboratori mensili
            let dataPagamento;
            
            if (pratica.workflow[passo].completedDate) {
              dataPagamento = new Date(pratica.workflow[passo].completedDate);
            } else {
              dataPagamento = new Date(pratica.dataInizio);
            }
            
            if (dataPagamento && (dataPagamento.getFullYear().toString() === filtroAnno || !filtroAnno)) {
              const mese = dataPagamento.getMonth() + 1;
              pagamentiCollaboratoriPerMese[mese] += importoCollab;
            }
          }
        });
      } 
      // Altrimenti usa la vecchia struttura "steps"
      else if (pratica.steps) {
        if (pratica.steps.acconto1?.completed && pratica.steps.acconto1?.importo) {
          importoRicevuto += pratica.steps.acconto1.importo;
          
          let dataAcconto;
          if (pratica.steps.acconto1.completedDate) {
            dataAcconto = new Date(pratica.steps.acconto1.completedDate);
          } else {
            dataAcconto = new Date(pratica.dataInizio);
          }
          
          if (dataAcconto && (dataAcconto.getFullYear().toString() === filtroAnno || !filtroAnno)) {
            const mese = dataAcconto.getMonth() + 1;
            pagamentiPerMese[mese] += pratica.steps.acconto1.importo;
          }
          
          pagamentiRecenti.push({
            id: `${pratica.id}-acconto1`,
            data: new Date(pratica.steps.acconto1.completedDate || pratica.dataInizio),
            pratica: pratica.indirizzo,
            comune: pratica.comune,
            committente: pratica.cliente,
            tipo: 'Acconto 1 (30%)',
            importo: pratica.steps.acconto1.importo
          });
        }
        
        if (pratica.steps.acconto2?.completed && pratica.steps.acconto2?.importo) {
          importoRicevuto += pratica.steps.acconto2.importo;
          
          let dataAcconto;
          if (pratica.steps.acconto2.completedDate) {
            dataAcconto = new Date(pratica.steps.acconto2.completedDate);
          } else {
            dataAcconto = new Date(pratica.dataInizio);
          }
          
          if (dataAcconto && (dataAcconto.getFullYear().toString() === filtroAnno || !filtroAnno)) {
            const mese = dataAcconto.getMonth() + 1;
            pagamentiPerMese[mese] += pratica.steps.acconto2.importo;
          }
          
          pagamentiRecenti.push({
            id: `${pratica.id}-acconto2`,
            data: new Date(pratica.steps.acconto2.completedDate || pratica.dataInizio),
            pratica: pratica.indirizzo,
            comune: pratica.comune,
            committente: pratica.cliente,
            tipo: 'Acconto 2 (30%)',
            importo: pratica.steps.acconto2.importo
          });
        }
        
        if (pratica.steps.saldo?.completed && pratica.steps.saldo?.importo) {
          importoRicevuto += pratica.steps.saldo.importo;
          
          let dataSaldo;
          if (pratica.steps.saldo.completedDate) {
            dataSaldo = new Date(pratica.steps.saldo.completedDate);
          } else {
            dataSaldo = new Date(pratica.dataInizio);
          }
          
          if (dataSaldo && (dataSaldo.getFullYear().toString() === filtroAnno || !filtroAnno)) {
            const mese = dataSaldo.getMonth() + 1;
            pagamentiPerMese[mese] += pratica.steps.saldo.importo;
          }
          
          pagamentiRecenti.push({
            id: `${pratica.id}-saldo`,
            data: new Date(pratica.steps.saldo.completedDate || pratica.dataInizio),
            pratica: pratica.indirizzo,
            comune: pratica.comune,
            committente: pratica.cliente,
            tipo: 'Saldo (40%)',
            importo: pratica.steps.saldo.importo
          });
        }
      }
      
      // Add to total
      totalePagamenti += importoRicevuto;
      totaleDaPagare += (importoTotale - importoRicevuto);
      
      // Aggiorna i totali per l'esposizione finanziaria
      totalePagatoCommittenti += importoRicevuto;
      totalePagatoCollaboratori += importoCollaboratorePagato;
      
      // Calculate collaborator payments
      if (pratica.collaboratore) {
        if (!pagamentiCollaboratori[pratica.collaboratore]) {
          pagamentiCollaboratori[pratica.collaboratore] = {
            totale: 0,
            pagato: 0,
            daPagare: 0
          };
        }
        
        // Usiamo l'importoCollaboratore dal form della pratica come totale
        pagamentiCollaboratori[pratica.collaboratore].totale += importoCollaboratoreTotale;
        pagamentiCollaboratori[pratica.collaboratore].pagato += importoCollaboratorePagato;
        pagamentiCollaboratori[pratica.collaboratore].daPagare = 
          pagamentiCollaboratori[pratica.collaboratore].totale - pagamentiCollaboratori[pratica.collaboratore].pagato;
      }
    });
    
    // Ordina i pagamenti recenti per data (più recenti prima)
    pagamentiRecenti.sort((a, b) => b.data - a.data);
    
    // Calcola totali per i collaboratori
    const totaliCollaboratori = {
      totale: Object.values(pagamentiCollaboratori).reduce((sum, collab) => sum + collab.totale, 0),
      pagato: Object.values(pagamentiCollaboratori).reduce((sum, collab) => sum + collab.pagato, 0),
      daPagare: Object.values(pagamentiCollaboratori).reduce((sum, collab) => sum + collab.daPagare, 0),
    };
    
    // Calcola il profitto per mese (entrate - uscite)
    let profittoPerMese = {};
    for (let mese = 1; mese <= 12; mese++) {
      profittoPerMese[mese] = pagamentiPerMese[mese] - pagamentiCollaboratoriPerMese[mese];
    }
    
    // Calcola margine operativo percentuale (se totalePagatoCommittenti è 0, il margine è 0%)
    const margineOperativoPercentuale = totalePagatoCommittenti > 0 
      ? ((totalePagatoCommittenti - totaleCollaboratori) / totalePagatoCommittenti) * 100 
      : 0;
    
    // Calcolo profitti soci
    const profittoSoci = {
      titolare: {
        nome: 'Marco Moschetti',
        percentuale: 0.79,
        totale: 0,
        pagato: 0
      },
      soci: [
        {
          nome: 'Ritorto',
          percentuale: 0.07,
          totale: 0,
          pagato: 0
        },
        {
          nome: 'Pardini',
          percentuale: 0.07,
          totale: 0,
          pagato: 0
        },
        {
          nome: 'Proscia',
          percentuale: 0.07,
          totale: 0,
          pagato: 0
        }
      ]
    };

    // Calcola il profitto da distribuire
    const profittoTotale = totalePagatoCommittenti - totaleCollaboratori;
    
    // Distribuisci il profitto tra i soci
    profittoSoci.titolare.totale = profittoTotale * profittoSoci.titolare.percentuale;
    profittoSoci.soci.forEach(socio => {
      socio.totale = profittoTotale * socio.percentuale;
    });
    
    return {
      totalePagamenti,
      totaleDaPagare,
      pagamentiPerMese,
      pagamentiCollaboratoriPerMese,
      profittoPerMese,
      pagamentiCollaboratori,
      pagamentiRecenti: pagamentiRecenti.slice(0, 10), // Prendi solo i 10 più recenti
      totaliCollaboratori,
      esposizioneFinanziaria: {
        totaleCommittenti,
        totalePagatoCommittenti,
        totaleCollaboratori,
        totalePagatoCollaboratori,
        // Margine operativo = quanto incassato - quanto dovuto ai collaboratori
        margineOperativo: totalePagatoCommittenti - totaleCollaboratori,
        // Percentuale del margine operativo rispetto alle entrate totali
        margineOperativoPercentuale,
        // Margine netto = quanto incassato - quanto già pagato ai collaboratori
        margineNetto: totalePagatoCommittenti - totalePagatoCollaboratori,
        // Aggiunta della distribuzione profitti soci
        profittoSoci
      }
    };
  };
  
  const finanze = calcolaFinanze();
  
  // Funzione per generare ed esportare il report PDF
  const generaPDF = async () => {
    if (!reportRef.current) return;
    
    try {
      const content = reportRef.current;
      const canvas = await html2canvas(content, {
        scale: 1,
        useCORS: true,
        logging: false
      });
      
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const heightLeft = imgHeight;
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png');
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      
      // Gestisci il caso di contenuto su più pagine
      let position = 0;
      position += imgHeight;
      
      while (position < heightLeft) {
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, -position, imgWidth, imgHeight);
        position += pageHeight;
      }
      
      // Scarica il PDF
      pdf.save(`Report_Finanziario_${format(new Date(), 'dd-MM-yyyy')}.pdf`);
      
    } catch (error) {
      console.error("Errore durante la generazione del PDF:", error);
    }
  };

  return (
    <div className="container mx-auto mb-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Gestione Finanziaria</h1>
        <button
          onClick={generaPDF}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <FaFileDownload className="mr-2" />
          Esporta PDF
        </button>
      </div>
      
      {/* Filtri */}
      <FiltriFinanze 
        filtroAnno={filtroAnno}
        setFiltroAnno={setFiltroAnno}
        filtroMese={filtroMese}
        setFiltroMese={setFiltroMese}
        anni={anni}
      />
      
      {/* Report content - questo div sarà utilizzato per generare il PDF */}
      <div ref={reportRef}>
        {/* Situazione Finanziaria Generale */}
        <SituazioneFinanziaria finanze={finanze} />
        
        {/* Collaborator Payments */}
        <PagamentiCollaboratori finanze={finanze} />

        {/* Sezione Distribuzione Profitti Soci */}
        <DistribuzioneProfitti profittoSoci={finanze.esposizioneFinanziaria.profittoSoci} />
        
        {/* Recent Payments */}
        <UltimiPagamenti pagamentiRecenti={finanze.pagamentiRecenti} />
      </div>
    </div>
  );
}

export default FinanzePage;
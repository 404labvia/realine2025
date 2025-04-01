import React, { useState, useRef, useEffect } from 'react';
import { usePratiche } from '../contexts/PraticheContext';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { FaFileDownload, FaFilter } from 'react-icons/fa';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import GaugeChart from 'react-gauge-chart';

// Importazioni per Chart.js
import {
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend,
  PointElement, 
  LineElement,
  ArcElement,
  RadialLinearScale
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';

// Registriamo i componenti di Chart.js necessari
ChartJS.register(
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend, 
  PointElement, 
  LineElement,
  ArcElement,
  RadialLinearScale
);

// Componente semplificato per il tachimetro senza tacche
const CustomGauge = ({ percentage, value }) => {
  return (
    <div className="relative">
      <GaugeChart 
        id="gauge-chart"
        nrOfLevels={3}
        colors={["#FF5F6D", "#FFC371", "#66BB6A"]}
        arcWidth={0.3}
        percent={percentage / 100}
        textColor="#333"
        needleColor="#464A4F"
        needleBaseColor="#464A4F"
        hideText={true}
      />
      <div className="text-center mt-2">
        <div className="text-xl font-bold">{percentage.toFixed(2)}%</div>
        <div className="text-sm text-gray-500">% Margine</div>
        <div className="text-2xl font-bold text-gray-800 mt-2">
          €{value.toLocaleString('it-IT')}
        </div>
        <div className="text-sm text-gray-500">Profitto</div>
      </div>
    </div>
  );
};

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
    
    // Non aggiungiamo più valori minimi forzati
    // Lasciamo che il grafico mostri solo dati reali
    
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
              pagamentiCollaboratoriPerMese[mese] += importoCollab;
            }
          }
        });
      } 
      // Altrimenti usa la vecchia struttura "steps"
      else if (pratica.steps) {
        if (pratica.steps.acconto1?.completed && pratica.steps.acconto1?.importo) {
          importoRicevuto += pratica.steps.acconto1.importo;
          
          // Add to monthly data
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
          
          // Aggiungi ai pagamenti recenti
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
          
          // Add to monthly data
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
          
          // Aggiungi ai pagamenti recenti
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
          
          // Add to monthly data
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
          
          // Aggiungi ai pagamenti recenti
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
        margineNetto: totalePagatoCommittenti - totalePagatoCollaboratori
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
  
  // Prepare chart data for monthly income and expenses
  const mesiLabels = [
    'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
  ];
  
  const entrateUsciteChartData = {
    labels: mesiLabels,
    datasets: [
      {
        type: 'bar',
        label: 'Entrate',
        data: Object.values(finanze.pagamentiPerMese),
        backgroundColor: 'rgba(255, 159, 64, 0.7)',
        borderColor: 'rgb(255, 159, 64)',
        borderWidth: 1,
        order: 2
      },
      {
        type: 'bar',
        label: 'Uscite',
        data: Object.values(finanze.pagamentiCollaboratoriPerMese),
        backgroundColor: 'rgba(201, 203, 207, 0.7)',
        borderColor: 'rgb(201, 203, 207)',
        borderWidth: 1,
        order: 2
      },
      {
        type: 'line',
        label: 'Profitto',
        data: Object.values(finanze.profittoPerMese),
        borderColor: 'rgb(75, 192, 192)',
        borderWidth: 2,
        pointBackgroundColor: 'rgb(75, 192, 192)',
        tension: 0.1,
        order: 1
      }
    ]
  };
  
  const entrateUsciteChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Entrate e uscite'
      },
      subtitle: {
        display: true,
        text: 'Ultimi 6 mesi',
        position: 'bottom'
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(context.parsed.y);
            }
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          display: true
        },
        ticks: {
          // Include € in the ticks
          callback: function(value) {
            return '€' + value;
          }
        }
      }
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
      
      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex items-center mb-2">
          <FaFilter className="text-gray-500 mr-2" />
          <h3 className="text-lg font-medium text-gray-700">Filtri</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Anno</label>
            <select
              value={filtroAnno}
              onChange={(e) => setFiltroAnno(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="">Tutti</option>
              {anni.map(anno => (
                <option key={anno} value={anno.toString()}>{anno}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mese</label>
            <select
              value={filtroMese}
              onChange={(e) => setFiltroMese(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="">Tutti</option>
              <option value="1">Gennaio</option>
              <option value="2">Febbraio</option>
              <option value="3">Marzo</option>
              <option value="4">Aprile</option>
              <option value="5">Maggio</option>
              <option value="6">Giugno</option>
              <option value="7">Luglio</option>
              <option value="8">Agosto</option>
              <option value="9">Settembre</option>
              <option value="10">Ottobre</option>
              <option value="11">Novembre</option>
              <option value="12">Dicembre</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Report content - questo div sarà utilizzato per generare il PDF */}
      <div ref={reportRef}>
        {/* Situazione Finanziaria Generale */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Situazione Finanziaria Realine Studio</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
            {/* Prima colonna - Sommario finanziario (2/6) */}
            <div className="space-y-4 lg:col-span-2">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-gray-800 mb-2">Entrate <span className="text-sm text-gray-600">(riepilogo finanziario)</span></h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                    <span className="text-gray-600">Pagamenti Ricevuti:</span>
                    <span className="font-semibold text-green-600">€{finanze.totalePagamenti.toLocaleString('it-IT')}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                    <span className="text-gray-600">Da Ricevere:</span>
                    <span className="font-semibold text-red-600">€{finanze.totaleDaPagare.toLocaleString('it-IT')}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-gray-700 font-medium">Totale:</span>
                    <span className="font-bold text-gray-800">€{(finanze.totalePagamenti + finanze.totaleDaPagare).toLocaleString('it-IT')}</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-gray-800 mb-2">Uscite <span className="text-sm text-gray-600">(pagamenti collaboratori)</span></h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                    <span className="text-gray-600">Totale Dovuto:</span>
                    <span className="font-semibold text-red-600">€{finanze.totaliCollaboratori.totale.toLocaleString('it-IT')}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                    <span className="text-gray-600">Già Pagato:</span>
                    <span className="font-semibold text-green-600">€{finanze.totaliCollaboratori.pagato.toLocaleString('it-IT')}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-gray-700 font-medium">Da Pagare:</span>
                    <span className="font-bold text-red-600">€{finanze.totaliCollaboratori.daPagare.toLocaleString('it-IT')}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Seconda colonna - Entrate e Uscite per mese (3/6) */}
            <div className="lg:col-span-3 h-96">
              <Bar 
                data={entrateUsciteChartData} 
                options={entrateUsciteChartOptions} 
              />
            </div>
            
            {/* Terza colonna - Tachimetro (1/6) */}
            <div className="lg:col-span-1">
              <div className="bg-yellow-50 p-4 rounded-lg h-full flex items-center justify-center">
                <div className="w-full">
                  <CustomGauge 
                    percentage={finanze.esposizioneFinanziaria.margineOperativoPercentuale} 
                    value={Math.abs(finanze.esposizioneFinanziaria.margineOperativo)} 
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Collaborator Payments */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Pagamenti Collaboratori</h2>
          
          {/* Tabella dettagliata collaboratori */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Collaboratore
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Importo Totale
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Già Pagato
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Da Pagare
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    % Completamento
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Object.entries(finanze.pagamentiCollaboratori).length > 0 ? (
                  Object.entries(finanze.pagamentiCollaboratori).map(([collaboratore, dati]) => (
                    <tr key={collaboratore}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{collaboratore}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">€{dati.totale.toLocaleString('it-IT', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-green-600">€{dati.pagato.toLocaleString('it-IT', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-red-600">€{dati.daPagare.toLocaleString('it-IT', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                            <div 
                              className="bg-blue-600 h-2.5 rounded-full" 
                              style={{ width: `${dati.totale > 0 ? (dati.pagato / dati.totale) * 100 : 0}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-700">
                            {dati.totale > 0 ? Math.round((dati.pagato / dati.totale) * 100) : 0}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                      Nessun pagamento ai collaboratori registrato
                    </td>
                  </tr>
                )}
                
                {/* Riga totale */}
                {Object.entries(finanze.pagamentiCollaboratori).length > 0 && (
                  <tr className="bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900">TOTALE</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900">€{finanze.totaliCollaboratori.totale.toLocaleString('it-IT', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-green-600">€{finanze.totaliCollaboratori.pagato.toLocaleString('it-IT', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-red-600">€{finanze.totaliCollaboratori.daPagare.toLocaleString('it-IT', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                          <div 
                            className="bg-blue-600 h-2.5 rounded-full" 
                            style={{ width: `${finanze.totaliCollaboratori.totale > 0 ? (finanze.totaliCollaboratori.pagato / finanze.totaliCollaboratori.totale) * 100 : 0}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-bold text-gray-700">
                          {finanze.totaliCollaboratori.totale > 0 ? Math.round((finanze.totaliCollaboratori.pagato / finanze.totaliCollaboratori.totale) * 100) : 0}%
                        </span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Recent Payments */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Ultimi Pagamenti Ricevuti</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pratica
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Committente
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Importo
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {finanze.pagamentiRecenti.length > 0 ? (
                  finanze.pagamentiRecenti.map(pagamento => (
                    <tr key={pagamento.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {format(pagamento.data, 'dd/MM/yyyy', { locale: it })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{pagamento.pratica}</div>
                        <div className="text-xs text-gray-500">{pagamento.comune}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{pagamento.committente}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{pagamento.tipo}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-green-600">
                          €{pagamento.importo.toLocaleString('it-IT')}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                      Nessun pagamento registrato
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FinanzePage;
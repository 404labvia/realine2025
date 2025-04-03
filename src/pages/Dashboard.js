import React, { useState } from 'react';
import { usePratiche } from '../contexts/PraticheContext';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function Dashboard() {
  const { pratiche, loading } = usePratiche();
  const [filtroStato, setFiltroStato] = useState('In Corso'); // Default: mostra pratiche in corso
  
  if (loading) {
    return <div className="flex justify-center items-center h-full">Caricamento...</div>;
  }

  // Filtro pratiche in base allo stato selezionato
  const praticheFiltered = filtroStato === 'Tutte' 
    ? pratiche 
    : pratiche.filter(pratica => pratica.stato === filtroStato);
  
  // Conteggio delle pratiche
  const praticheInCorso = pratiche.filter(pratica => pratica.stato === 'In Corso').length;
  const praticheCompletate = pratiche.filter(pratica => pratica.stato === 'Completata').length;
  
  // Calcolo valore pratiche in corso
  const valoreInCorso = pratiche
    .filter(pratica => pratica.stato === 'In Corso')
    .reduce((acc, pratica) => acc + (pratica.importoTotale || 0), 0);
  
  // Calcolo pagamenti ricevuti e da ricevere per pratiche in corso e completate
  const calcolaPagamenti = () => {
    let totaleRicevutoInCorso = 0;
    let fatturatoTotale = 0; // Pagamenti ricevuti da TUTTE le pratiche
    
    // Elabora tutte le pratiche per il fatturato totale
    pratiche.forEach(pratica => {
      let importoRicevuto = 0;
      
      // Controlla se la pratica usa la nuova struttura workflow
      if (pratica.workflow) {
        const passiPagamento = ['acconto1', 'acconto2', 'saldo'];
        
        passiPagamento.forEach(passo => {
          if (pratica.workflow[passo] && pratica.workflow[passo].importoCommittente) {
            importoRicevuto += pratica.workflow[passo].importoCommittente;
          }
        });
      } 
      // Altrimenti usa la vecchia struttura steps
      else if (pratica.steps) {
        if (pratica.steps.acconto1?.completed && pratica.steps.acconto1?.importo) {
          importoRicevuto += pratica.steps.acconto1.importo;
        }
        
        if (pratica.steps.acconto2?.completed && pratica.steps.acconto2?.importo) {
          importoRicevuto += pratica.steps.acconto2.importo;
        }
        
        if (pratica.steps.saldo?.completed && pratica.steps.saldo?.importo) {
          importoRicevuto += pratica.steps.saldo.importo;
        }
      }
      
      // Aggiungi al fatturato totale (tutte le pratiche)
      fatturatoTotale += importoRicevuto;
      
      // Aggiungi al totale ricevuto per pratiche in corso
      if (pratica.stato === 'In Corso') {
        totaleRicevutoInCorso += importoRicevuto;
      }
    });
    
    return {
      fatturatoTotale,
      totaleRicevutoInCorso,
      totaleDaRicevere: valoreInCorso - totaleRicevutoInCorso
    };
  };
  
  const pagamenti = calcolaPagamenti();
  
  // Distribuzione pratiche per agenzia (escludi PRIVATO)
  const calcolaDistribuzioneAgenzie = () => {
    const distribuzioneAgenzie = {};
    
    praticheFiltered
      .filter(pratica => pratica.agenzia && pratica.agenzia !== 'PRIVATO')
      .forEach(pratica => {
        if (!distribuzioneAgenzie[pratica.agenzia]) {
          distribuzioneAgenzie[pratica.agenzia] = 0;
        }
        distribuzioneAgenzie[pratica.agenzia]++;
      });
      
    return distribuzioneAgenzie;
  };
  
  const distribuzioneAgenzie = calcolaDistribuzioneAgenzie();
  
  // Calcola il fatturato per agenzia (escludi PRIVATO)
  const calcolaFatturatoPerAgenzia = () => {
    const fatturatoPerAgenzia = {};
    
    praticheFiltered
      .filter(pratica => pratica.agenzia && pratica.agenzia !== 'PRIVATO')
      .forEach(pratica => {
        if (!fatturatoPerAgenzia[pratica.agenzia]) {
          fatturatoPerAgenzia[pratica.agenzia] = 0;
        }
        fatturatoPerAgenzia[pratica.agenzia] += pratica.importoTotale || 0;
      });
      
    return fatturatoPerAgenzia;
  };
  
  const fatturatoPerAgenzia = calcolaFatturatoPerAgenzia();
  
  // Trova le pratiche con Atto/Fine Pratica più vicine
  const praticheConScadenze = pratiche
    .filter(pratica => 
      pratica.stato === 'In Corso' && 
      pratica.dataFine // Usa dataFine come Atto/Fine Pratica
    )
    .sort((a, b) => new Date(a.dataFine) - new Date(b.dataFine))
    .slice(0, 5); // Mostra solo le 5 più vicine
  
  // Prepara i dati per il grafico a torta delle agenzie test modifica
  const agenzieData = {
    labels: Object.keys(distribuzioneAgenzie),
    datasets: [
      {
        data: Object.values(distribuzioneAgenzie),
        backgroundColor: [
          '#4F46E5', // Indigo
          '#10B981', // Emerald
          '#F59E0B', // Amber
          '#EF4444', // Red
          '#8B5CF6', // Violet
          '#EC4899', // Pink
          '#06B6D4', // Cyan
          '#84CC16', // Lime
        ],
        borderWidth: 1,
      },
    ],
  };
  
  // Prepara i dati per il grafico a barre del fatturato per agenzia
  const fatturatoAgenzieData = {
    labels: Object.keys(fatturatoPerAgenzia),
    datasets: [
      {
        label: 'Fatturato per Agenzia (€)',
        data: Object.values(fatturatoPerAgenzia),
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgb(54, 162, 235)',
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="container mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Dashboard</h1>
      
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-500">Pratiche Totali</h3>
          <p className="text-3xl font-bold text-gray-800">{pratiche.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-500">Pratiche In Corso</h3>
          <p className="text-3xl font-bold text-indigo-600">{praticheInCorso}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-500">Pratiche Concluse</h3>
          <p className="text-3xl font-bold text-emerald-600">{praticheCompletate}</p>
        </div>
      </div>
      
      {/* Valori Finanziari */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-500">Fatturato Totale</h3>
          <p className="text-3xl font-bold text-emerald-600">€{pagamenti.fatturatoTotale.toLocaleString('it-IT')}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-500">Valore Pratiche in Corso</h3>
          <p className="text-3xl font-bold text-blue-600">€{valoreInCorso.toLocaleString('it-IT')}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-500">Da Ricevere</h3>
          <p className="text-3xl font-bold text-amber-600">€{pagamenti.totaleDaRicevere.toLocaleString('it-IT')}</p>
        </div>
      </div>
      
      {/* Charts Section with Filter */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Distribuzione Agenzie</h2>
            <div>
              <select 
                value={filtroStato} 
                onChange={(e) => setFiltroStato(e.target.value)}
                className="p-1 border border-gray-300 rounded-md text-sm"
              >
                <option value="Tutte">Tutte</option>
                <option value="In Corso">In Corso</option>
                <option value="Completata">Completate</option>
              </select>
            </div>
          </div>
          <div className="h-64">
            {Object.keys(distribuzioneAgenzie).length > 0 ? (
              <Doughnut 
                data={agenzieData} 
                options={{ 
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                    },
                  },
                }} 
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                Nessuna pratica di agenzia {filtroStato === 'Tutte' ? '' : filtroStato.toLowerCase()}
              </div>
            )}
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Fatturato per Agenzia</h2>
            <div>
              <select 
                value={filtroStato} 
                onChange={(e) => setFiltroStato(e.target.value)}
                className="p-1 border border-gray-300 rounded-md text-sm"
              >
                <option value="Tutte">Tutte</option>
                <option value="In Corso">In Corso</option>
                <option value="Completata">Completate</option>
              </select>
            </div>
          </div>
          <div className="h-64">
            {Object.keys(fatturatoPerAgenzia).length > 0 ? (
              <Bar 
                data={fatturatoAgenzieData} 
                options={{ 
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false,
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        callback: function(value) {
                          return '€' + value.toLocaleString('it-IT');
                        }
                      }
                    }
                  }
                }} 
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                Nessuna pratica di agenzia {filtroStato === 'Tutte' ? '' : filtroStato.toLowerCase()}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Scadenze Imminenti Section */}
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Atti/Fine Pratiche Imminenti</h2>
        {praticheConScadenze.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pratica
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data Atto/Fine
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Giorni Mancanti
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stato
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {praticheConScadenze.map((pratica) => {
                  const dataFine = new Date(pratica.dataFine);
                  const today = new Date();
                  const giorniMancanti = Math.ceil((dataFine - today) / (1000 * 60 * 60 * 24));
                  
                  return (
                    <tr key={pratica.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{pratica.indirizzo}</div>
                        <div className="text-sm text-gray-500">{pratica.comune}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{pratica.cliente}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {format(dataFine, 'dd MMM yyyy', { locale: it })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm font-medium ${
                          giorniMancanti <= 3 ? 'text-red-600' : 
                          giorniMancanti <= 7 ? 'text-amber-600' : 
                          'text-blue-600'
                        }`}>
                          {giorniMancanti} giorni
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          pratica.stato === 'Completata' ? 'bg-green-100 text-green-800' : 
                          pratica.stato === 'In Corso' ? 'bg-blue-100 text-blue-800' : 
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {pratica.stato}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">Nessuna data di fine pratica imminente.</p>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
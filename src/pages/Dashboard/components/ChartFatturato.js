// src/pages/Dashboard/components/ChartFatturato.js
import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

// Registrare i componenti necessari di Chart.js
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function ChartFatturato({ pratiche, filtroStato, setFiltroStato }) {
  // GRAFICO: Fatturato per agenzia
  const calcolaFatturatoPerAgenzia = () => {
    const fatturatoPerAgenzia = {};
    
    const praticheFiltered = pratiche.filter(pratica => 
      filtroStato === 'Tutte' || pratica.stato === filtroStato
    );
    
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
  
  // Colori per agenzie
  const agenzieColori = {
    'Barner CAMAIORE': '#4F46E5',    // Indigo
    'Barner LUCCA': '#10B981',       // Emerald
    'Barner ALTOPASCIO': '#F59E0B',  // Amber
    'Barner VIAREGGIO': '#EF4444',   // Red
    'Barner QUERCETA': '#8B5CF6',    // Violet
    'Barner PIETRASANTA': '#EC4899', // Pink
    'Barner PISA': '#06B6D4',        // Cyan
    'Barner MASSA': '#84CC16',       // Lime
    'BARNER LUCCA': '#3B82F6',       // Blue
  };
  
  // Ordina le agenzie per fatturato
  const agenzieFatturatoOrdinato = Object.entries(fatturatoPerAgenzia)
    .sort(([, fatturatoA], [, fatturatoB]) => fatturatoB - fatturatoA);
  
  // Dati per grafico a barre fatturato per agenzia
  const fatturatoAgenzieData = {
    labels: agenzieFatturatoOrdinato.map(([agenzia]) => agenzia),
    datasets: [
      {
        label: 'Fatturato per Agenzia (€)',
        data: agenzieFatturatoOrdinato.map(([, fatturato]) => fatturato),
        backgroundColor: agenzieFatturatoOrdinato.map(([agenzia]) => 
          agenzieColori[agenzia] || '#6B7280'
        ),
        borderWidth: 1,
      },
    ],
  };
  
  // Opzioni per il grafico a barre
  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `€${context.raw.toLocaleString('it-IT')}`;
          }
        }
      }
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
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Fatturato per Agenzia</h2>
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
      <div className="h-72">
        {Object.keys(fatturatoPerAgenzia).length > 0 ? (
          <Bar 
            data={fatturatoAgenzieData} 
            options={barOptions} 
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Nessuna pratica di agenzia {filtroStato === 'Tutte' ? '' : filtroStato.toLowerCase()}
          </div>
        )}
      </div>
    </div>
  );
}

export default ChartFatturato;
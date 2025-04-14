// src/pages/Dashboard/components/ChartAgenzie.js
import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

// Registrare i componenti necessari di Chart.js
ChartJS.register(ArcElement, Tooltip, Legend);

function ChartAgenzie({ pratiche, filtroStato, setFiltroStato }) {
  // GRAFICO: Distribuzione pratiche per agenzia
  const calcolaDistribuzioneAgenzie = () => {
    const distribuzioneAgenzie = {};
    
    const praticheFiltered = pratiche.filter(pratica => 
      filtroStato === 'Tutte' || pratica.stato === filtroStato
    );
    
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
  
  // Dati per grafico torta distribuzione agenzie
  const totalePratiche = Object.values(distribuzioneAgenzie).reduce((sum, count) => sum + count, 0);
  
  const agenzieData = {
    labels: Object.keys(distribuzioneAgenzie).map(agenzia => {
      const count = distribuzioneAgenzie[agenzia];
      const percentage = ((count / totalePratiche) * 100).toFixed(1);
      return `${agenzia} (${percentage}%)`;
    }),
    datasets: [
      {
        data: Object.values(distribuzioneAgenzie),
        backgroundColor: Object.keys(distribuzioneAgenzie).map(agenzia => 
          agenzieColori[agenzia] || '#6B7280'
        ),
        borderWidth: 1,
      },
    ],
  };
  
  // Opzioni per grafici
  const torteOptions = {
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.raw || 0;
            return `${label.split('(')[0].trim()}: ${value} pratiche`;
          }
        }
      }
    },
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Distribuzione Agenzie</h2>
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
        {Object.keys(distribuzioneAgenzie).length > 0 ? (
          <Doughnut 
            data={agenzieData} 
            options={torteOptions}
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

export default ChartAgenzie;
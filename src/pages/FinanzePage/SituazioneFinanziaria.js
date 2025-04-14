import React from 'react';
import { Bar } from 'react-chartjs-2';
import GaugeChart from 'react-gauge-chart';
import { MdAccountBalance, MdAttachMoney, MdMoneyOff } from 'react-icons/md';

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

function SituazioneFinanziaria({ finanze }) {
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
    <div className="bg-white p-6 rounded-lg shadow mb-8">
      <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
        <MdAccountBalance className="text-blue-600 mr-2 text-2xl" />
        Situazione Finanziaria Realine Studio
      </h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
        {/* Prima colonna - Sommario finanziario (2/6) */}
        <div className="space-y-4 lg:col-span-2">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-800 mb-2 flex items-center">
              <MdAttachMoney className="text-green-600 mr-2" />
              Entrate <span className="text-sm text-gray-600 ml-2">(riepilogo finanziario)</span>
            </h3>
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
            <h3 className="text-lg font-medium text-gray-800 mb-2 flex items-center">
              <MdMoneyOff className="text-red-600 mr-2" />
              Uscite <span className="text-sm text-gray-600 ml-2">(pagamenti collaboratori)</span>
            </h3>
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
  );
}

export default SituazioneFinanziaria;
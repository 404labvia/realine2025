import React, { useMemo } from 'react';
import { usePratiche } from '../../contexts/PraticheContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadialBarChart, RadialBar, PolarAngleAxis, Cell } from 'recharts'; // Added Cell for Bar colors
import { Euro, Activity, TrendingUp } from 'lucide-react';
import {
  calcolaStatistichePrincipali
} from '../../pages/Dashboard/utils/dashboardCalculations';

// Helper function to format currency
const formatCurrency = (value) => {
  // Ensure value is treated as a number, default to 0 if not valid
  const numericValue = Number(value);
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(isNaN(numericValue) ? 0 : numericValue);
};


// Helper function to format percentage
const formatPercentage = (value) => {
  const numericValue = Number(value);
  return `${(isNaN(numericValue) ? 0 : numericValue).toFixed(1)}%`;
};

// Define colors for cards and bars (approximating Tailwind shades)
const COLORS = {
  incassato: '#3b82f6', // Blue (Tailwind blue-500/600 area for stronger color)
  inCorso: '#f59e0b', // Yellow/Amber (Tailwind yellow-500/amber-500 area)
  daRicevere: '#10b981', // Green (Tailwind green-500/emerald-500 area)
  margine: '#8884d8' // Default Recharts color for gauge
};

// Main component for Financial Situation
function SituazioneFinanziaria() {
  const { pratiche } = usePratiche();

  // Calculate financial metrics
  const {
    incassatoTotale, // Renamed from fatturatoTotale
    valorePraticheInCorso,
    totaleDaRicevere,
    margineLordo, // Added for gauge display
    marginePercentuale
  } = useMemo(() => {
    if (!pratiche || pratiche.length === 0) {
      return {
        incassatoTotale: 0,
        valorePraticheInCorso: 0,
        totaleDaRicevere: 0,
        costiTotali: 0,
        margineLordo: 0,
        marginePercentuale: 0,
      };
    }

    const stats = calcolaStatistichePrincipali(pratiche);

    const calculatedIncassato = stats.fatturatoTotale || 0; // Keep using fatturatoTotale from stats
    const calculatedValoreInCorso = stats.valoreInCorso || 0;
    const calculatedDaRicevere = stats.totaleDaRicevere || 0;

    // Calculate total costs from all pratiche, ensuring 'costo' is treated as a number
    const costi = pratiche.reduce((acc, p) => acc + (Number(p.costo) || 0), 0);


    // Calculate Profit (Margine Lordo) and Percentage
    // Profit = Incassato - Costi Totali
    const profitto = calculatedIncassato - costi; // Profit can be negative
    // Margin % = (Profit / Incassato) * 100. Handle division by zero.
    const marginePerc = calculatedIncassato !== 0 ? (profitto / calculatedIncassato) * 100 : 0;


    return {
      incassatoTotale: calculatedIncassato,
      valorePraticheInCorso: calculatedValoreInCorso,
      totaleDaRicevere: calculatedDaRicevere,
      costiTotali: costi,
      margineLordo: profitto, // Return the calculated profit
      marginePercentuale: marginePerc,
    };
  }, [pratiche]);

  // Data for the Bar Chart - Updated names and added colors
  const barChartData = useMemo(() => [
    { name: 'Incassato', Valore: incassatoTotale, fill: COLORS.incassato },
    { name: 'Valore In Corso', Valore: valorePraticheInCorso, fill: COLORS.inCorso },
    { name: 'Da Ricevere', Valore: totaleDaRicevere, fill: COLORS.daRicevere },
  ], [incassatoTotale, valorePraticheInCorso, totaleDaRicevere]);

  // Data for the Radial Bar Chart (Gauge simulation) - Represents margin %
  const gaugeData = useMemo(() => [
    // Clamp percentage for visual representation (0-100)
    // Note: The visual gauge shows 0-100, but the text label shows the actual percentage.
    { name: 'Margine %', value: Math.max(0, Math.min(100, marginePercentuale)), fill: COLORS.margine },
  ],[marginePercentuale]);

  // Style for the Radial Bar Chart label
  const radialProfitStyle = { // Style for the main profit value (€)
    fontSize: '1.5rem',
    fontWeight: 'bold',
    fill: '#333',
  };
  const radialPercentageStyle = { // Style for the percentage value (%)
    fontSize: '1rem',
    fill: '#666',
  };


  return (
    <div className="bg-white shadow-lg rounded-lg w-full p-6">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-700">Situazione Finanziaria</h3>
      </div>
      <div className="space-y-6">
        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {/* Incassato Card - Updated Title */}
          <div className="bg-blue-50 rounded-md shadow-sm overflow-hidden p-4">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              {/* Updated Title */}
              <div className="text-sm font-medium text-blue-800">Incassato</div>
              <Euro className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-900 truncate">{formatCurrency(incassatoTotale)}</div>
            </div>
          </div>
          {/* Valore Pratiche in Corso Card */}
          <div className="bg-yellow-50 rounded-md shadow-sm overflow-hidden p-4">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="text-sm font-medium text-yellow-800">Valore Pratiche in Corso</div>
              <Activity className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              {/* Corrected variable name here */}
              <div className="text-2xl font-bold text-yellow-900 truncate">{formatCurrency(valorePraticheInCorso)}</div>
            </div>
          </div>
          {/* Totale Da Ricevere Card */}
          <div className="bg-green-50 rounded-md shadow-sm overflow-hidden p-4">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="text-sm font-medium text-green-800">Totale Da Ricevere</div>
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-green-900 truncate">{formatCurrency(totaleDaRicevere)}</div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* Bar Chart - Updated */}
          <div className="lg:col-span-2 bg-gray-50 p-4 rounded-lg shadow">
            <h3 className="text-lg font-medium mb-4 text-gray-600">Panoramica Finanziaria</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={barChartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                {/* Updated XAxis dataKey to use the new name */}
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis
                    tickFormatter={(value) => typeof value === 'number' ? formatCurrency(value) : value}
                    tick={{ fontSize: 12 }}
                    width={100}
                 />
                <Tooltip
                    formatter={(value) => formatCurrency(value)}
                 />
                <Legend wrapperStyle={{ fontSize: "12px", paddingTop: '10px' }} />
                {/* Use Cell to apply individual colors to bars */}
                <Bar dataKey="Valore" name="Valore (€)" barSize={40} radius={[4, 4, 0, 0]}>
                   {barChartData.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={entry.fill} />
                   ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Gauge Chart (Simulated with RadialBarChart) - Updated */}
          <div className="flex flex-col items-center justify-center bg-gray-50 p-4 rounded-lg shadow">
             {/* Updated Title */}
             <h3 className="text-lg font-medium mb-4 text-gray-600">Profitto & Margine</h3>
             <ResponsiveContainer width="100%" height={300}>
                <RadialBarChart
                    cx="50%"
                    cy="55%"
                    innerRadius="50%"
                    outerRadius="90%"
                    barSize={30}
                    data={gaugeData} // Data now represents margin %
                    startAngle={180}
                    endAngle={-180}
                >
                    <PolarAngleAxis
                        type="number"
                        domain={[0, 100]} // Visual scale is 0-100%
                        angleAxisId={0}
                        tick={false}
                    />
                    <RadialBar
                        minAngle={15}
                        background={{ fill: '#e9ecef' }}
                        clockWise={true}
                        dataKey="value" // Binds to the 'value' in gaugeData (margin %)
                        cornerRadius={15}
                        angleAxisId={0}
                        fill={COLORS.margine} // Use the defined margin color for the bar
                    />
                    {/* Custom label in the center - Updated */}
                    {/* Profit Value (€) */}
                    <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" style={radialProfitStyle}>
                        {formatCurrency(margineLordo)}
                    </text>
                    {/* Margin Percentage (%) */}
                     <text x="50%" y="65%" textAnchor="middle" dominantBaseline="middle" style={radialPercentageStyle}>
                        ({formatPercentage(marginePercentuale)})
                    </text>
                    {/* Label Text */}
                     <text x="50%" y="80%" textAnchor="middle" dominantBaseline="middle" className="text-xs text-gray-500">
                        Profitto (Margine %)
                    </text>
                    {/* Tooltip shows the percentage value of the radial bar */}
                    <Tooltip formatter={(value) => `Margine: ${formatPercentage(value)}`} />
                </RadialBarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SituazioneFinanziaria;

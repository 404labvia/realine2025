// src/pages/ApePage/components/ApeStatisticsBox.js
import React, { useState, useMemo } from 'react';
import { FaChartBar } from 'react-icons/fa';

function ApeStatisticsBox({ ape }) {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);

  // Estrai gli anni disponibili dalle APE
  const availableYears = useMemo(() => {
    const years = new Set();
    ape.forEach(apeItem => {
      if (apeItem.dataCreazione) {
        const year = apeItem.dataCreazione.getFullYear();
        years.add(year);
      }
    });
    return Array.from(years).sort((a, b) => b - a); // Ordine decrescente
  }, [ape]);

  // Filtra APE per anno selezionato
  const apePerAnno = useMemo(() => {
    return ape.filter(apeItem => {
      if (!apeItem.dataCreazione) return false;
      return apeItem.dataCreazione.getFullYear() === selectedYear;
    });
  }, [ape, selectedYear]);

  // Calcola statistiche
  const stats = useMemo(() => {
    const fatte = apePerAnno.filter(a => a.completata).length;
    const inCorso = apePerAnno.filter(a => !a.completata).length;
    const totali = apePerAnno.length;

    return { fatte, inCorso, totali };
  }, [apePerAnno]);

  return (
    <div className="p-4 rounded-lg shadow-md relative bg-purple-50 text-purple-800">
      <div className="absolute top-4 right-4 opacity-60">
        <FaChartBar size={18} />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium uppercase tracking-wide">Statistiche APE</h3>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="text-xs border border-purple-300 rounded px-2 py-1 bg-white text-purple-800"
          >
            {availableYears.map(year => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium">Fatte:</span>
            <span className="text-lg font-bold">{stats.fatte}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium">In Corso:</span>
            <span className="text-lg font-bold">{stats.inCorso}</span>
          </div>
          <div className="flex justify-between items-center border-t border-purple-300 pt-1 mt-1">
            <span className="text-xs font-semibold">Totali:</span>
            <span className="text-2xl font-bold">{stats.totali}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ApeStatisticsBox;

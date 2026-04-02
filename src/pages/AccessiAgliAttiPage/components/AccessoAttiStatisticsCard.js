// src/pages/AccessiAgliAttiPage/components/AccessoAttiStatisticsCard.js
import React, { useState, useMemo } from 'react';

function AccessoAttiStatisticsCard({ accessi, title, icon, color, isCompleted }) {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);

  // Estrai gli anni disponibili dagli accessi
  const availableYears = useMemo(() => {
    const years = new Set();
    accessi.forEach(accesso => {
      if (accesso.dataCreazione) {
        const year = accesso.dataCreazione.getFullYear();
        years.add(year);
      }
    });
    return Array.from(years).sort((a, b) => b - a); // Ordine decrescente
  }, [accessi]);

  // Filtra accessi per anno e stato
  const accessiPerAnno = useMemo(() => {
    return accessi.filter(accesso => {
      if (!accesso.dataCreazione) return false;
      const matchYear = accesso.dataCreazione.getFullYear() === selectedYear;
      const matchStatus = isCompleted ? accesso.completata : !accesso.completata;
      return matchYear && matchStatus;
    });
  }, [accessi, selectedYear, isCompleted]);

  const count = accessiPerAnno.length;

  // Colori basati sul tipo
  const colorClasses = {
    green: 'bg-green-50 text-green-800 border-green-300',
    blue: 'bg-blue-50 text-blue-800 border-blue-300',
    red: 'bg-red-50 text-red-800 border-red-300',
    yellow: 'bg-yellow-50 text-yellow-800 border-yellow-300',
  };

  const selectedColorClass = colorClasses[color] || colorClasses.blue;

  return (
    <div className={`p-4 rounded-lg shadow-md relative ${selectedColorClass}`}>
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium uppercase tracking-wide">{title}</h3>
          {availableYears.length > 0 && (
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className={`text-xs border rounded px-2 py-1 bg-white ${color === 'green' ? 'text-green-800 border-green-300' : color === 'blue' ? 'text-blue-800 border-blue-300' : color === 'red' ? 'text-red-800 border-red-300' : 'text-yellow-800 border-yellow-300'}`}
            >
              {availableYears.map(year => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="mt-2">
          <span className="text-4xl font-bold">{count}</span>
          <p className="text-xs mt-1 opacity-75">
            {isCompleted ? 'Completati' : 'In corso'} nel {selectedYear}
          </p>
        </div>
      </div>
    </div>
  );
}

export default AccessoAttiStatisticsCard;

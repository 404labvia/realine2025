// src/pages/Dashboard/components/DashboardAccessiAtti.js
// Card Dashboard "Accesso Atti" nello stesso stile di StatistichePrincipali
// (Panoramica Pratiche): mini-stat con icona quadrata + label + valore.
// Filtro anno in alto a destra: i conteggi corrispondono all'anno selezionato.
import React, { useState, useMemo } from 'react';
import { FaFolderOpen, FaClock, FaCheckCircle } from 'react-icons/fa';
import { useAccessiAtti } from '../../AccessiAgliAttiPage/contexts/AccessoAttiContext';

function DashboardAccessiAtti() {
  const { accessi } = useAccessiAtti();
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const availableYears = useMemo(() => {
    const years = new Set([currentYear]);
    accessi.forEach(a => {
      if (a.dataCreazione) years.add(a.dataCreazione.getFullYear());
    });
    return Array.from(years).sort((x, y) => y - x);
  }, [accessi, currentYear]);

  const accessiAnno = useMemo(
    () => accessi.filter(a => a.dataCreazione && a.dataCreazione.getFullYear() === selectedYear),
    [accessi, selectedYear]
  );

  const totali = accessiAnno.length;
  const inCorso = accessiAnno.filter(a => !a.completata).length;
  const completati = accessiAnno.filter(a => a.completata).length;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-gray-800">Accesso Atti</h2>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(parseInt(e.target.value))}
          className="text-xs border border-gray-300 rounded px-2 py-1 bg-white text-gray-600"
        >
          {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="flex items-center">
          <div className="p-3 rounded-md bg-purple-100 mr-3">
            <FaFolderOpen className="text-purple-600 text-xl" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Totali</p>
            <h3 className="text-xl font-bold">{totali}</h3>
          </div>
        </div>

        <div className="flex items-center">
          <div className="p-3 rounded-md bg-blue-100 mr-3">
            <FaClock className="text-blue-600 text-xl" />
          </div>
          <div>
            <p className="text-xs text-gray-500">In Corso</p>
            <h3 className="text-xl font-bold">{inCorso}</h3>
          </div>
        </div>

        <div className="flex items-center">
          <div className="p-3 rounded-md bg-green-100 mr-3">
            <FaCheckCircle className="text-green-600 text-xl" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Completati</p>
            <h3 className="text-xl font-bold">{completati}</h3>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardAccessiAtti;

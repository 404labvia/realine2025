// src/pages/Dashboard/components/DashboardApe.js
// Card Dashboard "APE" nello stesso stile di StatistichePrincipali (mini-stat).
// Riga unica (4 tile): In Corso, Completate, Incassato, Da Incassare.
// Importi = quota STUDIO (importoStudio): incassato = fasePagamentoCompletata; da incassare = resto.
// Filtro anno in alto a destra: i valori corrispondono all'anno selezionato.
import React, { useState, useMemo } from 'react';
import { FaClock, FaCheckCircle, FaMoneyBillWave, FaEuroSign } from 'react-icons/fa';
import { useApe } from '../../ApePage/contexts/ApeContext';

const formatEuro = (value) => `€${(value || 0).toLocaleString('it-IT', { maximumFractionDigits: 0 })}`;

function DashboardApe() {
  const { ape } = useApe();
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const availableYears = useMemo(() => {
    const years = new Set([currentYear]);
    ape.forEach(a => {
      if (a.dataCreazione) years.add(a.dataCreazione.getFullYear());
    });
    return Array.from(years).sort((x, y) => y - x);
  }, [ape, currentYear]);

  const apeAnno = useMemo(
    () => ape.filter(a => a.dataCreazione && a.dataCreazione.getFullYear() === selectedYear),
    [ape, selectedYear]
  );

  const inCorso = apeAnno.filter(a => !a.completata).length;
  const completate = apeAnno.filter(a => a.completata).length;

  let incassatoStudio = 0;
  let daIncassareStudio = 0;
  apeAnno.forEach(apeItem => {
    const importoStudio = parseFloat(apeItem.importoStudio) || 0;
    if (apeItem.fasePagamentoCompletata) {
      incassatoStudio += importoStudio;
    } else {
      daIncassareStudio += importoStudio;
    }
  });

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-gray-800">APE</h2>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(parseInt(e.target.value))}
          className="text-xs border border-gray-300 rounded px-2 py-1 bg-white text-gray-600"
        >
          {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-4 gap-4">
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
            <p className="text-xs text-gray-500">Completate</p>
            <h3 className="text-xl font-bold">{completate}</h3>
          </div>
        </div>

        <div className="flex items-center">
          <div className="p-3 rounded-md bg-green-100 mr-3">
            <FaMoneyBillWave className="text-green-600 text-xl" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Incassato Studio</p>
            <h3 className="text-xl font-bold">{formatEuro(incassatoStudio)}</h3>
          </div>
        </div>

        <div className="flex items-center">
          <div className="p-3 rounded-md bg-amber-100 mr-3">
            <FaEuroSign className="text-amber-600 text-xl" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Da Incassare Studio</p>
            <h3 className="text-xl font-bold">{formatEuro(daIncassareStudio)}</h3>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardApe;

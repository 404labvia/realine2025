// src/pages/Dashboard/components/StatistichePrincipali.js
import React, { useState, useMemo } from 'react';
import { FaFolderOpen, FaClock, FaCheckCircle, FaMoneyBillWave, FaFileInvoiceDollar, FaEuroSign } from 'react-icons/fa';

// Anno di riferimento di una pratica: createdAt (ISO) con fallback su dataInizio.
const getPraticaYear = (pratica) => {
  const raw = pratica.createdAt || pratica.dataInizio;
  if (!raw) return null;
  const d = new Date(raw);
  return isNaN(d.getTime()) ? null : d.getFullYear();
};

function StatistichePrincipali({ pratiche }) {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);

  // Anni disponibili dalle pratiche (+ anno corrente sempre presente)
  const availableYears = useMemo(() => {
    const years = new Set([currentYear]);
    pratiche.forEach(p => {
      const y = getPraticaYear(p);
      if (y) years.add(y);
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [pratiche, currentYear]);

  // Pratiche dell'anno selezionato: tutti i valori sotto derivano da questo sottoinsieme
  const praticheAnno = useMemo(
    () => pratiche.filter(p => getPraticaYear(p) === selectedYear),
    [pratiche, selectedYear]
  );

  const praticheInCorso = praticheAnno.filter(pratica => pratica.stato === 'In Corso').length;
  const praticheCompletate = praticheAnno.filter(pratica => pratica.stato === 'Completata').length;

  const valoreInCorso = praticheAnno
    .filter(pratica => pratica.stato === 'In Corso')
    .reduce((acc, pratica) => acc + (pratica.importoTotale || 0), 0);

  const calcolaPagamenti = () => {
    let totaleRicevutoInCorso = 0;
    let fatturatoTotale = 0;

    praticheAnno.forEach(pratica => {
      let importoRicevuto = 0;

      if (pratica.workflow) {
        const passiPagamento = ['acconto1', 'acconto2', 'saldo'];

        passiPagamento.forEach(passo => {
          if (pratica.workflow[passo] && pratica.workflow[passo].importoCommittente) {
            importoRicevuto += pratica.workflow[passo].importoCommittente;
          }
        });
      }
      else if (pratica.steps) {
        // Retrocompatibilità
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

      fatturatoTotale += importoRicevuto;

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

  const renderYearSelect = () => (
    <select
      value={selectedYear}
      onChange={(e) => setSelectedYear(parseInt(e.target.value))}
      className="text-xs border border-gray-300 rounded px-2 py-1 bg-white text-gray-600"
    >
      {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
    </select>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      {/* Card Panoramica Pratiche */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-gray-800">Panoramica Pratiche</h2>
          {renderYearSelect()}
        </div>
        <div className="grid grid-cols-3 gap-4">
          {/* Pratiche Totali */}
          <div className="flex items-center">
            <div className="p-3 rounded-md bg-purple-100 mr-3">
              <FaFolderOpen className="text-purple-600 text-xl" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Pratiche Totali</p>
              <h3 className="text-xl font-bold">{praticheAnno.length}</h3>
            </div>
          </div>

          {/* Pratiche In Corso */}
          <div className="flex items-center">
            <div className="p-3 rounded-md bg-blue-100 mr-3">
              <FaClock className="text-blue-600 text-xl" />
            </div>
            <div>
              <p className="text-xs text-gray-500">In Corso</p>
              <h3 className="text-xl font-bold">{praticheInCorso}</h3>
            </div>
          </div>

          {/* Pratiche Concluse */}
          <div className="flex items-center">
            <div className="p-3 rounded-md bg-green-100 mr-3">
              <FaCheckCircle className="text-green-600 text-xl" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Concluse</p>
              <h3 className="text-xl font-bold">{praticheCompletate}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Card Situazione Finanziaria */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-gray-800">Situazione Finanziaria</h2>
          {renderYearSelect()}
        </div>
        <div className="grid grid-cols-3 gap-4">
          {/* Fatturato Totale */}
          <div className="flex items-center">
            <div className="p-3 rounded-md bg-green-100 mr-3">
              <FaMoneyBillWave className="text-green-600 text-xl" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Fatturato</p>
              <h3 className="text-xl font-bold">€{pagamenti.fatturatoTotale.toLocaleString('it-IT', {maximumFractionDigits: 0})}</h3>
            </div>
          </div>

          {/* Valore Pratiche in Corso */}
          <div className="flex items-center">
            <div className="p-3 rounded-md bg-blue-100 mr-3">
              <FaFileInvoiceDollar className="text-blue-600 text-xl" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Pratiche in Corso</p>
              <h3 className="text-xl font-bold">€{valoreInCorso.toLocaleString('it-IT', {maximumFractionDigits: 0})}</h3>
            </div>
          </div>

          {/* Da Ricevere */}
          <div className="flex items-center">
            <div className="p-3 rounded-md bg-amber-100 mr-3">
              <FaEuroSign className="text-amber-600 text-xl" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Da Ricevere</p>
              <h3 className="text-xl font-bold">€{pagamenti.totaleDaRicevere.toLocaleString('it-IT', {maximumFractionDigits: 0})}</h3>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StatistichePrincipali;

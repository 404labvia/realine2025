// src/pages/Dashboard/components/StatistichePrincipali.js
import React from 'react';
import { FaUsers, FaSpinner, FaCheckCircle } from 'react-icons/fa';
import { MdAccountBalance, MdAttachMoney, MdMoneyOff } from 'react-icons/md';

function StatistichePrincipali({ pratiche }) {
  // Conteggio delle pratiche
  const praticheInCorso = pratiche.filter(pratica => pratica.stato === 'In Corso').length;
  const praticheCompletate = pratiche.filter(pratica => pratica.stato === 'Completata').length;
  
  // Calcolo valore pratiche in corso
  const valoreInCorso = pratiche
    .filter(pratica => pratica.stato === 'In Corso')
    .reduce((acc, pratica) => acc + (pratica.importoTotale || 0), 0);
  
  // Calcolo pagamenti ricevuti e da ricevere
  const calcolaPagamenti = () => {
    let totaleRicevutoInCorso = 0;
    let fatturatoTotale = 0;
    
    pratiche.forEach(pratica => {
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      {/* Card Panoramica Pratiche */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-base text-gray-500 mb-6">Panoramica Pratiche</h2>
        <div className="grid grid-cols-3 gap-4">
          {/* Pratiche Totali */}
          <div className="flex items-center">
            <div className="p-3 rounded-md bg-purple-100 mr-3">
              <FaUsers className="text-purple-600 text-xl" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Pratiche Totali</p>
              <h3 className="text-xl font-bold">{pratiche.length}</h3>
            </div>
          </div>
          
          {/* Pratiche In Corso */}
          <div className="flex items-center">
            <div className="p-3 rounded-md bg-blue-100 mr-3">
              <FaSpinner className="text-blue-600 text-xl" />
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
        <h2 className="text-base text-gray-500 mb-6">Situazione Finanziaria</h2>
        <div className="grid grid-cols-3 gap-4">
          {/* Fatturato Totale */}
          <div className="flex items-center">
            <div className="p-3 rounded-md bg-green-100 mr-3">
              <MdAccountBalance className="text-green-600 text-xl" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Fatturato</p>
              <h3 className="text-xl font-bold">€{pagamenti.fatturatoTotale.toLocaleString('it-IT', {maximumFractionDigits: 0})}</h3>
            </div>
          </div>
          
          {/* Valore Pratiche in Corso */}
          <div className="flex items-center">
            <div className="p-3 rounded-md bg-blue-100 mr-3">
              <MdAttachMoney className="text-blue-600 text-xl" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Pratiche in Corso</p>
              <h3 className="text-xl font-bold">€{valoreInCorso.toLocaleString('it-IT', {maximumFractionDigits: 0})}</h3>
            </div>
          </div>
          
          {/* Da Ricevere */}
          <div className="flex items-center">
            <div className="p-3 rounded-md bg-amber-100 mr-3">
              <MdMoneyOff className="text-amber-600 text-xl" />
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
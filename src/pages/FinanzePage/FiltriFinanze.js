import React from 'react';
import { FaFilter, FaCalendarAlt, FaChartLine } from 'react-icons/fa';

function FiltriFinanze({ filtroAnno, setFiltroAnno, filtroMese, setFiltroMese, anni }) {
  return (
    <div className="bg-white p-4 rounded-lg shadow mb-6">
      <div className="flex items-center mb-2">
        <FaFilter className="text-blue-500 mr-2" />
        <h3 className="text-lg font-medium text-gray-700">Filtri Report Finanziario</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-center">
          <div className="p-3 rounded-md bg-blue-100 mr-3">
            <FaCalendarAlt className="text-blue-600 text-xl" />
          </div>
          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">Anno</label>
            <select
              value={filtroAnno}
              onChange={(e) => setFiltroAnno(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Tutti</option>
              {anni.map(anno => (
                <option key={anno} value={anno.toString()}>{anno}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="flex items-center">
          <div className="p-3 rounded-md bg-green-100 mr-3">
            <FaChartLine className="text-green-600 text-xl" />
          </div>
          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">Mese</label>
            <select
              value={filtroMese}
              onChange={(e) => setFiltroMese(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Tutti</option>
              <option value="1">Gennaio</option>
              <option value="2">Febbraio</option>
              <option value="3">Marzo</option>
              <option value="4">Aprile</option>
              <option value="5">Maggio</option>
              <option value="6">Giugno</option>
              <option value="7">Luglio</option>
              <option value="8">Agosto</option>
              <option value="9">Settembre</option>
              <option value="10">Ottobre</option>
              <option value="11">Novembre</option>
              <option value="12">Dicembre</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FiltriFinanze;
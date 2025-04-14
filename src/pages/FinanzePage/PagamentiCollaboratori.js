import React from 'react';
import { FaUsers } from 'react-icons/fa';

function PagamentiCollaboratori({ finanze }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow mb-8">
      <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
        <FaUsers className="text-purple-600 mr-2 text-xl" />
        Pagamenti Collaboratori
      </h2>
      
      {/* Tabella dettagliata collaboratori */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Collaboratore
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Importo Totale
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Già Pagato
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Da Pagare
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                % Completamento
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {Object.entries(finanze.pagamentiCollaboratori).length > 0 ? (
              Object.entries(finanze.pagamentiCollaboratori).map(([collaboratore, dati]) => (
                <tr key={collaboratore}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{collaboratore}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">€{dati.totale.toLocaleString('it-IT', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-green-600">€{dati.pagato.toLocaleString('it-IT', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-red-600">€{dati.daPagare.toLocaleString('it-IT', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                        <div 
                          className="bg-blue-600 h-2.5 rounded-full" 
                          style={{ width: `${dati.totale > 0 ? (dati.pagato / dati.totale) * 100 : 0}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-700">
                        {dati.totale > 0 ? Math.round((dati.pagato / dati.totale) * 100) : 0}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                  Nessun pagamento ai collaboratori registrato
                </td>
              </tr>
            )}
            
            {/* Riga totale */}
            {Object.entries(finanze.pagamentiCollaboratori).length > 0 && (
              <tr className="bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-bold text-gray-900">TOTALE</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-bold text-gray-900">€{finanze.totaliCollaboratori.totale.toLocaleString('it-IT', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-bold text-green-600">€{finanze.totaliCollaboratori.pagato.toLocaleString('it-IT', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-bold text-red-600">€{finanze.totaliCollaboratori.daPagare.toLocaleString('it-IT', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                      <div 
                        className="bg-blue-600 h-2.5 rounded-full" 
                        style={{ width: `${finanze.totaliCollaboratori.totale > 0 ? (finanze.totaliCollaboratori.pagato / finanze.totaliCollaboratori.totale) * 100 : 0}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-bold text-gray-700">
                      {finanze.totaliCollaboratori.totale > 0 ? Math.round((finanze.totaliCollaboratori.pagato / finanze.totaliCollaboratori.totale) * 100) : 0}%
                    </span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default PagamentiCollaboratori;
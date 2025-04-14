import React from 'react';
import { FaMoneyBillWave } from 'react-icons/fa';

function DistribuzioneProfitti({ profittoSoci }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow mb-8">
      <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
        <FaMoneyBillWave className="text-green-600 mr-2 text-xl" />
        Distribuzione Profitti Soci
      </h2>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Socio
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Percentuale
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Profitto Totale
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Importo Già Distribuito
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Da Distribuire
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {/* Riga per il Titolare */}
            <tr>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-bold text-gray-900">{profittoSoci.titolare.nome}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-700">
                  {(profittoSoci.titolare.percentuale * 100).toFixed(0)}%
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-semibold text-gray-900">
                  €{profittoSoci.titolare.totale.toLocaleString('it-IT', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-green-600">
                  €{profittoSoci.titolare.pagato.toLocaleString('it-IT', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-semibold text-red-600">
                  €{(profittoSoci.titolare.totale - profittoSoci.titolare.pagato).toLocaleString('it-IT', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                </div>
              </td>
            </tr>

            {/* Righe per gli altri soci */}
            {profittoSoci.soci.map((socio, index) => (
              <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{socio.nome}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-700">
                    {(socio.percentuale * 100).toFixed(0)}%
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-semibold text-gray-900">
                    €{socio.totale.toLocaleString('it-IT', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-green-600">
                    €{socio.pagato.toLocaleString('it-IT', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-semibold text-red-600">
                    €{(socio.totale - socio.pagato).toLocaleString('it-IT', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </div>
                </td>
              </tr>
            ))}

            {/* Riga Totale */}
            <tr className="bg-gray-50 font-bold">
              <td className="px-6 py-4 whitespace-nowrap">TOTALE</td>
              <td className="px-6 py-4 whitespace-nowrap">100%</td>
              <td className="px-6 py-4 whitespace-nowrap">
                €{[
                  profittoSoci.titolare.totale,
                  ...profittoSoci.soci.map(s => s.totale)
                ].reduce((a, b) => a + b, 0).toLocaleString('it-IT', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-green-600">
                €{[
                  profittoSoci.titolare.pagato,
                  ...profittoSoci.soci.map(s => s.pagato)
                ].reduce((a, b) => a + b, 0).toLocaleString('it-IT', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-red-600">
                €{[
                  profittoSoci.titolare.totale - profittoSoci.titolare.pagato,
                  ...profittoSoci.soci.map(s => s.totale - s.pagato)
                ].reduce((a, b) => a + b, 0).toLocaleString('it-IT', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DistribuzioneProfitti;
// src/pages/ApePage/components/ApeSummaryBox.js
import React from 'react';
import { FaMoneyBillWave, FaEuroSign, FaHandshake, FaChartLine } from 'react-icons/fa';

const formatCurrency = (value) => {
  const numericValue = Number(value);
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(isNaN(numericValue) ? 0 : numericValue);
};

const colorMap = {
  green: 'bg-green-500 text-white',
  blue: 'bg-blue-500 text-white',
  yellow: 'bg-yellow-500 text-gray-800',
  red: 'bg-red-500 text-white',
};

const iconMap = {
  'Incassato': <FaMoneyBillWave size={18} />,
  'Importo Studio': <FaHandshake size={18} />,
  'Importo Collaboratore': <FaChartLine size={24} />,
  'Importo da Avere': <FaEuroSign size={24} />,
};

function ApeSummaryBox({ title, value, subValue, color }) {
  const boxColorClass = colorMap[color] || 'bg-gray-100 text-gray-800';
  const icon = iconMap[title] || <FaMoneyBillWave size={24} />;

  return (
    <div className={`p-4 rounded-lg shadow-md flex items-center space-x-4 ${boxColorClass}`}>
      <div className="flex-shrink-0">
        {icon}
      </div>
      <div className="flex-grow">
        <h3 className="text-sm font-medium uppercase tracking-wide opacity-80">{title}</h3>
        <p className="text-2xl font-bold">{formatCurrency(value)}</p>
        {subValue && (
          <p className="text-xs mt-1 opacity-90">{subValue}</p>
        )}
      </div>
    </div>
  );
}

export default ApeSummaryBox;
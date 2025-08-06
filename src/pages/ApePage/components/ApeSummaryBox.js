// src/pages/ApePage/components/ApeSummaryBox.js
import React from 'react';
import { FaMoneyBillWave, FaEuroSign, FaHandshake, FaChartLine } from 'react-icons/fa';

const formatCurrency = (value) => {
  const numericValue = Number(value);
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(isNaN(numericValue) ? 0 : numericValue);
};

const colorMap = {
  green: 'bg-green-50 text-green-800',
  blue: 'bg-blue-100 text-blue-800',
  yellow: 'bg-yellow-50 text-yellow-900',
  red: 'bg-red-100 text-red-800',
};

const iconMap = {
  'Incassato': <FaMoneyBillWave size={18} />,
  'Importo Studio': <FaHandshake size={18} />,
  'Importo Collaboratore': <FaChartLine size={18} />,
  'Importo da Avere': <FaEuroSign size={18} />,
};

function ApeSummaryBox({ title, value, subValue, color }) {
  const boxColorClass = colorMap[color] || 'bg-gray-100 text-gray-800';
  const icon = iconMap[title] || <FaMoneyBillWave size={24} />;

  return (
    // --- MODIFIED CODE START ---
    <div className={`p-4 rounded-lg shadow-md relative ${boxColorClass}`}>
      <div className="absolute top-4 right-4 opacity-60">
        {icon}
      </div>

      <div>
        <h3 className="text-sm font-medium uppercase tracking-wide">{title}</h3>
        <p className="text-2xl font-bold">{formatCurrency(value)}</p>
        {subValue && (
          <p className="text-xs mt-1">{subValue}</p>
        )}
      </div>
    </div>
    // --- MODIFIED CODE END ---
  );
}

export default ApeSummaryBox;
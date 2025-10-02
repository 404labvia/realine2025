// src/pages/PraticheBoardPage/components/cells/DettagliCell.js
import React from 'react';

const DettagliCell = ({ pratica }) => {
  return (
    <div className="text-center">
      <div className="text-xs text-gray-700 mb-1">{pratica.agenzia || '-'}</div>
      <div className="text-xs text-gray-600">{pratica.collaboratore || '-'}</div>
    </div>
  );
};

export default DettagliCell;
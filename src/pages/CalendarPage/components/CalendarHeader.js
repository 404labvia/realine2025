// src/pages/CalendarPage/components/CalendarHeader.js
import React from 'react';
import { FaPlus, FaSync } from 'react-icons/fa';

// Il calendario è gestito server-side via service account: nessun login/logout Google
// da mostrare. L'header espone solo "Aggiungi" e "Aggiorna".
const CalendarHeader = ({
  isLoadingEvents,
  onRefreshEvents,
  onShowCreationModal,
}) => {
  return (
    <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
      <h1 className="text-2xl font-bold text-gray-800">Calendario</h1>
      <div className="flex items-center space-x-2">
        <button
          onClick={onShowCreationModal}
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-3 rounded flex items-center text-xs sm:text-sm"
          title="Aggiungi nuovo evento"
          disabled={isLoadingEvents}
        >
          <FaPlus className="mr-1 sm:mr-2" /> Aggiungi
        </button>
        <button
          onClick={onRefreshEvents}
          className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-2 px-3 rounded flex items-center text-xs sm:text-sm"
          disabled={isLoadingEvents}
          title="Aggiorna eventi"
        >
          <FaSync className={`mr-1 sm:mr-2 ${isLoadingEvents ? 'animate-spin' : ''}`} /> Aggiorna
        </button>
      </div>
    </div>
  );
};

export default CalendarHeader;

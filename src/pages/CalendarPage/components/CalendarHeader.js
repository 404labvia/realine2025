// src/pages/CalendarPage/components/CalendarHeader.js
import React from 'react';
import { FaPlus, FaCalendarCheck, FaSync, FaCalendarTimes } from 'react-icons/fa'; // Aggiunta FaPlus

const CalendarHeader = ({
  googleApiToken,
  gapiClientInitialized,
  isLoadingGapi,
  isLoadingEvents,
  onLogin,
  onLogout,
  onRefreshEvents,
  onShowCreationModal, // Aggiunta prop per aprire modal nuovo evento
}) => {
  return (
    <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
      <h1 className="text-2xl font-bold text-gray-800">Calendario</h1>
      <div className="flex items-center space-x-2">
        {/* Pulsante Aggiungi Evento (Nuovo) */}
        {googleApiToken && gapiClientInitialized && (
           <button
             onClick={onShowCreationModal}
             className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-3 rounded flex items-center text-xs sm:text-sm"
             title="Aggiungi nuovo evento"
             disabled={isLoadingGapi || isLoadingEvents}
           >
             <FaPlus className="mr-1 sm:mr-2" /> Aggiungi {/* Icona Cambiata */}
           </button>
        )}
        {!googleApiToken ? (
          <button
            onClick={onLogin}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex items-center text-sm sm:text-base"
            disabled={isLoadingGapi || !gapiClientInitialized} // Disabilitato se GAPI non è pronto o sta caricando
          >
            <FaCalendarCheck className="mr-2" /> Connetti Google Calendar
          </button>
        ) : (
          <>
            <button
              onClick={onRefreshEvents}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-2 px-3 rounded flex items-center text-xs sm:text-sm"
              disabled={isLoadingEvents || !gapiClientInitialized}
              title="Aggiorna eventi"
            >
              <FaSync className={`mr-1 sm:mr-2 ${isLoadingEvents ? 'animate-spin' : ''}`} /> Aggiorna
            </button>
            <button
              onClick={onLogout}
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-3 rounded flex items-center text-xs sm:text-sm"
              title="Disconnetti Google Calendar"
            >
              <FaCalendarTimes className="mr-1 sm:mr-2" /> Disconnetti
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default CalendarHeader;
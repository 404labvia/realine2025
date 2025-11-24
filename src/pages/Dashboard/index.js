// src/pages/Dashboard/index.js
import React, { useState } from 'react';
import { usePratiche } from '../../contexts/PraticheContext';
import StatistichePrincipali from './components/StatistichePrincipali';
import UpcomingDeadlines from './components/UpcomingDeadlines'; // ORA CORRETTO: renderizzerà solo una card
import ChartAgenzie from './components/ChartAgenzie';
import ChartFatturato from './components/ChartFatturato';

// Rimuovi import non più usati
// import TaskNotification from './components/TaskNotification';
// import TaskDetails from './components/TaskDetails';
// import { useDashboardTasks } from './hooks/useDashboardTasks';


function Dashboard() {
  const { pratiche, loading } = usePratiche(); // updatePratica non è più usato qui
  const [filtroStatoDistribuzione, setFiltroStatoDistribuzione] = useState('In Corso');
  const [filtroStatoFatturato, setFiltroStatoFatturato] = useState('Tutte');

  // Rimuovi stati non più usati
  // const [showTaskDetails, setShowTaskDetails] = useState(null);
  // const [showTaskNotification, setShowTaskNotification] = useState(false);
  // const [lastTaskEvent, setLastTaskEvent] = useState(null);

  // Rimuovi hook non più usato
  // const { upcomingDeadlines, handleToggleTask } = useDashboardTasks(pratiche, loading, updatePratica);

  // Loader principale
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
        <p className="ml-3 text-gray-700">Caricamento Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-2 sm:p-4">
      <StatistichePrincipali pratiche={pratiche} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
        <ChartAgenzie
          pratiche={pratiche}
          filtroStato={filtroStatoDistribuzione}
          setFiltroStato={setFiltroStatoDistribuzione}
        />
        <ChartFatturato
          pratiche={pratiche}
          filtroStato={filtroStatoFatturato}
          setFiltroStato={setFiltroStatoFatturato}
        />
      </div>

      {/* CORRETTO: Chiama UpcomingDeadlines senza props */}
      <div className="my-6">
        <UpcomingDeadlines />
      </div>

      {/* Rimuovi modali non più usati */}
    </div>
  );
}

export default Dashboard;
// src/pages/Dashboard/index.js
import React, { useState } from 'react';
import { usePratiche } from '../../contexts/PraticheContext';
import StatistichePrincipali from './components/StatistichePrincipali';
import UpcomingDeadlines from './components/UpcomingDeadlines'; // MANTENUTO: Riferito a "Atti/Fine Pratiche Imminenti"
import ChartAgenzie from './components/ChartAgenzie';
import ChartFatturato from './components/ChartFatturato';
import TaskNotification from './components/TaskNotification';
import TaskDetails from './components/TaskDetails';
import TodoList from './components/TodoList'; // Nuovo componente basato su GCal

import { useDashboardTasks } from './hooks/useDashboardTasks'; // MANTENUTO: Serve a `UpcomingDeadlines`

// Hook per il calendario rimosso
// import { useDashboardCalendar } from './hooks/useDashboardCalendar';

// Componente TaskList rimosso
// import TaskList from './components/TaskList';

// Componente DashboardCalendar rimosso
// import DashboardCalendar from './components/DashboardCalendar';

function Dashboard() {
  const { pratiche, loading, updatePratica } = usePratiche();
  const [filtroStatoDistribuzione, setFiltroStatoDistribuzione] = useState('In Corso');
  const [filtroStatoFatturato, setFiltroStatoFatturato] = useState('Tutte');

  // Stati per i componenti Task (necessari per UpcomingDeadlines)
  const [showTaskDetails, setShowTaskDetails] = useState(null);
  const [showTaskNotification, setShowTaskNotification] = useState(false);
  const [lastTaskEvent, setLastTaskEvent] = useState(null);

  // Hook per task da Firestore (logica per `TaskList` rimossa, mantenuta per `UpcomingDeadlines`)
  const {
    upcomingDeadlines,
    handleToggleTask
    // Le altre variabili come currentTasks, taskFilter, etc. non sono più necessarie qui
  } = useDashboardTasks(pratiche, loading, updatePratica);

  // Hook e stati per `DashboardCalendar` sono stati rimossi.

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
      {/* RIGA 1: Statistiche Principali */}
      <StatistichePrincipali pratiche={pratiche} />

      {/* RIGA 2: Grafici */}
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

      {/* RIGA 3: Nuova To-Do List */}
      <div className="my-6">
        <TodoList />
      </div>

      {/* RIGA 4: Atti/Fine Pratiche Imminenti */}
      <div className="my-6">
        <UpcomingDeadlines
          deadlines={upcomingDeadlines}
          handleToggleTask={handleToggleTask}
          onViewTaskDetails={(task) => setShowTaskDetails(task)}
        />
      </div>

      {/* Modali per i dettagli e notifiche (necessari per UpcomingDeadlines) */}
      {showTaskDetails && (
        <TaskDetails
          task={showTaskDetails}
          onClose={() => setShowTaskDetails(null)}
          onComplete={handleToggleTask}
        />
      )}

      {showTaskNotification && (
        <TaskNotification
          event={lastTaskEvent}
          onClose={() => setShowTaskNotification(false)}
        />
      )}
    </div>
  );
}

export default Dashboard;
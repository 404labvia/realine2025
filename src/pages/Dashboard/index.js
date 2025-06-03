// src/pages/Dashboard/index.js
import React, { useState } from 'react';
import { usePratiche } from '../../contexts/PraticheContext';
import StatistichePrincipali from './components/StatistichePrincipali';
import TaskList from './components/TaskList'; // Componente esistente per task da Firestore
import UpcomingDeadlines from './components/UpcomingDeadlines'; // Componente esistente
import DashboardCalendar from './components/DashboardCalendar'; // Componente esistente (con suoi eventi)
import ChartAgenzie from './components/ChartAgenzie';
import ChartFatturato from './components/ChartFatturato';
import TaskNotification from './components/TaskNotification'; // Per notifiche di automazione task Firestore
import TaskDetails from './components/TaskDetails'; // Modale per task Firestore

import { useDashboardTasks } from './hooks/useDashboardTasks'; // Hook per task Firestore
import { useDashboardCalendar } from './hooks/useDashboardCalendar'; // Hook per eventi DashboardCalendar

import TodoList from './components/TodoList'; // <-- NUOVA IMPORTAZIONE PER LA TODO LIST BASATA SU GCAL

function Dashboard() {
  // 'loading' si riferisce al caricamento delle pratiche per statistiche e grafici
  const { pratiche, loading, updatePratica } = usePratiche();
  const [filtroStatoDistribuzione, setFiltroStatoDistribuzione] = useState('In Corso');
  const [filtroStatoFatturato, setFiltroStatoFatturato] = useState('Tutte');

  // Stati per i componenti esistenti che usano useDashboardTasks
  const [showTaskDetails, setShowTaskDetails] = useState(null);
  const [showTaskNotification, setShowTaskNotification] = useState(false);
  const [lastTaskEvent, setLastTaskEvent] = useState(null);

  // Hook esistente per TaskList e UpcomingDeadlines (task da Firestore)
  const {
    upcomingDeadlines,
    taskFilter,
    setTaskFilter,
    currentTaskPage,
    setCurrentTaskPage,
    totalTaskPages,
    currentTasks, // Usato da TaskList
    handleToggleTask // Funzione per completare task da Firestore
  } = useDashboardTasks(pratiche, loading, updatePratica);

  // Hook esistente per DashboardCalendar
  const {
    currentDate,
    setCurrentDate,
    calendarView,
    setCalendarView,
    events, // Eventi gestiti specificamente da useDashboardCalendar
    isLoadingEvents,
    lastSync,
    fetchEvents,
    navigatePrev,
    navigateNext,
    navigateToday
  } = useDashboardCalendar();

  // Loader principale basato sul caricamento delle pratiche (per Statistiche, Grafici)
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
      {/* Il titolo principale della pagina è gestito da App.js */}

      <StatistichePrincipali pratiche={pratiche} />

      {/* NUOVA SEZIONE: To-Do List basata su Google Calendar */}
      <div className="my-6"> {/* Aggiunto margine sopra e sotto */}
        <TodoList /> {/* TodoList gestisce il suo caricamento e dati internamente */}
      </div>

      {/* Sezioni esistenti del Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <TaskList
          currentTasks={currentTasks}
          taskFilter={taskFilter}
          setTaskFilter={setTaskFilter}
          currentTaskPage={currentTaskPage}
          totalTaskPages={totalTaskPages}
          handlePageChange={setCurrentTaskPage}
          handleToggleTask={handleToggleTask} // Questa funzione opera sulle task di Firestore
          onViewTaskDetails={(task) => setShowTaskDetails(task)}
        />
        <DashboardCalendar
          currentDate={currentDate}
          setCurrentDate={setCurrentDate}
          calendarView={calendarView}
          setCalendarView={setCalendarView}
          events={events} // Questi sono gli eventi gestiti da useDashboardCalendar
          isLoadingEvents={isLoadingEvents}
          lastSync={lastSync}
          fetchEvents={fetchEvents}
          pendingTasks={currentTasks} // Passa le task da useDashboardTasks
          navigatePrev={navigatePrev}
          navigateNext={navigateNext}
          navigateToday={navigateToday}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
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

      <UpcomingDeadlines
        deadlines={upcomingDeadlines}
        handleToggleTask={handleToggleTask} // Questa funzione opera sulle task di Firestore
        onViewTaskDetails={(task) => setShowTaskDetails(task)}
      />

      {/* Modale per i dettagli delle task di Firestore (da TaskList/UpcomingDeadlines) */}
      {showTaskDetails && (
        <TaskDetails
          task={showTaskDetails}
          onClose={() => setShowTaskDetails(null)}
          onComplete={handleToggleTask} // Questa funzione opera sulle task di Firestore
        />
      )}

      {/* Notifica per task automatiche (legate al vecchio sistema di task Firestore) */}
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
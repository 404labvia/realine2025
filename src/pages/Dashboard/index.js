// src/pages/Dashboard/index.js
import React, { useState, useEffect } from 'react';
import { usePratiche } from '../../contexts/PraticheContext';
import StatistichePrincipali from './components/StatistichePrincipali';
import TaskList from './components/TaskList';
import UpcomingDeadlines from './components/UpcomingDeadlines';
import DashboardCalendar from './components/DashboardCalendar';
import ChartAgenzie from './components/ChartAgenzie';
import ChartFatturato from './components/ChartFatturato';
import TaskNotification from './components/TaskNotification';
import { useDashboardTasks } from './hooks/useDashboardTasks';
import { useDashboardCalendar } from './hooks/useDashboardCalendar';
import { signInWithGoogle, isGoogleCalendarAuthenticated } from '../../firebase';

function Dashboard() {
  // Context e stati base
  const { pratiche, loading } = usePratiche();
  const [filtroStatoDistribuzione, setFiltroStatoDistribuzione] = useState('In Corso');
  const [filtroStatoFatturato, setFiltroStatoFatturato] = useState('Tutte');
  const [showTaskDetails, setShowTaskDetails] = useState(null);
  const [showTaskNotification, setShowTaskNotification] = useState(false);
  const [lastTaskEvent, setLastTaskEvent] = useState(null);
  
  // Utilizza i custom hooks
  const {
    pendingTasks,
    upcomingDeadlines,
    taskFilter,
    setTaskFilter,
    currentTaskPage,
    setCurrentTaskPage,
    totalTaskPages,
    filteredTasks,
    currentTasks,
    handleToggleTask
  } = useDashboardTasks(pratiche, loading);
  
  const {
    currentDate,
    setCurrentDate,
    calendarView,
    setCalendarView,
    googleEvents,
    isAuthenticated,
    isLoadingEvents,
    lastSync,
    fetchEvents,
    handleGoogleAuth
  } = useDashboardCalendar();

  if (loading) {
    return <div className="flex justify-center items-center h-full">Caricamento...</div>;
  }

  return (
    <div className="container mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>
      
      {/* Statistiche principali */}
      <StatistichePrincipali pratiche={pratiche} />
      
      {/* Grid layout per task e calendario */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Task da completare */}
        <TaskList 
          currentTasks={currentTasks}
          taskFilter={taskFilter}
          setTaskFilter={setTaskFilter}
          currentTaskPage={currentTaskPage}
          totalTaskPages={totalTaskPages}
          handlePageChange={setCurrentTaskPage}
          handleToggleTask={handleToggleTask}
          onViewTaskDetails={(task) => setShowTaskDetails(task)}
        />
        
        {/* Calendario */}
        <DashboardCalendar 
          currentDate={currentDate}
          setCurrentDate={setCurrentDate}
          calendarView={calendarView}
          setCalendarView={setCalendarView}
          googleEvents={googleEvents}
          isAuthenticated={isAuthenticated}
          isLoadingEvents={isLoadingEvents}
          lastSync={lastSync}
          fetchEvents={fetchEvents}
          handleGoogleAuth={handleGoogleAuth}
          pendingTasks={pendingTasks}
        />
      </div>
      
      {/* Grafici */}
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
      
      {/* Scadenze imminenti */}
      <UpcomingDeadlines 
        deadlines={upcomingDeadlines}
        handleToggleTask={handleToggleTask}
        onViewTaskDetails={(task) => setShowTaskDetails(task)}
      />
      
      {/* Modale dettagli task */}
      {showTaskDetails && (
        <TaskDetails 
          task={showTaskDetails}
          onClose={() => setShowTaskDetails(null)}
          onComplete={handleToggleTask}
        />
      )}
      
      {/* Notifica task automatiche */}
      {showTaskNotification && (
        <TaskNotification 
          event={lastTaskEvent}
          onClose={() => setShowTaskNotification(false)}
        />
      )}
    </div>
  );
}

// Componente TaskDetails importato nel file index.js per semplicità
// In un'implementazione completa dovrebbe essere un file separato
function TaskDetails({ task, onClose, onComplete }) {
  // ... Implementazione taskDetails (da spostare in un file dedicato)
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-5 rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-lg font-semibold pr-4">{task.taskText}</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>
        
        {/* Contenuto del TaskDetails */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 mr-3 hover:bg-gray-100"
          >
            Chiudi
          </button>
          <button
            onClick={() => {
              onComplete(task.praticaId, task.stepId, task.taskIndex);
              onClose();
            }}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Completa
          </button>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
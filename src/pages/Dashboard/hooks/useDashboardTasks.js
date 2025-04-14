// src/pages/Dashboard/hooks/useDashboardTasks.js
import { useState, useEffect } from 'react';
import { isPast, isToday, addDays } from 'date-fns';

export function useDashboardTasks(pratiche, loading, updatePratica) {
  // Stati per task e filtri
  const [pendingTasks, setPendingTasks] = useState([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState([]);
  const [taskFilter, setTaskFilter] = useState('all');
  
  // Stati per paginazione
  const [currentTaskPage, setCurrentTaskPage] = useState(1);
  const tasksPerPage = 10;
  
  // Estrai tutte le task non completate dalle pratiche
  useEffect(() => {
    if (!loading) {
      const allTasks = [];
      
      pratiche.forEach(pratica => {
        if (pratica.workflow && pratica.workflow.inizioPratica && pratica.workflow.inizioPratica.tasks) {
          pratica.workflow.inizioPratica.tasks.forEach((task, index) => {
            if (!task.completed) {
              allTasks.push({
                praticaId: pratica.id,
                taskIndex: index,
                taskText: task.text,
                praticaIndirizzo: pratica.indirizzo,
                praticaCliente: pratica.cliente,
                createdDate: task.createdDate || pratica.dataInizio,
                dueDate: task.dueDate || null,
                priority: task.priority || 'normal',
                googleCalendarEventId: task.googleCalendarEventId || null,
                autoCreated: task.autoCreated || false,
                stepId: 'inizioPratica'
              });
            }
          });
        }
      });
      
      // Ordina le task non completate: prima quelle con scadenza (per data), poi quelle senza scadenza (per data creazione)
      const sortedTasks = allTasks.sort((a, b) => {
        // Se una ha scadenza e l'altra no
        if (a.dueDate && !b.dueDate) return -1;
        if (!a.dueDate && b.dueDate) return 1;
        
        // Se entrambe hanno scadenza, ordina per scadenza
        if (a.dueDate && b.dueDate) {
          return new Date(a.dueDate) - new Date(b.dueDate);
        }
        
        // Se nessuna ha scadenza, ordina per data creazione
        return new Date(a.createdDate) - new Date(b.createdDate);
      });
      
      setPendingTasks(sortedTasks);
      
      // Estrai le scadenze imminenti (prossimi 7 giorni)
      const today = new Date();
      const nextWeek = addDays(today, 7);
      const upcoming = sortedTasks
        .filter(task => task.dueDate && new Date(task.dueDate) <= nextWeek)
        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
      
      setUpcomingDeadlines(upcoming);
    }
  }, [pratiche, loading]);
  
  // Filtra le task in base al filtro selezionato
  const getFilteredTasks = () => {
    const today = new Date();
    const endOfToday = new Date(today);
    endOfToday.setHours(23, 59, 59, 999);
    
    const nextWeek = addDays(today, 7);
    
    switch (taskFilter) {
      case 'today':
        return pendingTasks.filter(task => 
          task.dueDate && isToday(new Date(task.dueDate))
        );
      case 'week':
        return pendingTasks.filter(task => 
          task.dueDate && new Date(task.dueDate) <= nextWeek && new Date(task.dueDate) >= today
        );
      case 'overdue':
        return pendingTasks.filter(task => 
          task.dueDate && isPast(new Date(task.dueDate)) && !isToday(new Date(task.dueDate))
        );
      case 'high':
        return pendingTasks.filter(task => task.priority === 'high');
      default:
        return pendingTasks;
    }
  };
  
  const filteredTasks = getFilteredTasks();
  
  // Calcola gli indici delle task da visualizzare nella pagina corrente
  const indexOfLastTask = currentTaskPage * tasksPerPage;
  const indexOfFirstTask = indexOfLastTask - tasksPerPage;
  const currentTasks = filteredTasks.slice(indexOfFirstTask, indexOfLastTask);
  const totalTaskPages = Math.ceil(filteredTasks.length / tasksPerPage);
  
  // Funzione per gestire il toggle di una task
  const handleToggleTask = async (praticaId, stepId, taskIndex) => {
    try {
      const pratica = pratiche.find(p => p.id === praticaId);
      if (!pratica || !pratica.workflow || !pratica.workflow[stepId]) return;
      
      // Clona il workflow per preparare l'aggiornamento
      const updatedWorkflow = JSON.parse(JSON.stringify(pratica.workflow));
      
      // Aggiorna lo stato di completamento della task
      updatedWorkflow[stepId].tasks[taskIndex].completed = true;
      updatedWorkflow[stepId].tasks[taskIndex].completedDate = new Date().toISOString();
      
      // Passa l'aggiornamento alla funzione di update del contesto
      if (updatePratica) {
        await updatePratica(praticaId, { workflow: updatedWorkflow });
      }
      
      // Aggiorna lo stato locale rimuovendo la task completata
      setPendingTasks(prevTasks => 
        prevTasks.filter(task => 
          !(task.praticaId === praticaId && task.taskIndex === taskIndex && task.stepId === stepId)
        )
      );
      
      // Aggiorna anche le scadenze imminenti
      setUpcomingDeadlines(prevDeadlines => 
        prevDeadlines.filter(task =>
          !(task.praticaId === praticaId && task.taskIndex === taskIndex && task.stepId === stepId)
        )
      );
    } catch (error) {
      console.error('Errore durante l\'aggiornamento della task:', error);
    }
  };

  return {
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
  };
}
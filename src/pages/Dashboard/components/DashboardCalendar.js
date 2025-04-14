// src/pages/Dashboard/components/DashboardCalendar.js
import React from 'react';
import { format, isSameMonth, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameDay } from 'date-fns';
import { it } from 'date-fns/locale';
import { FaChevronLeft, FaChevronRight, FaCalendarAlt, FaGoogle, FaSyncAlt } from 'react-icons/fa';
import { BsCalendarDay, BsCalendarMonth, BsCalendarWeek } from 'react-icons/bs';

function DashboardCalendar({ 
  currentDate, 
  setCurrentDate, 
  calendarView, 
  setCalendarView, 
  googleEvents, 
  isAuthenticated, 
  isLoadingEvents, 
  lastSync, 
  fetchEvents, 
  handleGoogleAuth,
  pendingTasks,
  navigatePrev,
  navigateNext,
  navigateToday
}) {
  // Funzioni di navigazione se non sono fornite
  const handlePrev = navigatePrev || (() => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() - 1);
    setCurrentDate(newDate);
  });

  const handleNext = navigateNext || (() => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + 1);
    setCurrentDate(newDate);
  });

  const handleToday = navigateToday || (() => {
    setCurrentDate(new Date());
  });

  // Renderizza vista mensile del calendario
  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = startOfWeek(monthStart, { locale: it });
    const endDate = endOfWeek(monthEnd, { locale: it });
    
    const dateFormat = 'd';
    const dayFormat = 'EEEEEE';
    const monthYearFormat = 'MMMM yyyy';
    
    const days = [];
    let day = startDate;
    
    // Intestazioni dei giorni della settimana
    const daysOfWeek = [];
    for (let i = 0; i < 7; i++) {
      daysOfWeek.push(
        <div key={`header-${i}`} className="text-center font-medium py-2 border-b">
          {format(addDays(startDate, i), dayFormat, { locale: it }).toUpperCase()}
        </div>
      );
    }

    // Celle dei giorni
    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const cloneDay = day;
        const dateString = format(cloneDay, 'yyyy-MM-dd');
        
        // Combina task, eventi e scadenze pratiche per la vista calendario
        const dayEvents = getEventsForDay(cloneDay);
        
        days.push(
          <div
            key={dateString}
            className={`min-h-16 border p-1 ${
              !isSameMonth(cloneDay, monthStart) ? 'bg-gray-100 text-gray-400' : 
              isSameDay(cloneDay, new Date()) ? 'bg-blue-50 border-blue-500' : ''
            }`}
          >
            <div className="flex justify-between items-center">
              <span className={`font-medium ${isSameDay(cloneDay, new Date()) ? 'text-blue-600' : ''}`}>
                {format(cloneDay, dateFormat)}
              </span>
              {dayEvents.length > 0 && (
                <span className="text-xs text-gray-500">{dayEvents.length}</span>
              )}
            </div>
            <div className="overflow-y-auto max-h-12">
              {dayEvents.slice(0, 2).map((event) => (
                <div 
                  key={event.id}
                  className="text-xs mt-1 p-1 rounded truncate cursor-pointer"
                  style={{ backgroundColor: event.color }}
                >
                  {format(new Date(event.start), 'HH:mm')} {event.title}
                </div>
              ))}
              {dayEvents.length > 2 && (
                <div className="text-xs text-center mt-1 text-gray-500">
                  +{dayEvents.length - 2} altri
                </div>
              )}
            </div>
          </div>
        );
        
        day = addDays(day, 1);
      }
    }

    return (
      <div>
        <div className="text-xl font-bold mb-4 text-center">
          {format(currentDate, monthYearFormat, { locale: it })}
        </div>
        <div className="grid grid-cols-7 gap-0">
          {daysOfWeek}
          {days}
        </div>
      </div>
    );
  };

  // Helper per ottenere gli eventi per un determinato giorno
  const getEventsForDay = (date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    
    // Task con scadenza in questo giorno
    const taskEvents = pendingTasks
      .filter(task => task.dueDate && format(new Date(task.dueDate), 'yyyy-MM-dd') === dateString)
      .map(task => ({
        id: `task-${task.praticaId}-${task.stepId}-${task.taskIndex}`,
        title: task.taskText,
        start: new Date(task.dueDate),
        color: task.priority === 'high' ? '#F97316' : // arancione per priorità alta
               task.priority === 'low' ? '#10B981' : // verde per priorità bassa
               '#3B82F6', // blu per priorità normale
        type: 'task',
        task
      }));
    
    // Eventi da Google Calendar
    const googleEventsForDay = googleEvents
      .filter(event => {
        const eventDate = event.start ? 
          new Date(event.start) : 
          null;
        return eventDate && format(eventDate, 'yyyy-MM-dd') === dateString;
      })
      .map(event => ({
        id: event.id,
        title: event.title || event.summary,
        start: event.start ? new Date(event.start) : new Date(),
        color: event.color || '#9CA3AF',
        type: 'google',
        googleEvent: event
      }));
    
    return [...taskEvents, ...googleEventsForDay];
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-2">
          <button 
            className="p-2 border border-gray-300 rounded-md hover:bg-gray-100"
            onClick={handlePrev}
          >
            <FaChevronLeft />
          </button>
          <button 
            className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
            onClick={handleToday}
          >
            Oggi
          </button>
          <button 
            className="p-2 border border-gray-300 rounded-md hover:bg-gray-100"
            onClick={handleNext}
          >
            <FaChevronRight />
          </button>
        </div>
        
        <div className="flex items-center space-x-1">
          <button 
            className={`p-2 rounded-md ${calendarView === 'day' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}
            onClick={() => setCalendarView('day')}
            title="Vista giornaliera"
          >
            <BsCalendarDay />
          </button>
          <button 
            className={`p-2 rounded-md ${calendarView === 'week' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}
            onClick={() => setCalendarView('week')}
            title="Vista settimanale"
          >
            <BsCalendarWeek />
          </button>
          <button 
            className={`p-2 rounded-md ${calendarView === 'month' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}
            onClick={() => setCalendarView('month')}
            title="Vista mensile"
          >
            <BsCalendarMonth />
          </button>
        </div>
        
        {!isAuthenticated ? (
          <button 
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
            onClick={handleGoogleAuth}
          >
            <FaGoogle className="mr-2" />
            <span className="hidden md:inline">Connetti Google Calendar</span>
            <span className="inline md:hidden">Calendar</span>
          </button>
        ) : (
          <button 
            className="p-2 border border-gray-300 rounded-md hover:bg-gray-100 text-gray-500"
            onClick={fetchEvents}
            disabled={isLoadingEvents}
            title="Sincronizza eventi"
          >
            <FaSyncAlt size={14} className={isLoadingEvents ? 'animate-spin' : ''} />
          </button>
        )}
      </div>
      
      <div className="p-4 overflow-x-auto h-64">
        {isLoadingEvents ? (
          <div className="flex justify-center items-center h-full">
            <FaSyncAlt size={20} className="text-blue-500 animate-spin mr-2" />
            <span>Caricamento eventi...</span>
          </div>
        ) : (
          renderMonthView()
        )}
      </div>
      
      {lastSync && (
        <div className="px-4 pb-2 text-xs text-gray-500 text-right">
          Ultimo aggiornamento: {format(lastSync, 'HH:mm', { locale: it })}
        </div>
      )}
    </div>
  );
}

export default DashboardCalendar;
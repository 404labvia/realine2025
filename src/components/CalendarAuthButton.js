import React, { useState, useEffect } from 'react';
import { FaGoogle, FaCalendarAlt, FaSignOutAlt } from 'react-icons/fa';
import enhancedAuthService from '../services/EnhancedAuthService';

const CalendarAuthButton = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Controlla lo stato di autenticazione all'avvio e ogni minuto
  useEffect(() => {
    const checkAuth = () => {
      const isAuth = enhancedAuthService.isCalendarAuthenticated();
      setIsAuthenticated(isAuth);
      
      if (isAuth) {
        const email = enhancedAuthService.getCalendarUserEmail();
        setUserEmail(email);
      } else {
        setUserEmail(null);
      }
    };
    
    // Controlla subito
    checkAuth();
    
    // Controlla ogni minuto
    const interval = setInterval(checkAuth, 60000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Gestisce l'autenticazione con Google Calendar
  const handleGoogleAuth = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await enhancedAuthService.authenticateCalendar('badalucco.g@gmail.com');
      
      if (result.success) {
        setIsAuthenticated(true);
        setUserEmail(result.user.email);
      } else {
        setError(result.error || 'Errore di autenticazione');
        console.error('Errore autenticazione Google Calendar:', result.error);
      }
    } catch (err) {
      setError('Si è verificato un errore durante l\'autenticazione');
      console.error('Errore:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Gestisce la disconnessione da Google Calendar
  const handleSignOut = () => {
    // Disconnette solo da Calendar, non dall'app
    enhancedAuthService.disconnectCalendar();
    setIsAuthenticated(false);
    setUserEmail(null);
  };
  
  if (isAuthenticated) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <div className="flex items-center text-green-600">
          <FaCalendarAlt className="mr-1" size={14} />
          <span>Connesso</span>
        </div>
      </div>
    );
  }
  
  return (
    <button
      onClick={handleGoogleAuth}
      disabled={isLoading}
      className={`flex items-center text-sm px-3 py-1 rounded-md bg-white border border-gray-300 hover:bg-gray-50
                  ${isLoading ? 'opacity-75 cursor-not-allowed' : ''}`}
    >
      {isLoading ? (
        <>
          <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Connessione...</span>
        </>
      ) : (
        <>
          <FaGoogle className="mr-2" size={14} />
          <span>Connetti Calendar</span>
        </>
      )}
    </button>
  );
};

export default CalendarAuthButton;
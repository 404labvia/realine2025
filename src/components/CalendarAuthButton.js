// src/components/CalendarAuthButton.js
import React, { useState, useEffect } from 'react';
import { FaGoogle, FaCalendarAlt, FaSignOutAlt } from 'react-icons/fa';
import enhancedAuthService from '../services/EnhancedAuthService';

const CalendarAuthButton = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Controlla lo stato di autenticazione all'avvio e ogni volta che il componente si monta
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Funzione per verificare lo stato di autenticazione
  const checkAuthStatus = () => {
    const isAuth = enhancedAuthService.isCalendarAuthenticated();
    setIsAuthenticated(isAuth);
    
    if (isAuth) {
      const email = enhancedAuthService.getCalendarUserEmail();
      setUserEmail(email);
    } else {
      setUserEmail(null);
    }
  };

  // Gestisce l'autenticazione con Google Calendar
  const handleGoogleAuth = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Avvia il processo di autenticazione per Google Calendar
      // Specificando l'account preferito
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
      <div className="flex items-center">
        <div className="mr-3 text-sm text-gray-600 hidden md:block">
          <FaCalendarAlt className="inline-block mr-1 text-green-600" />
          Connesso a Google Calendar: <span className="font-medium">{userEmail}</span>
        </div>
        <button 
          onClick={handleSignOut}
          className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-100 text-gray-700 text-sm flex items-center"
          title="Disconnetti da Google Calendar"
        >
          <FaSignOutAlt className="mr-1" size={12} />
          <span className="hidden md:inline">Disconnetti Calendar</span>
          <span className="inline md:hidden">Disconnetti</span>
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleGoogleAuth}
      disabled={isLoading}
      className={`px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center text-sm ${isLoading ? 'opacity-75 cursor-not-allowed' : ''}`}
    >
      {isLoading ? (
        <>
          <svg className="animate-spin h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Connessione...</span>
        </>
      ) : (
        <>
          <FaGoogle className="mr-1" size={12} />
          <span className="hidden md:inline">Connetti Google Calendar</span>
          <span className="inline md:hidden">Calendar</span>
        </>
      )}
    </button>
  );
};

export default CalendarAuthButton;
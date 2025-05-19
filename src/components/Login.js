// src/components/Login.js
import React, { useState, useEffect } from 'react';
import { FaGoogle } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase'; // Importa auth per controllare currentUser iniziale
import { useAuth } from '../contexts/AuthContext'; // Importa useAuth per signInWithGoogle e loading

function Login() {
  const [error, setError] = useState(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false); // Stato di caricamento specifico per il login
  const navigate = useNavigate();
  const { signInWithGoogle, loading: authLoading, currentUser } = useAuth();

  useEffect(() => {
    // Se l'utente è già loggato (controllo iniziale o dopo refresh) e auth non sta caricando,
    // naviga alla home.
    if (!authLoading && currentUser) {
      navigate('/');
    }
  }, [currentUser, authLoading, navigate]);

  const handleGoogleLogin = async () => {
    try {
      setIsLoggingIn(true);
      setError(null);
      const user = await signInWithGoogle();
      if (user) {
        navigate('/');
      } else {
        // Questo caso è meno probabile con signInWithPopup se non ci sono errori
        setError('Errore durante il login con Google.');
      }
    } catch (error) {
      console.error("Errore login con Google:", error);
      if (error.code === 'auth/popup-closed-by-user') {
        setError('Login con Google annullato dall\'utente.');
      } else if (error.code === 'auth/cancelled-popup-request') {
        setError('Richiesta di login multipla, annullata.');
      } else if (error.code === 'auth/popup-blocked') {
        setError('Il popup per il login con Google è stato bloccato dal browser. Abilita i popup per questo sito.');
      } else {
        setError('Si è verificato un errore durante il login con Google. Riprova.');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Se il context Auth sta ancora caricando lo stato iniziale dell'utente, mostra un loader
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
        <p className="ml-3 text-gray-700">Verifica autenticazione...</p>
      </div>
    );
  }

  // Se l'utente è già loggato (e non stiamo più caricando), non dovrebbe essere qui,
  // ma l'useEffect sopra dovrebbe aver già reindirizzato.
  // Questa pagina è solo per utenti non loggati.

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="Realine Studio Logo" className="h-24 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800">Realine Studio</h2>
          <p className="text-gray-600">Gestione Pratiche</p>
        </div>

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
            <p>{error}</p>
          </div>
        )}

        <div className="mt-6">
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded focus:outline-none focus:shadow-outline w-full flex items-center justify-center text-lg"
            disabled={isLoggingIn} // Disabilita il pulsante durante il tentativo di login
          >
            {isLoggingIn ? (
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <FaGoogle className="mr-3" />
            )}
            {isLoggingIn ? 'Accesso in corso...' : 'Accedi con Google'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Login;
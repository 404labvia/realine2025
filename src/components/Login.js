// src/components/Login.js
import React, { useState, useEffect } from 'react';
import { FaEnvelope, FaLock, FaSignInAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import enhancedAuthService from '../services/EnhancedAuthService';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Controlla se l'utente è già loggato all'avvio
  useEffect(() => {
    if (enhancedAuthService.isAppLoggedIn()) {
      navigate('/');
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Inserisci email e password');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const result = await enhancedAuthService.loginWithEmailPassword(email, password);
      
      if (result.success) {
        navigate('/');
      } else {
        setError(result.error || 'Errore durante il login. Controlla le credenziali.');
      }
    } catch (error) {
      console.error("Errore login:", error);
      setError('Si è verificato un errore durante il login. Riprova.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800">Realine Studio</h2>
          <p className="text-gray-600">Gestione Pratiche</p>
        </div>
        
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
            <p>{error}</p>
          </div>
        )}
        
        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
              Email
            </label>
            <div className="flex items-center border rounded-md">
              <div className="px-3 py-2 bg-gray-100 border-r">
                <FaEnvelope className="text-gray-500" />
              </div>
              <input
                id="email"
                type="email"
                className="w-full px-4 py-2 outline-none"
                placeholder="Inserisci la tua email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
              Password
            </label>
            <div className="flex items-center border rounded-md">
              <div className="px-3 py-2 bg-gray-100 border-r">
                <FaLock className="text-gray-500" />
              </div>
              <input
                id="password"
                type="password"
                className="w-full px-4 py-2 outline-none"
                placeholder="Inserisci la tua password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full flex items-center justify-center"
              disabled={loading}
            >
              {loading ? (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <FaSignInAlt className="mr-2" />
              )}
              {loading ? 'Accesso in corso...' : 'Accedi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;
// src/App.js
import React, { useState, useEffect } from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import { 
  FaHome, 
  FaFileAlt, 
  FaCalendarAlt, 
  FaPiggyBank, 
  FaRobot, 
  FaSignOutAlt 
} from 'react-icons/fa';

// Importa Provider e pagine
import { PraticheProvider } from './contexts/PraticheContext';
import Dashboard from './pages/Dashboard';
import PratichePage from './pages/PratichePage';
import CalendarPage from './pages/CalendarPage';
import PrezziarioPage from './pages/PrezziarioPage';
import AutomationConfigPage from './pages/AutomationConfigPage';
import LoginPage from './components/Login';

// Importa il servizio di autenticazione migliorato
import enhancedAuthService from './services/EnhancedAuthService';
// Importa il nuovo componente per l'autenticazione Google Calendar
import CalendarAuthButton from './components/CalendarAuthButton';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  useEffect(() => {
    // Controlla se l'utente è già loggato all'app
    const checkAuth = () => {
      const isLoggedIn = enhancedAuthService.isAppLoggedIn();
      if (isLoggedIn) {
        const appUser = enhancedAuthService.getAppUser();
        setUser(appUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    };
    
    checkAuth();
    
    // Aggiungi listener per cambiamenti nell'autenticazione
    const unsubscribe = enhancedAuthService.auth.onAuthStateChanged((currentUser) => {
      if (currentUser) {
        setUser({
          email: currentUser.email,
          uid: currentUser.uid
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);
  
  const handleSignOut = async () => {
    try {
      // Usa il servizio di autenticazione migliorato
      const result = await enhancedAuthService.logoutFromApp();
      if (!result.success) {
        console.error("Errore durante il logout:", result.error);
      }
    } catch (error) {
      console.error("Errore durante il logout:", error);
    }
  };
  
  // Schermata di caricamento
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        Caricamento...
      </div>
    );
  }
  
  // Pagina di login se non autenticato
  if (!user) {
    return <LoginPage />;
  }
  
  // Funzione per ottenere il titolo della pagina corrente
  const getPageTitle = () => {
    const path = window.location.pathname;
    
    const titles = {
      '/': 'Dashboard',
      '/pratiche': 'Gestione Pratiche',
      '/calendario': 'Calendario',
      '/prezziario': 'Prezziario',
      '/automazioni': 'Configurazione Automazioni'
    };
    
    return titles[path] || 'Studio App';
  };
  
  return (
    <PraticheProvider>
      <div className="flex h-screen bg-gray-100">
        {/* Sidebar */}
        <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-gray-800 text-white transition-all duration-300 ease-in-out overflow-y-auto`}>
          <div className="p-4 flex justify-between items-center">
            <h1 className={`text-xl font-bold ${sidebarOpen ? '' : 'hidden'}`}>Studio App</h1>
            <button 
              className="p-1 rounded-full hover:bg-gray-700"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={sidebarOpen ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"} />
              </svg>
            </button>
          </div>
          
          <nav className="mt-5">
            <NavLink 
              to="/" 
              className={({isActive}) => 
                `flex items-center py-3 px-4 ${isActive ? 'bg-gray-700' : 'hover:bg-gray-700'}`
              }
            >
              <FaHome className="w-5 h-5" />
              <span className={`ml-3 ${sidebarOpen ? '' : 'hidden'}`}>Dashboard</span>
            </NavLink>
            
            <NavLink 
              to="/pratiche" 
              className={({isActive}) => 
                `flex items-center py-3 px-4 ${isActive ? 'bg-gray-700' : 'hover:bg-gray-700'}`
              }
            >
              <FaFileAlt className="w-5 h-5" />
              <span className={`ml-3 ${sidebarOpen ? '' : 'hidden'}`}>Pratiche</span>
            </NavLink>
            
            <NavLink 
              to="/calendario" 
              className={({isActive}) => 
                `flex items-center py-3 px-4 ${isActive ? 'bg-gray-700' : 'hover:bg-gray-700'}`
              }
            >
              <FaCalendarAlt className="w-5 h-5" />
              <span className={`ml-3 ${sidebarOpen ? '' : 'hidden'}`}>Calendario</span>
            </NavLink>
            
            <NavLink 
              to="/prezziario" 
              className={({isActive}) => 
                `flex items-center py-3 px-4 ${isActive ? 'bg-gray-700' : 'hover:bg-gray-700'}`
              }
            >
              <FaPiggyBank className="w-5 h-5" />
              <span className={`ml-3 ${sidebarOpen ? '' : 'hidden'}`}>Prezziario</span>
            </NavLink>
            
            <NavLink 
              to="/automazioni" 
              className={({isActive}) => 
                `flex items-center py-3 px-4 ${isActive ? 'bg-gray-700' : 'hover:bg-gray-700'}`
              }
            >
              <FaRobot className="w-5 h-5" />
              <span className={`ml-3 ${sidebarOpen ? '' : 'hidden'}`}>Automazioni</span>
            </NavLink>
            
            <div className="border-t border-gray-700 mt-4 pt-4">
              <button 
                onClick={handleSignOut}
                className="flex items-center py-3 px-4 w-full text-left hover:bg-gray-700"
              >
                <FaSignOutAlt className="w-5 h-5" />
                <span className={`ml-3 ${sidebarOpen ? '' : 'hidden'}`}>Logout</span>
              </button>
            </div>
          </nav>
        </aside>
        
        {/* Contenuto principale */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Intestazione */}
          <header className="bg-white border-b p-4 flex items-center justify-between">
            <h1 className="text-xl font-semibold">{getPageTitle()}</h1>
            <div className="flex items-center space-x-3">
              {/* Componente di autenticazione Calendar */}
              <CalendarAuthButton />
              
              <div className="flex items-center space-x-1">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </div>
                {sidebarOpen && <span>{user?.email}</span>}
              </div>
            </div>
          </header>
          
          {/* Contenuto pagina */}
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-4">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/pratiche" element={<PratichePage />} />
              <Route path="/calendario" element={<CalendarPage />} />
              <Route path="/prezziario" element={<PrezziarioPage />} />
              <Route path="/automazioni" element={<AutomationConfigPage />} />
            </Routes>
          </main>
        </div>
      </div>
    </PraticheProvider>
  );
}

export default App;
// src/App.js
import React, { useState, useEffect } from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import { 
  MdHome, 
  MdDescription, 
  MdAttachMoney, 
  MdChevronLeft, 
  MdChevronRight, 
  MdFormatListBulleted, 
  MdLogout, 
  MdAccountCircle
} from 'react-icons/md';
import { FaCalendarAlt, FaRobot } from 'react-icons/fa';

// Importa Provider e pagine
import { PraticheProvider } from './contexts/PraticheContext';
import Dashboard from './pages/Dashboard';
import PratichePage from './pages/PratichePage';
import CalendarPage from './pages/CalendarPage';
import PrezziarioPage from './pages/PrezziarioPage';
import AutomationConfigPage from './pages/AutomationConfigPage';
import FinanzePage from './pages/FinanzePage';
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
      '/finanze': 'Gestione Finanziaria',
      '/automazioni': 'Configurazione Automazioni'
    };
    
    return titles[path] || 'Realine Studio';
  };
  
  return (
    <PraticheProvider>
      <div className="flex h-screen bg-gray-100">
        {/* Sidebar con stile Navbar precedente (sfondo chiaro) */}
        <aside className={`${sidebarOpen ? 'w-52' : 'w-16'} bg-white text-gray-800 transition-all duration-300 ease-in-out overflow-y-auto shadow-md`}>
          <div className="p-4 flex flex-col">
            <div className={`flex ${sidebarOpen ? 'justify-between' : 'justify-center'} w-full`}>
              {sidebarOpen ? (
                <div className="flex flex-col items-center w-full">
                  <img 
                    src="/logo.png" 
                    alt="Realine Studio Logo" 
                    className="h-20 mb-3" 
                  />
                  <h1 className="text-xl font-bold text-gray-800">Realine Studio</h1>
                  <p className="text-xs text-gray-500">Gestione Pratiche</p>
                </div>
              ) : (
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-800">R</div>
                </div>
              )}
              <button 
                className={`p-1 rounded-full hover:bg-gray-100 text-gray-600 ${sidebarOpen ? '' : 'mt-4'}`}
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                {sidebarOpen ? <MdChevronLeft size={20} /> : <MdChevronRight size={20} />}
              </button>
            </div>
          </div>
          
          <nav className="mt-6">
            <NavLink 
              to="/" 
              className={({isActive}) =>
                `flex items-center py-3 ${sidebarOpen ? 'px-6' : 'px-0 justify-center'} ${
                  isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
                }`
              }
            >
              <span className={sidebarOpen ? 'mr-3' : ''}>
                <MdHome className="h-5 w-5" />
              </span>
              {sidebarOpen && <span>Dashboard</span>}
            </NavLink>
            
            <NavLink 
              to="/pratiche" 
              className={({isActive}) =>
                `flex items-center py-3 ${sidebarOpen ? 'px-6' : 'px-0 justify-center'} ${
                  isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
                }`
              }
            >
              <span className={sidebarOpen ? 'mr-3' : ''}>
                <MdDescription className="h-5 w-5" />
              </span>
              {sidebarOpen && <span>Pratiche</span>}
            </NavLink>
            
            <NavLink 
              to="/finanze" 
              className={({isActive}) =>
                `flex items-center py-3 ${sidebarOpen ? 'px-6' : 'px-0 justify-center'} ${
                  isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
                }`
              }
            >
              <span className={sidebarOpen ? 'mr-3' : ''}>
                <MdAttachMoney className="h-5 w-5" />
              </span>
              {sidebarOpen && <span>Finanze</span>}
            </NavLink>
            
            <NavLink 
              to="/calendario" 
              className={({isActive}) =>
                `flex items-center py-3 ${sidebarOpen ? 'px-6' : 'px-0 justify-center'} ${
                  isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
                }`
              }
            >
              <span className={sidebarOpen ? 'mr-3' : ''}>
                <FaCalendarAlt className="h-5 w-5" />
              </span>
              {sidebarOpen && <span>Calendario</span>}
            </NavLink>
            
            <NavLink 
              to="/prezziario" 
              className={({isActive}) =>
                `flex items-center py-3 ${sidebarOpen ? 'px-6' : 'px-0 justify-center'} ${
                  isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
                }`
              }
            >
              <span className={sidebarOpen ? 'mr-3' : ''}>
                <MdFormatListBulleted className="h-5 w-5" />
              </span>
              {sidebarOpen && <span>Prezziario</span>}
            </NavLink>
            
            <NavLink 
              to="/automazioni" 
              className={({isActive}) =>
                `flex items-center py-3 ${sidebarOpen ? 'px-6' : 'px-0 justify-center'} ${
                  isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
                }`
              }
            >
              <span className={sidebarOpen ? 'mr-3' : ''}>
                <FaRobot className="h-5 w-5" />
              </span>
              {sidebarOpen && <span>Automazioni</span>}
            </NavLink>
          </nav>
          
          {/* Sezione utente e logout */}
          {user && (
            <div className={`mt-auto mb-6 ${sidebarOpen ? 'px-4' : 'px-0 text-center'}`}>
              {sidebarOpen ? (
                <div className="p-3 bg-gray-100 rounded-md">
                  <div className="flex items-center mb-2">
                    <MdAccountCircle className="h-6 w-6 text-gray-600 mr-2" />
                    <span className="text-sm text-gray-700 truncate">
                      {user.email}
                    </span>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center justify-center w-full py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    <MdLogout className="h-4 w-4 mr-1" />
                    <span className="text-sm">Logout</span>
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <MdAccountCircle className="h-8 w-8 text-gray-600 mb-2" />
                  <button
                    onClick={handleSignOut}
                    className="p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                    title="Logout"
                  >
                    <MdLogout className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          )}
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
                <span>{user?.email}</span>
              </div>
            </div>
          </header>
          
          {/* Contenuto pagina */}
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-4">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/pratiche" element={<PratichePage />} />
              <Route path="/finanze" element={<FinanzePage />} />
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
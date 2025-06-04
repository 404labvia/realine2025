// src/App.js
import React, { useState, useEffect } from 'react';
import { Routes, Route, NavLink, useLocation } from 'react-router-dom';
import {
  MdHome,
  MdDescription,
  MdAttachMoney,
  MdChevronLeft,
  MdChevronRight,
  MdFormatListBulleted,
  MdLogout,
  MdAccountCircle,
  MdFolderSpecial,
  MdFolderOpen,
} from 'react-icons/md';
import { FaCalendarAlt, FaRobot } from 'react-icons/fa';

import { AuthProvider } from './contexts/AuthContext';
import { PraticheProvider } from './contexts/PraticheContext';
import { PratichePrivatoProvider } from './contexts/PratichePrivatoContext'; // Assicurati che questo import sia corretto
import { AccessoAttiProvider } from './pages/AccessiAgliAttiPage/contexts/AccessoAttiContext';

import Dashboard from './pages/Dashboard';
import AccessiAgliAttiPage from './pages/AccessiAgliAttiPage';
import PratichePage from './pages/PratichePage';
import PratichePrivatoPage from './pages/PratichePrivatoPage';
import CalendarPage from './pages/CalendarPage';
import PrezziarioPage from './pages/PrezziarioPage';
import AutomationConfigPage from './pages/AutomationConfigPage';
import FinanzePage from './pages/FinanzePage';
import LoginPage from './components/Login';

import { auth, onAuthStateChanged, logoutUser as firebaseLogoutUser } from './firebase';

function AppContent() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          email: firebaseUser.email,
          uid: firebaseUser.uid
        });
      } else {
        setUser(null);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await firebaseLogoutUser();
      // La navigazione alla pagina di login dovrebbe avvenire automaticamente
      // a causa del cambio di stato di 'user' che renderizzerà <LoginPage />
    } catch (error) {
      console.error("Errore durante il logout:", error);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
        <p className="ml-3 text-gray-700">Verifica autenticazione...</p>
      </div>
    );
  }

  if (!user) {
    // Se non c'è utente, renderizza solo la pagina di Login.
    // Non c'è bisogno di Routes qui se Login gestisce la sua logica e reindirizzamento.
    return <LoginPage />;
  }

  const getPageTitle = () => {
    const path = location.pathname;
    const titles = {
      '/': 'Dashboard',
      '/accessi-atti': 'Gestione Accessi agli Atti',
      '/pratiche': 'Gestione Pratiche',
      '/pratiche-privato': 'Gestione Pratiche Privato',
      '/calendario': 'Calendario',
      '/prezziario': 'Prezziario',
      '/finanze': 'Gestione Finanziaria',
      '/automazioni': 'Configurazione Automazioni'
    };
    return titles[path] || 'Realine Studio';
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <aside className={`${sidebarOpen ? 'w-52' : 'w-16'} bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 transition-all duration-300 ease-in-out overflow-y-auto shadow-lg flex flex-col justify-between`}>
        <div>
          <div className="p-4 flex flex-col">
            <div className={`flex ${sidebarOpen ? 'justify-between' : 'justify-center'} w-full items-center`}>
              {sidebarOpen ? (
                <div className="flex flex-col items-center w-full">
                  <img src="/logo.png" alt="Realine Studio Logo" className="h-20 mb-3"/>
                  <h1 className="text-xl font-bold text-gray-800 dark:text-white">Realine Studio</h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Gestione Pratiche</p>
                </div>
              ) : (
                <img src="/favicon.ico" alt="R" className="h-8 w-8 mx-auto" /> // Usa favicon quando collassata
              )}
              <button
                className={`p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 ${!sidebarOpen && 'mt-4 fixed left-14 top-3 z-50 bg-white dark:bg-gray-800 shadow-md'}`}
                onClick={() => setSidebarOpen(!sidebarOpen)}
                aria-label={sidebarOpen ? "Collassa sidebar" : "Espandi sidebar"}
              >
                {sidebarOpen ? <MdChevronLeft size={20} /> : <MdChevronRight size={20} />}
              </button>
            </div>
          </div>
          <nav className="mt-6">
            {[
              { to: "/", label: "Dashboard", icon: MdHome },
              { to: "/accessi-atti", label: "Accessi Atti", icon: MdFolderOpen },
              { to: "/pratiche", label: "Pratiche", icon: MdDescription },
              { to: "/pratiche-privato", label: "Pratiche Privato", icon: MdFolderSpecial },
              { to: "/finanze", label: "Finanze", icon: MdAttachMoney },
              { to: "/calendario", label: "Calendario", icon: FaCalendarAlt },
              { to: "/prezziario", label: "Prezziario", icon: MdFormatListBulleted },
              { to: "/automazioni", label: "Automazioni", icon: FaRobot },
            ].map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({isActive}) => `flex items-center py-3 transition-colors duration-150 ${sidebarOpen ? 'px-6' : 'px-0 justify-center'} ${ isActive ? 'bg-blue-50 dark:bg-blue-700/30 text-blue-600 dark:text-blue-400 border-r-2 border-blue-600 dark:border-blue-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700' }`}
                title={!sidebarOpen ? item.label : ""}
              >
                <span className={sidebarOpen ? 'mr-3' : ''}><item.icon className="h-5 w-5" /></span>
                {sidebarOpen && <span>{item.label}</span>}
              </NavLink>
            ))}
          </nav>
        </div>
        {user && (
          <div className={`mb-6 ${sidebarOpen ? 'px-4' : 'px-0 text-center'}`}>
            {sidebarOpen ? (
              <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-md">
                <div className="flex items-center mb-2">
                  <MdAccountCircle className="h-6 w-6 text-gray-600 dark:text-gray-300 mr-2" />
                  <span className="text-sm text-gray-700 dark:text-gray-200 truncate">{user.email}</span>
                </div>
                <button onClick={handleSignOut} className="flex items-center justify-center w-full py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm">
                  <MdLogout className="h-4 w-4 mr-1.5" />
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <button onClick={handleSignOut} className="p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors" title={`Logout (${user.email})`}>
                  <MdLogout className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>
        )}
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 p-4 flex items-center justify-between shadow-sm">
          <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100">{getPageTitle()}</h1>
          {/* Qui puoi aggiungere altri elementi dell'header se necessario */}
        </header>
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-900 p-4">
          <Routes>
            <Route
              path="/"
              element={
                <PraticheProvider>
                  <PratichePrivatoProvider> {/* PROVIDER AGGIUNTO */}
                    <Dashboard />
                  </PratichePrivatoProvider>
                </PraticheProvider>
              }
            />
            <Route
              path="/accessi-atti"
              element={
                <AccessoAttiProvider>
                  <AccessiAgliAttiPage />
                </AccessoAttiProvider>
              }
            />
            <Route
              path="/pratiche"
              element={
                <PraticheProvider>
                  <PratichePrivatoProvider>
                    <PratichePage />
                  </PratichePrivatoProvider>
                </PraticheProvider>
              }
            />
            <Route
              path="/pratiche-privato"
              element={
                <PratichePrivatoProvider>
                  <PratichePrivatoPage />
                </PratichePrivatoProvider>
              }
            />
            <Route path="/finanze" element={
              <PraticheProvider>
                {/* Se FinanzePage necessita anche di PratichePrivatoContext, aggiungilo qui */}
                <PratichePrivatoProvider>
                  <FinanzePage />
                </PratichePrivatoProvider>
              </PraticheProvider>
            } />
            <Route
              path="/calendario"
              element={
                <PraticheProvider>
                  <PratichePrivatoProvider>
                    <CalendarPage />
                  </PratichePrivatoProvider>
                </PraticheProvider>
              }
            />
            <Route path="/prezziario" element={<PrezziarioPage />} />
            <Route path="/automazioni" element={<AutomationConfigPage />} />
            {/* Aggiungi altre rotte protette qui */}
          </Routes>
        </main>
      </div>
    </div>
  );
}

function App() {
  // AuthProvider è già qui, il che è corretto
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
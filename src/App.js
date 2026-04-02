// src/App.js
import React, { useState, useEffect } from 'react';
import { Routes, Route, NavLink, useLocation } from 'react-router-dom';
import {
  MdHome,
  MdDescription,
  MdAttachMoney,
  MdChevronLeft,
  MdChevronRight,
  MdLogout,
  MdAccountCircle,
  MdFolderSpecial,
  MdFolderOpen,
  MdBolt,
  MdViewColumn,
  MdNoteAdd,
  MdExpandMore,
  MdExpandLess,
  MdPeople,
} from 'react-icons/md';
import { FaCalendarAlt } from 'react-icons/fa';

import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { PraticheProvider } from './contexts/PraticheContext';
import { PratichePrivatoProvider } from './contexts/PratichePrivatoContext';
import { AccessoAttiProvider } from './pages/AccessiAgliAttiPage/contexts/AccessoAttiContext';
import { ApeProvider } from './pages/ApePage/contexts/ApeContext';
import ThemeToggle from './components/ThemeToggle';

import Dashboard from './pages/Dashboard';
import AccessiAgliAttiPage from './pages/AccessiAgliAttiPage';
import ApePage from './pages/ApePage';
import PratichePage from './pages/PratichePage';
import PraticheBoardPage from './pages/PraticheBoardPage';
import PratichePrivatoPage from './pages/PratichePrivatoPage';
import CalendarTaskPage from './pages/CalendarTaskPage';
import FinanzePage from './pages/FinanzePage';
import GeneraIncaricoPage from './pages/GeneraIncaricoPage';
import LoginPage from './components/Login';

import { auth, onAuthStateChanged, logoutUser as firebaseLogoutUser } from './firebase';

function AppContent() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [generaDocumentiOpen, setGeneraDocumentiOpen] = useState(false);
  const location = useLocation();

  // Espandi automaticamente il menu se siamo su una pagina di generazione documenti
  useEffect(() => {
    if (location.pathname.startsWith('/genera-')) {
      setGeneraDocumentiOpen(true);
    }
  }, [location.pathname]);

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
    return <LoginPage />;
  }

  const getPageTitle = () => {
    const path = location.pathname;
    const titles = {
      '/': 'Dashboard',
      '/accessi-atti': 'Gestione Accessi agli Atti',
      '/ape': 'Gestione APE - Attestati di Prestazione Energetica',
      '/pratiche': 'Gestione Pratiche',
      '/pratiche-board': 'Gestione Pratiche - Vista Board',
      '/pratiche-privato': 'Gestione Pratiche Privato',
      '/calendario': 'Calendario & Task',
      '/finanze': 'Gestione Finanziaria',
      '/genera-incarico-committente': 'Genera Incarico Committente',
      '/genera-incarico-collaboratore': 'Genera Incarico Collaboratore'
    };
    return titles[path] || 'Realine Studio';
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-dark-bg transition-colors duration-200">
      <aside className={`${sidebarOpen ? 'w-52' : 'w-16'} bg-white dark:bg-dark-surface text-gray-800 dark:text-dark-text-primary transition-all duration-300 ease-in-out overflow-y-auto shadow-lg flex flex-col justify-between`}>
        <div>
          <div className="p-4 flex flex-col">
            <div className={`flex ${sidebarOpen ? 'justify-between' : 'justify-center'} w-full items-center`}>
              {sidebarOpen ? (
                <div className="flex flex-col items-center w-full">
                  <img src="/logo.png" alt="Realine Studio Logo" className="h-20 mb-3"/>
                  <h1 className="text-xl font-bold text-gray-800 dark:text-dark-text-primary">Realine Studio</h1>
                  <p className="text-xs text-gray-500 dark:text-dark-text-muted">Gestione Pratiche</p>
                </div>
              ) : (
                <img src="/favicon.ico" alt="R" className="h-8 w-8 mx-auto" />
              )}
              <button
                className={`p-1 rounded-full hover:bg-gray-100 dark:hover:bg-dark-hover text-gray-600 dark:text-dark-text-secondary ${!sidebarOpen && 'mt-4 fixed left-14 top-3 z-50 bg-white dark:bg-dark-surface shadow-md'}`}
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
              { to: "/ape", label: "APE", icon: MdBolt },
              { to: "/pratiche", label: "Pratiche", icon: MdDescription },
              { to: "/pratiche-board", label: "Pratiche Board", icon: MdViewColumn },
              { to: "/pratiche-privato", label: "Pratiche Privato", icon: MdFolderSpecial },
              { to: "/finanze", label: "Finanze", icon: MdAttachMoney },
              { to: "/calendario", label: "Calendario", icon: FaCalendarAlt },
            ].map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({isActive}) => `flex items-center py-3 transition-colors duration-150 ${sidebarOpen ? 'px-6' : 'px-0 justify-center'} ${ isActive ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-r-2 border-blue-600 dark:border-blue-400' : 'text-gray-600 dark:text-dark-text-secondary hover:bg-gray-100 dark:hover:bg-dark-hover' }`}
                title={!sidebarOpen ? item.label : ""}
              >
                <span className={sidebarOpen ? 'mr-3' : ''}><item.icon className="h-5 w-5" /></span>
                {sidebarOpen && <span>{item.label}</span>}
              </NavLink>
            ))}

            {/* Separatore e Genera Documenti (menu espandibile) */}
            <div className="my-2 mx-4 border-t border-gray-200 dark:border-dark-border"></div>

            {/* Header menu espandibile */}
            <button
              onClick={() => sidebarOpen && setGeneraDocumentiOpen(!generaDocumentiOpen)}
              className={`w-full flex items-center py-3 transition-colors duration-150 ${sidebarOpen ? 'px-6' : 'px-0 justify-center'} ${
                location.pathname.startsWith('/genera-')
                  ? 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                  : 'text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20'
              }`}
              title={!sidebarOpen ? "Genera Documenti" : ""}
            >
              <span className={sidebarOpen ? 'mr-3' : ''}><MdNoteAdd className="h-5 w-5" /></span>
              {sidebarOpen && (
                <>
                  <span className="font-medium flex-1 text-left">Genera Documenti</span>
                  {generaDocumentiOpen ? <MdExpandLess className="h-5 w-5" /> : <MdExpandMore className="h-5 w-5" />}
                </>
              )}
            </button>

            {/* Sub-menu items */}
            {sidebarOpen && generaDocumentiOpen && (
              <div className="bg-gray-50 dark:bg-dark-hover">
                <NavLink
                  to="/genera-incarico-committente"
                  className={({isActive}) => `flex items-center py-2.5 pl-12 pr-6 text-sm transition-colors duration-150 ${
                    isActive
                      ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 border-r-2 border-green-600'
                      : 'text-gray-600 dark:text-dark-text-secondary hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-600 dark:hover:text-green-400'
                  }`}
                >
                  <MdNoteAdd className="h-4 w-4 mr-2" />
                  Incarico Committente
                </NavLink>
                <NavLink
                  to="/genera-incarico-collaboratore"
                  className={({isActive}) => `flex items-center py-2.5 pl-12 pr-6 text-sm transition-colors duration-150 ${
                    isActive
                      ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 border-r-2 border-green-600'
                      : 'text-gray-600 dark:text-dark-text-secondary hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-600 dark:hover:text-green-400'
                  }`}
                >
                  <MdPeople className="h-4 w-4 mr-2" />
                  Incarico Collaboratore
                </NavLink>
              </div>
            )}
          </nav>
        </div>
        {user && (
          <div className={`mb-6 ${sidebarOpen ? 'px-4' : 'px-0 text-center'}`}>
            {sidebarOpen ? (
              <div className="p-3 bg-gray-100 dark:bg-dark-hover rounded-md">
                <div className="flex items-center mb-2">
                  <MdAccountCircle className="h-6 w-6 text-gray-600 dark:text-dark-text-secondary mr-2" />
                  <span className="text-sm text-gray-700 dark:text-dark-text-secondary truncate">{user.email}</span>
                </div>
                <button onClick={handleSignOut} className="flex items-center justify-center w-full py-1.5 bg-blue-600 dark:bg-blue-700 text-white rounded hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors text-sm">
                  <MdLogout className="h-4 w-4 mr-1.5" />
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <button onClick={handleSignOut} className="p-2 rounded-full bg-blue-600 dark:bg-blue-700 text-white hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors" title={`Logout (${user.email})`}>
                  <MdLogout className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>
        )}
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white dark:bg-dark-surface border-b dark:border-dark-border p-4 flex items-center justify-between shadow-sm transition-colors duration-200">
          <h1 className="text-xl font-semibold text-gray-800 dark:text-dark-text-primary">{getPageTitle()}</h1>
          <ThemeToggle />
        </header>
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-dark-bg p-4 transition-colors duration-200">
          <Routes>
            <Route
              path="/"
              element={
                <PraticheProvider>
                  <PratichePrivatoProvider>
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
              path="/ape"
              element={
                <ApeProvider>
                  <ApePage />
                </ApeProvider>
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
              path="/pratiche-board"
              element={
                <PraticheProvider>
                  <PratichePrivatoProvider>
                    <AccessoAttiProvider>
                      <PraticheBoardPage />
                    </AccessoAttiProvider>
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
                    <CalendarTaskPage />
                  </PratichePrivatoProvider>
                </PraticheProvider>
              }
            />
            <Route
              path="/genera-incarico-committente"
              element={
                <PraticheProvider>
                  <PratichePrivatoProvider>
                    <GeneraIncaricoPage />
                  </PratichePrivatoProvider>
                </PraticheProvider>
              }
            />
            <Route
              path="/genera-incarico-collaboratore"
              element={
                <PratichePrivatoProvider>
                  <div className="flex items-center justify-center h-64">
                    <p className="text-gray-500 dark:text-dark-text-secondary">
                      Incarico Collaboratore - In sviluppo
                    </p>
                  </div>
                </PratichePrivatoProvider>
              }
            />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
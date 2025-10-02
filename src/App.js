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
  MdBolt,
  MdViewColumn,
} from 'react-icons/md';
import { FaCalendarAlt, FaRobot } from 'react-icons/fa';

import { AuthProvider } from './contexts/AuthContext';
import { PraticheProvider } from './contexts/PraticheContext';
import { PratichePrivatoProvider } from './contexts/PratichePrivatoContext';
import { AccessoAttiProvider } from './pages/AccessiAgliAttiPage/contexts/AccessoAttiContext';
import { ApeProvider } from './pages/ApePage/contexts/ApeContext';

import Dashboard from './pages/Dashboard';
import AccessiAgliAttiPage from './pages/AccessiAgliAttiPage';
import ApePage from './pages/ApePage';
import PratichePage from './pages/PratichePage';
import PraticheBoardPage from './pages/PraticheBoardPage';
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
      '/calendario': 'Calendario',
      '/prezziario': 'Prezziario',
      '/finanze': 'Gestione Finanziaria',
      '/automazioni': 'Configurazione Automazioni'
    };
    return titles[path] || 'Realine Studio';
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <aside className={`${sidebarOpen ? 'w-52' : 'w-16'} bg-white text-gray-800 transition-all duration-300 ease-in-out overflow-y-auto shadow-lg flex flex-col justify-between`}>
        <div>
          <div className="p-4 flex flex-col">
            <div className={`flex ${sidebarOpen ? 'justify-between' : 'justify-center'} w-full items-center`}>
              {sidebarOpen ? (
                <div className="flex flex-col items-center w-full">
                  <img src="/logo.png" alt="Realine Studio Logo" className="h-20 mb-3"/>
                  <h1 className="text-xl font-bold text-gray-800">Realine Studio</h1>
                  <p className="text-xs text-gray-500">Gestione Pratiche</p>
                </div>
              ) : (
                <img src="/favicon.ico" alt="R" className="h-8 w-8 mx-auto" />
              )}
              <button
                className={`p-1 rounded-full hover:bg-gray-100 text-gray-600 ${!sidebarOpen && 'mt-4 fixed left-14 top-3 z-50 bg-white shadow-md'}`}
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
              { to: "/prezziario", label: "Prezziario", icon: MdFormatListBulleted },
              { to: "/automazioni", label: "Automazioni", icon: FaRobot },
            ].map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({isActive}) => `flex items-center py-3 transition-colors duration-150 ${sidebarOpen ? 'px-6' : 'px-0 justify-center'} ${ isActive ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600' : 'text-gray-600 hover:bg-gray-100' }`}
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
              <div className="p-3 bg-gray-100 rounded-md">
                <div className="flex items-center mb-2">
                  <MdAccountCircle className="h-6 w-6 text-gray-600 mr-2" />
                  <span className="text-sm text-gray-700 truncate">{user.email}</span>
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
        <header className="bg-white border-b p-4 flex items-center justify-between shadow-sm">
          <h1 className="text-xl font-semibold text-gray-800">{getPageTitle()}</h1>
        </header>
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-4">
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
                    <PraticheBoardPage />
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
                    <CalendarPage />
                  </PratichePrivatoProvider>
                </PraticheProvider>
              }
            />
            <Route path="/prezziario" element={<PrezziarioPage />} />
            <Route path="/automazioni" element={<AutomationConfigPage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
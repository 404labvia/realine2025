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
  MdAccountCircle,
  MdFolderSpecial
} from 'react-icons/md';
import { FaCalendarAlt, FaRobot } from 'react-icons/fa';

import { AuthProvider } from './contexts/AuthContext';
import { PraticheProvider } from './contexts/PraticheContext';
import { PratichePrivatoProvider } from './contexts/PratichePrivatoContext'; // Importato

import Dashboard from './pages/Dashboard';
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
    const path = window.location.pathname;
    const titles = {
      '/': 'Dashboard',
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
    <PraticheProvider>
      <div className="flex h-screen bg-gray-100">
        <aside className={`${sidebarOpen ? 'w-52' : 'w-16'} bg-white text-gray-800 transition-all duration-300 ease-in-out overflow-y-auto shadow-md flex flex-col justify-between`}>
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
                <button className={`p-1 rounded-full hover:bg-gray-100 text-gray-600 ${!sidebarOpen && 'mt-4'}`} onClick={() => setSidebarOpen(!sidebarOpen)}>
                  {sidebarOpen ? <MdChevronLeft size={20} /> : <MdChevronRight size={20} />}
                </button>
              </div>
            </div>
            <nav className="mt-6">
              <NavLink to="/" className={({isActive}) => `flex items-center py-3 ${sidebarOpen ? 'px-6' : 'px-0 justify-center'} ${ isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100' }`}>
                <span className={sidebarOpen ? 'mr-3' : ''} title={!sidebarOpen ? "Dashboard" : ""}><MdHome className="h-5 w-5" /></span>
                {sidebarOpen && <span>Dashboard</span>}
              </NavLink>
              <NavLink to="/pratiche" className={({isActive}) => `flex items-center py-3 ${sidebarOpen ? 'px-6' : 'px-0 justify-center'} ${ isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100' }`}>
                <span className={sidebarOpen ? 'mr-3' : ''} title={!sidebarOpen ? "Pratiche" : ""}><MdDescription className="h-5 w-5" /></span>
                {sidebarOpen && <span>Pratiche</span>}
              </NavLink>
              <NavLink to="/pratiche-privato" className={({isActive}) => `flex items-center py-3 ${sidebarOpen ? 'px-6' : 'px-0 justify-center'} ${ isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100' }`}>
                <span className={sidebarOpen ? 'mr-3' : ''} title={!sidebarOpen ? "Pratiche Privato" : ""}><MdFolderSpecial className="h-5 w-5" /></span>
                {sidebarOpen && <span>Pratiche Privato</span>}
              </NavLink>
              <NavLink to="/finanze" className={({isActive}) => `flex items-center py-3 ${sidebarOpen ? 'px-6' : 'px-0 justify-center'} ${ isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100' }`}>
                <span className={sidebarOpen ? 'mr-3' : ''} title={!sidebarOpen ? "Finanze" : ""}><MdAttachMoney className="h-5 w-5" /></span>
                {sidebarOpen && <span>Finanze</span>}
              </NavLink>
              <NavLink to="/calendario" className={({isActive}) => `flex items-center py-3 ${sidebarOpen ? 'px-6' : 'px-0 justify-center'} ${ isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100' }`}>
                <span className={sidebarOpen ? 'mr-3' : ''} title={!sidebarOpen ? "Calendario" : ""}><FaCalendarAlt className="h-5 w-5" /></span>
                {sidebarOpen && <span>Calendario</span>}
              </NavLink>
              <NavLink to="/prezziario" className={({isActive}) => `flex items-center py-3 ${sidebarOpen ? 'px-6' : 'px-0 justify-center'} ${ isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100' }`}>
                <span className={sidebarOpen ? 'mr-3' : ''} title={!sidebarOpen ? "Prezziario" : ""}><MdFormatListBulleted className="h-5 w-5" /></span>
                {sidebarOpen && <span>Prezziario</span>}
              </NavLink>
              <NavLink to="/automazioni" className={({isActive}) => `flex items-center py-3 ${sidebarOpen ? 'px-6' : 'px-0 justify-center'} ${ isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100' }`}>
                <span className={sidebarOpen ? 'mr-3' : ''} title={!sidebarOpen ? "Automazioni" : ""}><FaRobot className="h-5 w-5" /></span>
                {sidebarOpen && <span>Automazioni</span>}
              </NavLink>
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
                  <button onClick={handleSignOut} className="flex items-center justify-center w-full py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
                    <MdLogout className="h-4 w-4 mr-1" />
                    <span className="text-sm">Logout</span>
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
          <header className="bg-white border-b p-4 flex items-center justify-between">
            <h1 className="text-xl font-semibold">{getPageTitle()}</h1>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-semibold">
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </div>
                <span className="hidden sm:inline text-sm text-gray-700">{user?.email}</span>
              </div>
            </div>
          </header>
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-4">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              {/* MODIFICATO: Avvolgi PratichePage con PratichePrivatoProvider */}
              <Route
                path="/pratiche"
                element={
                  <PratichePrivatoProvider>
                    <PratichePage />
                  </PratichePrivatoProvider>
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
              <Route path="/finanze" element={<FinanzePage />} />
              <Route
                path="/calendario"
                element={
                  <PratichePrivatoProvider>
                    <CalendarPage />
                  </PratichePrivatoProvider>
                }
              />
              <Route path="/prezziario" element={<PrezziarioPage />} />
              <Route path="/automazioni" element={<AutomationConfigPage />} />
            </Routes>
          </main>
        </div>
      </div>
    </PraticheProvider>
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
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import PratichePage from './pages/PratichePage';
import FinanzePage from './pages/FinanzePage';
import PrezziarioPage from './pages/PrezziarioPage';
import CalendarPage from './pages/CalendarPage'; // Nuovo import per il calendario
import Navbar from './components/Navbar';
import { PraticheProvider } from './contexts/PraticheContext';

function App() {
  return (
    <PraticheProvider>
      <div className="flex h-screen bg-gray-50">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-5">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/pratiche" element={<PratichePage />} />
            <Route path="/finanze" element={<FinanzePage />} />
            <Route path="/prezziario" element={<PrezziarioPage />} />
            <Route path="/calendario" element={<CalendarPage />} /> {/* Nuova route per il calendario di prova */}
          </Routes>
        </main>
      </div>
    </PraticheProvider>
  );
}

export default App;
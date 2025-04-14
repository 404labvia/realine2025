// src/components/PrivateRoute.js
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function PrivateRoute() {
  const { currentUser, loading } = useAuth();

  // Se l'autenticazione è ancora in caricamento, mostra un loader
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Reindirizza al login se non autenticato, altrimenti mostra il componente
  return currentUser ? <Outlet /> : <Navigate to="/login" />;
}

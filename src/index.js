import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // Il tuo CSS globale
import App from './App';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext'; // Il tuo context per Firebase Auth

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <Router>
      <AuthProvider> {/* Il tuo AuthProvider per Firebase */}
        <App />
      </AuthProvider>
    </Router>
  </React.StrictMode>
);
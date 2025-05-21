import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // Il tuo CSS globale
import App from './App';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext'; // Il tuo context per Firebase Auth
import { GoogleOAuthProvider } from '@react-oauth/google'; // NUOVO

const root = ReactDOM.createRoot(document.getElementById('root'));

// Sostituisci "IL_TUO_ID_CLIENT_GOOGLE_API" con l'ID Client che hai ottenuto dalla Google Cloud Console
const GOOGLE_CLIENT_ID = "956807791511-4l7d0pcs2u4gabn1320cjjrcf9hnv7i1.apps.googleusercontent.com";

root.render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}> {/* NUOVO WRAPPER */}
      <Router>
        <AuthProvider> {/* Il tuo AuthProvider per Firebase */}
          <App />
        </AuthProvider>
      </Router>
    </GoogleOAuthProvider> {/* FINE NUOVO WRAPPER */}
  </React.StrictMode>
);
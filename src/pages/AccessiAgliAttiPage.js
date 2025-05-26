// src/pages/AccessiAgliAttiPage.js
import React from 'react';
import { AccessoAttiProvider } from './AccessiAgliAttiPage/contexts/AccessoAttiContext';
import AccessiAgliAttiPageContent from './AccessiAgliAttiPage/index';

function AccessiAgliAttiPage() {
  return (
    <AccessoAttiProvider>
      <AccessiAgliAttiPageContent />
    </AccessoAttiProvider>
  );
}

export default AccessiAgliAttiPage;
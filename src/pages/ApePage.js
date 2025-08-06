// src/pages/ApePage.js
import React from 'react';
import { ApeProvider } from './ApePage/contexts/ApeContext';
import ApePageContent from './ApePage/index';

function ApePage() {
  return (
    <ApeProvider>
      <ApePageContent />
    </ApeProvider>
  );
}

export default ApePage;
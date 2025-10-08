import React from 'react';
import { ClerkAuthProvider } from './contexts/ClerkAuthContext';

const TestPage = () => {
  return (
    <ClerkAuthProvider>
      <div>
        <h1>Test Page</h1>
        <p>If you can see this, the ClerkAuthProvider is working.</p>
      </div>
    </ClerkAuthProvider>
  );
};

export default TestPage;
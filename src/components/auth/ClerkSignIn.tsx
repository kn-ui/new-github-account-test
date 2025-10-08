import React from 'react';
import { SignIn } from '@clerk/nextjs';

interface ClerkSignInProps {
  redirectUrl?: string;
}

export const ClerkSignIn: React.FC<ClerkSignInProps> = ({ 
  redirectUrl = '/dashboard' 
}) => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome Back</h1>
          <p className="mt-2 text-gray-600">Sign in to your account</p>
        </div>
        <SignIn 
          redirectUrl={redirectUrl}
          appearance={{
            elements: {
              formButtonPrimary: 'bg-blue-600 hover:bg-blue-700 text-sm normal-case',
              card: 'shadow-lg',
              headerTitle: 'hidden',
              headerSubtitle: 'hidden',
              socialButtonsBlockButton: 'border border-gray-300 hover:bg-gray-50',
              formFieldInput: 'border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500',
              footerActionLink: 'text-blue-600 hover:text-blue-700',
            }
          }}
        />
      </div>
    </div>
  );
};
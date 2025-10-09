import React from 'react';
import { UserButton } from '@clerk/clerk-react';

export const ClerkUserButton: React.FC = () => {
  return (
    <UserButton 
      appearance={{
        elements: {
          avatarBox: 'w-8 h-8',
          userButtonPopoverCard: 'shadow-lg',
          userButtonPopoverActionButton: 'hover:bg-gray-50',
          userButtonPopoverActionButtonText: 'text-gray-700',
        }
      }}
      afterSignOutUrl="/"
    />
  );
};
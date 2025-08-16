import React, { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

export default function TestAuthUIDs() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });

    return unsubscribe;
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Firebase Auth UID Test</h2>
        
        {currentUser ? (
          <div className="space-y-4">
            <div>
              <strong>UID:</strong> {currentUser.uid}
            </div>
            <div>
              <strong>Email:</strong> {currentUser.email}
            </div>
            <div>
              <strong>Display Name:</strong> {currentUser.displayName || 'Not set'}
            </div>
          </div>
        ) : (
          <p>No user logged in</p>
        )}
        
        <div className="mt-6 p-4 bg-gray-100 rounded">
          <h3 className="font-semibold mb-2">Instructions:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Login with a seeded user (e.g., admin@straguel.edu)</li>
            <li>Check the UID displayed above</li>
            <li>Use this UID to update the test data</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
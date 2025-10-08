/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Secondary Firebase App Configuration
 * 
 * This file creates a separate Firebase app instance specifically for admin user creation.
 * The secondary auth instance prevents the main app's authentication state from being affected
 * when admins create new users, avoiding unwanted redirects and session conflicts.
 * 
 * How it works:
 * 1. Creates a separate Firebase app with name 'secondary'
 * 2. Exports a separate auth instance (secondaryAuth) 
 * 3. User creation uses this secondary auth, then immediately signs out
 * 4. Main app's auth state remains unchanged, preventing redirects
 */
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, connectAuthEmulator, setPersistence, browserSessionPersistence } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

// Use the same config as the main Firebase app
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBtIY1wVdePkWCJ84bSr7alOMcI2aihVqw",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "school-management-system-67b85.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "school-management-system-67b85",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "school-management-system-67b85.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "103441012203195276037",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:103441012203195276037:web:abc123def456ghi789"
};

// Initialize secondary Firebase app with a unique name
// This prevents conflicts with the main app and ensures separate auth state
let secondaryApp;
const existingApps = getApps();
const secondaryAppName = 'secondary';

// Check if secondary app already exists to avoid duplicate initialization
if (existingApps.find(app => app.name === secondaryAppName)) {
  secondaryApp = existingApps.find(app => app.name === secondaryAppName);
} else {
  secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
}

// Initialize secondary Firebase Authentication
// This auth instance is completely separate from the main app's auth
export const secondaryAuth = getAuth(secondaryApp);
setPersistence(secondaryAuth, browserSessionPersistence);

// Initialize secondary Firestore (optional, but good for consistency)
export const secondaryDb = getFirestore(secondaryApp);

// Connect to emulators in development (same as main app)
if (import.meta.env.DEV) {
  try {
    if (!secondaryAuth.config) {
      // connectAuthEmulator(secondaryAuth, "http://localhost:9099");
    }
    if (!(secondaryDb as any)._delegate._databaseId.projectId.includes('demo-')) {
      // connectFirestoreEmulator(secondaryDb, 'localhost', 8080);
    }
  } catch (error) {
    console.log('Secondary app emulators already connected or not available');
  }
}

export default secondaryApp;
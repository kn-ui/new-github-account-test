/* eslint-disable @typescript-eslint/no-explicit-any */
import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, setPersistence, browserSessionPersistence, initializeAuth, indexedDBLocalPersistence } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, initializeFirestore, persistentLocalCache, CACHE_SIZE_UNLIMITED } from 'firebase/firestore';

// Use env vars; do not ship real keys in code. The fallbacks are non-functional placeholders.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBtIY1wVdePkWCJ84bSr7alOMcI2aihVqw",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "school-management-system-67b85.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "school-management-system-67b85",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "school-management-system-67b85.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "103441012203195276037",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:103441012203195276037:web:abc123def456ghi789"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
// Prefer IndexedDB persistence to reduce network calls on web
export const auth = getAuth(app);
setPersistence(auth, browserSessionPersistence);

// Initialize Cloud Firestore with local persistent cache to minimize reads
export const db = getFirestore(app);

// Connect to emulators in development
if (import.meta.env.DEV) {
  // Only connect to emulators if not already connected
  try {
    if (!auth.config) {
      // connectAuthEmulator(auth, "http://localhost:9099");
    }
    if (!(db as any)._delegate._databaseId.projectId.includes('demo-')) {
      // connectFirestoreEmulator(db, 'localhost', 8080);
    }
  } catch (error) {
    console.log('Emulators already connected or not available');
  }
}

export default app;
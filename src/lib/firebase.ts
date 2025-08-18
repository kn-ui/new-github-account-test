import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

// Use env vars; do not ship real keys in code. The fallbacks are non-functional placeholders.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "test-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "test-app.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "test-project",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "test-project.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "0000000000000",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:0000000000000:web:0000000000000000"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
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
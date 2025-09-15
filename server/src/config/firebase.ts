/* eslint-disable @typescript-eslint/no-explicit-any */
import * as admin from 'firebase-admin';
import { ServiceAccount } from 'firebase-admin';

let firebaseInitialized = false;

// Validate required environment variables for production
const requiredEnvVars = [
  'FIREBASE_PROJECT_ID',
  'FIREBASE_PRIVATE_KEY',
  'FIREBASE_CLIENT_EMAIL'
];

const missingVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingVars.length === 0) {
  const serviceAccount: ServiceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID!,
    privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
  };

  // Initialize Firebase Admin SDK
  if (!admin.apps.length) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID,
      });
      firebaseInitialized = true;
      console.log('✅ Firebase initialized successfully');
    } catch (error) {
      console.error('❌ Firebase initialization failed:', error);
      throw error;
    }
  }
} else {
  // Attempt application default credentials in development
  try {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: process.env.FIREBASE_PROJECT_ID || undefined,
      });
      firebaseInitialized = true;
      console.log('✅ Firebase initialized using application default credentials');
    }
  } catch (err) {
    console.log(`⚠️  Missing Firebase env vars: ${missingVars.join(', ')} and application default credentials unavailable.`);
    firebaseInitialized = false;
  }
}

// Export Firebase services
export const auth = firebaseInitialized ? admin.auth() : null;
export const firestore = firebaseInitialized ? admin.firestore() : null;
export const storage = firebaseInitialized ? admin.storage() : null;

export { firebaseInitialized };

export default admin;
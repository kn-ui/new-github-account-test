/* eslint-disable @typescript-eslint/no-explicit-any */
import * as admin from 'firebase-admin';
import { ServiceAccount } from 'firebase-admin';

// Check if we're in development mode without proper Firebase config
const isTestMode = process.env.NODE_ENV === 'development' && 
  (!process.env.FIREBASE_PROJECT_ID || 
   process.env.FIREBASE_PROJECT_ID === 'test-project' ||
   !process.env.FIREBASE_PRIVATE_KEY ||
   process.env.FIREBASE_PRIVATE_KEY.includes('TEST_KEY'));

let firebaseInitialized = false;

if (!isTestMode) {
  // Validate required environment variables for production
  const requiredEnvVars = [
    'FIREBASE_PROJECT_ID',
    'FIREBASE_PRIVATE_KEY',
    'FIREBASE_CLIENT_EMAIL'
  ];

  const missingVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
  
  if (missingVars.length > 0) {
    console.log(`⚠️  Missing Firebase environment variables: ${missingVars.join(', ')}`);
    console.log('⚠️  Running in test mode - Firebase disabled');
    // Override test mode flag
    (global as any).isTestMode = true;
  } else {

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
  }
} else {
  console.log('⚠️  Running in test mode - Firebase disabled');
}

// Export Firebase services (will be null in test mode)
export const auth = firebaseInitialized ? admin.auth() : null;
export const firestore = firebaseInitialized ? admin.firestore() : null;
export const storage = firebaseInitialized ? admin.storage() : null;

// Export test mode flag, checking for global override
const finalIsTestMode = isTestMode || (global as any).isTestMode;
export { firebaseInitialized, finalIsTestMode as isTestMode };

/* export { firebaseInitialized, isTestMode };
 */export default admin;


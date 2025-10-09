/* eslint-disable @typescript-eslint/no-explicit-any */
import * as admin from 'firebase-admin';
import { ServiceAccount } from 'firebase-admin';

let firebaseInitialized = false;

function normalizePrivateKey(input?: string): string | undefined {
  if (!input) return undefined;
  // Trim potential wrapping quotes
  let key = input.trim();
  if (key.startsWith('"') && key.endsWith('"')) {
    key = key.slice(1, -1);
  }
  // Replace escaped newlines and CRLF
  key = key.replace(/\\r\\n/g, '\n').replace(/\\n/g, '\n');
  return key;
}

function resolveServiceAccount(): ServiceAccount | null {
  // 1) Full JSON in env
  const json = process.env.FIREBASE_CREDENTIALS_JSON;
  if (json) {
    try {
      const parsed = JSON.parse(json);
      return {
        projectId: parsed.project_id || process.env.FIREBASE_PROJECT_ID,
        clientEmail: parsed.client_email || process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: normalizePrivateKey(parsed.private_key)!,
      } as ServiceAccount;
    } catch {}
  }

  // 2) Base64 JSON in env
  const b64 = process.env.FIREBASE_CREDENTIALS_B64 || process.env.FIREBASE_PRIVATE_KEY_BASE64;
  if (b64) {
    try {
      const decoded = Buffer.from(b64, 'base64').toString('utf8');
      const parsed = JSON.parse(decoded);
      return {
        projectId: parsed.project_id || process.env.FIREBASE_PROJECT_ID,
        clientEmail: parsed.client_email || process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: normalizePrivateKey(parsed.private_key)!,
      } as ServiceAccount;
    } catch {}
  }

  // 3) Raw pieces in env
  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    const privateKey = normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY);
    if (privateKey) {
      return {
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey,
      } as ServiceAccount;
    }
  }

  return null;
}

// Firebase initialization disabled during Hygraph migration
// TODO: Remove Firebase entirely once migration is complete
console.log('⚠️ Firebase initialization skipped during Hygraph migration');

// Export Firebase services
export const auth = firebaseInitialized ? admin.auth() : null;
export const firestore = firebaseInitialized ? admin.firestore() : null;
export const storage = firebaseInitialized ? admin.storage() : null;

export { firebaseInitialized };

export default admin;
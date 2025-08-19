// src/lib/firebase/config.ts
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Validate critical config in development
if (process.env.NODE_ENV !== 'production') {
  const missing = [];
  if (!firebaseConfig.apiKey) missing.push('apiKey');
  if (!firebaseConfig.authDomain) missing.push('authDomain');
  if (!firebaseConfig.projectId) missing.push('projectId');
  if (missing.length > 0) {
    console.warn('Missing Firebase config:', missing.join(', '));
  }
}

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Auth
export const auth = getAuth(app);

// Enable test mode for development (optional - allows test phone numbers)
if (process.env.NODE_ENV === 'development') {
  // You can add test phone numbers here if needed
  // auth.settings.appVerificationDisabledForTesting = true; // Uncomment for testing
}

export default app;

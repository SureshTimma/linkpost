// src/lib/firebase/config.ts
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

console.log('🔥 Firebase config loading...');

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

console.log('🔧 Firebase config values:');
console.log('  apiKey:', firebaseConfig.apiKey ? '***SET***' : '❌ MISSING');
console.log('  authDomain:', firebaseConfig.authDomain || '❌ MISSING');
console.log('  projectId:', firebaseConfig.projectId || '❌ MISSING');
console.log('  storageBucket:', firebaseConfig.storageBucket || '❌ MISSING');
console.log('  messagingSenderId:', firebaseConfig.messagingSenderId || '❌ MISSING');
console.log('  appId:', firebaseConfig.appId ? '***SET***' : '❌ MISSING');

// Initialize Firebase
console.log('🚀 Initializing Firebase...');
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
console.log('✅ Firebase app initialized:', app.name);

// Initialize Firestore
console.log('🗄️ Initializing Firestore...');
export const db = getFirestore(app);
console.log('✅ Firestore initialized');

// Initialize Auth
console.log('🔐 Initializing Firebase Auth...');
export const auth = getAuth(app);

// Enable test mode for development (optional - allows test phone numbers)
if (process.env.NODE_ENV === 'development') {
  console.log('🧪 Development mode: Setting up auth for testing...');
  
  // You can add test phone numbers here if needed
  // auth.settings.appVerificationDisabledForTesting = true; // Uncomment for testing
}

console.log('✅ Firebase Auth initialized');
console.log('🌍 Auth domain:', auth.config.authDomain);
console.log('🔧 Auth settings:', auth.settings);

export default app;

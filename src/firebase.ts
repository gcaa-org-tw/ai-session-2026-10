import { initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import type { Auth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';

export const USE_EMULATORS = import.meta.env.VITE_USE_EMULATORS === 'true';
export const EMULATOR_PROJECT_ID = 'demo-ai-session';

interface FirebaseServices {
  auth: Auth;
  db: Firestore;
}

let cached: FirebaseServices | null = null;

function init(): FirebaseServices {
  if (USE_EMULATORS) {
    const app = initializeApp({
      apiKey: 'demo-api-key',
      authDomain: 'localhost',
      projectId: EMULATOR_PROJECT_ID,
    });
    const auth = getAuth(app);
    const db = getFirestore(app);
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    connectFirestoreEmulator(db, '127.0.0.1', 8080);
    return { auth, db };
  }
  const env = import.meta.env;
  if (!env.VITE_FIREBASE_API_KEY || !env.VITE_FIREBASE_PROJECT_ID) {
    throw new Error('尚未設定 Firebase 連線資訊，請檢查 .env.local。');
  }
  const app = initializeApp({
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.VITE_FIREBASE_APP_ID,
  });
  return { auth: getAuth(app), db: getFirestore(app) };
}

export function getFirebase(): FirebaseServices {
  cached ??= init();
  return cached;
}

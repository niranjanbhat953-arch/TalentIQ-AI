import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAgEGQlFtbfGfvn_TYqH8mYcaYSalWWniY",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "talentiq-ai.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "talentiq-ai",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "talentiq-ai.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1046672786330",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1046672786330:web:4c4cd9a40d7a6fb1b0f023",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-9DBMP0RHNK",
};

// Initialize Firebase safely
const app: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth: Auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { app, auth, googleProvider };

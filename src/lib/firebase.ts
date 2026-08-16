import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { 
  getAuth, 
  GoogleAuthProvider, 
  GithubAuthProvider,
  PhoneAuthProvider,
  PhoneMultiFactorGenerator,
  RecaptchaVerifier,
  type MultiFactorUser
} from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyA-fake-api-key-for-testing-purposes",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "fake-domain.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "fake-project",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "fake-project.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1234567890",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1234567890:web:1234567890abcdef",
};

// Initialize Firebase (ensuring it doesn't initialize twice in dev mode)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const githubProvider = new GithubAuthProvider();

export { 
  app, 
  db, 
  auth, 
  googleProvider, 
  githubProvider, 
  PhoneAuthProvider, 
  PhoneMultiFactorGenerator,
  RecaptchaVerifier,
  type MultiFactorUser 
};

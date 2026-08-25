import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "AIzaSyAqe8jTArK6Q95keFvHyELdU9lV02tt58w",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "ugobuy-cb42f.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "ugobuy-cb42f",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "ugobuy-cb42f.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "407654652181",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "1:407654652181:web:d132a29d0bf1409e49711c",
};

const isConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId,
);

export const firebaseApp = isConfigured
  ? getApps().length
    ? getApp()
    : initializeApp(firebaseConfig)
  : null;

export const auth = firebaseApp ? getAuth(firebaseApp) : null;
export const db = firebaseApp ? getFirestore(firebaseApp) : null;
export const storage = firebaseApp ? getStorage(firebaseApp) : null;
export const googleProvider = auth ? new GoogleAuthProvider() : null;

export const firebaseReady = Boolean(firebaseApp);

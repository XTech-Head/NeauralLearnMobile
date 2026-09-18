// src/lib/firebase.ts — Firebase Auth (free tier: unlimited email/password auth)
import { initializeApp, getApps, getApp } from "firebase/app";
import {
    getAuth,
    initializeAuth,
    getReactNativePersistence,
    type Auth,
} from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Fill these from your Firebase console: Project Settings → General → Your apps → Web app
// Free tier (Spark plan) covers this entirely — no billing needed for email/password auth.
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID!,
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// initializeAuth (not getAuth) is required on React Native so sessions
// persist to AsyncStorage instead of getting wiped on every app restart.
let auth: Auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch {
  // Fast-refresh in dev calls this file twice — reuse the existing instance.
  auth = getAuth(app);
}

export { app, auth };

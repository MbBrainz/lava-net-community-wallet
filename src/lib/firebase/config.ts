/**
 * Firebase Configuration
 *
 * Singleton Firebase app initialization for Cloud Messaging.
 * This config is used by both the client and service worker.
 */

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getMessaging, type Messaging } from "firebase/messaging";

/**
 * Firebase configuration from environment variables.
 * All values are public (NEXT_PUBLIC_*) as they're used client-side.
 */
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

/**
 * VAPID key for Web Push.
 * Generated in Firebase Console > Cloud Messaging > Web Push certificates.
 */
export const vapidKey = process.env.NEXT_PUBLIC_VAPID_KEY;

/**
 * Get or initialize the Firebase app (singleton pattern).
 * Prevents re-initialization errors in hot-reload and SSR.
 */
export function getFirebaseApp(): FirebaseApp {
  if (getApps().length > 0) {
    return getApp();
  }
  return initializeApp(firebaseConfig);
}

/**
 * Get Firebase Messaging instance.
 * Only works in browser environment.
 *
 * @throws Error if called in non-browser environment
 */
export function getFirebaseMessaging(): Messaging {
  if (typeof window === "undefined") {
    throw new Error("Firebase Messaging is only available in browser");
  }

  const app = getFirebaseApp();
  return getMessaging(app);
}

/**
 * Check if Firebase is properly configured.
 * Useful for conditional rendering of notification features.
 */
export function isFirebaseConfigured(): boolean {
  return !!(
    firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    firebaseConfig.messagingSenderId &&
    vapidKey
  );
}

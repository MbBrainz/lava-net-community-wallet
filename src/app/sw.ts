import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";
import { initializeApp } from "firebase/app";
import { getMessaging, onBackgroundMessage } from "firebase/messaging/sw";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

// ============================================
// Serwist (PWA) Setup
// ============================================

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
});

// ============================================
// Firebase Cloud Messaging Setup
// ============================================

/**
 * Firebase config injected at build time.
 * Serwist/Next.js will replace process.env values with actual strings.
 */
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID,
};

/**
 * Check if Firebase is configured before initializing.
 */
const isFirebaseConfigured =
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.messagingSenderId;

if (isFirebaseConfigured) {
  try {
    // Initialize Firebase in the service worker
    const app = initializeApp(firebaseConfig);
    const messaging = getMessaging(app);

    /**
     * Handle background push notifications from Firebase.
     * This runs when the app is closed or in the background.
     */
    onBackgroundMessage(messaging, (payload) => {
      console.log("[SW] Background message received:", payload);

      // Extract notification data from payload
      const notificationTitle =
        payload.notification?.title || "Lava Wallet";
      const notificationBody =
        payload.notification?.body || "New notification";

      // Custom notification options
      const notificationOptions: NotificationOptions & {
        vibrate?: number[];
        actions?: Array<{ action: string; title: string }>;
      } = {
        body: notificationBody,
        icon: "/lava-brand-kit/logos/logo-icon-color.png",
        badge: "/lava-brand-kit/logos/logo-symbol-white.png",
        vibrate: [100, 50, 100],
        data: {
          // URL to open when notification is clicked
          url: payload.data?.url || payload.fcmOptions?.link || "/notifications",
          // Pass through any custom data
          ...payload.data,
        },
        actions: [
          {
            action: "open",
            title: "Open",
          },
          {
            action: "dismiss",
            title: "Dismiss",
          },
        ],
        // Require interaction on desktop (notification persists until clicked)
        requireInteraction: true,
        // Tag for notification grouping/replacement
        tag: payload.data?.tag || "lava-notification",
      };

      // Show the notification
      self.registration.showNotification(notificationTitle, notificationOptions);
    });
  } catch (error) {
    console.error("[SW] Failed to initialize Firebase:", error);
  }
} else {
  console.warn("[SW] Firebase not configured, push notifications disabled");
}

// ============================================
// Notification Click Handler
// ============================================

/**
 * Handle notification clicks.
 * Works for both FCM notifications and any other push notifications.
 */
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  // Handle dismiss action
  if (event.action === "dismiss") return;

  // Get the URL to open from notification data
  const urlToOpen = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Try to focus an existing window first
        for (const client of clientList) {
          if ("focus" in client) {
            client.focus();
            // Navigate to the notification URL
            if ("navigate" in client) {
              (client as WindowClient).navigate(urlToOpen);
            }
            return;
          }
        }
        // No existing window, open a new one
        return self.clients.openWindow(urlToOpen);
      })
  );
});

// ============================================
// Register Serwist Event Listeners
// ============================================

serwist.addEventListeners();

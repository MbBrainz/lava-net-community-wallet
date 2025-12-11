/**
 * Firebase Admin SDK Configuration
 *
 * Server-side only. Used for sending push notifications.
 * DO NOT import this file in client-side code.
 */

import admin from "firebase-admin";

/**
 * Initialize Firebase Admin SDK.
 * Uses singleton pattern to prevent re-initialization errors.
 */
function initializeAdmin() {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

  if (!privateKey) {
    throw new Error("FIREBASE_ADMIN_PRIVATE_KEY environment variable is not set");
  }

  try {
    // Parse the service account JSON from environment variable
    const serviceAccount = JSON.parse(privateKey);

    return admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (error) {
    throw new Error(
      `Failed to parse FIREBASE_ADMIN_PRIVATE_KEY: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Get the Firebase Admin app instance.
 */
export function getAdminApp() {
  return initializeAdmin();
}

/**
 * Get Firebase Admin Messaging instance.
 */
export function getAdminMessaging() {
  initializeAdmin();
  return admin.messaging();
}

/**
 * Send a push notification to a specific device token.
 */
export async function sendPushNotification(params: {
  token: string;
  title: string;
  body: string;
  url?: string;
  data?: Record<string, string>;
}) {
  const messaging = getAdminMessaging();

  const message: admin.messaging.Message = {
    token: params.token,
    notification: {
      title: params.title,
      body: params.body,
    },
    data: {
      url: params.url || "/",
      ...params.data,
    },
    webpush: {
      headers: {
        Urgency: "high",
      },
      fcmOptions: {
        link: params.url || "/",
      },
    },
  };

  return messaging.send(message);
}

/**
 * Send push notifications to multiple device tokens.
 * Handles batching automatically.
 */
export async function sendPushNotificationToMany(params: {
  tokens: string[];
  title: string;
  body: string;
  url?: string;
  data?: Record<string, string>;
}) {
  if (params.tokens.length === 0) {
    return { successCount: 0, failureCount: 0, responses: [] };
  }

  const messaging = getAdminMessaging();

  const message: admin.messaging.MulticastMessage = {
    tokens: params.tokens,
    notification: {
      title: params.title,
      body: params.body,
    },
    data: {
      url: params.url || "/",
      ...params.data,
    },
    webpush: {
      headers: {
        Urgency: "high",
      },
      fcmOptions: {
        link: params.url || "/",
      },
    },
  };

  return messaging.sendEachForMulticast(message);
}

/**
 * Subscribe tokens to an FCM topic.
 * Topics are used for category-based notifications (e.g., "community", "wallet").
 */
export async function subscribeToTopic(tokens: string[], topic: string) {
  if (tokens.length === 0) return { successCount: 0, failureCount: 0 };

  const messaging = getAdminMessaging();
  return messaging.subscribeToTopic(tokens, topic);
}

/**
 * Unsubscribe tokens from an FCM topic.
 */
export async function unsubscribeFromTopic(tokens: string[], topic: string) {
  if (tokens.length === 0) return { successCount: 0, failureCount: 0 };

  const messaging = getAdminMessaging();
  return messaging.unsubscribeFromTopic(tokens, topic);
}

/**
 * Send a notification to all devices subscribed to a topic.
 */
export async function sendToTopic(params: {
  topic: string;
  title: string;
  body: string;
  url?: string;
  data?: Record<string, string>;
}) {
  const messaging = getAdminMessaging();

  const message: admin.messaging.Message = {
    topic: params.topic,
    notification: {
      title: params.title,
      body: params.body,
    },
    data: {
      url: params.url || "/",
      ...params.data,
    },
    webpush: {
      headers: {
        Urgency: "high",
      },
      fcmOptions: {
        link: params.url || "/",
      },
    },
  };

  return messaging.send(message);
}

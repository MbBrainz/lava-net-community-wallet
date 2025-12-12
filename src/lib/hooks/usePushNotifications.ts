"use client";

/**
 * Push Notifications Hook
 *
 * Manages FCM token lifecycle:
 * - Request notification permission
 * - Get FCM token
 * - Save token to backend
 * - Handle token refresh
 *
 * @example
 * ```tsx
 * const {
 *   isSupported,
 *   permission,
 *   token,
 *   isLoading,
 *   error,
 *   requestPermission,
 * } = usePushNotifications();
 * ```
 */

import { useState, useEffect, useCallback } from "react";
import { getToken, onMessage, type MessagePayload } from "firebase/messaging";
import {
  getFirebaseMessaging,
  vapidKey,
  isFirebaseConfigured,
} from "@/lib/firebase";
import { useAuthFetch } from "@/lib/auth/client";

interface UsePushNotificationsResult {
  /** Whether push notifications are supported in this browser */
  isSupported: boolean;
  /** Whether Firebase is properly configured */
  isConfigured: boolean;
  /** Current notification permission status */
  permission: NotificationPermission;
  /** FCM token (null if not registered) */
  token: string | null;
  /** Whether we're currently loading/registering */
  isLoading: boolean;
  /** Error message if registration failed */
  error: string | null;
  /** Request permission and register for push notifications */
  requestPermission: () => Promise<boolean>;
  /** Unregister from push notifications */
  unregister: () => Promise<void>;
  /** Callback for foreground messages */
  onForegroundMessage: (callback: (payload: MessagePayload) => void) => () => void;
}

/**
 * Check if push notifications are supported in the current environment.
 */
function checkPushSupport(): boolean {
  if (typeof window === "undefined") return false;
  if (!("Notification" in window)) return false;
  if (!("serviceWorker" in navigator)) return false;
  if (!("PushManager" in window)) return false;
  return true;
}

/**
 * Get the current notification permission status.
 */
function getPermissionStatus(): NotificationPermission {
  if (typeof window === "undefined") return "default";
  if (!("Notification" in window)) return "denied";
  return Notification.permission;
}

/**
 * Get device info for debugging purposes.
 */
function getDeviceInfo(): Record<string, unknown> {
  if (typeof window === "undefined") return {};

  const nav = navigator as Navigator & { standalone?: boolean };

  return {
    userAgent: nav.userAgent,
    platform: nav.platform,
    language: nav.language,
    isStandalone:
      window.matchMedia("(display-mode: standalone)").matches ||
      nav.standalone === true,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
  };
}

/**
 * Detect platform for token categorization.
 */
function detectPlatform(): "ios" | "android" | "web" {
  if (typeof window === "undefined") return "web";

  const ua = navigator.userAgent.toLowerCase();

  if (/iphone|ipad|ipod/.test(ua)) return "ios";
  if (/android/.test(ua)) return "android";
  return "web";
}

export function usePushNotifications(): UsePushNotificationsResult {
  const { authFetch, isReady: isAuthReady } = useAuthFetch();

  const [isSupported] = useState(() => checkPushSupport());
  const [isConfigured] = useState(() => isFirebaseConfigured());
  const [permission, setPermission] = useState<NotificationPermission>(() =>
    getPermissionStatus()
  );
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Save the FCM token to the backend.
   */
  const saveTokenToBackend = useCallback(
    async (fcmToken: string): Promise<boolean> => {
      if (!isAuthReady) {
        console.warn("[Push] Cannot save token: auth not ready");
        return false;
      }

      try {
        const response = await authFetch("/api/notifications/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: fcmToken,
            platform: detectPlatform(),
            deviceInfo: getDeviceInfo(),
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || "Failed to save token");
        }

        return true;
      } catch (err) {
        console.error("[Push] Failed to save token:", err);
        return false;
      }
    },
    [authFetch, isAuthReady]
  );

  /**
   * Request notification permission and register FCM token.
   */
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      setError("Push notifications are not supported in this browser");
      return false;
    }

    if (!isConfigured) {
      setError("Push notifications are not configured");
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Request permission
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);

      if (permissionResult !== "granted") {
        setError("Notification permission denied");
        return false;
      }

      // Wait for service worker to be ready
      const registration = await navigator.serviceWorker.ready;

      // Get FCM token
      const messaging = getFirebaseMessaging();
      const fcmToken = await getToken(messaging, {
        vapidKey: vapidKey,
        serviceWorkerRegistration: registration,
      });

      if (!fcmToken) {
        setError("Failed to get push token");
        return false;
      }

      setToken(fcmToken);

      // Save to backend
      const saved = await saveTokenToBackend(fcmToken);
      if (!saved) {
        setError("Failed to save push token");
        return false;
      }

      // Store in localStorage as backup
      localStorage.setItem("fcm_token", fcmToken);

      return true;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to enable notifications";
      setError(message);
      console.error("[Push] Registration failed:", err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, isConfigured, saveTokenToBackend]);

  /**
   * Unregister from push notifications.
   */
  const unregister = useCallback(async (): Promise<void> => {
    if (!token) return;

    setIsLoading(true);

    try {
      // Remove from backend
      if (isAuthReady) {
        await authFetch("/api/notifications/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
      }

      // Clear local state
      setToken(null);
      localStorage.removeItem("fcm_token");
    } catch (err) {
      console.error("[Push] Unregister failed:", err);
    } finally {
      setIsLoading(false);
    }
  }, [token, authFetch, isAuthReady]);

  /**
   * Subscribe to foreground messages.
   * Returns an unsubscribe function.
   */
  const onForegroundMessage = useCallback(
    (callback: (payload: MessagePayload) => void): (() => void) => {
      if (!isConfigured || typeof window === "undefined") {
        return () => {};
      }

      try {
        const messaging = getFirebaseMessaging();
        return onMessage(messaging, callback);
      } catch {
        return () => {};
      }
    },
    [isConfigured]
  );

  /**
   * Initialize: check for existing token on mount.
   */
  useEffect(() => {
    // Update permission status
    setPermission(getPermissionStatus());

    // Check for existing token in localStorage
    const existingToken = localStorage.getItem("fcm_token");
    if (existingToken) {
      setToken(existingToken);
    }
  }, []);

  /**
   * Re-sync token with backend when auth becomes ready.
   */
  useEffect(() => {
    if (isAuthReady && token && permission === "granted") {
      // Token exists, re-sync with backend to ensure it's up to date
      saveTokenToBackend(token);
    }
  }, [isAuthReady, token, permission, saveTokenToBackend]);

  return {
    isSupported,
    isConfigured,
    permission,
    token,
    isLoading,
    error,
    requestPermission,
    unregister,
    onForegroundMessage,
  };
}

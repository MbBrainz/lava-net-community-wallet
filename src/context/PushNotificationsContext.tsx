"use client";

import type { ReactNode } from "react";
import { createContext, useContext, useMemo } from "react";
import { usePushNotifications } from "@/lib/hooks/usePushNotifications";
import type { MessagePayload } from "firebase/messaging";

interface PushNotificationsContextValue {
  pushSupported: boolean;
  pushConfigured: boolean;
  pushPermission: NotificationPermission;
  pushToken: string | null;
  pushLoading: boolean;
  pushError: string | null;
  requestPushPermission: () => Promise<boolean>;
  unregisterPush: () => Promise<void>;
  onForegroundMessage: (callback: (payload: MessagePayload) => void) => () => void;
}

const PushNotificationsContext = createContext<PushNotificationsContextValue | undefined>(
  undefined
);

export function PushNotificationsProvider({ children }: { children: ReactNode }) {
  const {
    isSupported,
    isConfigured,
    permission,
    token,
    isLoading,
    error,
    requestPermission,
    unregister,
    onForegroundMessage,
  } = usePushNotifications();

  const value = useMemo<PushNotificationsContextValue>(
    () => ({
      pushSupported: isSupported,
      pushConfigured: isConfigured,
      pushPermission: permission,
      pushToken: token,
      pushLoading: isLoading,
      pushError: error,
      requestPushPermission: requestPermission,
      unregisterPush: unregister,
      onForegroundMessage,
    }),
    [
      isSupported,
      isConfigured,
      permission,
      token,
      isLoading,
      error,
      requestPermission,
      unregister,
      onForegroundMessage,
    ]
  );

  return (
    <PushNotificationsContext.Provider value={value}>
      {children}
    </PushNotificationsContext.Provider>
  );
}

export function usePush() {
  const context = useContext(PushNotificationsContext);
  if (!context) {
    throw new Error("usePush must be used within a PushNotificationsProvider");
  }
  return context;
}


"use client";

import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { mockNotifications, type Notification } from "@/lib/mock-data";

type NotificationSettings = {
  communityUpdates: boolean;
  walletAlerts: boolean;
  priceAlerts: boolean;
};

interface NotificationInboxContextValue {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;

  notificationSettings: NotificationSettings;
  updateNotificationSettings: (settings: Partial<NotificationSettings>) => void;
}

const NotificationInboxContext = createContext<NotificationInboxContextValue | undefined>(
  undefined
);

export function NotificationInboxProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications]
  );

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }, []);

  const [notificationSettings, setNotificationSettings] =
    useState<NotificationSettings>({
      communityUpdates: true,
      walletAlerts: true,
      priceAlerts: true,
    });

  const updateNotificationSettings = useCallback(
    (settings: Partial<NotificationSettings>) => {
      setNotificationSettings((prev) => ({ ...prev, ...settings }));
    },
    []
  );

  const value = useMemo<NotificationInboxContextValue>(
    () => ({
      notifications,
      unreadCount,
      markAsRead,
      markAllAsRead,
      notificationSettings,
      updateNotificationSettings,
    }),
    [
      notifications,
      unreadCount,
      markAsRead,
      markAllAsRead,
      notificationSettings,
      updateNotificationSettings,
    ]
  );

  return (
    <NotificationInboxContext.Provider value={value}>
      {children}
    </NotificationInboxContext.Provider>
  );
}

export function useNotificationInbox() {
  const context = useContext(NotificationInboxContext);
  if (!context) {
    throw new Error("useNotificationInbox must be used within a NotificationInboxProvider");
  }
  return context;
}


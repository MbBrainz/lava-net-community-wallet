"use client";

import type { ReactNode } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useAuthFetch } from "@/lib/auth/client";
import type { UserNotification } from "@/lib/db/schema";

/**
 * Notification settings that map to backend preferences.
 */
type NotificationSettings = {
  communityUpdates: boolean;
  walletAlerts: boolean;
  priceAlerts: boolean;
};

interface NotificationInboxContextValue {
  // Data
  notifications: UserNotification[];
  unreadCount: number;

  // Loading/error state
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;

  // Actions
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;

  // Settings (for settings sheet)
  notificationSettings: NotificationSettings;
  updateNotificationSettings: (settings: Partial<NotificationSettings>) => void;
}

const NotificationInboxContext = createContext<NotificationInboxContextValue | undefined>(
  undefined
);

export function NotificationInboxProvider({ children }: { children: ReactNode }) {
  const { authFetch, isReady } = useAuthFetch();

  // Notifications state
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  // Settings state (synced with backend in notifications page)
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    communityUpdates: true,
    walletAlerts: true,
    priceAlerts: true,
  });

  // Track if we've fetched to avoid duplicate requests
  const hasFetched = useRef(false);
  // Track if we've seeded
  const hasSeeded = useRef(false);

  /**
   * Fetch notifications from API.
   */
  const fetchNotifications = useCallback(
    async (cursor?: string | null) => {
      if (!isReady) return;

      try {
        setError(null);

        const url = cursor
          ? `/api/notifications/inbox?cursor=${cursor}`
          : "/api/notifications/inbox";

        const response = await authFetch(url);

        if (!response.ok) {
          throw new Error("Failed to fetch notifications");
        }

        const data = await response.json();

        if (cursor) {
          // Append for pagination
          setNotifications((prev) => [...prev, ...data.notifications]);
        } else {
          // Replace for initial/refresh
          setNotifications(data.notifications);
        }

        setUnreadCount(data.unreadCount);
        setHasMore(data.hasMore);
        setNextCursor(data.nextCursor);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
        console.error("[NotificationInbox] Fetch failed:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [authFetch, isReady]
  );

  /**
   * Seed initial notifications if user has none.
   */
  const seedNotifications = useCallback(async () => {
    if (!isReady || hasSeeded.current) return;
    hasSeeded.current = true;

    try {
      await authFetch("/api/notifications/inbox/seed", {
        method: "POST",
      });
    } catch (err) {
      console.error("[NotificationInbox] Seed failed:", err);
    }
  }, [authFetch, isReady]);

  /**
   * Initial fetch on mount.
   */
  useEffect(() => {
    if (!isReady || hasFetched.current) return;
    hasFetched.current = true;

    const initialize = async () => {
      // First, try to seed sample notifications
      await seedNotifications();
      // Then fetch
      await fetchNotifications();
    };

    initialize();
  }, [isReady, seedNotifications, fetchNotifications]);

  /**
   * Mark a single notification as read.
   */
  const markAsRead = useCallback(
    async (id: string) => {
      // Find the notification to check if already read
      const notification = notifications.find((n) => n.id === id);
      if (!notification || notification.isRead) return;

      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, isRead: true, readAt: new Date() } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      try {
        await authFetch("/api/notifications/inbox/read", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notificationIds: [id] }),
        });
      } catch (err) {
        console.error("[NotificationInbox] Mark as read failed:", err);
        // Revert on error
        fetchNotifications();
      }
    },
    [authFetch, notifications, fetchNotifications]
  );

  /**
   * Mark all notifications as read.
   */
  const markAllAsRead = useCallback(async () => {
    if (unreadCount === 0) return;

    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, isRead: true, readAt: n.readAt ?? new Date() }))
    );
    setUnreadCount(0);

    try {
      await authFetch("/api/notifications/inbox/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
      });
    } catch (err) {
      console.error("[NotificationInbox] Mark all as read failed:", err);
      // Revert on error
      fetchNotifications();
    }
  }, [authFetch, unreadCount, fetchNotifications]);

  /**
   * Load more notifications (pagination).
   */
  const loadMore = useCallback(async () => {
    if (!hasMore || !nextCursor || isLoading) return;
    await fetchNotifications(nextCursor);
  }, [hasMore, nextCursor, isLoading, fetchNotifications]);

  /**
   * Refresh notifications list.
   */
  const refresh = useCallback(async () => {
    setIsLoading(true);
    setNextCursor(null);
    await fetchNotifications();
  }, [fetchNotifications]);

  /**
   * Update notification settings (local state).
   * Actual sync with backend happens in the notifications page.
   */
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
      isLoading,
      error,
      hasMore,
      markAsRead,
      markAllAsRead,
      loadMore,
      refresh,
      notificationSettings,
      updateNotificationSettings,
    }),
    [
      notifications,
      unreadCount,
      isLoading,
      error,
      hasMore,
      markAsRead,
      markAllAsRead,
      loadMore,
      refresh,
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

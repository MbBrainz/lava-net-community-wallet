"use client";

/**
 * Push Notification Foreground Handler
 *
 * This component handles push notifications when the app is in the foreground.
 * Firebase's onBackgroundMessage only works when the app is closed/backgrounded.
 * For foreground notifications, we use onMessage and show a toast/banner.
 *
 * Also refreshes the notification inbox when new messages arrive.
 *
 * Add this component to the root providers to enable foreground notifications.
 */

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { usePush } from "@/context/PushNotificationsContext";
import { useNotificationInbox } from "@/context/NotificationInboxContext";

interface ForegroundNotification {
  id: string;
  title: string;
  body: string;
  url?: string;
  timestamp: number;
}

/**
 * Auto-dismiss timeout for notifications (in milliseconds)
 */
const NOTIFICATION_TIMEOUT = 6000;

export function PushHandler() {
  const router = useRouter();
  const { onForegroundMessage, pushPermission: permission, pushToken: token } = usePush();
  const { refresh: refreshInbox } = useNotificationInbox();

  const [notifications, setNotifications] = useState<ForegroundNotification[]>([]);

  /**
   * Dismiss a notification.
   */
  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  /**
   * Handle notification click - navigate and dismiss.
   */
  const handleNotificationClick = useCallback(
    (notification: ForegroundNotification) => {
      dismissNotification(notification.id);
      if (notification.url) {
        router.push(notification.url);
      }
    },
    [dismissNotification, router]
  );

  /**
   * Listen for foreground messages when push is enabled.
   */
  useEffect(() => {
    if (permission !== "granted" || !token) {
      return;
    }

    const unsubscribe = onForegroundMessage((payload) => {
      console.log("[PushHandler] Foreground message received:", payload);

      const notification: ForegroundNotification = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        title: payload.notification?.title || "Lava Wallet",
        body: payload.notification?.body || "New notification",
        url: payload.data?.url || payload.fcmOptions?.link,
        timestamp: Date.now(),
      };

      setNotifications((prev) => [...prev, notification]);

      // Refresh inbox to include the new notification
      refreshInbox();

      // Auto-dismiss after timeout
      setTimeout(() => {
        dismissNotification(notification.id);
      }, NOTIFICATION_TIMEOUT);
    });

    return unsubscribe;
  }, [permission, token, onForegroundMessage, dismissNotification, refreshInbox]);

  // Don't render anything if no notifications
  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 left-4 right-4 z-[100] pointer-events-none flex flex-col gap-2 max-w-md mx-auto">
      <AnimatePresence mode="popLayout">
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="pointer-events-auto"
          >
            <div
              onClick={() => handleNotificationClick(notification)}
              className="bg-grey-550 border border-grey-425 rounded-2xl shadow-xl p-4 cursor-pointer hover:bg-grey-500 transition-colors"
            >
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className="w-10 h-10 rounded-xl bg-lava-orange/20 flex items-center justify-center flex-shrink-0">
                  <Bell className="w-5 h-5 text-lava-orange" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-white truncate">
                    {notification.title}
                  </h4>
                  <p className="text-xs text-grey-200 line-clamp-2 mt-0.5">
                    {notification.body}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {notification.url && (
                    <ChevronRight className="w-4 h-4 text-grey-200" />
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      dismissNotification(notification.id);
                    }}
                    className="p-1 text-grey-200 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  BellOff,
  CheckCheck,
  Users,
  Wallet,
  TrendingUp,
  Settings,
  ChevronRight,
  AlertCircle,
  Download,
} from "lucide-react";
import Link from "next/link";
import { useNotificationInbox } from "@/context/NotificationInboxContext";
import { usePwa } from "@/context/PwaContext";
import { usePush } from "@/context/PushNotificationsContext";
import { useAuthFetch } from "@/lib/auth/client";
import { timeAgo, isIOS } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Sheet } from "@/components/ui/Modal";
import { Toggle } from "@/components/ui/Toggle";

const notificationIcons = {
  community: Users,
  app: Wallet,
  transaction: Bell,
};

export default function NotificationsPage() {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    notificationSettings,
    updateNotificationSettings,
  } = useNotificationInbox();

  const {
    // Push notification state from context
    pushSupported,
    pushConfigured,
    pushPermission,
    pushToken,
    pushLoading,
    pushError,
    requestPushPermission,
  } = usePush();

  const {
    // PWA state
    isInstalled,
    setShowInstallBanner,
  } = usePwa();

  const { authFetch, isReady: isAuthReady } = useAuthFetch();

  const [showSettings, setShowSettings] = useState(false);
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);

  // Check if push is available (considering iOS requirements)
  const isIOSDevice = isIOS();
  const canEnablePush = pushSupported && pushConfigured && (!isIOSDevice || isInstalled);

  /**
   * Handle push permission request with iOS install gate.
   */
  const handleEnablePush = async () => {
    if (isIOSDevice && !isInstalled) {
      // On iOS, show install banner instead
      setShowInstallBanner(true);
      return;
    }
    await requestPushPermission();
  };

  /**
   * Sync preferences with backend.
   */
  const syncPreferencesToBackend = useCallback(
    async (preferences: typeof notificationSettings) => {
      if (!isAuthReady) return;

      setIsSavingPreferences(true);
      try {
        await authFetch("/api/notifications/preferences", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(preferences),
        });
      } catch (error) {
        console.error("[Notifications] Failed to sync preferences:", error);
      } finally {
        setIsSavingPreferences(false);
      }
    },
    [authFetch, isAuthReady]
  );

  /**
   * Load preferences from backend on mount.
   */
  useEffect(() => {
    if (!isAuthReady) return;

    const loadPreferences = async () => {
      try {
        const response = await authFetch("/api/notifications/preferences");
        if (response.ok) {
          const data = await response.json();
          updateNotificationSettings(data);
        }
      } catch (error) {
        console.error("[Notifications] Failed to load preferences:", error);
      }
    };

    loadPreferences();
  }, [isAuthReady, authFetch, updateNotificationSettings]);

  /**
   * Handle preference toggle with backend sync.
   */
  const handlePreferenceChange = (key: keyof typeof notificationSettings, value: boolean) => {
    const newSettings = { ...notificationSettings, [key]: value };
    updateNotificationSettings({ [key]: value });
    syncPreferencesToBackend(newSettings);
  };

  /**
   * Get push status message for display.
   */
  const getPushStatusMessage = () => {
    if (!pushSupported) return "Not supported in this browser";
    if (!pushConfigured) return "Not configured";
    if (isIOSDevice && !isInstalled) return "Install app first (iOS requirement)";
    if (pushPermission === "denied") return "Blocked in browser settings";
    if (pushPermission === "granted" && pushToken) return "Enabled";
    if (pushLoading) return "Enabling...";
    return "Not enabled";
  };

  return (
    <div className="min-h-screen pb-4">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ opacity: 0 }}
        className="px-4 pt-4 pb-2"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <Bell className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Notifications</h1>
              <p className="text-sm text-grey-200">
                {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="p-2 text-grey-200 hover:text-white hover:bg-grey-425/50 rounded-lg transition-colors"
                title="Mark all as read"
              >
                <CheckCheck className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 text-grey-200 hover:text-white hover:bg-grey-425/50 rounded-lg transition-colors"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </motion.header>

      <div className="px-4 py-4 space-y-4">
        {/* Push notification prompt - show if can enable and not yet enabled */}
        {canEnablePush && pushPermission === "default" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ opacity: 0 }}
          >
            <Card variant="gradient" className="border-blue-500/30">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <Bell className="w-6 h-6 text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white mb-1">
                    Enable Push Notifications
                  </h3>
                  <p className="text-sm text-grey-200 mb-3">
                    Get notified about community updates, wallet activity, and price alerts
                  </p>
                  <Button
                    size="sm"
                    onClick={handleEnablePush}
                    disabled={pushLoading}
                  >
                    {pushLoading ? "Enabling..." : "Enable Notifications"}
                  </Button>
                  {pushError && (
                    <p className="text-xs text-red-400 mt-2 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {pushError}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* iOS install requirement banner */}
        {isIOSDevice && !isInstalled && pushSupported && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ opacity: 0 }}
          >
            <Card variant="outline" className="border-lava-orange/30 bg-lava-orange/5">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-lava-orange/20 flex items-center justify-center flex-shrink-0">
                  <Download className="w-6 h-6 text-lava-orange" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white mb-1">
                    Install App for Notifications
                  </h3>
                  <p className="text-sm text-grey-200 mb-3">
                    On iOS, push notifications require the app to be installed to your home screen
                  </p>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setShowInstallBanner(true)}
                  >
                    Install App
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Notification List */}
        {notifications.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ opacity: 0 }}
            className="text-center py-12"
          >
            <div className="w-16 h-16 rounded-full bg-grey-425/50 flex items-center justify-center mx-auto mb-4">
              <BellOff className="w-8 h-8 text-grey-200" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">
              No notifications yet
            </h3>
            <p className="text-sm text-grey-200">
              You&apos;ll see updates from the community here
            </p>
          </motion.div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {notifications.map((notification, index) => {
                const Icon = notificationIcons[notification.type];

                return (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.03 }}
                    style={{ opacity: 0 }}
                  >
                    <div
                      onClick={() => markAsRead(notification.id)}
                      className={`relative flex items-start gap-3 p-4 rounded-2xl transition-colors cursor-pointer ${
                        notification.isRead
                          ? "bg-grey-550/50"
                          : "bg-grey-550 border border-lava-orange/20"
                      }`}
                    >
                      {/* Unread indicator */}
                      {!notification.isRead && (
                        <div className="absolute top-4 left-2 w-2 h-2 bg-lava-orange rounded-full" />
                      )}

                      {/* Icon */}
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          notification.type === "community"
                            ? "bg-lava-purple/20"
                            : notification.type === "app"
                            ? "bg-green-500/20"
                            : "bg-blue-500/20"
                        }`}
                      >
                        <Icon
                          className={`w-5 h-5 ${
                            notification.type === "community"
                              ? "text-lava-purple"
                              : notification.type === "app"
                              ? "text-green-400"
                              : "text-blue-400"
                          }`}
                        />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h3
                            className={`text-sm font-medium ${
                              notification.isRead ? "text-grey-100" : "text-white"
                            }`}
                          >
                            {notification.title}
                          </h3>
                        </div>
                        <p className="text-sm text-grey-200 line-clamp-2">
                          {notification.body}
                        </p>
                        <p className="text-xs text-grey-200 mt-1">
                          {timeAgo(notification.timestamp)}
                        </p>
                      </div>

                      {/* Link indicator */}
                      {notification.linkTo && (
                        <Link
                          href={notification.linkTo}
                          className="p-1 text-grey-200 hover:text-white"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </Link>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Settings Sheet */}
      <Sheet
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        title="Notification Settings"
      >
        <div className="space-y-6">
          {/* Push permission status */}
          <div className="p-4 bg-grey-650/50 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">
                    Push Notifications
                  </p>
                  <p className="text-xs text-grey-200">
                    {getPushStatusMessage()}
                  </p>
                </div>
              </div>
              {canEnablePush && pushPermission === "default" && (
                <Button
                  size="sm"
                  onClick={handleEnablePush}
                  disabled={pushLoading}
                >
                  {pushLoading ? "..." : "Enable"}
                </Button>
              )}
              {pushPermission === "granted" && pushToken && (
                <Badge variant="success">Active</Badge>
              )}
              {pushPermission === "denied" && (
                <Badge variant="warning">Blocked</Badge>
              )}
            </div>
          </div>

          {/* Category toggles */}
          <div className="space-y-1">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-grey-100">
                Notification Categories
              </h3>
              {isSavingPreferences && (
                <span className="text-xs text-grey-200">Saving...</span>
              )}
            </div>

            <div className="flex items-center justify-between p-4 bg-grey-650/50 rounded-xl">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-lava-purple" />
                <div>
                  <p className="text-sm font-medium text-white">
                    Community Updates
                  </p>
                  <p className="text-xs text-grey-200">
                    Announcements, events, governance
                  </p>
                </div>
              </div>
              <Toggle
                checked={notificationSettings.communityUpdates}
                onChange={(checked) =>
                  handlePreferenceChange("communityUpdates", checked)
                }
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-grey-650/50 rounded-xl">
              <div className="flex items-center gap-3">
                <Wallet className="w-5 h-5 text-green-400" />
                <div>
                  <p className="text-sm font-medium text-white">Wallet Alerts</p>
                  <p className="text-xs text-grey-200">
                    Transaction confirmations, balance changes
                  </p>
                </div>
              </div>
              <Toggle
                checked={notificationSettings.walletAlerts}
                onChange={(checked) =>
                  handlePreferenceChange("walletAlerts", checked)
                }
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-grey-650/50 rounded-xl">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-blue-400" />
                <div>
                  <p className="text-sm font-medium text-white">Price Alerts</p>
                  <p className="text-xs text-grey-200">
                    LAVA price changes and market updates
                  </p>
                </div>
              </div>
              <Toggle
                checked={notificationSettings.priceAlerts}
                onChange={(checked) =>
                  handlePreferenceChange("priceAlerts", checked)
                }
              />
            </div>
          </div>

          {/* Info */}
          <div className="p-3 bg-grey-650/50 rounded-xl">
            <p className="text-xs text-grey-200">
              <span className="text-grey-100 font-medium">Note:</span> Push
              notifications require the app to be installed on your device. On
              iOS, you must add to home screen first.
            </p>
          </div>
        </div>
      </Sheet>
    </div>
  );
}

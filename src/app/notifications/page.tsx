"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  BellOff,
  CheckCheck,
  Users,
  Smartphone,
  Trash2,
  Settings,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { useApp } from "@/context/AppContext";
import { timeAgo } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Sheet } from "@/components/ui/Modal";
import { Toggle } from "@/components/ui/Toggle";

const notificationIcons = {
  community: Users,
  app: Smartphone,
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
  } = useApp();

  const [showSettings, setShowSettings] = useState(false);
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);

  // Check if push is supported and permission status
  const isPushSupported = typeof window !== "undefined" && "Notification" in window;
  const pushPermission =
    typeof window !== "undefined" && "Notification" in window
      ? Notification.permission
      : "default";

  const requestPushPermission = async () => {
    if (!isPushSupported) return;

    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        // In production, this would register the push subscription
        setShowPermissionPrompt(false);
      }
    } catch {
      console.log("Push permission request failed");
    }
  };

  return (
    <div className="min-h-screen pb-4">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
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
        {/* Push notification prompt */}
        {isPushSupported && pushPermission === "default" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
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
                    Get notified about community updates and important announcements
                  </p>
                  <Button size="sm" onClick={requestPushPermission}>
                    Enable Notifications
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
            className="text-center py-12"
          >
            <div className="w-16 h-16 rounded-full bg-grey-425/50 flex items-center justify-center mx-auto mb-4">
              <BellOff className="w-8 h-8 text-grey-200" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">
              No notifications yet
            </h3>
            <p className="text-sm text-grey-200">
              You'll see updates from the community here
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
                    {pushPermission === "granted"
                      ? "Enabled"
                      : pushPermission === "denied"
                      ? "Blocked in browser settings"
                      : "Not enabled"}
                  </p>
                </div>
              </div>
              {pushPermission === "default" && (
                <Button size="sm" onClick={requestPushPermission}>
                  Enable
                </Button>
              )}
              {pushPermission === "granted" && (
                <Badge variant="success">Active</Badge>
              )}
            </div>
          </div>

          {/* Category toggles */}
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-grey-100 mb-3">
              Notification Categories
            </h3>

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
                  updateNotificationSettings({ communityUpdates: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-grey-650/50 rounded-xl">
              <div className="flex items-center gap-3">
                <Smartphone className="w-5 h-5 text-green-400" />
                <div>
                  <p className="text-sm font-medium text-white">App Updates</p>
                  <p className="text-xs text-grey-200">
                    New features and improvements
                  </p>
                </div>
              </div>
              <Toggle
                checked={notificationSettings.appUpdates}
                onChange={(checked) =>
                  updateNotificationSettings({ appUpdates: checked })
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


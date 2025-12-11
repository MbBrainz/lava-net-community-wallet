"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { useAuth, AuthUser } from "@/context/AuthContext";
import { useLavaBalance } from "@/lib/hooks/useLavaBalance";
import { usePushNotifications } from "@/lib/hooks/usePushNotifications";
import { WalletTransaction } from "@/lib/wallet";
import { useAuthFetch } from "@/lib/auth/client";
import {
  mockCommunityPosts,
  mockNotifications,
  mockDeFiApps,
  type CommunityPost,
  type Notification,
  type DeFiApp,
} from "@/lib/mock-data";
import type { PwaInstallEventPayload } from "@/lib/pwa/install-events";

type Theme = "light" | "dark" | "system";

interface NotificationSettings {
  communityUpdates: boolean;
  walletAlerts: boolean;
  priceAlerts: boolean;
}

interface AppContextType {
  // Auth state (from AuthContext)
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AuthUser | null;
  logout: () => Promise<void>;

  // Wallet & Balance data (powered by Dynamic SDK's useTokenBalances)
  walletAddress: string | null;
  lastUpdated: Date | null;
  refreshBalance: () => void;
  isRefreshing: boolean;
  balanceError: Error | null;

  // Balance values
  totalLavaBalance: number;
  arbitrumLavaBalance: number;
  baseLavaBalance: number;
  arbitrumEthBalance: number;
  baseEthBalance: number;

  // Transactions (placeholder for now)
  transactions: WalletTransaction[];
  refreshTransactions: () => Promise<void>;

  // Community (still mocked for now)
  communityPosts: CommunityPost[];
  pinnedPost: CommunityPost | null;

  // Notifications (still mocked for now)
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;

  // DeFi Apps (still mocked for now)
  deFiApps: DeFiApp[];

  // Theme
  theme: Theme;
  setTheme: (theme: Theme) => void;

  // Notification settings
  notificationSettings: NotificationSettings;
  updateNotificationSettings: (settings: Partial<NotificationSettings>) => void;

  // Push notifications
  pushSupported: boolean;
  pushConfigured: boolean;
  pushPermission: NotificationPermission;
  pushToken: string | null;
  pushLoading: boolean;
  pushError: string | null;
  requestPushPermission: () => Promise<boolean>;
  unregisterPush: () => Promise<void>;

  // PWA
  isInstalled: boolean;
  canInstall: boolean;
  installPromptEvent: BeforeInstallPromptEvent | null;
  setInstallPromptEvent: (event: BeforeInstallPromptEvent | null) => void;
  showInstallBanner: boolean;
  setShowInstallBanner: (show: boolean) => void;
  trackPwaInstallEvent: (payload: PwaInstallEventPayload) => Promise<void>;

  // Offline
  isOffline: boolean;
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  // Get auth state from AuthContext
  const {
    isAuthenticated,
    isLoading: authLoading,
    user,
    logout: authLogout,
  } = useAuth();
  const { authFetch } = useAuthFetch();

  // Balance state from Dynamic SDK's useTokenBalances hook
  const {
    arbitrumLava,
    baseLava,
    totalLava,
    arbitrumEth,
    baseEth,
    isLoading: balanceLoading,
    error: balanceErrorDetails,
    lastUpdated,
    refetch: refreshBalanceFromHook,
  } = useLavaBalance();

  // Transactions (placeholder)
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);

  // Community (mocked)
  const [communityPosts] = useState<CommunityPost[]>(mockCommunityPosts);
  const pinnedPost = communityPosts.find((p) => p.isPinned) || null;

  // Notifications (mocked)
  const [notifications, setNotifications] =
    useState<Notification[]>(mockNotifications);
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // DeFi Apps (mocked)
  const [deFiApps] = useState<DeFiApp[]>(mockDeFiApps);

  // Theme
  const [theme, setThemeState] = useState<Theme>("dark");

  // Notification settings
  const [notificationSettings, setNotificationSettings] =
    useState<NotificationSettings>({
      communityUpdates: true,
      walletAlerts: true,
      priceAlerts: true,
    });

  // PWA state (must be before push notifications for iOS gate)
  const [isInstalled, setIsInstalled] = useState(false);

  // Push notifications
  const {
    isSupported: pushSupported,
    isConfigured: pushConfigured,
    permission: pushPermission,
    token: pushToken,
    isLoading: pushLoading,
    error: pushError,
    requestPermission: requestPushPermissionBase,
    unregister: unregisterPush,
  } = usePushNotifications();

  /**
   * Request push permission - gated behind PWA installation on iOS.
   * iOS requires the app to be installed to the home screen for push to work.
   */
  const requestPushPermission = useCallback(async (): Promise<boolean> => {
    // Check if we're on iOS and not installed
    const isIOSDevice = /iphone|ipad|ipod/i.test(navigator.userAgent);
    if (isIOSDevice && !isInstalled) {
      console.warn("[Push] iOS requires app to be installed for push notifications");
      return false;
    }
    return requestPushPermissionBase();
  }, [isInstalled, requestPushPermissionBase]);

  // PWA state (continued)
  const [canInstall, setCanInstall] = useState(false);
  const [installPromptEvent, setInstallPromptEvent] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  // Offline state
  const [isOffline, setIsOffline] = useState(false);

  // Wallet address from user
  const walletAddress = user?.walletAddress || null;

  const trackPwaInstallEvent = useCallback(
    async (payload: PwaInstallEventPayload) => {
      if (typeof window === "undefined") {
        return;
      }

      try {
        const nav = window.navigator as Navigator & { standalone?: boolean };
        const displayModeStandalone = window.matchMedia
          ? window.matchMedia("(display-mode: standalone)").matches
          : false;
        const fallbackStandalone = displayModeStandalone || nav.standalone === true;
        const platform = payload.platform ?? nav.platform ?? null;
        const userAgent = payload.userAgent ?? nav.userAgent ?? null;
        const occurredAt = payload.occurredAt ?? new Date().toISOString();

        await authFetch("/api/pwa/install", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            eventType: payload.eventType,
            triggeredBy: payload.triggeredBy,
            installSurface: payload.installSurface,
            metadata: payload.metadata,
            platform,
            userAgent,
            occurredAt,
            isStandalone: payload.isStandalone ?? fallbackStandalone,
          }),
        });
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          console.error("[PWA] Failed to track install event", error);
        }
      }
    },
    [authFetch]
  );

  // Balance values from Dynamic SDK hook
  const totalLavaBalance = totalLava;
  const arbitrumLavaBalance = arbitrumLava;
  const baseLavaBalance = baseLava;
  const arbitrumEthBalance = arbitrumEth;
  const baseEthBalance = baseEth;

  // Refresh balance using Dynamic SDK's refetch
  const refreshBalance = useCallback(() => {
    if (!walletAddress || isOffline) return;
    refreshBalanceFromHook();
  }, [walletAddress, isOffline, refreshBalanceFromHook]);

  // Clear transactions when logged out
  useEffect(() => {
    if (!isAuthenticated) {
      setTransactions([]);
    }
  }, [isAuthenticated]);

  // Refresh transactions (placeholder)
  const refreshTransactions = useCallback(async () => {
    if (!walletAddress || isOffline) return;
    // TODO: Implement transaction fetching from block explorer APIs
  }, [walletAddress, isOffline]);

  // Logout handler
  const logout = useCallback(async () => {
    // Clear local state
    setTransactions([]);
    // Call auth logout
    await authLogout();
  }, [authLogout]);

  // Check if running as PWA
  useEffect(() => {
    const checkInstalled = () => {
      const isStandalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as Navigator & { standalone?: boolean }).standalone ===
          true;
      setIsInstalled(isStandalone);
      if (!isStandalone) {
        // Delay showing the install banner
        setTimeout(() => setShowInstallBanner(true), 3000);
      }
    };
    checkInstalled();

    window
      .matchMedia("(display-mode: standalone)")
      .addEventListener("change", checkInstalled);

    return () => {
      window
        .matchMedia("(display-mode: standalone)")
        .removeEventListener("change", checkInstalled);
    };
  }, []);

  // Listen for install prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPromptEvent(e as BeforeInstallPromptEvent);
      setCanInstall(true);
      void trackPwaInstallEvent({
        eventType: "prompt_available",
        triggeredBy: "install_banner",
        installSurface: "beforeinstallprompt",
      });
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
    };
  }, [trackPwaInstallEvent]);

  useEffect(() => {
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallBanner(false);
      void trackPwaInstallEvent({
        eventType: "installed",
        triggeredBy: "appinstalled",
        installSurface: "system_event",
      });
    };

    window.addEventListener("appinstalled", handleAppInstalled);
    return () => {
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, [trackPwaInstallEvent]);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    setIsOffline(!navigator.onLine);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Theme handling
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as Theme | null;
    if (savedTheme) {
      setThemeState(savedTheme);
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }

    localStorage.setItem("theme", theme);
  }, [theme]);

  // Notification methods
  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  // Theme setter
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  // Notification settings
  const updateNotificationSettings = (
    settings: Partial<NotificationSettings>
  ) => {
    setNotificationSettings((prev) => ({ ...prev, ...settings }));
  };

  return (
    <AppContext.Provider
      value={{
        isAuthenticated,
        isLoading: authLoading || balanceLoading,
        user,
        logout,
        walletAddress,
        lastUpdated,
        refreshBalance,
        isRefreshing: balanceLoading,
        balanceError: balanceErrorDetails,
        totalLavaBalance,
        arbitrumLavaBalance,
        baseLavaBalance,
        arbitrumEthBalance,
        baseEthBalance,
        transactions,
        refreshTransactions,
        communityPosts,
        pinnedPost,
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        deFiApps,
        theme,
        setTheme,
        notificationSettings,
        updateNotificationSettings,
        pushSupported,
        pushConfigured,
        pushPermission,
        pushToken,
        pushLoading,
        pushError,
        requestPushPermission,
        unregisterPush,
        isInstalled,
        canInstall,
        installPromptEvent,
        setInstallPromptEvent,
        showInstallBanner,
        setShowInstallBanner,
        trackPwaInstallEvent,
        isOffline,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}

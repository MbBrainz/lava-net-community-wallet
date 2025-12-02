"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import {
  mockUserProfile,
  mockChainBalances,
  mockTransactions,
  mockCommunityPosts,
  mockNotifications,
  mockDeFiApps,
  mockTotalLava,
  mockTotalUsdValue,
  mockStakedLava,
  mockStakedPercentage,
  MOCK_LAVA_PRICE,
  type UserProfile,
  type ChainBalance,
  type Transaction,
  type CommunityPost,
  type Notification,
  type DeFiApp,
} from "@/lib/mock-data";

type Theme = "light" | "dark" | "system";

interface NotificationSettings {
  communityUpdates: boolean;
  appUpdates: boolean;
}

interface AppContextType {
  // Auth state (mocked)
  isAuthenticated: boolean;
  isLoading: boolean;
  user: UserProfile | null;
  login: (email: string) => Promise<void>;
  logout: () => void;

  // Portfolio data
  chainBalances: ChainBalance[];
  totalLava: number;
  totalUsdValue: number;
  stakedLava: number;
  stakedPercentage: number;
  lavaPrice: number;
  lastUpdated: Date;
  refreshPortfolio: () => Promise<void>;

  // Transactions
  transactions: Transaction[];

  // Community
  communityPosts: CommunityPost[];
  pinnedPost: CommunityPost | null;

  // Notifications
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;

  // DeFi Apps
  deFiApps: DeFiApp[];

  // Theme
  theme: Theme;
  setTheme: (theme: Theme) => void;

  // Notification settings
  notificationSettings: NotificationSettings;
  updateNotificationSettings: (settings: Partial<NotificationSettings>) => void;

  // PWA
  isInstalled: boolean;
  canInstall: boolean;
  installPromptEvent: BeforeInstallPromptEvent | null;
  setInstallPromptEvent: (event: BeforeInstallPromptEvent | null) => void;
  showInstallBanner: boolean;
  setShowInstallBanner: (show: boolean) => void;

  // Offline
  isOffline: boolean;
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(true); // Demo: start logged in
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(mockUserProfile);

  // Portfolio (using mock data)
  const [chainBalances] = useState<ChainBalance[]>(mockChainBalances);
  const [totalLava] = useState(mockTotalLava);
  const [totalUsdValue] = useState(mockTotalUsdValue);
  const [stakedLava] = useState(mockStakedLava);
  const [stakedPercentage] = useState(mockStakedPercentage);
  const [lavaPrice] = useState(MOCK_LAVA_PRICE);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Transactions
  const [transactions] = useState<Transaction[]>(mockTransactions);

  // Community
  const [communityPosts] = useState<CommunityPost[]>(mockCommunityPosts);
  const pinnedPost = communityPosts.find((p) => p.isPinned) || null;

  // Notifications
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // DeFi Apps
  const [deFiApps] = useState<DeFiApp[]>(mockDeFiApps);

  // Theme
  const [theme, setThemeState] = useState<Theme>("dark");

  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    communityUpdates: true,
    appUpdates: true,
  });

  // PWA state
  const [isInstalled, setIsInstalled] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  const [installPromptEvent, setInstallPromptEvent] = useState<BeforeInstallPromptEvent | null>(
    null
  );
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  // Offline state
  const [isOffline, setIsOffline] = useState(false);

  // Check if running as PWA
  useEffect(() => {
    const checkInstalled = () => {
      const isStandalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
      setIsInstalled(isStandalone);
      if (!isStandalone) {
        // Delay showing the install banner
        setTimeout(() => setShowInstallBanner(true), 3000);
      }
    };
    checkInstalled();

    // Listen for display mode changes
    window.matchMedia("(display-mode: standalone)").addEventListener("change", checkInstalled);

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
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

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
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }

    localStorage.setItem("theme", theme);
  }, [theme]);

  // Auth methods (mocked)
  const login = async (email: string) => {
    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setUser({ ...mockUserProfile, email });
    setIsAuthenticated(true);
    setIsLoading(false);
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
  };

  // Portfolio refresh (mocked)
  const refreshPortfolio = async () => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setLastUpdated(new Date());
    setIsLoading(false);
  };

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
  const updateNotificationSettings = (settings: Partial<NotificationSettings>) => {
    setNotificationSettings((prev) => ({ ...prev, ...settings }));
  };

  return (
    <AppContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        user,
        login,
        logout,
        chainBalances,
        totalLava,
        totalUsdValue,
        stakedLava,
        stakedPercentage,
        lavaPrice,
        lastUpdated,
        refreshPortfolio,
        transactions,
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
        isInstalled,
        canInstall,
        installPromptEvent,
        setInstallPromptEvent,
        showInstallBanner,
        setShowInstallBanner,
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



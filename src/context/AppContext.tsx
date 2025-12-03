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
import {
  fetchBalanceWithCache,
  clearBalanceCache,
  type MultiChainBalance,
} from "@/lib/services/balance";
import { WalletTransaction } from "@/lib/wallet";
import {
  mockCommunityPosts,
  mockNotifications,
  mockDeFiApps,
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
  // Auth state (from AuthContext)
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AuthUser | null;
  logout: () => Promise<void>;

  // Wallet & Balance data
  walletAddress: string | null;
  multiChainBalance: MultiChainBalance | null;
  lastUpdated: Date;
  refreshBalance: () => Promise<void>;
  isRefreshing: boolean;

  // Computed balance values
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
  // Get auth state from AuthContext
  const {
    isAuthenticated,
    isLoading: authLoading,
    user,
    logout: authLogout,
  } = useAuth();

  // Balance state
  const [multiChainBalance, setMultiChainBalance] = useState<MultiChainBalance | null>(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

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
      appUpdates: true,
    });

  // PWA state
  const [isInstalled, setIsInstalled] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  const [installPromptEvent, setInstallPromptEvent] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  // Offline state
  const [isOffline, setIsOffline] = useState(false);

  // Wallet address from user
  const walletAddress = user?.walletAddress || null;

  // Computed balance values
  const totalLavaBalance = multiChainBalance?.totalLavaBalance || 0;

  const arbitrumLavaBalance = multiChainBalance?.chains
    .find((c) => c.chainId === 42161)
    ?.tokens.find((t) => t.symbol === "LAVA")?.balanceFormatted || 0;

  const baseLavaBalance = multiChainBalance?.chains
    .find((c) => c.chainId === 8453)
    ?.tokens.find((t) => t.symbol === "LAVA")?.balanceFormatted || 0;

  const arbitrumEthBalance = multiChainBalance?.chains
    .find((c) => c.chainId === 42161)?.nativeBalanceFormatted || 0;

  const baseEthBalance = multiChainBalance?.chains
    .find((c) => c.chainId === 8453)?.nativeBalanceFormatted || 0;

  // Fetch balance when wallet address changes
  useEffect(() => {
    const fetchData = async () => {
      if (walletAddress && isAuthenticated && !isOffline) {
        try {
          console.log("[AppContext] Fetching balance for:", walletAddress);
          const balance = await fetchBalanceWithCache(walletAddress as `0x${string}`, true);
          setMultiChainBalance(balance);
          setLastUpdated(new Date());
          console.log("[AppContext] Balance fetched:", balance);
        } catch (error) {
          console.error("[AppContext] Failed to fetch balance:", error);
        }
      } else {
        // Clear data when logged out
        setMultiChainBalance(null);
        setTransactions([]);
      }
    };

    fetchData();
  }, [walletAddress, isAuthenticated, isOffline]);

  // Refresh balance
  const refreshBalance = useCallback(async () => {
    if (!walletAddress || isOffline) return;

    setIsRefreshing(true);
    try {
      const balance = await fetchBalanceWithCache(walletAddress as `0x${string}`, true);
      setMultiChainBalance(balance);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("[AppContext] Failed to refresh balance:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [walletAddress, isOffline]);

  // Refresh transactions (placeholder)
  const refreshTransactions = useCallback(async () => {
    if (!walletAddress || isOffline) return;
    // TODO: Implement transaction fetching from block explorer APIs
  }, [walletAddress, isOffline]);

  // Logout handler
  const logout = useCallback(async () => {
    // Clear caches
    if (walletAddress) {
      clearBalanceCache(walletAddress);
    }
    // Clear local state
    setMultiChainBalance(null);
    setTransactions([]);
    // Call auth logout
    await authLogout();
  }, [walletAddress, authLogout]);

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
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
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
        isLoading: authLoading,
        user,
        logout,
        walletAddress,
        multiChainBalance,
        lastUpdated,
        refreshBalance,
        isRefreshing,
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

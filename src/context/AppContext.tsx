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
import { fetchLavaBalance, clearBalanceCache } from "@/lib/services/balance";
import {
  fetchTransactionHistory,
  clearTransactionCache,
} from "@/lib/services/transactions";
import { WalletBalance, WalletTransaction } from "@/lib/wallet";
import {
  mockCommunityPosts,
  mockNotifications,
  mockDeFiApps,
  MOCK_LAVA_PRICE,
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
  balance: WalletBalance | null;
  lavaPrice: number;
  lastUpdated: Date;
  refreshBalance: () => Promise<void>;
  isRefreshing: boolean;

  // Computed balance values
  totalLava: number;
  totalUsdValue: number;
  availableLava: number;
  stakedLava: number;
  rewardsLava: number;
  stakedPercentage: number;

  // Transactions
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
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [lavaPrice] = useState(MOCK_LAVA_PRICE); // TODO: Fetch real price
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Transactions
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
  const totalLava = balance?.total || 0;
  const availableLava = balance?.available || 0;
  const stakedLava = balance?.staked || 0;
  const rewardsLava = balance?.rewards || 0;
  const totalUsdValue = totalLava * lavaPrice;
  const stakedPercentage = totalLava > 0 ? (stakedLava / totalLava) * 100 : 0;

  // Fetch balance when wallet address changes
  useEffect(() => {
    const fetchData = async () => {
      if (walletAddress && isAuthenticated && !isOffline) {
        // Fetch balance
        try {
          const newBalance = await fetchLavaBalance(walletAddress, true);
          setBalance(newBalance);
          setLastUpdated(new Date());
        } catch (error) {
          console.error("[AppContext] Failed to fetch balance:", error);
        }
        
        // Fetch transactions
        try {
          const txHistory = await fetchTransactionHistory(walletAddress, true);
          setTransactions(txHistory);
        } catch (error) {
          console.error("[AppContext] Failed to fetch transactions:", error);
        }
      } else {
        // Clear data when logged out
        setBalance(null);
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
      const newBalance = await fetchLavaBalance(walletAddress, true);
      setBalance(newBalance);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("[AppContext] Failed to refresh balance:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [walletAddress, isOffline]);

  // Refresh transactions
  const refreshTransactions = useCallback(async () => {
    if (!walletAddress || isOffline) return;

    try {
      const txHistory = await fetchTransactionHistory(walletAddress, true);
      setTransactions(txHistory);
    } catch (error) {
      console.error("[AppContext] Failed to refresh transactions:", error);
    }
  }, [walletAddress, isOffline]);

  // Logout handler
  const logout = useCallback(async () => {
    // Clear caches
    if (walletAddress) {
      clearBalanceCache(walletAddress);
      clearTransactionCache(walletAddress);
    }
    // Clear local state
    setBalance(null);
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
        balance,
        lavaPrice,
        lastUpdated,
        refreshBalance,
        isRefreshing,
        totalLava,
        totalUsdValue,
        availableLava,
        stakedLava,
        rewardsLava,
        stakedPercentage,
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

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(num: number, decimals = 2): string {
  if (num >= 1_000_000_000) {
    return (num / 1_000_000_000).toFixed(decimals) + "B";
  }
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(decimals) + "M";
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(decimals) + "K";
  }
  return num.toFixed(decimals);
}

export function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatLavaAmount(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(amount);
}

export function shortenAddress(address: string, chars = 4): string {
  if (!address) return "";
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

export function timeAgo(date: Date | string): string {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return past.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function isIOS(): boolean {
  if (typeof window === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

export function isAndroid(): boolean {
  if (typeof window === "undefined") return false;
  return /Android/.test(navigator.userAgent);
}

export function isPWA(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function isMobile(): boolean {
  if (typeof window === "undefined") return false;
  return /Mobi|Android/i.test(navigator.userAgent);
}

export function getChainColor(chain: string): string {
  const colors: Record<string, string> = {
    lava: "#FF3900",
    ethereum: "#627EEA",
    base: "#0052FF",
    arbitrum: "#12AAFF",
    optimism: "#FF0420",
    polygon: "#8247E5",
  };
  return colors[chain.toLowerCase()] || "#787A7E";
}

export function getChainIcon(chain: string): string {
  // In a real app, these would be actual chain icons
  const icons: Record<string, string> = {
    lava: "🌋",
    ethereum: "⟠",
    base: "🔵",
    arbitrum: "🔷",
    optimism: "🔴",
    polygon: "🟣",
  };
  return icons[chain.toLowerCase()] || "⬡";
}



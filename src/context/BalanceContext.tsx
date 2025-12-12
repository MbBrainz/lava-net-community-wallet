"use client";

import type { ReactNode } from "react";
import { createContext, useContext, useMemo } from "react";
import { useLavaBalance } from "@/lib/hooks/useLavaBalance";

interface BalanceContextValue {
  // Balance values
  totalLavaBalance: number;
  arbitrumLavaBalance: number;
  baseLavaBalance: number;
  arbitrumEthBalance: number;
  baseEthBalance: number;

  // Meta
  lastUpdated: Date | null;
  isRefreshing: boolean;

  // Actions
  refreshBalance: () => void;
}

const BalanceContext = createContext<BalanceContextValue | undefined>(undefined);

export function BalanceProvider({ children }: { children: ReactNode }) {
  const {
    arbitrumLava,
    baseLava,
    totalLava,
    arbitrumEth,
    baseEth,
    isLoading,
    lastUpdated,
    refetch,
  } = useLavaBalance();

  const value = useMemo<BalanceContextValue>(
    () => ({
      totalLavaBalance: totalLava,
      arbitrumLavaBalance: arbitrumLava,
      baseLavaBalance: baseLava,
      arbitrumEthBalance: arbitrumEth,
      baseEthBalance: baseEth,
      lastUpdated,
      isRefreshing: isLoading,
      refreshBalance: refetch,
    }),
    [
      totalLava,
      arbitrumLava,
      baseLava,
      arbitrumEth,
      baseEth,
      lastUpdated,
      isLoading,
      refetch,
    ]
  );

  return <BalanceContext.Provider value={value}>{children}</BalanceContext.Provider>;
}

export function useBalance() {
  const context = useContext(BalanceContext);
  if (!context) {
    throw new Error("useBalance must be used within a BalanceProvider");
  }
  return context;
}


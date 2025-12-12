"use client";

import type { ReactNode } from "react";
import { createContext, useCallback, useContext } from "react";
import { usePathname, useRouter } from "next/navigation";

interface SwapOptions {
  /** Whether to default to LAVA as destination token (default: true) */
  defaultToLava?: boolean;
  /** Custom title for the swap sheet */
  title?: string;
  /** Optional return URL (defaults to current pathname) */
  returnUrl?: string;
}

interface SwapContextType {
  /** Navigate to the swap route */
  openSwap: (options?: SwapOptions) => void;
}

const SwapContext = createContext<SwapContextType | undefined>(undefined);

interface SwapProviderProps {
  children: ReactNode;
}

export function SwapProvider({ children }: SwapProviderProps) {
  const router = useRouter();
  const pathname = usePathname();

  const openSwap = useCallback(
    (opts?: SwapOptions) => {
      const defaultToLava = opts?.defaultToLava ?? true;
      const title = opts?.title ?? (defaultToLava ? "Get LAVA" : "Swap");
      const returnUrl = opts?.returnUrl ?? pathname ?? "/";

      const params = new URLSearchParams({
        defaultToLava: defaultToLava ? "true" : "false",
        title,
        returnUrl,
      });

      router.push(`/swap?${params.toString()}`);
    },
    [pathname, router]
  );

  return (
    <SwapContext.Provider
      value={{
        openSwap,
      }}
    >
      {children}
    </SwapContext.Provider>
  );
}

export function useSwap() {
  const context = useContext(SwapContext);
  if (context === undefined) {
    throw new Error("useSwap must be used within a SwapProvider");
  }
  return context;
}

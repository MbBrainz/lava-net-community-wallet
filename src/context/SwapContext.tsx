"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from "react";
import dynamic from "next/dynamic";

/**
 * Dynamically import SwapWidget to create a separate chunk.
 * This keeps LI.FI (~2-3MB) out of the main bundle.
 * The chunk is still precached by the service worker for PWA.
 */
const SwapWidget = dynamic(
  () => import("@/components/swap/SwapWidget").then((mod) => mod.SwapWidget),
  { ssr: false }
);

interface SwapOptions {
  /** Whether to default to LAVA as destination token (default: true) */
  defaultToLava?: boolean;
  /** Custom title for the swap sheet */
  title?: string;
}

interface SwapContextType {
  /** Open the swap widget */
  openSwap: (options?: SwapOptions) => void;
  /** Close the swap widget */
  closeSwap: () => void;
  /** Whether the swap widget is currently open */
  isSwapOpen: boolean;
}

const SwapContext = createContext<SwapContextType | undefined>(undefined);

interface SwapProviderProps {
  children: ReactNode;
}

export function SwapProvider({ children }: SwapProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<SwapOptions>({
    defaultToLava: true,
    title: "Swap",
  });

  // Background prefetch: Load SwapWidget chunk after app settles
  // This ensures the swap is instant when user clicks "Get LAVA"
  useEffect(() => {
    const timer = setTimeout(() => {
      import("@/components/swap/SwapWidget");
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const openSwap = useCallback((opts?: SwapOptions) => {
    setOptions({
      defaultToLava: opts?.defaultToLava ?? true,
      title: opts?.title ?? (opts?.defaultToLava !== false ? "Get LAVA" : "Swap"),
    });
    setIsOpen(true);
  }, []);

  const closeSwap = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <SwapContext.Provider
      value={{
        openSwap,
        closeSwap,
        isSwapOpen: isOpen,
      }}
    >
      {children}
      {/* Only mount when open - triggers chunk load if not prefetched */}
      {isOpen && (
        <SwapWidget
          isOpen={isOpen}
          onClose={closeSwap}
          defaultToLava={options.defaultToLava}
          title={options.title}
        />
      )}
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

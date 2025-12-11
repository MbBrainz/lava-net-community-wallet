"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { SwapWidget } from "@/components/swap";

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
      <SwapWidget
        isOpen={isOpen}
        onClose={closeSwap}
        defaultToLava={options.defaultToLava}
        title={options.title}
      />
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

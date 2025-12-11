"use client";

import { useEffect, useState } from "react";
import { LiFiWidget } from "@lifi/widget";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2 } from "lucide-react";
import { getLavaConfig, swapConfig } from "@/lib/lifi";
import type { WidgetConfig } from "@lifi/widget";

interface SwapWidgetProps {
  /** Whether the swap sheet is open */
  isOpen: boolean;
  /** Callback when the sheet should close */
  onClose: () => void;
  /** Whether to default to LAVA as destination token */
  defaultToLava?: boolean;
  /** Custom title for the sheet */
  title?: string;
}

export function SwapWidget({
  isOpen,
  onClose,
  defaultToLava = true,
  title = "Swap",
}: SwapWidgetProps) {
  const { setShowAuthFlow, primaryWallet, sdkHasLoaded } = useDynamicContext();
  const [isWidgetReady, setIsWidgetReady] = useState(false);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Reset widget ready state when opening
  useEffect(() => {
    if (isOpen) {
      // Small delay to allow animation to start
      const timer = setTimeout(() => setIsWidgetReady(true), 100);
      return () => clearTimeout(timer);
    } else {
      setIsWidgetReady(false);
    }
  }, [isOpen]);

  // Get the appropriate config based on mode
  const baseConfig = defaultToLava ? getLavaConfig : swapConfig;

  // Create config with wallet connection callback
  const widgetConfig: WidgetConfig = {
    ...baseConfig,
    walletConfig: {
      onConnect: () => {
        // Open Dynamic's auth flow when user clicks "Connect Wallet" in LI.FI widget
        setShowAuthFlow?.(true);
      },
    },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[70]">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="absolute bottom-0 left-0 right-0 bg-grey-550 rounded-t-3xl safe-area-bottom max-h-[95vh] overflow-hidden flex flex-col"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 bg-grey-425 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-grey-425/50 flex-shrink-0">
              <h2 className="text-lg font-semibold text-white">{title}</h2>
              <button
                onClick={onClose}
                className="p-2 text-grey-200 hover:text-white hover:bg-grey-425 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content - LI.FI Widget */}
            <div className="flex-1 overflow-y-auto hide-scrollbar px-4 py-4">
              {!sdkHasLoaded || !isWidgetReady ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 text-lava-orange animate-spin mx-auto mb-3" />
                    <p className="text-sm text-grey-200">Loading swap widget...</p>
                  </div>
                </div>
              ) : (
                <LiFiWidget
                  integrator="lava-community-wallet"
                  config={widgetConfig}
                />
              )}
            </div>

            {/* Footer - Connection status */}
            {primaryWallet && (
              <div className="px-5 py-3 border-t border-grey-425/50 flex-shrink-0">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-grey-200">Connected wallet</span>
                  <span className="text-white font-mono">
                    {primaryWallet.address.slice(0, 6)}...
                    {primaryWallet.address.slice(-4)}
                  </span>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// Hook for managing swap widget state
export function useSwapWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [defaultToLava, setDefaultToLava] = useState(true);

  const openSwap = (options?: { defaultToLava?: boolean }) => {
    setDefaultToLava(options?.defaultToLava ?? true);
    setIsOpen(true);
  };

  const closeSwap = () => {
    setIsOpen(false);
  };

  return {
    isOpen,
    defaultToLava,
    openSwap,
    closeSwap,
  };
}

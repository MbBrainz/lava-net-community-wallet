// LI.FI Widget Configuration
// Centralized configuration for the swap widget

import type { WidgetConfig } from "@lifi/widget";
import { LAVA_TOKEN_ADDRESS } from "@/lib/chains/registry";
import { SUPPORTED_CHAIN_IDS } from "@/lib/wagmi";

// Lava token configuration on supported chains
const LAVA_TOKEN = {
  chainId: 42161, // Arbitrum (primary chain for LAVA)
  address: LAVA_TOKEN_ADDRESS,
  symbol: "LAVA",
  decimals: 18,
  name: "Lava Token",
  logoURI: "/lava-brand-kit/logos/logo-symbol-color.png",
};

// Theme colors matching Lava brand
const LIFI_THEME = {
  palette: {
    primary: {
      main: "#FF3900", // lava-orange
    },
    secondary: {
      main: "#EF6000", // lava-spanish-orange
    },
    background: {
      default: "#05090F", // grey-650
      paper: "#0C121A", // grey-550
    },
    text: {
      primary: "#EDEDED", // grey-25
      secondary: "#B9B9B9", // grey-100
    },
    grey: {
      200: "#787A7E",
      300: "#212630", // grey-425
      700: "#0C121A",
      800: "#05090F",
    },
  },
  shape: {
    borderRadius: 12,
    borderRadiusSecondary: 8,
  },
  container: {
    boxShadow: "0px 0px 0px rgba(0, 0, 0, 0)",
    borderRadius: "16px",
  },
};

interface LiFiConfigOptions {
  /** Default chain ID for "to" token (default: 42161 - Arbitrum) */
  toChainId?: number;
  /** Whether to default to LAVA as destination token */
  defaultToLava?: boolean;
  /** Fee percentage (0.01 = 1%) - must be configured in LI.FI partner portal */
  feePercentage?: number;
  /** Limit chains to only supported ones */
  limitChains?: boolean;
}

export function createLiFiConfig(options: LiFiConfigOptions = {}): WidgetConfig {
  const {
    toChainId = 42161, // Arbitrum
    defaultToLava = true,
    feePercentage = 0.01, // 1%
    limitChains = true,
  } = options;

  const config: WidgetConfig = {
    // Integration identifier - required
    integrator: "lava-community-wallet",

    // API key from environment
    apiKey: process.env.NEXT_PUBLIC_LIFI_API_KEY,

    // Default token selections
    ...(defaultToLava && {
      toChain: toChainId,
      toToken: LAVA_TOKEN.address,
    }),

    // Chain restrictions
    ...(limitChains && {
      chains: {
        allow: SUPPORTED_CHAIN_IDS,
      },
    }),

    // Fee configuration (must match LI.FI partner portal settings)
    fee: feePercentage,

    // Appearance
    appearance: "dark",
    theme: LIFI_THEME,

    // Hide elements we don't need
    hiddenUI: [
      "appearance", // We force dark mode
      "language", // Single language for now
    ],

    // SDK configuration for embedded wallets
    sdkConfig: {
      // Route options for better UX
      routeOptions: {
        order: "CHEAPEST",
        maxPriceImpact: 0.3,
        slippage: 0.005, // 0.5%
      },
    },
  };

  return config;
}

// Pre-configured defaults for easy import
export const defaultLiFiConfig = createLiFiConfig();

// Config for "Get LAVA" flow (always defaults to LAVA)
export const getLavaConfig = createLiFiConfig({
  defaultToLava: true,
  toChainId: 42161,
});

// Config for general swapping (no defaults)
export const swapConfig = createLiFiConfig({
  defaultToLava: false,
  limitChains: true,
});

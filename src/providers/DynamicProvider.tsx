"use client";

import { ReactNode } from "react";
import { DynamicContextProvider } from "@dynamic-labs/sdk-react-core";
import { CosmosWalletConnectors } from "@dynamic-labs/cosmos";
import { EthereumWalletConnectors } from "@dynamic-labs/ethereum";
import { LAVA_CHAIN_CONFIG } from "@/lib/chains/lava";

interface DynamicProviderProps {
  children: ReactNode;
}

// Custom Lava Network chain configuration for Dynamic SDK
const lavaNetworkConfig = {
  blockExplorerUrls: [LAVA_CHAIN_CONFIG.explorerUrl],
  chainId: LAVA_CHAIN_CONFIG.chainId,
  chainName: LAVA_CHAIN_CONFIG.chainName,
  iconUrls: ["/lava-brand-kit/logos/logo-symbol-color.png"],
  name: LAVA_CHAIN_CONFIG.chainName,
  nativeCurrency: {
    decimals: LAVA_CHAIN_CONFIG.decimals,
    denom: LAVA_CHAIN_CONFIG.denom,
    name: LAVA_CHAIN_CONFIG.displayDenom,
    symbol: LAVA_CHAIN_CONFIG.displayDenom,
  },
  networkId: LAVA_CHAIN_CONFIG.chainId,
  rpcUrls: [LAVA_CHAIN_CONFIG.rpcUrl],
  vanityName: "Lava",
  shortName: "lava",
};

export function DynamicProvider({ children }: DynamicProviderProps) {
  const environmentId = process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID;

  if (!environmentId) {
    console.error("NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID is not set");
    // In development, show a helpful message
    if (process.env.NODE_ENV === "development") {
      return (
        <div className="min-h-screen flex items-center justify-center bg-grey-650 text-white p-4">
          <div className="text-center">
            <h1 className="text-xl font-bold mb-2">Configuration Required</h1>
            <p className="text-grey-200">
              Please set NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID in your .env.local file
            </p>
          </div>
        </div>
      );
    }
    return null;
  }

  return (
    <DynamicContextProvider
      settings={{
        environmentId,
        walletConnectors: [CosmosWalletConnectors, EthereumWalletConnectors],

        // Override networks to include Lava
        overrides: {
          cosmosNetworks: [lavaNetworkConfig],
        },

        // Events configuration
        events: {
          onAuthFlowClose: () => {
            console.log("[Dynamic] Auth flow closed");
          },
          onAuthFlowOpen: () => {
            console.log("[Dynamic] Auth flow opened");
          },
          onAuthSuccess: (args) => {
            console.log("[Dynamic] Auth success", args);
          },
          onLogout: () => {
            console.log("[Dynamic] User logged out");
          },
        },

        // Privacy policy and terms
        privacyPolicyUrl: "https://lavanet.xyz/privacy",
        termsOfServiceUrl: "https://lavanet.xyz/terms",
      }}
    >
      {children}
    </DynamicContextProvider>
  );
}

"use client";

import { ReactNode } from "react";
import { DynamicContextProvider } from "@dynamic-labs/sdk-react-core";
import { EthereumWalletConnectors } from "@dynamic-labs/ethereum";
import { CHAIN_CONFIGS, getDefaultChain } from "@/lib/chains/registry";

interface DynamicProviderProps {
  children: ReactNode;
}

// Build EVM networks configuration for Dynamic SDK
const evmNetworks = Object.values(CHAIN_CONFIGS)
  .filter((chain) => chain.isEnabled)
  .map((chain) => ({
    chainId: chain.chainId,
    name: chain.displayName,
    rpcUrls: [chain.rpcUrl],
    nativeCurrency: chain.nativeCurrency,
    blockExplorerUrls: [chain.blockExplorerUrl],
    iconUrls: [chain.iconPath],
    networkId: chain.chainId,
    vanityName: chain.name,
  }));

const defaultChain = getDefaultChain();

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
        walletConnectors: [EthereumWalletConnectors],

        // Configure EVM networks with Arbitrum as default
        overrides: {
          evmNetworks,
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

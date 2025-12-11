"use client";

import { ReactNode } from "react";
import { DynamicContextProvider, getAuthToken } from "@dynamic-labs/sdk-react-core";
import { EthereumWalletConnectors } from "@dynamic-labs/ethereum";
import { DynamicWagmiConnector } from "@dynamic-labs/wagmi-connector";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CHAIN_CONFIGS } from "@/lib/chains/registry";
import { wagmiConfig } from "@/lib/wagmi";
import { getReferral, clearReferral, clearAllReferralData } from "@/lib/referral/storage";

// Create a stable QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      gcTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

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

/**
 * Process referral for new users on signup.
 * Called from onAuthSuccess when user is new.
 * Uses the auth token to authenticate the request server-side.
 */
async function processNewUserReferral() {
  // 1. Read referral from localStorage
  const referralData = getReferral();

  if (!referralData) {
    if (process.env.NODE_ENV === "development") {
      console.log("[Referral] No referral data found");
    }
    return;
  }

  // 2. Get the auth token from Dynamic
  const authToken = getAuthToken();
  if (!authToken) {
    console.error("[Referral] No auth token available for convert API");
    return;
  }

  // 3. Call convert API with auth token
  try {
    const response = await fetch("/api/referrals/convert", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        code: referralData.code,
      }),
    });

    const data = await response.json();

    if (response.ok && data.status === "success") {
      if (process.env.NODE_ENV === "development") {
        console.log("[Referral] Conversion successful:", data);
      }
      // Clear referral data after successful conversion
      clearReferral();
    } else if (data.status === "already_referred") {
      if (process.env.NODE_ENV === "development") {
        console.log("[Referral] User already has referral attribution");
      }
      clearReferral();
    } else {
      console.error("[Referral] Conversion failed:", data.message);
    }
  } catch (error) {
    console.error("[Referral] Conversion error:", error);
  }
}

export function DynamicProvider({ children }: DynamicProviderProps) {
  return (
    <DynamicContextProvider
      settings={{
        environmentId: process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID || "",
        walletConnectors: [EthereumWalletConnectors],
        overrides: {
          evmNetworks,
        },
        events: {
          onAuthSuccess: async (args) => {
            const isNewUser = args.isAuthenticated && args.primaryWallet;

            if (isNewUser) {
              // Process referral for new signups
              await processNewUserReferral();
            }
          },
          onLogout: () => {
            // Clear all referral data on logout
            clearAllReferralData();
          },
        },
      }}
    >
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <DynamicWagmiConnector>{children}</DynamicWagmiConnector>
        </QueryClientProvider>
      </WagmiProvider>
    </DynamicContextProvider>
  );
}

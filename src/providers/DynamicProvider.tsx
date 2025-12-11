"use client";

import { ReactNode } from "react";
import { DynamicContextProvider, getAuthToken } from "@dynamic-labs/sdk-react-core";
import { EthereumWalletConnectors } from "@dynamic-labs/ethereum";
import { DynamicWagmiConnector } from "@dynamic-labs/wagmi-connector";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CHAIN_CONFIGS } from "@/lib/chains/registry";
import { wagmiConfig } from "@/lib/wagmi";
import {
  getReferral,
  clearReferral,
  isReferralExpired,
  clearAllReferralData,
} from "@/lib/referral/storage";

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
async function processNewUserReferral(userData: {
  walletAddress?: string;
}) {
  // 1. Read referral from localStorage
  const referralData = getReferral();

  if (!referralData) {
    if (process.env.NODE_ENV === "development") {
      console.log("[Referral] No referral data found");
    }
    return;
  }

  // 2. Check expiry
  if (isReferralExpired(referralData)) {
    if (process.env.NODE_ENV === "development") {
      console.log("[Referral] Referral expired");
    }
    clearReferral();
    return;
  }

  // 3. Get the auth token from Dynamic
  const authToken = getAuthToken();
  if (!authToken) {
    console.error("[Referral] No auth token available for convert API");
    return;
  }

  // 4. Call convert API with auth token
  try {
    const response = await fetch("/api/referrals/convert", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        // User email and ID are now extracted from JWT on server
        walletAddress: userData.walletAddress,
        referralData: {
          ref: referralData.ref,
          tag: referralData.tag,
          source: referralData.source,
          fullParams: referralData.fullParams,
          capturedAt: referralData.capturedAt,
        },
      }),
    });

    const result = await response.json();

    if (process.env.NODE_ENV === "development") {
      console.log("[Referral] Convert result:", result);
    }
  } catch (error) {
    console.error("[Referral] Convert API error:", error);
  }

  // 5. Clear referral from localStorage regardless of result
  clearReferral();
}

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
        bridgeChains: [{
           chain: "EVM",
        }],

        // Configure EVM networks with Arbitrum as default
        overrides: {
          evmNetworks,
        },

        // Events configuration
        events: {
          onAuthFlowClose: () => {
            if (process.env.NODE_ENV === "development") {
              console.log("[Dynamic] Auth flow closed");
            }
          },
          onAuthFlowOpen: () => {
            if (process.env.NODE_ENV === "development") {
              console.log("[Dynamic] Auth flow opened");
            }
          },
          onAuthSuccess: async (args) => {
            if (process.env.NODE_ENV === "development") {
              console.log("[Dynamic] Auth success", args);
            }

            // Only process referrals for NEW users
            if (args.user.newUser) {
              try {
                await processNewUserReferral({
                  walletAddress: args.primaryWallet?.address,
                });
              } catch (error) {
                console.error("[Referral] Failed to process:", error);
                // Don't block auth flow on referral errors
              }
            }
          },
          onLogout: () => {
            if (process.env.NODE_ENV === "development") {
              console.log("[Dynamic] User logged out");
            }
            // Clear referral caches on logout
            clearAllReferralData();
          },
        },

        // Privacy policy and terms
        privacyPolicyUrl: "https://lavanet.xyz/privacy",
        termsOfServiceUrl: "https://lavanet.xyz/terms",
      }}
    >
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <DynamicWagmiConnector>
            {children}
          </DynamicWagmiConnector>
        </QueryClientProvider>
      </WagmiProvider>
    </DynamicContextProvider>
  );
}

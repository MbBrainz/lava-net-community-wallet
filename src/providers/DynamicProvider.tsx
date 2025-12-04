"use client";

import { ReactNode } from "react";
import { DynamicContextProvider } from "@dynamic-labs/sdk-react-core";
import { EthereumWalletConnectors } from "@dynamic-labs/ethereum";
import { CHAIN_CONFIGS } from "@/lib/chains/registry";
import {
  getReferral,
  clearReferral,
  isReferralExpired,
  clearAllReferralData,
} from "@/lib/referral/storage";

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
 */
async function processNewUserReferral(userData: {
  email: string;
  dynamicUserId: string;
  walletAddress?: string;
}) {
  // 1. Read referral from localStorage
  const referralData = getReferral();

  if (!referralData) {
    console.log("[Referral] No referral data found");
    return;
  }

  // 2. Check expiry
  if (isReferralExpired(referralData)) {
    console.log("[Referral] Referral expired");
    clearReferral();
    return;
  }

  // 3. Call convert API
  try {
    const response = await fetch("/api/referrals/convert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userEmail: userData.email,
        dynamicUserId: userData.dynamicUserId,
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
    console.log("[Referral] Convert result:", result);
  } catch (error) {
    console.error("[Referral] Convert API error:", error);
  }

  // 4. Clear referral from localStorage regardless of result
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
          onAuthSuccess: async (args) => {
            console.log("[Dynamic] Auth success", args);

            // Only process referrals for NEW users
            if (args.user.newUser) {
              try {
                await processNewUserReferral({
                  email: args.user.email || "",
                  dynamicUserId: args.user.userId || "",
                  walletAddress: args.primaryWallet?.address,
                });
              } catch (error) {
                console.error("[Referral] Failed to process:", error);
                // Don't block auth flow on referral errors
              }
            }
          },
          onLogout: () => {
            console.log("[Dynamic] User logged out");
            // Clear referral caches on logout
            clearAllReferralData();
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

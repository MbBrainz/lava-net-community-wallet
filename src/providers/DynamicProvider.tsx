"use client";

import { ReactNode } from "react";
import {
  DynamicContextProvider,
  getAuthToken,
} from "@dynamic-labs/sdk-react-core";
import { EthereumWalletConnectors } from "@dynamic-labs/ethereum";
import { CHAIN_CONFIGS } from "@/lib/chains/registry";
import { clearReferralStatusCaches } from "@/lib/referral/storage";
import { REFERRAL_CONFIG, MatchVisitResponse } from "@/lib/referral";

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
 * Referral data structure returned from server-side matching.
 */
interface MatchedReferralData {
  ref: string;
  tag: string | null;
  source: string | null;
  fullParams: Record<string, string>;
  capturedAt: string;
}

/**
 * Collect client-side fingerprint data.
 * Server extracts IP and User-Agent from request headers automatically.
 */
function getClientFingerprint(): { screenResolution: string } {
  return {
    screenResolution:
      typeof window !== "undefined"
        ? `${window.screen.width}x${window.screen.height}`
        : "unknown",
  };
}

/**
 * Try to match this visitor with a pending referral visit using server-side
 * probabilistic matching.
 *
 * Server matches based on:
 * - IP Address (from request headers)
 * - User-Agent (from request headers)
 * - Time window (within 60 minutes of original visit)
 * - Screen resolution (optional, for additional precision)
 *
 * Returns the matched referral data or null if no match.
 */
async function matchReferralVisit(): Promise<MatchedReferralData | null> {
  if (!REFERRAL_CONFIG.PROBABILISTIC_MATCHING.ENABLED) {
    console.log("[Referral] ⚠️ Probabilistic matching disabled, skipping");
    return null;
  }

  const fingerprint = getClientFingerprint();
  
  console.log("[Referral] 🔎 Checking server for matching referral visit:", {
    screenResolution: fingerprint.screenResolution,
    note: "Server will match by IP + User-Agent from request headers",
  });

  try {
    const response = await fetch("/api/referrals/match-visit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fingerprint }),
    });

    const result: MatchVisitResponse = await response.json();

    if (result.matched) {
      console.log("[Referral] ✅ Server found matching referral:", {
        code: result.referralData.ref,
        tag: result.referralData.tag || "(none)",
        source: result.referralData.source || "(none)",
        originalCaptureTime: result.referralData.capturedAt,
      });
      return result.referralData;
    }

    console.log("[Referral] ❌ No matching referral found:", {
      reason: result.reason,
      explanation:
        result.reason === "no_match"
          ? "No pending visit with matching IP + User-Agent"
          : result.reason === "multiple_matches"
          ? "Multiple pending visits found - ambiguous"
          : "Feature disabled",
    });
    return null;
  } catch (error) {
    console.error("[Referral] ❌ Match visit error:", error);
    return null;
  }
}

/**
 * Check if referral data is expired (older than configured days).
 */
function isReferralExpired(capturedAt: string): boolean {
  const capturedDate = new Date(capturedAt);
  const expiryMs = REFERRAL_CONFIG.REFERRAL_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
  const expiryDate = new Date(capturedDate.getTime() + expiryMs);
  return new Date() > expiryDate;
}

/**
 * Process referral for new users on signup.
 * Called from onAuthSuccess when user is new.
 *
 * Flow (100% server-side matching):
 * 1. Call server to match this visitor by IP + User-Agent + time
 * 2. If match found and not expired, call convert API to attribute
 * 3. Server deletes pending visit record to prevent reuse
 *
 * NOTE: We don't use localStorage because it doesn't persist
 * between browser and PWA on iOS.
 */
async function processNewUserReferral(userData: { walletAddress?: string }) {
  console.log("[Referral] 🚀 Processing referral for new user signup:", {
    walletAddress: userData.walletAddress || "(not provided)",
    timestamp: new Date().toISOString(),
  });

  // 1. Try to match this visitor with a pending referral
  const referralData = await matchReferralVisit();

  if (!referralData) {
    console.log("[Referral] 📭 No referral to attribute for this user");
    return;
  }

  // 2. Check expiry
  const capturedDate = new Date(referralData.capturedAt);
  const daysSinceCapture = Math.floor(
    (Date.now() - capturedDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (isReferralExpired(referralData.capturedAt)) {
    console.log("[Referral] ⏰ Matched referral is expired:", {
      capturedAt: referralData.capturedAt,
      daysSinceCapture,
      maxDays: REFERRAL_CONFIG.REFERRAL_EXPIRY_DAYS,
    });
    return;
  }

  console.log("[Referral] ⏱️ Referral age check passed:", {
    daysSinceCapture,
    maxDays: REFERRAL_CONFIG.REFERRAL_EXPIRY_DAYS,
  });

  // 3. Get the auth token from Dynamic
  const authToken = getAuthToken();
  if (!authToken) {
    console.error("[Referral] ❌ No auth token available for convert API");
    return;
  }

  // 4. Call convert API with auth token to attribute the referral
  console.log("[Referral] 📤 Calling convert API to attribute referral:", {
    code: referralData.ref,
    tag: referralData.tag || "(none)",
    source: referralData.source || "(none)",
  });

  try {
    const response = await fetch("/api/referrals/convert", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
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

    if (result.success && result.attributed) {
      console.log("[Referral] ✅ Referral successfully attributed:", {
        code: referralData.ref,
        attributed: true,
      });
    } else if (result.success && !result.attributed) {
      console.log("[Referral] ⚠️ Referral not attributed:", {
        code: referralData.ref,
        reason: result.reason,
      });
    } else {
      console.warn("[Referral] ❌ Convert API returned error:", result);
    }
  } catch (error) {
    console.error("[Referral] ❌ Convert API error:", error);
  }
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
            // Clear cached referral status and admin status on logout
            clearReferralStatusCaches();
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

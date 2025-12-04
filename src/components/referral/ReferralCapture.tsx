"use client";

/**
 * ReferralCapture Component
 *
 * Captures referral params from URL and tracks them server-side.
 * Uses server-side probabilistic matching for attribution.
 *
 * How it works:
 * 1. On mount, check URL for ?ref=, ?tag=, ?source=
 * 2. If ref exists:
 *    - Send to server with client fingerprint (screen resolution)
 *    - Server records IP, User-Agent, timestamp automatically
 *    - Clean URL (remove params)
 * 3. On PWA signup, server matches by IP + User-Agent + time window
 *
 * NOTE: We don't use localStorage because it doesn't persist
 * between browser and PWA on iOS. All storage is server-side.
 */

import { useEffect } from "react";
import { truncateCode, REFERRAL_CONFIG } from "@/lib/referral";

const { URL_PARAMS, PROBABILISTIC_MATCHING } = REFERRAL_CONFIG;

/**
 * Collect client-side fingerprint data.
 * Server will add IP address and User-Agent from request headers.
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
 * Track the referral visit on the server.
 *
 * The server extracts from request headers:
 * - IP Address (x-forwarded-for, cf-connecting-ip, x-real-ip)
 * - User-Agent
 * - Timestamp (server time)
 *
 * We send from client:
 * - Screen resolution (for additional matching precision)
 * - Referral code and metadata
 */
async function trackReferralVisit(referralData: {
  ref: string;
  tag?: string;
  source?: string;
  fullParams: Record<string, string>;
}): Promise<void> {
  if (!PROBABILISTIC_MATCHING.ENABLED) {
    console.log("[ReferralCapture] Probabilistic matching disabled, skipping server track");
    return;
  }

  const fingerprint = getClientFingerprint();
  const capturedAt = new Date().toISOString();

  console.log("[ReferralCapture] 📤 Sending referral to server:", {
    code: referralData.ref,
    tag: referralData.tag || "(none)",
    source: referralData.source || "(none)",
    screenResolution: fingerprint.screenResolution,
    capturedAt,
    note: "Server will extract IP + User-Agent from request headers",
  });

  try {
    const response = await fetch("/api/referrals/track-visit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        referralData: {
          ...referralData,
          capturedAt,
        },
        fingerprint,
      }),
    });

    const result = await response.json();

    if (result.success) {
      console.log("[ReferralCapture] ✅ Referral tracked on server:", {
        visitId: result.visitId,
        code: referralData.ref,
        expiresIn: `${PROBABILISTIC_MATCHING.MATCH_WINDOW_MINUTES} minutes`,
      });
    } else {
      console.warn("[ReferralCapture] ⚠️ Server tracking failed:", {
        error: result.error,
        message: result.message,
      });
    }
  } catch (error) {
    // Log but don't block - referral tracking is best-effort
    console.error("[ReferralCapture] ❌ Server tracking error:", error);
  }
}

export function ReferralCapture() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Get URL params
    const params = new URLSearchParams(window.location.search);
    const ref = params.get(URL_PARAMS.REF);

    // No referral code in URL, nothing to do
    if (!ref) {
      // Only log if there were any params (avoid noise)
      if (params.toString()) {
        console.log("[ReferralCapture] URL has params but no ref code");
      }
      return;
    }

    // Build referral data
    const referralData = {
      ref: truncateCode(ref),
      tag: params.get(URL_PARAMS.TAG) || undefined,
      source: params.get(URL_PARAMS.SOURCE) || undefined,
      fullParams: Object.fromEntries(params.entries()),
    };

    console.log("[ReferralCapture] 🔗 Detected referral in URL:", {
      originalRef: ref,
      truncatedRef: referralData.ref,
      tag: referralData.tag || "(none)",
      source: referralData.source || "(none)",
      allParams: referralData.fullParams,
    });

    // Track on server (IP + User-Agent extracted from headers server-side)
    trackReferralVisit(referralData);

    // Clean URL (remove ref-related params for cleaner UX)
    const url = new URL(window.location.href);
    url.searchParams.delete(URL_PARAMS.REF);
    url.searchParams.delete(URL_PARAMS.TAG);
    url.searchParams.delete(URL_PARAMS.SOURCE);
    window.history.replaceState({}, "", url.toString());
    
    console.log("[ReferralCapture] 🧹 Cleaned URL params");
  }, []);

  return null;
}


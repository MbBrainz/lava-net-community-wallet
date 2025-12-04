"use client";

/**
 * ReferralCapture Component
 *
 * Captures referral params from URL on page load.
 * Runs on every page via Providers wrapper.
 *
 * Behavior:
 * 1. On mount, check URL for ?ref=, ?tag=, ?source=
 * 2. If ref exists:
 *    - Validate/truncate to 20 chars
 *    - Create referral object with timestamp
 *    - Save to localStorage (overwrites = last-touch)
 *    - Clean URL (remove params)
 * 3. Render nothing (null)
 */

import { useEffect } from "react";
import { saveReferral, truncateCode, StoredReferral, REFERRAL_CONFIG } from "@/lib/referral";

const { URL_PARAMS } = REFERRAL_CONFIG;

export function ReferralCapture() {
  useEffect(() => {
    // 1. Check if running in browser
    if (typeof window === "undefined") return;

    // 2. Get URL params
    const params = new URLSearchParams(window.location.search);
    const ref = params.get(URL_PARAMS.REF);

    // 3. If no ref, do nothing
    if (!ref) return;

    // 4. Truncate and create referral data
    const referralData: StoredReferral = {
      ref: truncateCode(ref),
      tag: params.get(URL_PARAMS.TAG) || undefined,
      source: params.get(URL_PARAMS.SOURCE) || undefined,
      fullParams: Object.fromEntries(params.entries()),
      capturedAt: new Date().toISOString(),
    };

    // 5. Save to localStorage
    saveReferral(referralData);
    console.log("[ReferralCapture] Saved referral:", referralData);

    // 6. Clean URL (remove ref-related params)
    const url = new URL(window.location.href);
    url.searchParams.delete(URL_PARAMS.REF);
    url.searchParams.delete(URL_PARAMS.TAG);
    url.searchParams.delete(URL_PARAMS.SOURCE);
    window.history.replaceState({}, "", url.toString());
  }, []); // Run once on mount

  return null; // Render nothing
}


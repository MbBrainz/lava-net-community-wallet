"use client";

/**
 * ReferralCapture Component
 *
 * Captures referral codes from URL parameters and stores them in localStorage.
 * Runs on every page load to capture ?ref=CODE parameters.
 */

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { saveReferral, getReferral } from "@/lib/referral/storage";
import { REFERRAL_CONFIG } from "@/lib/referral/constants";
import { isValidCodeFormat } from "@/lib/referral/validation";

export function ReferralCapture() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const refCode = searchParams.get(REFERRAL_CONFIG.URL_PARAMS.REF);

    if (!refCode) return;

    // Validate code format
    if (!isValidCodeFormat(refCode)) {
      if (process.env.NODE_ENV === "development") {
        console.log("[ReferralCapture] Invalid code format:", refCode);
      }
      return;
    }

    // Check if we already have the same code stored
    const existing = getReferral();
    if (existing?.code === refCode.toUpperCase()) {
      if (process.env.NODE_ENV === "development") {
        console.log("[ReferralCapture] Code already captured:", refCode);
      }
      return;
    }

    // Save the referral code
    saveReferral({
      code: refCode.toUpperCase(),
      capturedAt: new Date().toISOString(),
    });

    if (process.env.NODE_ENV === "development") {
      console.log("[ReferralCapture] Captured referral code:", refCode);
    }
  }, [searchParams]);

  // This component doesn't render anything
  return null;
}

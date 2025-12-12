"use client";

/**
 * ReferralCapture Component
 *
 * Captures referral codes AND UTM parameters from URL and stores them in localStorage.
 * Runs on every page load to capture ?ref=CODE&utm_source=...&utm_medium=...&utm_campaign=...
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

    const normalizedCode = refCode.toUpperCase();

    // Capture UTM parameters
    const utmSource = searchParams.get("utm_source") || undefined;
    const utmMedium = searchParams.get("utm_medium") || undefined;
    const utmCampaign = searchParams.get("utm_campaign") || undefined;

    // Check if we already have the same code stored with same UTM
    const existing = getReferral();
    if (
      existing?.code === normalizedCode &&
      existing?.utmSource === utmSource &&
      existing?.utmMedium === utmMedium &&
      existing?.utmCampaign === utmCampaign
    ) {
      if (process.env.NODE_ENV === "development") {
        console.log("[ReferralCapture] Code already captured with same UTM:", refCode);
      }
      return;
    }

    // Save the referral code with UTM params
    saveReferral({
      code: normalizedCode,
      utmSource,
      utmMedium,
      utmCampaign,
      capturedAt: new Date().toISOString(),
    });

    if (process.env.NODE_ENV === "development") {
      console.log("[ReferralCapture] Captured referral:", {
        code: normalizedCode,
        utmSource,
        utmMedium,
        utmCampaign,
      });
    }
  }, [searchParams]);

  // This component doesn't render anything
  return null;
}

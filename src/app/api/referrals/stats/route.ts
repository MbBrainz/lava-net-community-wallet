/**
 * GET /api/referrals/stats
 *
 * Get detailed statistics for an approved referrer.
 * Includes per-code breakdown, UTM analytics, and recent referrals.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/server";
import { db } from "@/lib/db/client";
import {
  referrers,
  referralCodes,
  userReferrals,
  type UserReferral,
} from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

/**
 * Mask an email address for privacy.
 * "user@example.com" → "u***@e***.com"
 */
function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return "***@***.***";

  const [domainName, tld] = domain.split(".");
  if (!tld) return `${local?.[0] || "*"}***@***`;

  return `${local?.[0] || "*"}***@${domainName?.[0] || "*"}***.${tld}`;
}

/**
 * Aggregate UTM values from referrals
 */
function aggregateUTM(referrals: UserReferral[]) {
  const sourceMap = new Map<string | null, number>();
  const mediumMap = new Map<string | null, number>();
  const campaignMap = new Map<string | null, number>();

  for (const ref of referrals) {
    // Aggregate sources
    const source = ref.utmSource || null;
    sourceMap.set(source, (sourceMap.get(source) || 0) + 1);

    // Aggregate mediums
    const medium = ref.utmMedium || null;
    mediumMap.set(medium, (mediumMap.get(medium) || 0) + 1);

    // Aggregate campaigns
    const campaign = ref.utmCampaign || null;
    campaignMap.set(campaign, (campaignMap.get(campaign) || 0) + 1);
  }

  // Convert maps to sorted arrays (highest count first)
  const toSortedArray = (map: Map<string | null, number>) =>
    Array.from(map.entries())
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count);

  return {
    source: toSortedArray(sourceMap),
    medium: toSortedArray(mediumMap),
    campaign: toSortedArray(campaignMap),
  };
}

export async function GET(request: NextRequest) {
  const auth = await getAuthenticatedUser(request);
  if (!auth.success) {
    return auth.response;
  }

  try {
    // Find referrer with codes and referrals in a single query
    const referrer = await db.query.referrers.findFirst({
      where: eq(referrers.email, auth.user.email ?? ""),
      with: {
        codes: {
          orderBy: desc(referralCodes.usageCount),
        },
        referrals: {
          orderBy: desc(userReferrals.convertedAt),
        },
      },
    });

    if (!referrer) {
      return NextResponse.json(
        { error: "not_referrer", message: "You are not a referrer" },
        { status: 403 }
      );
    }

    if (!referrer.isApproved) {
      return NextResponse.json(
        { error: "not_approved", message: "Your referrer account is pending approval" },
        { status: 403 }
      );
    }

    // Extract codes and referrals from relations
    const codes = referrer.codes;
    const allReferrals = referrer.referrals;

    // Aggregate UTM breakdown
    const utmBreakdown = aggregateUTM(allReferrals);

    // Get recent referrals (last 50)
    const recentReferrals = allReferrals.slice(0, 50);

    return NextResponse.json({
      referrerId: referrer.id,
      totalReferrals: allReferrals.length,
      codeStats: codes.map((code) => ({
        code: code.code,
        label: code.label,
        usageCount: code.usageCount,
        isActive: code.isActive,
        expiresAt: code.expiresAt?.toISOString() || null,
      })),
      utmBreakdown,
      recentReferrals: recentReferrals.map((ref) => ({
        id: ref.id,
        userEmail: maskEmail(ref.userEmail),
        codeUsed: ref.codeUsed,
        utmSource: ref.utmSource,
        utmMedium: ref.utmMedium,
        utmCampaign: ref.utmCampaign,
        convertedAt: ref.convertedAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("[Referrals] Failed to get stats:", error);
    return NextResponse.json(
      { error: "server_error", message: "Failed to get referral stats" },
      { status: 500 }
    );
  }
}

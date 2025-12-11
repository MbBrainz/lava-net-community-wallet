/**
 * GET /api/referrals-v2/stats
 *
 * Get detailed statistics for an approved referrer.
 * Includes per-code breakdown and recent referrals.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/server";
import { db } from "@/lib/db/client";
import {
  referrers,
  referralCodes,
  userReferrals,
  type Referrer,
  type ReferralCode,
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

export async function GET(request: NextRequest) {
  const auth = await getAuthenticatedUser(request);
  if (!auth.success) {
    return auth.response;
  }

  try {
    // Find referrer
    const [referrer]: Referrer[] = await db
      .select()
      .from(referrers)
      .where(eq(referrers.email, auth.user.email))
      .limit(1);

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

    // Get all codes with their stats
    const codes: ReferralCode[] = await db
      .select()
      .from(referralCodes)
      .where(eq(referralCodes.referrerId, referrer.id))
      .orderBy(desc(referralCodes.usageCount));

    // Get all referrals for this referrer
    const allReferrals: UserReferral[] = await db
      .select()
      .from(userReferrals)
      .where(eq(userReferrals.referrerId, referrer.id))
      .orderBy(desc(userReferrals.convertedAt));

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
      recentReferrals: recentReferrals.map((ref) => ({
        id: ref.id,
        userEmail: maskEmail(ref.userEmail),
        codeUsed: ref.codeUsed,
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

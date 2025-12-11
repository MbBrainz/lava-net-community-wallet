/**
 * GET /api/referrals-v2/status
 *
 * Get the authenticated user's referrer status.
 * Returns whether they are a referrer, pending, or not a referrer.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/server";
import { db } from "@/lib/db/client";
import { referrers, referralCodes, type Referrer, type ReferralCode } from "@/lib/db/schema/referrers";
import { eq, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const auth = await getAuthenticatedUser(request);
  if (!auth.success) {
    return auth.response;
  }

  try {
    // Find referrer record
    const [referrer]: Referrer[] = await db
      .select()
      .from(referrers)
      .where(eq(referrers.email, auth.user.email))
      .limit(1);

    if (!referrer) {
      return NextResponse.json({ status: "none" });
    }

    if (!referrer.isApproved) {
      return NextResponse.json({
        status: "pending",
        requestedAt: referrer.createdAt.toISOString(),
      });
    }

    // Get all codes for approved referrer
    const codes: ReferralCode[] = await db
      .select()
      .from(referralCodes)
      .where(eq(referralCodes.referrerId, referrer.id))
      .orderBy(desc(referralCodes.createdAt));

    return NextResponse.json({
      status: "approved",
      referrerId: referrer.id,
      approvedAt: referrer.approvedAt?.toISOString() || referrer.updatedAt.toISOString(),
      canSendNotifications: referrer.canSendNotifications,
      codes: codes.map((code) => ({
        code: code.code,
        label: code.label,
        isActive: code.isActive,
        expiresAt: code.expiresAt?.toISOString() || null,
        usageCount: code.usageCount,
        createdAt: code.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("[Referrals] Failed to get status:", error);
    return NextResponse.json(
      { error: "server_error", message: "Failed to get referrer status" },
      { status: 500 }
    );
  }
}

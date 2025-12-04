/**
 * GET /api/referrals/stats
 *
 * Purpose: Get dashboard statistics for approved code owner
 * Auth required: Yes (verified via JWT token)
 *
 * Headers:
 * - Authorization: Bearer <token>
 *
 * Responses:
 * - { code, totalReferrals, referrals: [...] }
 * - { error: "not_approved", message: "..." }
 * - { error: "no_code", message: "..." }
 * - { error: "unauthorized", message: "..." } (401)
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { referrerCodes, userReferrals } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { maskEmail } from "@/lib/referral";
import { getAuthenticatedUser } from "@/lib/auth/server";

export async function GET(request: NextRequest) {
  try {
    // Verify authentication via JWT
    const auth = await getAuthenticatedUser(request);
    if (!auth.success) {
      return auth.response;
    }

    // Get user's approved code using the VERIFIED email
    const userCode = await db.query.referrerCodes.findFirst({
      where: and(
        eq(referrerCodes.ownerEmail, auth.user.email),
        eq(referrerCodes.isApproved, true)
      ),
    });

    if (!userCode) {
      // Check if they have a pending code
      const pendingCode = await db.query.referrerCodes.findFirst({
        where: eq(referrerCodes.ownerEmail, auth.user.email),
      });

      if (pendingCode) {
        return NextResponse.json({
          error: "not_approved",
          message: "Your referral code is still pending approval",
        });
      }

      return NextResponse.json({
        error: "no_code",
        message: "You don't have a referral code",
      });
    }

    // Get all referrals for this code
    const referrals = await db.query.userReferrals.findMany({
      where: eq(userReferrals.referrerCode, userCode.code),
      orderBy: [desc(userReferrals.convertedAt)],
    });

    // Mask emails and format response
    const maskedReferrals = referrals.map((r) => ({
      id: r.id,
      userEmail: maskEmail(r.userEmail),
      convertedAt: r.convertedAt.toISOString(),
      tag: r.customTag,
      source: r.source,
    }));

    return NextResponse.json({
      code: userCode.code,
      totalReferrals: referrals.length,
      referrals: maskedReferrals,
    });
  } catch (error) {
    console.error("[Stats] Error:", error);
    return NextResponse.json(
      { error: "server_error", message: "Internal server error" },
      { status: 500 }
    );
  }
}

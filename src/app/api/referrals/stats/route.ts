/**
 * GET /api/referrals/stats
 *
 * Purpose: Get dashboard statistics for approved code owner
 * Auth required: Yes (email passed as query param)
 *
 * Query params:
 * - email: string (from authenticated user)
 *
 * Responses:
 * - { code, totalReferrals, referrals: [...] }
 * - { error: "not_approved", message: "..." }
 * - { error: "no_code", message: "..." }
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { referrerCodes, userReferrals } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { maskEmail } from "@/lib/referral";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    // Validate email parameter
    if (!email) {
      return NextResponse.json(
        { error: "missing_email", message: "Email parameter is required" },
        { status: 400 }
      );
    }

    // Get user's approved code
    const userCode = await db.query.referrerCodes.findFirst({
      where: and(
        eq(referrerCodes.ownerEmail, email),
        eq(referrerCodes.isApproved, true)
      ),
    });

    if (!userCode) {
      // Check if they have a pending code
      const pendingCode = await db.query.referrerCodes.findFirst({
        where: eq(referrerCodes.ownerEmail, email),
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


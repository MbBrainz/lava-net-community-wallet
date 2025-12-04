/**
 * POST /api/referrals/convert
 *
 * Purpose: Attribute a referral when new user signs up
 * Auth required: Yes (get email from request body - client verifies auth)
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { referrerCodes, userReferrals } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { convertReferralSchema, isExpired } from "@/lib/referral";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 1. Validate request body
    const parseResult = convertReferralSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "invalid_request",
          message: parseResult.error.issues[0]?.message || "Invalid request",
        },
        { status: 400 }
      );
    }

    const { userEmail, dynamicUserId, walletAddress, referralData } =
      parseResult.data;

    // 2. Check expiry
    if (isExpired(referralData.capturedAt)) {
      console.log("[Convert] Referral expired for:", userEmail);
      return NextResponse.json({
        success: true,
        attributed: false,
        reason: "expired",
      });
    }

    // 3. Check if code is approved
    const referrerCode = await db.query.referrerCodes.findFirst({
      where: and(
        eq(referrerCodes.code, referralData.ref),
        eq(referrerCodes.isApproved, true)
      ),
    });

    if (!referrerCode) {
      console.log("[Convert] Code not approved:", referralData.ref);
      return NextResponse.json({
        success: true,
        attributed: false,
        reason: "code_not_approved",
      });
    }

    // 4. Check if user already has referral
    const existingReferral = await db.query.userReferrals.findFirst({
      where: eq(userReferrals.userEmail, userEmail),
    });

    if (existingReferral) {
      console.log("[Convert] User already has referral:", userEmail);
      return NextResponse.json({
        success: true,
        attributed: false,
        reason: "already_attributed",
      });
    }

    // 5. Insert referral record
    await db.insert(userReferrals).values({
      userEmail,
      dynamicUserId,
      walletAddress: walletAddress || null,
      referrerCode: referralData.ref,
      customTag: referralData.tag || null,
      source: referralData.source || null,
      fullParams: referralData.fullParams,
      referredAt: new Date(referralData.capturedAt),
    });

    console.log("[Convert] Referral attributed:", {
      user: userEmail,
      code: referralData.ref,
    });

    return NextResponse.json({
      success: true,
      attributed: true,
    });
  } catch (error) {
    console.error("[Convert] Error:", error);
    return NextResponse.json(
      { success: false, error: "server_error", message: "Internal server error" },
      { status: 500 }
    );
  }
}


/**
 * POST /api/referrals-v2/convert
 *
 * Convert a referral - attribute a new user signup to a referral code.
 * Called when a user signs up with a referral code.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/server";
import { db } from "@/lib/db/client";
import { referralCodes, userReferrals, type UserReferral } from "@/lib/db/schema/referrers";
import { eq, sql } from "drizzle-orm";
import { validateCode, normalizeCode } from "@/lib/referral/code-generator";

export async function POST(request: NextRequest) {
  const auth = await getAuthenticatedUser(request);
  if (!auth.success) {
    return auth.response;
  }

  try {
    const body = await request.json();
    const { code } = body;

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { error: "invalid_request", message: "Code is required" },
        { status: 400 }
      );
    }

    const normalizedCode = normalizeCode(code);

    // Check if user already has a referral
    const [existingReferral]: UserReferral[] = await db
      .select()
      .from(userReferrals)
      .where(eq(userReferrals.userEmail, auth.user.email))
      .limit(1);

    if (existingReferral) {
      return NextResponse.json({
        status: "already_referred",
        message: "You already have a referral attribution",
        codeUsed: existingReferral.codeUsed,
      });
    }

    // Validate the code
    const validation = await validateCode(normalizedCode);

    if (!validation.isValid) {
      const messages: Record<string, string> = {
        not_found: "Referral code not found",
        inactive: "This referral code is no longer active",
        expired: "This referral code has expired",
        invalid_format: "Invalid referral code format",
      };

      return NextResponse.json(
        {
          error: "invalid_code",
          message: messages[validation.reason || "not_found"],
        },
        { status: 400 }
      );
    }

    const codeRecord = validation.code!;

    // Create the referral record
    const [newReferral] = await db
      .insert(userReferrals)
      .values({
        userEmail: auth.user.email,
        userDynamicId: auth.user.userId,
        userWalletAddress: null, // Can be updated later
        codeUsed: codeRecord.code,
        referrerId: codeRecord.referrerId,
      })
      .returning();

    // Increment usage count on the code
    await db
      .update(referralCodes)
      .set({
        usageCount: sql`${referralCodes.usageCount} + 1`,
      })
      .where(eq(referralCodes.code, codeRecord.code));

    return NextResponse.json({
      status: "success",
      message: "Referral attributed successfully",
      referralId: newReferral.id,
      codeUsed: newReferral.codeUsed,
    });
  } catch (error) {
    console.error("[Referrals] Failed to convert referral:", error);
    return NextResponse.json(
      { error: "server_error", message: "Failed to attribute referral" },
      { status: 500 }
    );
  }
}

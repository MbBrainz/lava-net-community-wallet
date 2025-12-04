/**
 * POST /api/referrals/request
 *
 * Purpose: User requests a referral code
 * Auth required: Yes (verified via JWT token)
 *
 * Headers:
 * - Authorization: Bearer <token>
 *
 * Request body:
 * - code: string
 *
 * Responses:
 * - { success: true, status: "pending", code, requestedAt }
 * - { success: false, error: "code_taken", message: "..." }
 * - { success: false, error: "already_requested", message: "..." }
 * - { success: false, error: "invalid_format", message: "..." }
 * - { error: "unauthorized", message: "..." } (401)
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { referrerCodes } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requestCodeSchema } from "@/lib/referral";
import { getAuthenticatedUser } from "@/lib/auth/server";

export async function POST(request: NextRequest) {
  try {
    // Verify authentication via JWT
    const auth = await getAuthenticatedUser(request);
    if (!auth.success) {
      return auth.response;
    }

    const body = await request.json();

    // 1. Validate request body (only code is needed now)
    const parseResult = requestCodeSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "invalid_format",
          message: parseResult.error.issues[0]?.message || "Invalid request",
        },
        { status: 400 }
      );
    }

    const { code } = parseResult.data;

    // Use VERIFIED email and userId from the JWT
    const email = auth.user.email;
    const dynamicUserId = auth.user.userId;

    // 2. Check if user already has any entry (pending or approved)
    const existingUserCode = await db.query.referrerCodes.findFirst({
      where: eq(referrerCodes.ownerEmail, email),
    });

    if (existingUserCode) {
      return NextResponse.json({
        success: false,
        error: "already_requested",
        message: "You already have a pending or approved referral code",
      });
    }

    // 3. Check if code is taken by an APPROVED code
    const existingCode = await db.query.referrerCodes.findFirst({
      where: and(
        eq(referrerCodes.code, code),
        eq(referrerCodes.isApproved, true)
      ),
    });

    if (existingCode) {
      return NextResponse.json({
        success: false,
        error: "code_taken",
        message: "This code is already taken",
      });
    }

    // 4. Insert new pending code
    const now = new Date();
    await db.insert(referrerCodes).values({
      code,
      ownerEmail: email,
      ownerDynamicUserId: dynamicUserId,
      isApproved: false,
      requestedAt: now,
    });

    // Log without PII in production
    if (process.env.NODE_ENV === "development") {
      console.log("[Request] Code requested:", { code, email });
    }

    return NextResponse.json({
      success: true,
      status: "pending",
      code,
      requestedAt: now.toISOString(),
    });
  } catch (error) {
    console.error("[Request] Error:", error);
    return NextResponse.json(
      { success: false, error: "server_error", message: "Internal server error" },
      { status: 500 }
    );
  }
}

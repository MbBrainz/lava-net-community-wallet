/**
 * GET /api/referrals/status
 *
 * Purpose: Get current user's referral code status
 * Auth required: Yes (verified via JWT token)
 *
 * Headers:
 * - Authorization: Bearer <token>
 *
 * Responses:
 * - { status: "none" }
 * - { status: "pending", code, requestedAt }
 * - { status: "approved", code, requestedAt, approvedAt }
 * - { error: "unauthorized", message: "..." } (401)
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { referrerCodes } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getAuthenticatedUser } from "@/lib/auth/server";

export async function GET(request: NextRequest) {
  try {
    // Verify authentication via JWT
    const auth = await getAuthenticatedUser(request);
    if (!auth.success) {
      return auth.response;
    }

    // Query for user's code using the VERIFIED email
    const userCode = await db.query.referrerCodes.findFirst({
      where: eq(referrerCodes.ownerEmail, auth.user.email),
    });

    // Return appropriate response
    if (!userCode) {
      return NextResponse.json({ status: "none" });
    }

    if (!userCode.isApproved) {
      return NextResponse.json({
        status: "pending",
        code: userCode.code,
        requestedAt: userCode.requestedAt.toISOString(),
      });
    }

    return NextResponse.json({
      status: "approved",
      code: userCode.code,
      requestedAt: userCode.requestedAt.toISOString(),
      approvedAt: userCode.approvedAt?.toISOString(),
    });
  } catch (error) {
    console.error("[Status] Error:", error);
    return NextResponse.json(
      { error: "server_error", message: "Internal server error" },
      { status: 500 }
    );
  }
}

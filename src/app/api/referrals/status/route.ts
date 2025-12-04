/**
 * GET /api/referrals/status
 *
 * Purpose: Get current user's referral code status
 * Auth required: Yes (email passed as query param)
 *
 * Query params:
 * - email: string (from authenticated user)
 *
 * Responses:
 * - { status: "none" }
 * - { status: "pending", code, requestedAt }
 * - { status: "approved", code, requestedAt, approvedAt }
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { referrerCodes } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

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

    // Query for user's code
    const userCode = await db.query.referrerCodes.findFirst({
      where: eq(referrerCodes.ownerEmail, email),
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


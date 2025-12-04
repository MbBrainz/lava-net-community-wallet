/**
 * GET /api/referrals/check
 *
 * Purpose: Check if a referral code is available (real-time form validation)
 * Auth required: No (public endpoint)
 *
 * Query params:
 * - code: string (required) - Code to check
 *
 * Responses:
 * - { available: true } - Code is available
 * - { available: false } - Taken by approved code
 * - { available: false, error: "invalid_format", message: "..." } - Invalid format
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { referrerCodes } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { validateCode } from "@/lib/referral";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");

    // Validate code parameter exists
    if (!code) {
      return NextResponse.json(
        {
          available: false,
          error: "missing_code",
          message: "Code parameter is required",
        },
        { status: 400 }
      );
    }

    // Validate code format
    const validation = validateCode(code);
    if (!validation.valid) {
      return NextResponse.json({
        available: false,
        error: "invalid_format",
        message: validation.error,
      });
    }

    // Check if code is taken by an approved code
    const existing = await db.query.referrerCodes.findFirst({
      where: and(
        eq(referrerCodes.code, code),
        eq(referrerCodes.isApproved, true)
      ),
    });

    if (existing) {
      return NextResponse.json({ available: false });
    }

    return NextResponse.json({ available: true });
  } catch (error) {
    console.error("[Check] Error:", error);
    return NextResponse.json(
      { available: false, error: "server_error", message: "Internal server error" },
      { status: 500 }
    );
  }
}


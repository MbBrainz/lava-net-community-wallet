/**
 * POST /api/referrals/request
 *
 * Purpose: User requests a referral code
 * Auth required: Yes (email and dynamicUserId in request body)
 *
 * Request body:
 * - code: string
 * - email: string (from authenticated user)
 * - dynamicUserId: string (from authenticated user)
 *
 * Responses:
 * - { success: true, status: "pending", code, requestedAt }
 * - { success: false, error: "code_taken", message: "..." }
 * - { success: false, error: "already_requested", message: "..." }
 * - { success: false, error: "invalid_format", message: "..." }
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { referrerCodes } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requestCodeSchema } from "@/lib/referral";
import { z } from "zod";

// Extended schema for request body with auth info
const requestBodySchema = requestCodeSchema.extend({
  email: z.string().email(),
  dynamicUserId: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 1. Validate request body
    const parseResult = requestBodySchema.safeParse(body);
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

    const { code, email, dynamicUserId } = parseResult.data;

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

    // 4. Delete any existing pending request with same code (so new user can request it)
    // This allows the "race" where first approval wins
    // We don't delete here - admin will see duplicates and pick one

    // 5. Insert new pending code
    const now = new Date();
    await db.insert(referrerCodes).values({
      code,
      ownerEmail: email,
      ownerDynamicUserId: dynamicUserId,
      isApproved: false,
      requestedAt: now,
    });

    console.log("[Request] Code requested:", { code, email });

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


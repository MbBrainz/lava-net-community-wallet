/**
 * /api/referrals/codes
 *
 * GET: List all codes for the authenticated referrer
 * POST: Create a new referral code
 * PATCH: Update a code (toggle active, update label)
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/server";
import { db } from "@/lib/db/client";
import {
  referrers,
  referralCodes,
  MAX_CODES_PER_REFERRER,
  type Referrer,
  type ReferralCode,
} from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { generateUniqueCode } from "@/lib/referral/code-generator";
import { createCodeSchema } from "@/lib/referral/types";

/**
 * GET /api/referrals/codes
 *
 * List all codes for the authenticated referrer.
 */
export async function GET(request: NextRequest) {
  const auth = await getAuthenticatedUser(request);
  if (!auth.success) {
    return auth.response;
  }

  try {
    // Find referrer
    const [referrer]: Referrer[] = await db
      .select()
      .from(referrers)
      .where(eq(referrers.email, auth.user.email))
      .limit(1);

    if (!referrer) {
      return NextResponse.json(
        { error: "not_referrer", message: "You are not a referrer" },
        { status: 403 }
      );
    }

    if (!referrer.isApproved) {
      return NextResponse.json(
        { error: "not_approved", message: "Your referrer account is pending approval" },
        { status: 403 }
      );
    }

    // Get all codes for this referrer
    const codes: ReferralCode[] = await db
      .select()
      .from(referralCodes)
      .where(eq(referralCodes.referrerId, referrer.id))
      .orderBy(desc(referralCodes.createdAt));

    return NextResponse.json({
      referrerId: referrer.id,
      maxCodes: MAX_CODES_PER_REFERRER,
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
    console.error("[Referrals] Failed to list codes:", error);
    return NextResponse.json(
      { error: "server_error", message: "Failed to list codes" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/referrals/codes
 *
 * Create a new referral code.
 */
export async function POST(request: NextRequest) {
  const auth = await getAuthenticatedUser(request);
  if (!auth.success) {
    return auth.response;
  }

  try {
    // Parse and validate request body
    const body = await request.json();
    const parsed = createCodeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "invalid_request", message: parsed.error.issues[0]?.message },
        { status: 400 }
      );
    }

    const { label, expiresAt } = parsed.data;

    // Find referrer
    const [referrer]: Referrer[] = await db
      .select()
      .from(referrers)
      .where(eq(referrers.email, auth.user.email))
      .limit(1);

    if (!referrer) {
      return NextResponse.json(
        { error: "not_referrer", message: "You are not a referrer" },
        { status: 403 }
      );
    }

    if (!referrer.isApproved) {
      return NextResponse.json(
        { error: "not_approved", message: "Your referrer account is pending approval" },
        { status: 403 }
      );
    }

    // Check code limit
    const existingCodes: ReferralCode[] = await db
      .select()
      .from(referralCodes)
      .where(eq(referralCodes.referrerId, referrer.id));

    if (existingCodes.length >= MAX_CODES_PER_REFERRER) {
      return NextResponse.json(
        {
          error: "limit_reached",
          message: `You have reached the maximum of ${MAX_CODES_PER_REFERRER} codes`,
        },
        { status: 400 }
      );
    }

    // Generate unique code
    const code = await generateUniqueCode();

    // Create the code
    const [newCode] = await db
      .insert(referralCodes)
      .values({
        code,
        referrerId: referrer.id,
        label: label || null,
        isActive: true,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        usageCount: 0,
      })
      .returning();

    return NextResponse.json({
      code: newCode.code,
      label: newCode.label,
      isActive: newCode.isActive,
      expiresAt: newCode.expiresAt?.toISOString() || null,
      usageCount: newCode.usageCount,
      createdAt: newCode.createdAt.toISOString(),
    });
  } catch (error) {
    console.error("[Referrals] Failed to create code:", error);
    return NextResponse.json(
      { error: "server_error", message: "Failed to create code" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/referrals/codes
 *
 * Update a code (toggle active, update label).
 */
export async function PATCH(request: NextRequest) {
  const auth = await getAuthenticatedUser(request);
  if (!auth.success) {
    return auth.response;
  }

  try {
    const body = await request.json();
    const { code, isActive, label } = body;

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { error: "invalid_request", message: "Code is required" },
        { status: 400 }
      );
    }

    // Find referrer
    const [referrer]: Referrer[] = await db
      .select()
      .from(referrers)
      .where(eq(referrers.email, auth.user.email))
      .limit(1);

    if (!referrer?.isApproved) {
      return NextResponse.json(
        { error: "not_approved", message: "Not an approved referrer" },
        { status: 403 }
      );
    }

    // Find the code and verify ownership
    const [existingCode]: ReferralCode[] = await db
      .select()
      .from(referralCodes)
      .where(eq(referralCodes.code, code.toUpperCase()))
      .limit(1);

    if (!existingCode) {
      return NextResponse.json(
        { error: "not_found", message: "Code not found" },
        { status: 404 }
      );
    }

    if (existingCode.referrerId !== referrer.id) {
      return NextResponse.json(
        { error: "forbidden", message: "You don't own this code" },
        { status: 403 }
      );
    }

    // Update the code
    const updates: Partial<typeof referralCodes.$inferInsert> = {};
    if (typeof isActive === "boolean") updates.isActive = isActive;
    if (typeof label === "string") updates.label = label || null;

    const [updatedCode] = await db
      .update(referralCodes)
      .set(updates)
      .where(eq(referralCodes.code, code.toUpperCase()))
      .returning();

    return NextResponse.json({
      code: updatedCode.code,
      label: updatedCode.label,
      isActive: updatedCode.isActive,
      expiresAt: updatedCode.expiresAt?.toISOString() || null,
      usageCount: updatedCode.usageCount,
      createdAt: updatedCode.createdAt.toISOString(),
    });
  } catch (error) {
    console.error("[Referrals] Failed to update code:", error);
    return NextResponse.json(
      { error: "server_error", message: "Failed to update code" },
      { status: 500 }
    );
  }
}

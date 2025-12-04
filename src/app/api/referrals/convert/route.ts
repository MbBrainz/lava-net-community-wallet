/**
 * POST /api/referrals/convert
 *
 * Purpose: Attribute a referral when new user signs up
 * Auth required: Yes (verified via JWT token)
 *
 * Headers:
 * - Authorization: Bearer <token>
 *
 * Request body:
 * - referralData: { ref, tag?, source?, fullParams, capturedAt }
 * - walletAddress?: string
 *
 * Note: userEmail and dynamicUserId are extracted from the verified JWT
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { referrerCodes, userReferrals } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { isExpired } from "@/lib/referral";
import { getAuthenticatedUser } from "@/lib/auth/server";
import { z } from "zod";

// Simplified schema - user info comes from JWT now
// Note: tag, source can be null (from server-side matching) or undefined
const convertRequestSchema = z.object({
  referralData: z.object({
    ref: z.string().min(1),
    tag: z.string().nullish(), // accepts string | null | undefined
    source: z.string().nullish(), // accepts string | null | undefined
    fullParams: z.record(z.string(), z.string()).optional(),
    capturedAt: z.string(),
  }),
  walletAddress: z.string().optional(),
});

// Sanitize fullParams to prevent abuse
function sanitizeFullParams(
  params: Record<string, string> | undefined | null
): Record<string, string> {
  if (!params) return {};

  return Object.fromEntries(
    Object.entries(params)
      .slice(0, 20) // Max 20 params
      .map(([k, v]) => [
        k.slice(0, 50), // Max 50 char keys
        String(v).slice(0, 200), // Max 200 char values
      ])
  );
}

export async function POST(request: NextRequest) {
  console.log("[Convert] 📥 Incoming convert request");

  try {
    // Verify authentication via JWT
    const auth = await getAuthenticatedUser(request);
    if (!auth.success) {
      console.log("[Convert] ❌ Authentication failed");
      return auth.response;
    }

    console.log("[Convert] ✅ User authenticated:", {
      email: auth.user.email,
      userId: auth.user.userId.slice(0, 8) + "...",
    });

    const body = await request.json();

    // 1. Validate request body
    const parseResult = convertRequestSchema.safeParse(body);
    if (!parseResult.success) {
      console.warn("[Convert] ❌ Invalid request body:", {
        issues: parseResult.error.issues,
        receivedBody: JSON.stringify(body).slice(0, 200),
      });
      return NextResponse.json(
        {
          success: false,
          error: "invalid_request",
          message: parseResult.error.issues[0]?.message || "Invalid request",
        },
        { status: 400 }
      );
    }

    const { referralData, walletAddress } = parseResult.data;

    console.log("[Convert] 🔍 Processing referral:", {
      code: referralData.ref,
      tag: referralData.tag || "(none)",
      source: referralData.source || "(none)",
      capturedAt: referralData.capturedAt,
      walletAddress: walletAddress || "(none)",
    });

    // Use VERIFIED email and userId from JWT
    const userEmail = auth.user.email;
    const dynamicUserId = auth.user.userId;

    // 2. Check expiry
    if (isExpired(referralData.capturedAt)) {
      console.log("[Convert] ⏰ Referral expired");
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
      console.log("[Convert] ⚠️ Code not approved:", referralData.ref);
      return NextResponse.json({
        success: true,
        attributed: false,
        reason: "code_not_approved",
      });
    }

    console.log("[Convert] ✅ Code is approved, checking existing referrals...");

    // 4. Check if user already has referral
    const existingReferral = await db.query.userReferrals.findFirst({
      where: eq(userReferrals.userEmail, userEmail),
    });

    if (existingReferral) {
      console.log("[Convert] ⚠️ User already has a referral attribution");
      return NextResponse.json({
        success: true,
        attributed: false,
        reason: "already_attributed",
      });
    }

    // 5. Insert referral record with sanitized params
    await db.insert(userReferrals).values({
      userEmail,
      dynamicUserId,
      walletAddress: walletAddress || null,
      referrerCode: referralData.ref,
      customTag: referralData.tag || null,
      source: referralData.source || null,
      fullParams: sanitizeFullParams(referralData.fullParams),
      referredAt: new Date(referralData.capturedAt),
    });

    console.log("[Convert] ✅ Referral successfully attributed:", {
      code: referralData.ref,
      userEmail,
      referrerCodeOwner: referrerCode.ownerEmail,
    });

    return NextResponse.json({
      success: true,
      attributed: true,
    });
  } catch (error) {
    console.error("[Convert] ❌ Error:", error);
    return NextResponse.json(
      { success: false, error: "server_error", message: "Internal server error" },
      { status: 500 }
    );
  }
}

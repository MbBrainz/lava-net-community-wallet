/**
 * GET/POST /api/admin/referrals
 *
 * GET: Get list of pending and approved referrals for admin panel
 * POST: Approve or reject a pending referral code
 *
 * Auth required: Yes (verified via JWT token) + Must be admin
 *
 * Headers:
 * - Authorization: Bearer <token>
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { referrerCodes } from "@/lib/db/schema";
import { eq, desc, and, ne } from "drizzle-orm";
import { adminActionSchema } from "@/lib/referral";
import { requireAdmin } from "@/lib/auth/server";

/**
 * GET /api/admin/referrals
 *
 * Returns lists of pending and approved referral codes with stats.
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication and admin status
    const auth = await requireAdmin(request);
    if (!auth.success) {
      return auth.response;
    }

    // Get pending codes
    const pending = await db.query.referrerCodes.findMany({
      where: eq(referrerCodes.isApproved, false),
      orderBy: [desc(referrerCodes.requestedAt)],
    });

    // Get approved codes with referral counts
    const approved = await db.query.referrerCodes.findMany({
      where: eq(referrerCodes.isApproved, true),
      with: {
        referrals: true,
      },
      orderBy: [desc(referrerCodes.approvedAt)],
    });

    // Map to response format
    const pendingResponse = pending.map((code) => ({
      code: code.code,
      ownerEmail: code.ownerEmail,
      requestedAt: code.requestedAt.toISOString(),
    }));

    const approvedResponse = approved.map((code) => ({
      code: code.code,
      ownerEmail: code.ownerEmail,
      approvedAt: code.approvedAt?.toISOString() || null,
      referralCount: code.referrals?.length || 0,
    }));

    return NextResponse.json({
      pending: pendingResponse,
      approved: approvedResponse,
    });
  } catch (error) {
    console.error("[Admin Referrals GET] Error:", error);
    return NextResponse.json(
      { error: "server_error", message: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/referrals
 *
 * Approve or reject a pending referral code.
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication and admin status
    const auth = await requireAdmin(request);
    if (!auth.success) {
      return auth.response;
    }

    const body = await request.json();

    // Validate request body
    const parseResult = adminActionSchema.safeParse(body);
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

    const { code, action } = parseResult.data;

    // Get the code
    const codeRecord = await db.query.referrerCodes.findFirst({
      where: eq(referrerCodes.code, code),
    });

    if (!codeRecord) {
      return NextResponse.json({
        success: false,
        error: "not_found",
        message: "Code not found",
      });
    }

    // Handle reject action
    if (action === "reject") {
      await db.delete(referrerCodes).where(eq(referrerCodes.code, code));

      // Log without PII in production
      if (process.env.NODE_ENV === "development") {
        console.log("[Admin] Code rejected:", code);
      }
      return NextResponse.json({
        success: true,
        action: "reject",
        code,
      });
    }

    // Handle approve action
    if (action === "approve") {
      // Check if already approved
      if (codeRecord.isApproved) {
        return NextResponse.json({
          success: false,
          error: "already_approved",
          message: "This code is already approved",
        });
      }

      // Check if another approved code with same name exists (different owner)
      const existingApproved = await db.query.referrerCodes.findFirst({
        where: and(
          eq(referrerCodes.code, code),
          eq(referrerCodes.isApproved, true),
          ne(referrerCodes.ownerEmail, codeRecord.ownerEmail)
        ),
      });

      if (existingApproved) {
        return NextResponse.json({
          success: false,
          error: "code_taken",
          message: "An approved code with this name already exists",
        });
      }

      // Approve the code
      await db
        .update(referrerCodes)
        .set({
          isApproved: true,
          approvedAt: new Date(),
        })
        .where(eq(referrerCodes.code, code));

      // Log without PII in production
      if (process.env.NODE_ENV === "development") {
        console.log("[Admin] Code approved:", code);
      }
      return NextResponse.json({
        success: true,
        action: "approve",
        code,
      });
    }

    return NextResponse.json(
      { success: false, error: "invalid_action", message: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("[Admin Referrals POST] Error:", error);
    return NextResponse.json(
      { success: false, error: "server_error", message: "Internal server error" },
      { status: 500 }
    );
  }
}

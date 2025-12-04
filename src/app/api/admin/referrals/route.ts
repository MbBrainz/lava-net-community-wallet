/**
 * GET/POST /api/admin/referrals
 *
 * GET: Get list of pending and approved referrals for admin panel
 * POST: Approve or reject a pending referral code
 *
 * Auth required: Yes + Must be admin
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { admins, referrerCodes } from "@/lib/db/schema";
import { eq, desc, and, ne } from "drizzle-orm";
import { adminActionSchema } from "@/lib/referral";

/**
 * Helper function to verify admin status
 */
async function verifyAdmin(email: string): Promise<boolean> {
  const admin = await db.query.admins.findFirst({
    where: eq(admins.email, email),
  });
  return !!admin;
}

/**
 * GET /api/admin/referrals
 *
 * Returns lists of pending and approved referral codes with stats.
 */
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

    // Verify admin
    const isAdmin = await verifyAdmin(email);
    if (!isAdmin) {
      return NextResponse.json(
        { error: "forbidden", message: "Admin access required" },
        { status: 403 }
      );
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
    const body = await request.json();

    // Validate admin email
    const adminEmail = body.adminEmail;
    if (!adminEmail) {
      return NextResponse.json(
        { success: false, error: "missing_email", message: "Admin email is required" },
        { status: 400 }
      );
    }

    // Verify admin
    const isAdmin = await verifyAdmin(adminEmail);
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: "forbidden", message: "Admin access required" },
        { status: 403 }
      );
    }

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

      console.log("[Admin] Code rejected:", code);
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

      console.log("[Admin] Code approved:", code);
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


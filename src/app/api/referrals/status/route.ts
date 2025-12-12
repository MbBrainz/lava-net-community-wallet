/**
 * GET /api/referrals/status
 *
 * Get the authenticated user's referrer status.
 * Returns whether they are a referrer, pending, or not a referrer.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/server";
import { db } from "@/lib/db/client";
import { referrers, referralCodes } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const auth = await getAuthenticatedUser(request);
  if (!auth.success) {
    return auth.response;
  }

  try {
    // Find referrer record with codes in a single query
    const referrer = await db.query.referrers.findFirst({
      where: eq(referrers.email, auth.user.email),
      with: {
        codes: {
          orderBy: desc(referralCodes.createdAt),
        },
      },
    });

    if (!referrer) {
      return NextResponse.json({ status: "none" });
    }

    if (!referrer.isApproved) {
      return NextResponse.json({
        status: "pending",
        requestedAt: referrer.createdAt.toISOString(),
      });
    }

    // Extract codes from relation
    const codes = referrer.codes;

    return NextResponse.json({
      status: "approved",
      referrerId: referrer.id,
      approvedAt: referrer.approvedAt?.toISOString() || referrer.updatedAt.toISOString(),
      canSendNotifications: referrer.canSendNotifications,
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
    console.error("[Referrals] Failed to get status:", error);
    return NextResponse.json(
      { error: "server_error", message: "Failed to get referrer status" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/referrals-v2/become
 *
 * Request to become a referrer.
 * Creates a pending referrer record that needs admin approval.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/server";
import { db } from "@/lib/db/client";
import { referrers, type Referrer } from "@/lib/db/schema/referrers";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  // Authenticate the request
  const auth = await getAuthenticatedUser(request);
  if (!auth.success) {
    return auth.response;
  }

  try {
    // Check if user is already a referrer
    const [existingReferrer]: Referrer[] = await db
      .select()
      .from(referrers)
      .where(eq(referrers.email, auth.user.email))
      .limit(1);

    if (existingReferrer) {
      if (existingReferrer.isApproved) {
        return NextResponse.json({
          status: "already_approved",
          message: "You are already an approved referrer",
          referrerId: existingReferrer.id,
        });
      }

      return NextResponse.json({
        status: "pending",
        message: "Your referrer request is pending approval",
        requestedAt: existingReferrer.createdAt.toISOString(),
      });
    }

    // Create new referrer record (pending approval)
    const [newReferrer] = await db
      .insert(referrers)
      .values({
        email: auth.user.email,
        dynamicUserId: auth.user.userId,
        isApproved: false,
        canSendNotifications: false,
      })
      .returning();

    return NextResponse.json({
      status: "pending",
      message: "Your request to become a referrer has been submitted",
      requestedAt: newReferrer.createdAt.toISOString(),
    });
  } catch (error) {
    console.error("[Referrals] Failed to create referrer:", error);
    return NextResponse.json(
      { error: "server_error", message: "Failed to submit referrer request" },
      { status: 500 }
    );
  }
}

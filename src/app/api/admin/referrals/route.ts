/**
 * /api/admin-v2/referrers
 *
 * GET: List all referrers (pending and approved)
 * PATCH: Approve/reject a referrer, toggle notifications
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/server";
import { db } from "@/lib/db/client";
import {
  referrers,
  referralCodes,
  userReferrals,
  type Referrer,
  type ReferralCode,
} from "@/lib/db/schema";
import { eq, desc, count } from "drizzle-orm";
import { adminReferrerActionSchema } from "@/lib/referral/types";

/**
 * GET /api/admin-v2/referrers
 *
 * List all referrers with their stats.
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.success) {
    return auth.response;
  }

  try {
    // Get all referrers
    const allReferrers: Referrer[] = await db
      .select()
      .from(referrers)
      .orderBy(desc(referrers.createdAt));

    // Get code counts and referral counts for each referrer
    const referrerStats = await Promise.all(
      allReferrers.map(async (referrer) => {
        const codes: ReferralCode[] = await db
          .select()
          .from(referralCodes)
          .where(eq(referralCodes.referrerId, referrer.id));

        const referralsResult = await db
          .select({ count: count() })
          .from(userReferrals)
          .where(eq(userReferrals.referrerId, referrer.id));

        return {
          referrer,
          codeCount: codes.length,
          totalReferrals: referralsResult[0]?.count || 0,
        };
      })
    );

    // Split into pending and approved
    const pending = referrerStats
      .filter((r) => !r.referrer.isApproved)
      .map((r) => ({
        referrerId: r.referrer.id,
        email: r.referrer.email,
        requestedAt: r.referrer.createdAt.toISOString(),
      }));

    const approved = referrerStats
      .filter((r) => r.referrer.isApproved)
      .map((r) => ({
        referrerId: r.referrer.id,
        email: r.referrer.email,
        approvedAt: r.referrer.approvedAt?.toISOString() || r.referrer.updatedAt.toISOString(),
        codeCount: r.codeCount,
        totalReferrals: r.totalReferrals,
        canSendNotifications: r.referrer.canSendNotifications,
      }));

    return NextResponse.json({ pending, approved });
  } catch (error) {
    console.error("[Admin] Failed to list referrers:", error);
    return NextResponse.json(
      { error: "server_error", message: "Failed to list referrers" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin-v2/referrers
 *
 * Perform admin action on a referrer.
 * Actions: approve, reject, enable_notifications, disable_notifications
 */
export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.success) {
    return auth.response;
  }

  try {
    const body = await request.json();
    const parsed = adminReferrerActionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "invalid_request", message: parsed.error.issues[0]?.message },
        { status: 400 }
      );
    }

    const { referrerId, action } = parsed.data;

    // Find the referrer
    const [referrer]: Referrer[] = await db
      .select()
      .from(referrers)
      .where(eq(referrers.id, referrerId))
      .limit(1);

    if (!referrer) {
      return NextResponse.json(
        { error: "not_found", message: "Referrer not found" },
        { status: 404 }
      );
    }

    switch (action) {
      case "approve": {
        if (referrer.isApproved) {
          return NextResponse.json(
            { error: "already_approved", message: "Referrer is already approved" },
            { status: 400 }
          );
        }

        await db
          .update(referrers)
          .set({
            isApproved: true,
            approvedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(referrers.id, referrerId));

        return NextResponse.json({
          success: true,
          action: "approved",
          referrerId,
        });
      }

      case "reject": {
        // Delete the referrer (and cascade to their codes/referrals)
        await db.delete(referrers).where(eq(referrers.id, referrerId));

        return NextResponse.json({
          success: true,
          action: "rejected",
          referrerId,
        });
      }

      case "enable_notifications": {
        if (!referrer.isApproved) {
          return NextResponse.json(
            { error: "not_approved", message: "Cannot enable notifications for unapproved referrer" },
            { status: 400 }
          );
        }

        await db
          .update(referrers)
          .set({
            canSendNotifications: true,
            updatedAt: new Date(),
          })
          .where(eq(referrers.id, referrerId));

        return NextResponse.json({
          success: true,
          action: "notifications_enabled",
          referrerId,
        });
      }

      case "disable_notifications": {
        await db
          .update(referrers)
          .set({
            canSendNotifications: false,
            updatedAt: new Date(),
          })
          .where(eq(referrers.id, referrerId));

        return NextResponse.json({
          success: true,
          action: "notifications_disabled",
          referrerId,
        });
      }

      default:
        return NextResponse.json(
          { error: "invalid_action", message: "Unknown action" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("[Admin] Failed to update referrer:", error);
    return NextResponse.json(
      { error: "server_error", message: "Failed to update referrer" },
      { status: 500 }
    );
  }
}

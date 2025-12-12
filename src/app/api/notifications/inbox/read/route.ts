/**
 * Mark Notifications as Read API
 *
 * POST: Mark specific notifications or all as read
 *
 * Request body:
 * - notificationIds?: string[] - Specific notification IDs to mark as read
 * - markAll?: boolean - If true, marks all notifications as read
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/server";
import { db } from "@/lib/db/client";
import { userNotifications } from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";

/**
 * POST /api/notifications/inbox/read
 *
 * Mark notifications as read.
 */
export async function POST(request: NextRequest) {
  // Authenticate the request
  const auth = await getAuthenticatedUser(request);
  if (!auth.success) {
    return auth.response;
  }

  try {
    const body = await request.json();
    const { notificationIds, markAll } = body as {
      notificationIds?: string[];
      markAll?: boolean;
    };

    const now = new Date();

    if (markAll) {
      // Mark all unread notifications as read for this user
      const result = await db
        .update(userNotifications)
        .set({ isRead: true, readAt: now })
        .where(
          and(
            eq(userNotifications.userId, auth.user.userId),
            eq(userNotifications.isRead, false)
          )
        )
        .returning({ id: userNotifications.id });

      return NextResponse.json({
        success: true,
        marked: result.length,
      });
    }

    if (notificationIds && Array.isArray(notificationIds) && notificationIds.length > 0) {
      // Mark specific notifications as read
      const result = await db
        .update(userNotifications)
        .set({ isRead: true, readAt: now })
        .where(
          and(
            eq(userNotifications.userId, auth.user.userId),
            inArray(userNotifications.id, notificationIds)
          )
        )
        .returning({ id: userNotifications.id });

      return NextResponse.json({
        success: true,
        marked: result.length,
      });
    }

    return NextResponse.json(
      { error: "invalid_request", message: "Provide notificationIds or markAll" },
      { status: 400 }
    );
  } catch (error) {
    console.error("[API] Failed to mark notifications as read:", error);
    return NextResponse.json(
      { error: "server_error", message: "Failed to mark notifications as read" },
      { status: 500 }
    );
  }
}


/**
 * Notification Inbox API
 *
 * GET: Fetch user's notifications with pagination
 *
 * Returns notifications for the authenticated user's inbox.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/server";
import { db } from "@/lib/db/client";
import { userNotifications, type UserNotification } from "@/lib/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";

/**
 * GET /api/notifications/inbox
 *
 * Fetch user's notifications with pagination.
 *
 * Query params:
 * - limit: number (default: 20, max: 50)
 * - cursor: string (notification ID for cursor-based pagination)
 */
export async function GET(request: NextRequest) {
  // Authenticate the request
  const auth = await getAuthenticatedUser(request);
  if (!auth.success) {
    return auth.response;
  }

  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 50);
    const cursor = searchParams.get("cursor");

    // Build query for notifications
    let notifications: UserNotification[];

    if (cursor) {
      // Get the cursor notification's createdAt for pagination
      const cursorNotification = await db.query.userNotifications.findFirst({
        where: eq(userNotifications.id, cursor),
        columns: { createdAt: true },
      });

      if (cursorNotification) {
        notifications = await db.query.userNotifications.findMany({
          where: and(
            eq(userNotifications.userId, auth.user.userId),
            sql`${userNotifications.createdAt} < ${cursorNotification.createdAt}`
          ),
          orderBy: [desc(userNotifications.createdAt)],
          limit: limit + 1,
        });
      } else {
        notifications = [];
      }
    } else {
      notifications = await db.query.userNotifications.findMany({
        where: eq(userNotifications.userId, auth.user.userId),
        orderBy: [desc(userNotifications.createdAt)],
        limit: limit + 1,
      });
    }

    // Check if there are more results
    const hasMore = notifications.length > limit;
    const items = hasMore ? notifications.slice(0, -1) : notifications;
    const nextCursor = hasMore ? items[items.length - 1]?.id : null;

    // Get unread count
    const [unreadResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(userNotifications)
      .where(
        and(
          eq(userNotifications.userId, auth.user.userId),
          eq(userNotifications.isRead, false)
        )
      );

    return NextResponse.json({
      notifications: items,
      unreadCount: unreadResult?.count ?? 0,
      nextCursor,
      hasMore,
    });
  } catch (error) {
    console.error("[API] Failed to fetch notifications:", error);
    return NextResponse.json(
      { error: "server_error", message: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}


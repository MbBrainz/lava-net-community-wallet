/**
 * Seed Notifications API
 *
 * POST: Create initial demo notifications for a user
 *
 * This endpoint creates sample notifications in the user's inbox.
 * Useful for demo purposes and initial app setup.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/server";
import { db } from "@/lib/db/client";
import { userNotifications } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

/**
 * Sample notifications to seed for new users.
 */
const SAMPLE_NOTIFICATIONS = [
  {
    type: "community" as const,
    title: "New Announcement",
    body: "LAVA Mainnet Launch Update posted",
    url: "/community/1",
    hoursAgo: 3,
  },
  {
    type: "app" as const,
    title: "App Update",
    body: "New features available! Check out the redesigned LAVA tab.",
    url: undefined,
    hoursAgo: 12,
  },
  {
    type: "community" as const,
    title: "Event Reminder",
    body: "Community AMA starts in 24 hours",
    url: "/community/2",
    hoursAgo: 24,
    isRead: true,
  },
  {
    type: "community" as const,
    title: "Governance Vote",
    body: "New proposal requires your attention",
    url: "/community/3",
    hoursAgo: 48,
    isRead: true,
  },
];

/**
 * POST /api/notifications/inbox/seed
 *
 * Create sample notifications for the authenticated user.
 * Skips if user already has notifications.
 */
export async function POST(request: NextRequest) {
  // Authenticate the request
  const auth = await getAuthenticatedUser(request);
  if (!auth.success) {
    return auth.response;
  }

  try {
    // Check if user already has notifications
    const [existingCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(userNotifications)
      .where(eq(userNotifications.userId, auth.user.userId));

    if (existingCount && existingCount.count > 0) {
      return NextResponse.json({
        success: true,
        seeded: 0,
        message: "User already has notifications",
      });
    }

    // Create sample notifications
    const now = Date.now();
    const notifications = SAMPLE_NOTIFICATIONS.map((n) => ({
      userId: auth.user.userId,
      type: n.type,
      title: n.title,
      body: n.body,
      url: n.url,
      isRead: n.isRead ?? false,
      createdAt: new Date(now - n.hoursAgo * 60 * 60 * 1000),
    }));

    await db.insert(userNotifications).values(notifications);

    return NextResponse.json({
      success: true,
      seeded: notifications.length,
    });
  } catch (error) {
    console.error("[API] Failed to seed notifications:", error);
    return NextResponse.json(
      { error: "server_error", message: "Failed to seed notifications" },
      { status: 500 }
    );
  }
}


/**
 * Send Notification API
 *
 * POST: Send push notifications to users
 *
 * Supports:
 * - Send to specific user(s) by userId
 * - Send to topic (community, wallet, price)
 * - Broadcast to all active tokens
 *
 * Requires admin authentication.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/server";
import { db } from "@/lib/db/client";
import { pushTokens, userNotifications, type NotificationType } from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import {
  sendPushNotification,
  sendPushNotificationToMany,
  sendToTopic,
} from "@/lib/firebase/admin";

/**
 * Map topic names to notification types.
 */
function topicToNotificationType(topic: string): NotificationType {
  switch (topic) {
    case "community":
      return "community";
    case "wallet":
      return "transaction";
    case "price":
      return "app";
    default:
      return "system";
  }
}

/**
 * Create inbox records for users when sending notifications.
 */
async function createInboxRecords(
  userIds: string[],
  notification: {
    type: NotificationType;
    title: string;
    body: string;
    url?: string;
    data?: Record<string, string>;
  }
): Promise<void> {
  if (userIds.length === 0) return;

  try {
    await db.insert(userNotifications).values(
      userIds.map((userId) => ({
        userId,
        type: notification.type,
        title: notification.title,
        body: notification.body,
        url: notification.url,
        data: notification.data,
      }))
    );
  } catch (error) {
    console.error("[API] Failed to create inbox records:", error);
    // Don't throw - inbox records are secondary to push notifications
  }
}

/**
 * Request body for sending notifications.
 */
interface SendNotificationRequest {
  /** Notification title */
  title: string;
  /** Notification body */
  body: string;
  /** URL to open when clicked */
  url?: string;
  /** Additional data payload */
  data?: Record<string, string>;
  /** Target type: 'topic' | 'users' | 'broadcast' */
  targetType: "topic" | "users" | "broadcast";
  /** For topic: the topic name (community, wallet, price) */
  topic?: string;
  /** For users: array of user IDs */
  userIds?: string[];
}

/**
 * POST /api/notifications/send
 *
 * Send push notifications to targeted users.
 * Admin only.
 */
export async function POST(request: NextRequest) {
  // Require admin authentication
  const auth = await requireAdmin(request);
  if (!auth.success) {
    return auth.response;
  }

  try {
    const body: SendNotificationRequest = await request.json();
    const { title, body: notificationBody, url, data, targetType, topic, userIds } = body;

    // Validate required fields
    if (!title || typeof title !== "string") {
      return NextResponse.json(
        { error: "invalid_request", message: "Title is required" },
        { status: 400 }
      );
    }

    if (!notificationBody || typeof notificationBody !== "string") {
      return NextResponse.json(
        { error: "invalid_request", message: "Body is required" },
        { status: 400 }
      );
    }

    if (!targetType || !["topic", "users", "broadcast"].includes(targetType)) {
      return NextResponse.json(
        { error: "invalid_request", message: "Invalid targetType" },
        { status: 400 }
      );
    }

    // Handle different target types
    switch (targetType) {
      case "topic": {
        if (!topic || !["community", "wallet", "price"].includes(topic)) {
          return NextResponse.json(
            { error: "invalid_request", message: "Invalid topic" },
            { status: 400 }
          );
        }

        const result = await sendToTopic({
          topic,
          title,
          body: notificationBody,
          url,
          data,
        });

        return NextResponse.json({
          success: true,
          targetType: "topic",
          topic,
          messageId: result,
        });
      }

      case "users": {
        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
          return NextResponse.json(
            { error: "invalid_request", message: "userIds required for users target" },
            { status: 400 }
          );
        }

        // Create inbox records for all targeted users
        await createInboxRecords(userIds, {
          type: topic ? topicToNotificationType(topic) : "system",
          title,
          body: notificationBody,
          url,
          data,
        });

        // Get active tokens for specified users
        const tokens = await db.query.pushTokens.findMany({
          where: and(
            inArray(pushTokens.userId, userIds),
            eq(pushTokens.isActive, true)
          ),
        });

        if (tokens.length === 0) {
          return NextResponse.json({
            success: true,
            targetType: "users",
            sent: 0,
            inboxCreated: userIds.length,
            message: "No active tokens found for specified users, but inbox records created",
          });
        }

        const tokenStrings = tokens.map((t) => t.token);

        if (tokenStrings.length === 1) {
          const result = await sendPushNotification({
            token: tokenStrings[0],
            title,
            body: notificationBody,
            url,
            data,
          });

          return NextResponse.json({
            success: true,
            targetType: "users",
            sent: 1,
            inboxCreated: userIds.length,
            messageId: result,
          });
        }

        const result = await sendPushNotificationToMany({
          tokens: tokenStrings,
          title,
          body: notificationBody,
          url,
          data,
        });

        return NextResponse.json({
          success: true,
          targetType: "users",
          sent: result.successCount,
          failed: result.failureCount,
          inboxCreated: userIds.length,
        });
      }

      case "broadcast": {
        // Get all active tokens
        const tokens = await db.query.pushTokens.findMany({
          where: eq(pushTokens.isActive, true),
        });

        if (tokens.length === 0) {
          return NextResponse.json({
            success: true,
            targetType: "broadcast",
            sent: 0,
            message: "No active tokens found",
          });
        }

        // Get unique user IDs from tokens for inbox records
        const uniqueUserIds = [...new Set(tokens.map((t) => t.userId))];

        // Create inbox records for all users with active tokens
        await createInboxRecords(uniqueUserIds, {
          type: topic ? topicToNotificationType(topic) : "system",
          title,
          body: notificationBody,
          url,
          data,
        });

        const tokenStrings = tokens.map((t) => t.token);

        // FCM has a limit of 500 tokens per multicast
        const batchSize = 500;
        let totalSuccess = 0;
        let totalFailure = 0;

        for (let i = 0; i < tokenStrings.length; i += batchSize) {
          const batch = tokenStrings.slice(i, i + batchSize);
          const result = await sendPushNotificationToMany({
            tokens: batch,
            title,
            body: notificationBody,
            url,
            data,
          });
          totalSuccess += result.successCount;
          totalFailure += result.failureCount;
        }

        return NextResponse.json({
          success: true,
          targetType: "broadcast",
          sent: totalSuccess,
          failed: totalFailure,
          total: tokens.length,
          inboxCreated: uniqueUserIds.length,
        });
      }

      default:
        return NextResponse.json(
          { error: "invalid_request", message: "Invalid targetType" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("[API] Failed to send notification:", error);
    return NextResponse.json(
      { error: "server_error", message: "Failed to send notification" },
      { status: 500 }
    );
  }
}

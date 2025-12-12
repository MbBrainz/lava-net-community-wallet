/**
 * Push Notification Subscribe/Unsubscribe API
 *
 * POST: Register a new FCM token for push notifications
 * DELETE: Remove an FCM token (unsubscribe)
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/server";
import { db } from "@/lib/db/client";
import {
  pushTokens,
  notificationPreferences,
  NOTIFICATION_TOPICS,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import {
  subscribeToTopic,
  unsubscribeFromTopic,
} from "@/lib/firebase/admin";

/**
 * POST /api/notifications/subscribe
 *
 * Register a new FCM token for the authenticated user.
 * Also subscribes the token to FCM topics based on user preferences.
 */
export async function POST(request: NextRequest) {
  // Authenticate the request
  const auth = await getAuthenticatedUser(request);
  if (!auth.success) {
    return auth.response;
  }

  try {
    const body = await request.json();
    const { token, platform = "web", deviceInfo } = body;

    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { error: "invalid_request", message: "Token is required" },
        { status: 400 }
      );
    }

    // Check if token already exists
    const existingToken = await db.query.pushTokens.findFirst({
      where: eq(pushTokens.token, token),
    });

    if (existingToken) {
      // Update existing token (reactivate if was deactivated)
      await db
        .update(pushTokens)
        .set({
          userId: auth.user.userId,
          userEmail: auth.user.email,
          platform,
          deviceInfo,
          isActive: true,
          updatedAt: new Date(),
        })
        .where(eq(pushTokens.token, token));
    } else {
      // Insert new token
      await db.insert(pushTokens).values({
        userId: auth.user.userId,
        userEmail: auth.user.email,
        token,
        platform,
        deviceInfo,
        isActive: true,
      });
    }

    // Get or create user preferences
    let preferences = await db.query.notificationPreferences.findFirst({
      where: eq(notificationPreferences.userId, auth.user.userId),
    });

    if (!preferences) {
      // Create default preferences
      const [newPrefs] = await db
        .insert(notificationPreferences)
        .values({
          userId: auth.user.userId,
          userEmail: auth.user.email,
          communityUpdates: true,
          walletAlerts: true,
          priceAlerts: true,
        })
        .returning();
      preferences = newPrefs;
    }

    // Subscribe to FCM topics based on preferences
    const topicSubscriptions: Promise<unknown>[] = [];

    if (preferences.communityUpdates) {
      topicSubscriptions.push(
        subscribeToTopic([token], NOTIFICATION_TOPICS.communityUpdates)
      );
    }

    if (preferences.walletAlerts) {
      topicSubscriptions.push(
        subscribeToTopic([token], NOTIFICATION_TOPICS.walletAlerts)
      );
    }

    if (preferences.priceAlerts) {
      topicSubscriptions.push(
        subscribeToTopic([token], NOTIFICATION_TOPICS.priceAlerts)
      );
    }

    // Wait for all topic subscriptions
    await Promise.allSettled(topicSubscriptions);

    return NextResponse.json({
      success: true,
      message: "Push notifications enabled",
      preferences: {
        communityUpdates: preferences.communityUpdates,
        walletAlerts: preferences.walletAlerts,
        priceAlerts: preferences.priceAlerts,
      },
    });
  } catch (error) {
    console.error("[API] Failed to subscribe:", error);
    return NextResponse.json(
      { error: "server_error", message: "Failed to enable push notifications" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/notifications/subscribe
 *
 * Remove an FCM token (unsubscribe from push notifications).
 */
export async function DELETE(request: NextRequest) {
  // Authenticate the request
  const auth = await getAuthenticatedUser(request);
  if (!auth.success) {
    return auth.response;
  }

  try {
    const body = await request.json();
    const { token } = body;

    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { error: "invalid_request", message: "Token is required" },
        { status: 400 }
      );
    }

    // Deactivate the token (soft delete)
    await db
      .update(pushTokens)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(pushTokens.token, token),
          eq(pushTokens.userId, auth.user.userId)
        )
      );

    // Unsubscribe from all topics
    const topicUnsubscriptions = Object.values(NOTIFICATION_TOPICS).map(
      (topic) => unsubscribeFromTopic([token], topic)
    );

    await Promise.allSettled(topicUnsubscriptions);

    return NextResponse.json({
      success: true,
      message: "Push notifications disabled",
    });
  } catch (error) {
    console.error("[API] Failed to unsubscribe:", error);
    return NextResponse.json(
      { error: "server_error", message: "Failed to disable push notifications" },
      { status: 500 }
    );
  }
}

/**
 * Notification Preferences API
 *
 * GET: Get user's notification preferences
 * PATCH: Update user's notification preferences
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/server";
import { db } from "@/lib/db/client";
import {
  pushTokens,
  notificationPreferences,
  NOTIFICATION_TOPICS,
  type NotificationPreferenceKey,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  subscribeToTopic,
  unsubscribeFromTopic,
} from "@/lib/firebase/admin";

/**
 * GET /api/notifications/preferences
 *
 * Get the current user's notification preferences.
 */
export async function GET(request: NextRequest) {
  const auth = await getAuthenticatedUser(request);
  if (!auth.success) {
    return auth.response;
  }

  try {
    // Get or create preferences
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

    return NextResponse.json({
      communityUpdates: preferences.communityUpdates,
      walletAlerts: preferences.walletAlerts,
      priceAlerts: preferences.priceAlerts,
    });
  } catch (error) {
    console.error("[API] Failed to get preferences:", error);
    return NextResponse.json(
      { error: "server_error", message: "Failed to get preferences" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/notifications/preferences
 *
 * Update the user's notification preferences.
 * Also updates FCM topic subscriptions for active tokens.
 */
export async function PATCH(request: NextRequest) {
  const auth = await getAuthenticatedUser(request);
  if (!auth.success) {
    return auth.response;
  }

  try {
    const body = await request.json();
    const { communityUpdates, walletAlerts, priceAlerts } = body;

    // Validate input
    const updates: Partial<Record<NotificationPreferenceKey, boolean>> = {};

    if (typeof communityUpdates === "boolean") {
      updates.communityUpdates = communityUpdates;
    }
    if (typeof walletAlerts === "boolean") {
      updates.walletAlerts = walletAlerts;
    }
    if (typeof priceAlerts === "boolean") {
      updates.priceAlerts = priceAlerts;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "invalid_request", message: "No valid preferences provided" },
        { status: 400 }
      );
    }

    // Get current preferences
    const currentPrefs = await db.query.notificationPreferences.findFirst({
      where: eq(notificationPreferences.userId, auth.user.userId),
    });

    // Update or create preferences
    let updatedPrefs;
    if (currentPrefs) {
      [updatedPrefs] = await db
        .update(notificationPreferences)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(eq(notificationPreferences.userId, auth.user.userId))
        .returning();
    } else {
      [updatedPrefs] = await db
        .insert(notificationPreferences)
        .values({
          userId: auth.user.userId,
          userEmail: auth.user.email,
          communityUpdates: updates.communityUpdates ?? true,
          walletAlerts: updates.walletAlerts ?? true,
          priceAlerts: updates.priceAlerts ?? true,
        })
        .returning();
    }

    // Get user's active tokens to update topic subscriptions
    const activeTokens = await db.query.pushTokens.findMany({
      where: eq(pushTokens.userId, auth.user.userId),
    });

    const tokens = activeTokens
      .filter((t) => t.isActive)
      .map((t) => t.token);

    if (tokens.length > 0) {
      // Update topic subscriptions based on preference changes
      const topicUpdates: Promise<unknown>[] = [];

      for (const [prefKey, topic] of Object.entries(NOTIFICATION_TOPICS)) {
        const key = prefKey as NotificationPreferenceKey;
        const enabled = updatedPrefs[key];
        const wasEnabled = currentPrefs?.[key] ?? true;

        // Only update if the preference actually changed
        if (enabled !== wasEnabled) {
          if (enabled) {
            topicUpdates.push(subscribeToTopic(tokens, topic));
          } else {
            topicUpdates.push(unsubscribeFromTopic(tokens, topic));
          }
        }
      }

      await Promise.allSettled(topicUpdates);
    }

    return NextResponse.json({
      success: true,
      preferences: {
        communityUpdates: updatedPrefs.communityUpdates,
        walletAlerts: updatedPrefs.walletAlerts,
        priceAlerts: updatedPrefs.priceAlerts,
      },
    });
  } catch (error) {
    console.error("[API] Failed to update preferences:", error);
    return NextResponse.json(
      { error: "server_error", message: "Failed to update preferences" },
      { status: 500 }
    );
  }
}

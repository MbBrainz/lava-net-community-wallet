/**
 * Push Notification Schema
 *
 * Tables:
 * 1. push_tokens - FCM device tokens for each user
 * 2. notification_preferences - User notification preferences (synced to FCM topics)
 */

import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";

// ============================================
// TABLE: push_tokens
// ============================================

/**
 * Stores FCM device tokens for push notifications.
 *
 * A user can have multiple tokens (multiple devices).
 * Tokens can become invalid and should be cleaned up periodically.
 */
export const pushTokens = pgTable("push_tokens", {
  /** Unique identifier */
  id: uuid("id").defaultRandom().primaryKey(),

  /** Dynamic.xyz user ID */
  userId: varchar("user_id", { length: 255 }).notNull(),

  /** User's email address */
  userEmail: varchar("user_email", { length: 255 }).notNull(),

  /** FCM device token (can be long) */
  token: text("token").notNull().unique(),

  /** Platform: 'web' | 'ios' | 'android' */
  platform: varchar("platform", { length: 20 }).notNull().default("web"),

  /** Device info for debugging (userAgent, etc.) */
  deviceInfo: jsonb("device_info"),

  /** Whether this token is active (soft delete) */
  isActive: boolean("is_active").notNull().default(true),

  /** When token was first registered */
  createdAt: timestamp("created_at").defaultNow().notNull(),

  /** When token was last updated/verified */
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================
// TABLE: notification_preferences
// ============================================

/**
 * User notification preferences.
 *
 * Each preference maps to an FCM topic:
 * - communityUpdates → "community" topic
 * - walletAlerts → "wallet" topic
 * - priceAlerts → "price" topic
 *
 * When preferences change, we subscribe/unsubscribe from topics.
 */
export const notificationPreferences = pgTable("notification_preferences", {
  /** Unique identifier */
  id: uuid("id").defaultRandom().primaryKey(),

  /** Dynamic.xyz user ID (unique - one record per user) */
  userId: varchar("user_id", { length: 255 }).notNull().unique(),

  /** User's email address */
  userEmail: varchar("user_email", { length: 255 }).notNull(),

  /** Community announcements, events, governance */
  communityUpdates: boolean("community_updates").notNull().default(true),

  /** Wallet activity: transactions, balance changes */
  walletAlerts: boolean("wallet_alerts").notNull().default(true),

  /** Price alerts for LAVA token */
  priceAlerts: boolean("price_alerts").notNull().default(true),

  /** When preferences were created */
  createdAt: timestamp("created_at").defaultNow().notNull(),

  /** When preferences were last updated */
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================
// TYPES
// ============================================

/**
 * Notification preference keys that map to FCM topics.
 */
export const NOTIFICATION_TOPICS = {
  communityUpdates: "community",
  walletAlerts: "wallet",
  priceAlerts: "price",
} as const;

export type NotificationPreferenceKey = keyof typeof NOTIFICATION_TOPICS;
export type NotificationTopic = (typeof NOTIFICATION_TOPICS)[NotificationPreferenceKey];

/**
 * Insert type for push_tokens table.
 */
export type NewPushToken = typeof pushTokens.$inferInsert;

/**
 * Select type for push_tokens table.
 */
export type PushToken = typeof pushTokens.$inferSelect;

/**
 * Insert type for notification_preferences table.
 */
export type NewNotificationPreferences = typeof notificationPreferences.$inferInsert;

/**
 * Select type for notification_preferences table.
 */
export type NotificationPreferences = typeof notificationPreferences.$inferSelect;

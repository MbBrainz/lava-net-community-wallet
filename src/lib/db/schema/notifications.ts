/**
 * User Notifications Schema (Inbox)
 *
 * Stores notifications that have been sent to users.
 * These are created when push notifications are sent and displayed in the inbox UI.
 */

import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  jsonb,
  index,
} from "drizzle-orm/pg-core";

// ============================================
// TABLE: user_notifications
// ============================================

/**
 * Notification types that map to UI categories.
 */
export const NOTIFICATION_TYPES = {
  community: "community",
  app: "app",
  transaction: "transaction",
  system: "system",
} as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES];

/**
 * User notifications inbox table.
 *
 * Stores all notifications sent to users for display in the notifications page.
 * Created automatically when push notifications are sent.
 */
export const userNotifications = pgTable(
  "user_notifications",
  {
    /** Unique identifier */
    id: uuid("id").defaultRandom().primaryKey(),

    /** Dynamic.xyz user ID */
    userId: varchar("user_id", { length: 255 }).notNull(),

    /** Notification type: 'community' | 'app' | 'transaction' | 'system' */
    type: varchar("type", { length: 50 }).notNull().default("system"),

    /** Notification title */
    title: varchar("title", { length: 255 }).notNull(),

    /** Notification body/message */
    body: text("body").notNull(),

    /** Optional URL to navigate to when clicked */
    url: varchar("url", { length: 512 }),

    /** Additional data payload (JSON) */
    data: jsonb("data"),

    /** Whether user has read this notification */
    isRead: boolean("is_read").notNull().default(false),

    /** When notification was created */
    createdAt: timestamp("created_at").defaultNow().notNull(),

    /** When notification was read (if applicable) */
    readAt: timestamp("read_at"),
  },
  (table) => [
    // Index for efficient user queries (most common access pattern)
    index("user_notifications_user_idx").on(table.userId, table.createdAt),
    // Index for unread count queries
    index("user_notifications_unread_idx").on(table.userId, table.isRead),
  ]
);

// ============================================
// TYPES
// ============================================

/**
 * Insert type for user_notifications table.
 */
export type NewUserNotification = typeof userNotifications.$inferInsert;

/**
 * Select type for user_notifications table.
 */
export type UserNotification = typeof userNotifications.$inferSelect;


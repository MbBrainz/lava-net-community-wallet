/**
 * PWA Install Monitoring Schema
 *
 * Tracks each notable event in the Add-To-Home-Screen flow so we can measure
 * how many installs happen, when they occur, and which authenticated account
 * triggered them.
 */

import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  boolean,
  jsonb,
} from "drizzle-orm/pg-core";

export const pwaInstallEvents = pgTable("pwa_install_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  eventType: varchar("event_type", { length: 40 }).notNull(),
  userId: varchar("user_id", { length: 255 }),
  triggeredBy: varchar("triggered_by", { length: 64 }),
  installSurface: varchar("install_surface", { length: 64 }),
  platform: varchar("platform", { length: 128 }),
  userAgent: varchar("user_agent", { length: 512 }),
  isStandalone: boolean("is_standalone"),
  metadata: jsonb("metadata"),
  occurredAt: timestamp("occurred_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

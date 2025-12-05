/**
 * Referral System Database Schema
 *
 * Tables:
 * 1. admins - Email addresses of admin users
 * 2. referrer_codes - Referral code requests and approved codes
 * 3. user_referrals - Attribution records (who referred whom)
 */

import {
  pgTable,
  varchar,
  boolean,
  timestamp,
  uuid,
  jsonb,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ============================================
// TABLE: admins
// ============================================

/**
 * Stores email addresses of users who have admin access.
 *
 * Admin emails are added manually via direct database insert.
 * If a user's email is in this table, they see the admin panel.
 */
export const admins = pgTable("admins", {
  /** Admin's email address (primary key) */
  email: varchar("email", { length: 255 }).primaryKey(),

  /** When this admin was added */
  createdAt: timestamp("created_at").defaultNow().notNull(),

  /** Optional notes about this admin */
  notes: varchar("notes", { length: 500 }),
});

// ============================================
// TABLE: referrer_codes
// ============================================

/**
 * Stores referral code requests and approved codes.
 *
 * Lifecycle:
 * 1. User requests a code → is_approved = false
 * 2. Admin approves → is_approved = true, approved_at set
 * 3. Admin rejects → Row deleted from table
 */
export const referrerCodes = pgTable("referrer_codes", {
  /** The referral code (e.g., "alice123") - max 20 chars */
  code: varchar("code", { length: 20 }).primaryKey(),

  /** Email of the user who owns/requested this code */
  ownerEmail: varchar("owner_email", { length: 255 }).notNull(),

  /** Dynamic.xyz user ID of the owner */
  ownerDynamicUserId: varchar("owner_dynamic_user_id", { length: 255 }).notNull(),

  /** Whether the code has been approved by an admin */
  isApproved: boolean("is_approved").default(false).notNull(),

  /** When the code was requested */
  requestedAt: timestamp("requested_at").defaultNow().notNull(),

  /** When the code was approved (null if pending) */
  approvedAt: timestamp("approved_at"),

  /** Additional metadata (for future use) */
  metadata: jsonb("metadata"),
});

// ============================================
// TABLE: user_referrals
// ============================================

/**
 * Records which users were referred by which codes.
 *
 * Created when a new user signs up AND:
 * - They have a referral in localStorage
 * - The referral code is approved
 * - The referral is not expired (< 30 days old)
 */
export const userReferrals = pgTable("user_referrals", {
  /** Unique identifier for this referral record */
  id: uuid("id").defaultRandom().primaryKey(),

  /** Email of the referred user (unique - one referral per user) */
  userEmail: varchar("user_email", { length: 255 }).notNull().unique(),

  /** Dynamic.xyz user ID of the referred user */
  dynamicUserId: varchar("dynamic_user_id", { length: 255 }).notNull(),

  /** Wallet address of the referred user (may be null initially) */
  walletAddress: varchar("wallet_address", { length: 255 }),

  /** The referral code that referred this user */
  referrerCode: varchar("referrer_code", { length: 20 })
    .notNull()
    .references(() => referrerCodes.code),

  /** Custom tag from URL (?tag=xyz) */
  customTag: varchar("custom_tag", { length: 255 }),

  /** Source from URL (?source=xyz) */
  source: varchar("source", { length: 255 }),

  /** All URL parameters captured (for future analysis) */
  fullParams: jsonb("full_params").notNull(),

  /** When the referral link was clicked */
  referredAt: timestamp("referred_at").notNull(),

  /** When the user signed up */
  convertedAt: timestamp("converted_at").defaultNow().notNull(),
});

// ============================================
// RELATIONS
// ============================================

/**
 * Drizzle relations enable type-safe joins and nested queries.
 */

/** referrer_codes has many user_referrals */
export const referrerCodesRelations = relations(referrerCodes, ({ many }) => ({
  referrals: many(userReferrals),
}));

/** user_referrals belongs to one referrer_code */
export const userReferralsRelations = relations(userReferrals, ({ one }) => ({
  referrerCode: one(referrerCodes, {
    fields: [userReferrals.referrerCode],
    references: [referrerCodes.code],
  }),
}));


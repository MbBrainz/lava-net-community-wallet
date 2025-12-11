/**
 * Referral System Database Schema (v2 - Refactored)
 *
 * New architecture:
 * 1. referrers - The people who can refer (approved accounts)
 * 2. referral_codes - Short 6-char codes owned by referrers (multiple per referrer)
 * 3. user_referrals - Attribution records (who signed up with which code)
 *
 * Admins table remains separate and unchanged.
 */

import {
  pgTable,
  varchar,
  boolean,
  timestamp,
  uuid,
  integer,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ============================================
// TABLE: referrers
// ============================================

/**
 * Stores approved referrer accounts.
 *
 * Lifecycle:
 * 1. User requests to become a referrer → is_approved = false
 * 2. Admin approves → is_approved = true, approved_at set
 * 3. Approved referrer can create codes (up to 20)
 */
export const referrers = pgTable("referrers", {
  /** Unique identifier (UUID) */
  id: uuid("id").defaultRandom().primaryKey(),

  /** Referrer's email address (unique) */
  email: varchar("email", { length: 255 }).notNull().unique(),

  /** Dynamic.xyz user ID (unique) */
  dynamicUserId: varchar("dynamic_user_id", { length: 255 }).notNull().unique(),

  /** Whether this referrer is approved by admin */
  isApproved: boolean("is_approved").notNull().default(false),

  /** Whether this referrer can send push notifications to their referrals */
  canSendNotifications: boolean("can_send_notifications").notNull().default(false),

  /** When the referrer was approved (null if pending) */
  approvedAt: timestamp("approved_at"),

  /** When the referrer requested access */
  createdAt: timestamp("created_at").defaultNow().notNull(),

  /** Last update timestamp */
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================
// TABLE: referral_codes
// ============================================

/**
 * Stores short 6-character referral codes.
 *
 * Each referrer can have up to 20 codes.
 * Codes are auto-generated using alphanumeric characters.
 */
export const referralCodes = pgTable("referral_codes", {
  /** The 6-character code (e.g., "A3X9K2") - primary key */
  code: varchar("code", { length: 6 }).primaryKey(),

  /** The referrer who owns this code */
  referrerId: uuid("referrer_id")
    .notNull()
    .references(() => referrers.id, { onDelete: "cascade" }),

  /** Optional label for campaign tracking (e.g., "Twitter", "Discord") */
  label: varchar("label", { length: 100 }),

  /** Whether this code is active (can be used) */
  isActive: boolean("is_active").notNull().default(true),

  /** Optional expiration date (null = never expires) */
  expiresAt: timestamp("expires_at"),

  /** Denormalized usage counter for quick lookup */
  usageCount: integer("usage_count").notNull().default(0),

  /** When this code was created */
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================
// TABLE: user_referrals
// ============================================

/**
 * Records which users signed up with which referral codes.
 *
 * Each user can only have one referral record (first attribution wins).
 */
export const userReferrals = pgTable("user_referrals", {
  /** Unique identifier */
  id: uuid("id").defaultRandom().primaryKey(),

  /** Email of the referred user (unique - one referral per user) */
  userEmail: varchar("user_email", { length: 255 }).notNull().unique(),

  /** Dynamic.xyz user ID of the referred user */
  userDynamicId: varchar("user_dynamic_id", { length: 255 }).notNull().unique(),

  /** Wallet address of the referred user (may be null initially) */
  userWalletAddress: varchar("user_wallet_address", { length: 255 }),

  /** The code that was used for signup */
  codeUsed: varchar("code_used", { length: 6 })
    .notNull()
    .references(() => referralCodes.code),

  /** Denormalized referrer ID for fast queries (avoids join through codes) */
  referrerId: uuid("referrer_id")
    .notNull()
    .references(() => referrers.id),

  /** When the user signed up */
  convertedAt: timestamp("converted_at").defaultNow().notNull(),
});

// ============================================
// TABLE: admins (unchanged - keeping from original)
// ============================================

/**
 * Stores email addresses of users who have admin access.
 * This is kept separate from referrers.
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
// RELATIONS
// ============================================

/** Referrers have many codes */
export const referrersRelations = relations(referrers, ({ many }) => ({
  codes: many(referralCodes),
  referrals: many(userReferrals),
}));

/** Codes belong to one referrer, have many referrals */
export const referralCodesRelations = relations(referralCodes, ({ one, many }) => ({
  referrer: one(referrers, {
    fields: [referralCodes.referrerId],
    references: [referrers.id],
  }),
  referrals: many(userReferrals),
}));

/** User referrals belong to one code and one referrer */
export const userReferralsRelations = relations(userReferrals, ({ one }) => ({
  code: one(referralCodes, {
    fields: [userReferrals.codeUsed],
    references: [referralCodes.code],
  }),
  referrer: one(referrers, {
    fields: [userReferrals.referrerId],
    references: [referrers.id],
  }),
}));

// ============================================
// TYPES
// ============================================

/** Insert type for referrers table */
export type NewReferrer = typeof referrers.$inferInsert;

/** Select type for referrers table */
export type Referrer = typeof referrers.$inferSelect;

/** Insert type for referral_codes table */
export type NewReferralCode = typeof referralCodes.$inferInsert;

/** Select type for referral_codes table */
export type ReferralCode = typeof referralCodes.$inferSelect;

/** Insert type for user_referrals table */
export type NewUserReferral = typeof userReferrals.$inferInsert;

/** Select type for user_referrals table */
export type UserReferral = typeof userReferrals.$inferSelect;

// ============================================
// CONSTANTS
// ============================================

/** Maximum number of codes a referrer can create */
export const MAX_CODES_PER_REFERRER = 20;

/** Length of auto-generated codes */
export const CODE_LENGTH = 6;

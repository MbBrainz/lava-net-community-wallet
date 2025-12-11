-- Referral System Refactor Migration
-- Migration: 0002_refactor_referrals.sql
--
-- This migration restructures the referral system:
-- - Creates new `referrers` table (the people)
-- - Restructures `referral_codes` table (short 6-char codes)
-- - Restructures `user_referrals` table (signups)
--
-- NOTE: Run manual data migration for existing 13 entries before dropping old tables.
-- See migration steps at the bottom of this file.

-- ============================================
-- STEP 1: Create new tables
-- ============================================

-- Table: referrers (The People)
CREATE TABLE IF NOT EXISTS "referrers" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "email" varchar(255) NOT NULL UNIQUE,
  "dynamic_user_id" varchar(255) NOT NULL UNIQUE,
  "is_approved" boolean NOT NULL DEFAULT false,
  "can_send_notifications" boolean NOT NULL DEFAULT false,
  "approved_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Indexes for referrers
CREATE INDEX IF NOT EXISTS "idx_referrers_email" ON "referrers" ("email");
CREATE INDEX IF NOT EXISTS "idx_referrers_dynamic_user_id" ON "referrers" ("dynamic_user_id");
CREATE INDEX IF NOT EXISTS "idx_referrers_approved" ON "referrers" ("is_approved") WHERE "is_approved" = true;

-- Table: referral_codes (The Short Codes)
-- NOTE: This replaces the old referrer_codes table structure
CREATE TABLE IF NOT EXISTS "referral_codes_v2" (
  "code" varchar(6) PRIMARY KEY NOT NULL,
  "referrer_id" uuid NOT NULL REFERENCES "referrers"("id") ON DELETE CASCADE,
  "label" varchar(100),
  "is_active" boolean NOT NULL DEFAULT true,
  "expires_at" timestamp,
  "usage_count" integer NOT NULL DEFAULT 0,
  "created_at" timestamp DEFAULT now() NOT NULL
);

-- Indexes for referral_codes
CREATE INDEX IF NOT EXISTS "idx_referral_codes_v2_referrer" ON "referral_codes_v2" ("referrer_id");
CREATE INDEX IF NOT EXISTS "idx_referral_codes_v2_active" ON "referral_codes_v2" ("is_active") WHERE "is_active" = true;

-- Table: user_referrals (The Signups)
-- NOTE: This replaces the old user_referrals table structure
CREATE TABLE IF NOT EXISTS "user_referrals_v2" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_email" varchar(255) NOT NULL UNIQUE,
  "user_dynamic_id" varchar(255) NOT NULL UNIQUE,
  "user_wallet_address" varchar(255),
  "code_used" varchar(6) NOT NULL REFERENCES "referral_codes_v2"("code"),
  "referrer_id" uuid NOT NULL REFERENCES "referrers"("id"),
  "converted_at" timestamp DEFAULT now() NOT NULL
);

-- Indexes for user_referrals
CREATE INDEX IF NOT EXISTS "idx_user_referrals_v2_referrer" ON "user_referrals_v2" ("referrer_id");
CREATE INDEX IF NOT EXISTS "idx_user_referrals_v2_code" ON "user_referrals_v2" ("code_used");

-- ============================================
-- STEP 2: Manual Data Migration (Run these manually)
-- ============================================

-- 2a. Insert referrers from old referrer_codes table
-- INSERT INTO "referrers" ("email", "dynamic_user_id", "is_approved", "approved_at", "created_at")
-- SELECT "owner_email", "owner_dynamic_user_id", "is_approved", "approved_at", "requested_at"
-- FROM "referrer_codes"
-- WHERE "is_approved" = true;

-- 2b. For each old referrer, generate a new 6-char code
-- This needs to be done manually or via application code since we need to:
-- - Generate unique 6-char codes
-- - Map old codes to new codes
-- - Update user_referrals with new codes

-- Example for one referrer:
-- INSERT INTO "referral_codes_v2" ("code", "referrer_id", "label", "is_active", "usage_count", "created_at")
-- VALUES ('A3X9K2', '<referrer-uuid>', 'Migrated from old code', true, <count>, NOW());

-- 2c. Migrate user_referrals
-- INSERT INTO "user_referrals_v2" ("user_email", "user_dynamic_id", "user_wallet_address", "code_used", "referrer_id", "converted_at")
-- SELECT ur."user_email", ur."dynamic_user_id", ur."wallet_address", '<new-6-char-code>', r."id", ur."converted_at"
-- FROM "user_referrals" ur
-- JOIN "referrer_codes" rc ON ur."referrer_code" = rc."code"
-- JOIN "referrers" r ON rc."owner_email" = r."email";

-- ============================================
-- STEP 3: Rename tables (after verifying migration)
-- ============================================

-- Backup old tables (optional)
-- ALTER TABLE "referrer_codes" RENAME TO "referrer_codes_old";
-- ALTER TABLE "user_referrals" RENAME TO "user_referrals_old";

-- Rename new tables to final names
-- ALTER TABLE "referral_codes_v2" RENAME TO "referral_codes";
-- ALTER TABLE "user_referrals_v2" RENAME TO "user_referrals";

-- ============================================
-- STEP 4: Drop old tables (after confirming everything works)
-- ============================================

-- DROP TABLE IF EXISTS "user_referrals_old";
-- DROP TABLE IF EXISTS "referrer_codes_old";

-- ============================================
-- ROLLBACK (if needed)
-- ============================================

-- DROP TABLE IF EXISTS "user_referrals_v2";
-- DROP TABLE IF EXISTS "referral_codes_v2";
-- DROP TABLE IF EXISTS "referrers";

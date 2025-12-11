-- Push Notification Tables
-- Migration: 0001_create_push_tables.sql

-- ============================================
-- TABLE: push_tokens
-- Stores FCM device tokens for push notifications
-- ============================================

CREATE TABLE IF NOT EXISTS "push_tokens" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" varchar(255) NOT NULL,
  "user_email" varchar(255) NOT NULL,
  "token" text NOT NULL UNIQUE,
  "platform" varchar(20) NOT NULL DEFAULT 'web',
  "device_info" jsonb,
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Index for finding tokens by user
CREATE INDEX IF NOT EXISTS "push_tokens_user_id_idx" ON "push_tokens" ("user_id");

-- Index for finding active tokens
CREATE INDEX IF NOT EXISTS "push_tokens_active_idx" ON "push_tokens" ("is_active") WHERE "is_active" = true;

-- ============================================
-- TABLE: notification_preferences
-- User notification preferences (synced to FCM topics)
-- ============================================

CREATE TABLE IF NOT EXISTS "notification_preferences" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" varchar(255) NOT NULL UNIQUE,
  "user_email" varchar(255) NOT NULL,
  "community_updates" boolean NOT NULL DEFAULT true,
  "wallet_alerts" boolean NOT NULL DEFAULT true,
  "price_alerts" boolean NOT NULL DEFAULT true,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Index for email lookups
CREATE INDEX IF NOT EXISTS "notification_preferences_email_idx" ON "notification_preferences" ("user_email");

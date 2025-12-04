/**
 * Referral System Types
 *
 * Uses drizzle-zod to generate Zod schemas from Drizzle tables.
 * This ensures database types and validation are always in sync.
 */

import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import {
  admins,
  referrerCodes,
  userReferrals,
  pendingReferralVisits,
} from "@/lib/db/schema";
import { REFERRAL_CONFIG } from "./constants";

// ============================================
// ADMINS
// ============================================

/** Schema for selecting admin records */
export const selectAdminSchema = createSelectSchema(admins);

/** Schema for inserting admin records */
export const insertAdminSchema = createInsertSchema(admins);

/** Type for an admin record from the database */
export type Admin = z.infer<typeof selectAdminSchema>;

// ============================================
// REFERRER CODES
// ============================================

/** Schema for selecting referrer code records */
export const selectReferrerCodeSchema = createSelectSchema(referrerCodes);

/** Schema for inserting referrer code records */
export const insertReferrerCodeSchema = createInsertSchema(referrerCodes, {
  // Add custom validation for the code field
  code: z
    .string()
    .min(1, "Code is required")
    .max(
      REFERRAL_CONFIG.CODE_MAX_LENGTH,
      `Code must be ${REFERRAL_CONFIG.CODE_MAX_LENGTH} characters or less`
    )
    .regex(
      REFERRAL_CONFIG.CODE_PATTERN,
      "Code can only contain letters, numbers, underscores, and hyphens"
    ),
});

/** Type for a referrer code record from the database */
export type ReferrerCode = z.infer<typeof selectReferrerCodeSchema>;

/** Type for inserting a new referrer code */
export type NewReferrerCode = z.infer<typeof insertReferrerCodeSchema>;

// ============================================
// USER REFERRALS
// ============================================

/** Schema for selecting user referral records */
export const selectUserReferralSchema = createSelectSchema(userReferrals);

/** Schema for inserting user referral records */
export const insertUserReferralSchema = createInsertSchema(userReferrals);

/** Type for a user referral record from the database */
export type UserReferral = z.infer<typeof selectUserReferralSchema>;

/** Type for inserting a new user referral */
export type NewUserReferral = z.infer<typeof insertUserReferralSchema>;

// ============================================
// API REQUEST/RESPONSE SCHEMAS
// ============================================

/** Schema for referral code availability check */
export const checkCodeAvailabilitySchema = z.object({
  code: z.string().min(1).max(REFERRAL_CONFIG.CODE_MAX_LENGTH),
});

/** Schema for requesting a new referral code */
export const requestCodeSchema = z.object({
  code: z
    .string()
    .min(1, "Code is required")
    .max(
      REFERRAL_CONFIG.CODE_MAX_LENGTH,
      `Maximum ${REFERRAL_CONFIG.CODE_MAX_LENGTH} characters`
    )
    .regex(
      REFERRAL_CONFIG.CODE_PATTERN,
      "Only letters, numbers, underscores, and hyphens allowed"
    ),
});

/** Schema for converting a referral (attributing on signup) */
export const convertReferralSchema = z.object({
  userEmail: z.string().email(),
  dynamicUserId: z.string().min(1),
  walletAddress: z.string().optional(),
  referralData: z.object({
    ref: z.string().min(1).max(REFERRAL_CONFIG.CODE_MAX_LENGTH),
    tag: z.string().optional(),
    source: z.string().optional(),
    fullParams: z.record(z.string(), z.string()),
    capturedAt: z.string().datetime(),
  }),
});

/** Schema for admin actions on referral codes */
export const adminActionSchema = z.object({
  code: z.string().min(1).max(REFERRAL_CONFIG.CODE_MAX_LENGTH),
  action: z.enum(["approve", "reject"]),
});

// ============================================
// LOCALSTORAGE CACHE TYPES
// ============================================

/**
 * These types are for caching user status to reduce API calls.
 * NOTE: We do NOT store captured referral data in localStorage
 * because it doesn't persist between browser and PWA on iOS.
 */

/** Shape of cached referral status in localStorage */
export const cachedReferralStatusSchema = z.object({
  userEmail: z.string().email(),
  status: z.enum(["none", "pending", "approved"]),
  code: z.string().optional(),
  requestedAt: z.string().datetime().optional(),
  approvedAt: z.string().datetime().optional(),
  cachedAt: z.string().datetime(),
});

export type CachedReferralStatus = z.infer<typeof cachedReferralStatusSchema>;

/** Shape of cached admin status in localStorage */
export const cachedAdminStatusSchema = z.object({
  userEmail: z.string().email(),
  isAdmin: z.boolean(),
  cachedAt: z.string().datetime(),
});

export type CachedAdminStatus = z.infer<typeof cachedAdminStatusSchema>;

// ============================================
// API RESPONSE TYPES
// ============================================

/** Response from /api/referrals/status */
export type ReferralStatusResponse =
  | { status: "none" }
  | { status: "pending"; code: string; requestedAt: string }
  | { status: "approved"; code: string; requestedAt: string; approvedAt: string };

/** Response from /api/referrals/stats */
export type ReferralStatsResponse = {
  code: string;
  totalReferrals: number;
  referrals: Array<{
    id: string;
    userEmail: string; // Partially masked
    convertedAt: string;
    tag: string | null;
    source: string | null;
  }>;
};

/** Response from /api/admin/referrals */
export type AdminReferralsResponse = {
  pending: Array<{
    code: string;
    ownerEmail: string;
    requestedAt: string;
  }>;
  approved: Array<{
    code: string;
    ownerEmail: string;
    approvedAt: string;
    referralCount: number;
  }>;
};

// ============================================
// PENDING REFERRAL VISITS (Probabilistic Matching)
// ============================================

/** Schema for selecting pending referral visit records */
export const selectPendingReferralVisitSchema = createSelectSchema(
  pendingReferralVisits
);

/** Schema for inserting pending referral visit records */
export const insertPendingReferralVisitSchema = createInsertSchema(
  pendingReferralVisits
);

/** Type for a pending referral visit from the database */
export type PendingReferralVisit = z.infer<
  typeof selectPendingReferralVisitSchema
>;

/** Type for inserting a new pending referral visit */
export type NewPendingReferralVisit = z.infer<
  typeof insertPendingReferralVisitSchema
>;

// ============================================
// PROBABILISTIC MATCHING API SCHEMAS
// ============================================

/**
 * Fingerprint data used for probabilistic matching.
 * Collected from the visitor's browser.
 */
export const fingerprintSchema = z.object({
  /** Screen resolution (e.g., "390x844") */
  screenResolution: z.string().max(20).optional(),
});

export type Fingerprint = z.infer<typeof fingerprintSchema>;

/** Schema for POST /api/referrals/track-visit */
export const trackVisitRequestSchema = z.object({
  /** Referral data captured from URL */
  referralData: z.object({
    ref: z.string().min(1).max(REFERRAL_CONFIG.CODE_MAX_LENGTH),
    tag: z.string().optional(),
    source: z.string().optional(),
    fullParams: z.record(z.string(), z.string()),
    capturedAt: z.string().datetime(),
  }),
  /** Browser fingerprint for matching */
  fingerprint: fingerprintSchema.optional(),
});

export type TrackVisitRequest = z.infer<typeof trackVisitRequestSchema>;

/** Response from POST /api/referrals/track-visit */
export type TrackVisitResponse =
  | { success: true; visitId: string }
  | { success: false; error: string; message: string };

/** Schema for GET /api/referrals/match-visit (query params converted to body) */
export const matchVisitRequestSchema = z.object({
  /** Browser fingerprint for matching */
  fingerprint: fingerprintSchema.optional(),
});

export type MatchVisitRequest = z.infer<typeof matchVisitRequestSchema>;

/** Response from GET /api/referrals/match-visit */
export type MatchVisitResponse =
  | {
      matched: true;
      referralData: {
        ref: string;
        tag: string | null;
        source: string | null;
        fullParams: Record<string, string>;
        capturedAt: string;
      };
    }
  | { matched: false; reason: "no_match" | "multiple_matches" | "disabled" };


/**
 * Referral System Types (v2 - Refactored)
 *
 * New architecture with referrers → codes → referrals.
 */

import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import {
  referrers,
  referralCodesV2 as referralCodes,
  userReferralsV2 as userReferrals,
  admins,
  CODE_LENGTH,
  MAX_CODES_PER_REFERRER,
} from "@/lib/db/schema";

// ============================================
// ADMINS (unchanged)
// ============================================

export const selectAdminSchema = createSelectSchema(admins);
export const insertAdminSchema = createInsertSchema(admins);
export type Admin = z.infer<typeof selectAdminSchema>;

// ============================================
// REFERRERS
// ============================================

export const selectReferrerSchema = createSelectSchema(referrers);
export const insertReferrerSchema = createInsertSchema(referrers);

export type Referrer = z.infer<typeof selectReferrerSchema>;
export type NewReferrer = z.infer<typeof insertReferrerSchema>;

// ============================================
// REFERRAL CODES
// ============================================

export const selectReferralCodeSchema = createSelectSchema(referralCodes);
export const insertReferralCodeSchema = createInsertSchema(referralCodes);

export type ReferralCode = z.infer<typeof selectReferralCodeSchema>;
export type NewReferralCode = z.infer<typeof insertReferralCodeSchema>;

// ============================================
// USER REFERRALS
// ============================================

export const selectUserReferralSchema = createSelectSchema(userReferrals);
export const insertUserReferralSchema = createInsertSchema(userReferrals);

export type UserReferral = z.infer<typeof selectUserReferralSchema>;
export type NewUserReferral = z.infer<typeof insertUserReferralSchema>;

// ============================================
// API REQUEST SCHEMAS
// ============================================

/** Schema for creating a new referral code */
export const createCodeSchema = z.object({
  label: z.string().max(100).optional(),
  expiresAt: z.string().datetime().optional(),
});

/** Schema for converting a referral (signup attribution) */
export const convertReferralSchema = z.object({
  code: z
    .string()
    .length(CODE_LENGTH, `Code must be ${CODE_LENGTH} characters`),
});

/** Schema for admin action on a referrer */
export const adminReferrerActionSchema = z.object({
  referrerId: z.string().uuid(),
  action: z.enum(["approve", "reject", "enable_notifications", "disable_notifications"]),
});

// ============================================
// LOCALSTORAGE TYPES
// ============================================

/** Referral code stored from URL */
export const storedReferralSchema = z.object({
  code: z.string().length(CODE_LENGTH),
  capturedAt: z.string().datetime(),
});

export type StoredReferral = z.infer<typeof storedReferralSchema>;

/** Cached referrer status */
export const cachedReferrerStatusSchema = z.object({
  userEmail: z.string().email(),
  status: z.enum(["none", "pending", "approved"]),
  referrerId: z.string().uuid().optional(),
  codeCount: z.number().optional(),
  approvedAt: z.string().datetime().optional(),
  cachedAt: z.string().datetime(),
});

export type CachedReferrerStatus = z.infer<typeof cachedReferrerStatusSchema>;

/** Cached admin status */
export const cachedAdminStatusSchema = z.object({
  userEmail: z.string().email(),
  isAdmin: z.boolean(),
  cachedAt: z.string().datetime(),
});

export type CachedAdminStatus = z.infer<typeof cachedAdminStatusSchema>;

// ============================================
// API RESPONSE TYPES
// ============================================

/** Response from GET /api/referrals/status */
export type ReferrerStatusResponse =
  | { status: "none" }
  | { status: "pending"; requestedAt: string }
  | {
      status: "approved";
      referrerId: string;
      approvedAt: string;
      canSendNotifications: boolean;
      codes: Array<{
        code: string;
        label: string | null;
        isActive: boolean;
        expiresAt: string | null;
        usageCount: number;
        createdAt: string;
      }>;
    };

/** Response from POST /api/referrals/codes */
export type CreateCodeResponse = {
  code: string;
  label: string | null;
  isActive: boolean;
  expiresAt: string | null;
  createdAt: string;
};

/** Response from GET /api/referrals/stats */
export type ReferralStatsResponse = {
  referrerId: string;
  totalReferrals: number;
  codeStats: Array<{
    code: string;
    label: string | null;
    usageCount: number;
    isActive: boolean;
    expiresAt: string | null;
  }>;
  recentReferrals: Array<{
    id: string;
    userEmail: string; // Masked
    codeUsed: string;
    convertedAt: string;
  }>;
};

/** Response from GET /api/admin/referrals */
export type AdminReferralsResponse = {
  pending: Array<{
    referrerId: string;
    email: string;
    requestedAt: string;
  }>;
  approved: Array<{
    referrerId: string;
    email: string;
    approvedAt: string;
    codeCount: number;
    totalReferrals: number;
    canSendNotifications: boolean;
  }>;
};

// ============================================
// CONSTANTS
// ============================================

export { CODE_LENGTH, MAX_CODES_PER_REFERRER };

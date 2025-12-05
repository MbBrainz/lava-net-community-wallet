/**
 * Referral System Configuration
 *
 * This file contains all configurable values for the referral system.
 * Change these values to adjust system behavior.
 */

export const REFERRAL_CONFIG = {
  // ============================================
  // CODE VALIDATION
  // ============================================

  /** Maximum length for referral codes */
  CODE_MAX_LENGTH: 20,

  /**
   * Regex pattern for valid codes
   * Allows: letters, numbers, underscore, hyphen
   * Does NOT allow: spaces, special characters
   */
  CODE_PATTERN: /^[a-zA-Z0-9_-]+$/,

  // ============================================
  // REFERRAL EXPIRY
  // ============================================

  /** How many days a referral link stays valid */
  REFERRAL_EXPIRY_DAYS: 30,

  // ============================================
  // LOCALSTORAGE KEYS
  // ============================================

  STORAGE_KEYS: {
    /** Stores referral data captured from URL */
    CAPTURED_REFERRAL: "lava_referral",

    /** Caches user's own referral code status */
    USER_REFERRAL_STATUS: "lava_ref_status",

    /** Caches admin status */
    ADMIN_STATUS: "lava_admin_status",
  },

  // ============================================
  // URL PARAMETERS
  // ============================================

  URL_PARAMS: {
    /** Main referral code parameter */
    REF: "ref",

    /** Optional tracking tag */
    TAG: "tag",

    /** Optional source identifier */
    SOURCE: "source",
  },
} as const;

// Type export for use in other files
export type ReferralConfig = typeof REFERRAL_CONFIG;


/**
 * Referral System Configuration
 *
 * Configuration for the referrer-centric referral system.
 */

export const REFERRAL_CONFIG = {
  // ============================================
  // CODE SETTINGS
  // ============================================

  /** Length of auto-generated codes */
  CODE_LENGTH: 6,

  /** Maximum codes per referrer */
  MAX_CODES_PER_REFERRER: 20,

  /**
   * Character set for code generation.
   * Excludes ambiguous characters: 0, O, I, l, 1
   */
  CODE_CHARSET: "ABCDEFGHJKLMNPQRSTUVWXYZ23456789",

  // ============================================
  // LOCALSTORAGE KEYS
  // ============================================

  STORAGE_KEYS: {
    /** Stores referral code captured from URL */
    CAPTURED_REFERRAL: "lava_referral_v2",

    /** Caches user's referrer status */
    REFERRER_STATUS: "lava_referrer_status",

    /** Caches admin status */
    ADMIN_STATUS: "lava_admin_status",
  },

  // ============================================
  // URL PARAMETERS
  // ============================================

  URL_PARAMS: {
    /** Referral code parameter */
    REF: "ref",
  },

  // ============================================
  // CACHE SETTINGS
  // ============================================

  /** How long to cache referrer status (in milliseconds) */
  STATUS_CACHE_TTL: 5 * 60 * 1000, // 5 minutes

  /** How long to cache admin status (in milliseconds) */
  ADMIN_CACHE_TTL: 10 * 60 * 1000, // 10 minutes
} as const;

export type ReferralConfig = typeof REFERRAL_CONFIG;

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
  // LOCALSTORAGE KEYS (for caching only)
  // ============================================

  /**
   * NOTE: We do NOT store captured referral data in localStorage because
   * it doesn't persist between browser and PWA on iOS.
   * These keys are only for caching user status to reduce API calls.
   */
  STORAGE_KEYS: {
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

  // ============================================
  // SERVER-SIDE PROBABILISTIC MATCHING
  // ============================================

  /**
   * Configuration for server-side matching when localStorage is unavailable
   * (e.g., PWA installation on iOS where browser storage isn't shared).
   */
  PROBABILISTIC_MATCHING: {
    /**
     * Time window (in minutes) for matching pending visits.
     * PWA installation usually happens within seconds of visiting the landing page.
     * 60 minutes provides a safe buffer while preventing stale matches.
     */
    MATCH_WINDOW_MINUTES: 60,

    /**
     * Whether to require exact User Agent match.
     * Set to false to be more lenient (useful if UA changes slightly between browser and PWA).
     */
    STRICT_USER_AGENT_MATCH: true,

    /**
     * Maximum pending visits to check per IP address.
     * Prevents abuse and limits database scan size.
     */
    MAX_PENDING_PER_IP: 10,

    /**
     * Enable/disable probabilistic matching feature.
     * Can be toggled off if issues arise.
     */
    ENABLED: true,
  },
} as const;

// Type export for use in other files
export type ReferralConfig = typeof REFERRAL_CONFIG;


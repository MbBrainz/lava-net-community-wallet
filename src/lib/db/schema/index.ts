/**
 * Database Schema Exports
 *
 * This file exports all tables and relations for use throughout the app.
 */

// ============================================
// REFERRAL SCHEMA (v1) - Current production
// Keep these exports for backward compatibility with existing code
// ============================================
export { admins, referrerCodes, userReferrals } from "./referrals";
export { referrerCodesRelations, userReferralsRelations } from "./referrals";

// ============================================
// REFERRAL SCHEMA (v2) - New referrer-centric model
// These are in a separate file for the migration
// ============================================
export {
  referrers,
  referralCodes as referralCodesV2,
  userReferrals as userReferralsV2,
  MAX_CODES_PER_REFERRER,
  CODE_LENGTH,
} from "./referrers";
export {
  referrersRelations,
  referralCodesRelations as referralCodesRelationsV2,
  userReferralsRelations as userReferralsRelationsV2,
} from "./referrers";
export type {
  Referrer,
  NewReferrer,
  ReferralCode,
  NewReferralCode,
  UserReferral as UserReferralV2,
  NewUserReferral as NewUserReferralV2,
} from "./referrers";

// ============================================
// PWA SCHEMA
// ============================================
export { pwaInstallEvents } from "./pwa";

// ============================================
// PUSH NOTIFICATIONS SCHEMA
// ============================================
export { pushTokens, notificationPreferences, NOTIFICATION_TOPICS } from "./push";
export type {
  NewPushToken,
  PushToken,
  NewNotificationPreferences,
  NotificationPreferences,
  NotificationPreferenceKey,
  NotificationTopic,
} from "./push";


/**
 * Database Schema Exports
 *
 * This file exports all tables and relations for use throughout the app.
 */

// ============================================
// REFERRAL SCHEMA
// ============================================
export {
  admins,
  referrers,
  referralCodes,
  userReferrals,
  referrersRelations,
  referralCodesRelations,
  userReferralsRelations,
  MAX_CODES_PER_REFERRER,
  CODE_LENGTH,
} from "./referrals";
export type {
  Referrer,
  NewReferrer,
  ReferralCode,
  NewReferralCode,
  UserReferral,
  NewUserReferral,
} from "./referrals";

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

// ============================================
// USER NOTIFICATIONS SCHEMA (INBOX)
// ============================================
export { userNotifications, NOTIFICATION_TYPES } from "./notifications";
export type {
  UserNotification,
  NewUserNotification,
  NotificationType,
} from "./notifications";

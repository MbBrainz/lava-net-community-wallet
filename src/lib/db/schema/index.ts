/**
 * Database Schema Exports
 *
 * This file exports all tables and relations for use throughout the app.
 */

// Export all tables
export { admins, referrerCodes, userReferrals } from "./referrals";
export { pwaInstallEvents } from "./pwa";
export { pushTokens, notificationPreferences, NOTIFICATION_TOPICS } from "./push";

// Export all relations
export { referrerCodesRelations, userReferralsRelations } from "./referrals";

// Export types
export type {
  NewPushToken,
  PushToken,
  NewNotificationPreferences,
  NotificationPreferences,
  NotificationPreferenceKey,
  NotificationTopic,
} from "./push";


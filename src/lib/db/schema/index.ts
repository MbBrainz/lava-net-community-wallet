/**
 * Database Schema Exports
 *
 * This file exports all tables and relations for use throughout the app.
 */

// Export all tables
export { admins, referrerCodes, userReferrals } from "./referrals";
export { pwaInstallEvents } from "./pwa";

// Export all relations
export { referrerCodesRelations, userReferralsRelations } from "./referrals";


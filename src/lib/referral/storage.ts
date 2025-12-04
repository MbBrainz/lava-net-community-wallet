/**
 * LocalStorage Helpers for Referral System
 *
 * Handles localStorage operations for caching user's referral code status
 * and admin status. These caches improve UX by reducing API calls.
 *
 * NOTE: We do NOT store captured referral data in localStorage because
 * localStorage doesn't persist between browser and PWA on iOS.
 * All referral capture and matching is done server-side.
 */

import {
  CachedReferralStatus,
  cachedReferralStatusSchema,
  CachedAdminStatus,
  cachedAdminStatusSchema,
} from "./types";
import { REFERRAL_CONFIG } from "./constants";

const { STORAGE_KEYS } = REFERRAL_CONFIG;

// ============================================
// USER REFERRAL STATUS CACHE
// ============================================

/**
 * Save user's referral status to cache.
 * This caches whether the user has requested/received a referral code.
 */
export function saveReferralStatus(
  data: Omit<CachedReferralStatus, "cachedAt">
): void {
  try {
    const cacheData: CachedReferralStatus = {
      ...data,
      cachedAt: new Date().toISOString(),
    };
    localStorage.setItem(
      STORAGE_KEYS.USER_REFERRAL_STATUS,
      JSON.stringify(cacheData)
    );
  } catch (error) {
    console.error("[Referral Storage] Failed to save status:", error);
  }
}

/**
 * Get cached referral status.
 * Returns null if not found, invalid, or belongs to different user.
 */
export function getReferralStatus(
  currentUserEmail: string
): CachedReferralStatus | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USER_REFERRAL_STATUS);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    const result = cachedReferralStatusSchema.safeParse(parsed);

    if (!result.success) {
      console.warn("[Referral Storage] Invalid status cache, clearing");
      clearReferralStatus();
      return null;
    }

    // Check if cache belongs to current user
    if (result.data.userEmail !== currentUserEmail) {
      console.log(
        "[Referral Storage] Status cache belongs to different user, clearing"
      );
      clearReferralStatus();
      return null;
    }

    return result.data;
  } catch (error) {
    console.error("[Referral Storage] Failed to get status:", error);
    return null;
  }
}

/**
 * Clear referral status cache.
 */
export function clearReferralStatus(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.USER_REFERRAL_STATUS);
  } catch (error) {
    console.error("[Referral Storage] Failed to clear status:", error);
  }
}

// ============================================
// ADMIN STATUS CACHE
// ============================================

/**
 * Save admin status to cache.
 */
export function saveAdminStatus(
  data: Omit<CachedAdminStatus, "cachedAt">
): void {
  try {
    const cacheData: CachedAdminStatus = {
      ...data,
      cachedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEYS.ADMIN_STATUS, JSON.stringify(cacheData));
  } catch (error) {
    console.error("[Referral Storage] Failed to save admin status:", error);
  }
}

/**
 * Get cached admin status.
 * Returns null if not found, invalid, or belongs to different user.
 */
export function getAdminStatus(
  currentUserEmail: string
): CachedAdminStatus | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ADMIN_STATUS);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    const result = cachedAdminStatusSchema.safeParse(parsed);

    if (!result.success) {
      clearAdminStatus();
      return null;
    }

    // Check if cache belongs to current user
    if (result.data.userEmail !== currentUserEmail) {
      clearAdminStatus();
      return null;
    }

    return result.data;
  } catch (error) {
    console.error("[Referral Storage] Failed to get admin status:", error);
    return null;
  }
}

/**
 * Clear admin status cache.
 */
export function clearAdminStatus(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.ADMIN_STATUS);
  } catch (error) {
    console.error("[Referral Storage] Failed to clear admin status:", error);
  }
}

// ============================================
// CLEAR ALL CACHES (for logout)
// ============================================

/**
 * Clear all referral-related localStorage caches.
 * Call this on logout.
 */
export function clearReferralStatusCaches(): void {
  clearReferralStatus();
  clearAdminStatus();
}

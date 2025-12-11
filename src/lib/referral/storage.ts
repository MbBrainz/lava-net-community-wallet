/**
 * LocalStorage Helpers for Referral System
 *
 * Handles all localStorage read/write operations with type safety.
 */

import {
  StoredReferral,
  storedReferralSchema,
  CachedReferrerStatus,
  cachedReferrerStatusSchema,
  CachedAdminStatus,
  cachedAdminStatusSchema,
} from "./types";
import { REFERRAL_CONFIG } from "./constants";

const { STORAGE_KEYS } = REFERRAL_CONFIG;

// ============================================
// CAPTURED REFERRAL (from URL)
// ============================================

/**
 * Save referral code captured from URL parameters.
 */
export function saveReferral(data: StoredReferral): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CAPTURED_REFERRAL, JSON.stringify(data));
  } catch (error) {
    console.error("[Referral Storage] Failed to save referral:", error);
  }
}

/**
 * Get referral code from localStorage.
 * Returns null if not found or invalid.
 */
export function getReferral(): StoredReferral | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CAPTURED_REFERRAL);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    const result = storedReferralSchema.safeParse(parsed);

    if (!result.success) {
      console.warn("[Referral Storage] Invalid referral data, clearing");
      clearReferral();
      return null;
    }

    return result.data;
  } catch (error) {
    console.error("[Referral Storage] Failed to get referral:", error);
    return null;
  }
}

/**
 * Clear referral data from localStorage.
 */
export function clearReferral(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.CAPTURED_REFERRAL);
  } catch (error) {
    console.error("[Referral Storage] Failed to clear referral:", error);
  }
}

// ============================================
// REFERRER STATUS CACHE
// ============================================

/**
 * Save user's referrer status to cache.
 */
export function saveReferrerStatus(
  data: Omit<CachedReferrerStatus, "cachedAt">
): void {
  try {
    const cacheData: CachedReferrerStatus = {
      ...data,
      cachedAt: new Date().toISOString(),
    };
    localStorage.setItem(
      STORAGE_KEYS.REFERRER_STATUS,
      JSON.stringify(cacheData)
    );
  } catch (error) {
    console.error("[Referral Storage] Failed to save status:", error);
  }
}

/**
 * Get cached referrer status.
 * Returns null if not found, invalid, or belongs to different user.
 */
export function getReferrerStatus(
  currentUserEmail: string
): CachedReferrerStatus | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.REFERRER_STATUS);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    const result = cachedReferrerStatusSchema.safeParse(parsed);

    if (!result.success) {
      console.warn("[Referral Storage] Invalid status cache, clearing");
      clearReferrerStatus();
      return null;
    }

    // Check if cache belongs to current user
    if (result.data.userEmail !== currentUserEmail) {
      console.log(
        "[Referral Storage] Status cache belongs to different user, clearing"
      );
      clearReferrerStatus();
      return null;
    }

    return result.data;
  } catch (error) {
    console.error("[Referral Storage] Failed to get status:", error);
    return null;
  }
}

/**
 * Clear referrer status cache.
 */
export function clearReferrerStatus(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.REFERRER_STATUS);
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
// CLEAR ALL (for logout)
// ============================================

/**
 * Clear all referral-related localStorage data.
 * Call this on logout.
 */
export function clearAllReferralData(): void {
  clearReferral();
  clearReferrerStatus();
  clearAdminStatus();
}

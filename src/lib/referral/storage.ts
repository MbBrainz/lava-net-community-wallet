/**
 * LocalStorage Helpers for Referral System
 *
 * Handles all localStorage read/write operations with type safety.
 */

import {
  StoredReferral,
  storedReferralSchema,
  CachedReferralStatus,
  cachedReferralStatusSchema,
  CachedAdminStatus,
  cachedAdminStatusSchema,
} from "./types";
import { REFERRAL_CONFIG } from "./constants";

const { STORAGE_KEYS } = REFERRAL_CONFIG;

// ============================================
// CAPTURED REFERRAL (from URL)
// ============================================

/**
 * Save referral data captured from URL parameters.
 * Uses last-touch attribution (overwrites existing).
 */
export function saveReferral(data: StoredReferral): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CAPTURED_REFERRAL, JSON.stringify(data));
  } catch (error) {
    console.error("[Referral Storage] Failed to save referral:", error);
  }
}

/**
 * Get referral data from localStorage.
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

/**
 * Check if referral is expired (older than 30 days).
 */
export function isReferralExpired(referral: StoredReferral): boolean {
  const capturedDate = new Date(referral.capturedAt);
  const expiryMs = REFERRAL_CONFIG.REFERRAL_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
  const expiryDate = new Date(capturedDate.getTime() + expiryMs);
  return new Date() > expiryDate;
}

// ============================================
// USER REFERRAL STATUS CACHE
// ============================================

/**
 * Save user's referral status to cache.
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
// CLEAR ALL (for logout)
// ============================================

/**
 * Clear all referral-related localStorage data.
 * Call this on logout.
 */
export function clearAllReferralData(): void {
  clearReferral();
  clearReferralStatus();
  clearAdminStatus();
}


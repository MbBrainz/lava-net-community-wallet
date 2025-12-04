/**
 * Referral System Utilities
 *
 * Helper functions for validation, masking, etc.
 */

import { REFERRAL_CONFIG } from "./constants";

/**
 * Validate a referral code format.
 * Returns { valid: true } or { valid: false, error: string }
 */
export function validateCode(
  code: string
): { valid: true } | { valid: false; error: string } {
  if (!code || code.length === 0) {
    return { valid: false, error: "Code is required" };
  }

  if (code.length > REFERRAL_CONFIG.CODE_MAX_LENGTH) {
    return {
      valid: false,
      error: `Code must be ${REFERRAL_CONFIG.CODE_MAX_LENGTH} characters or less`,
    };
  }

  if (!REFERRAL_CONFIG.CODE_PATTERN.test(code)) {
    return {
      valid: false,
      error:
        "Code can only contain letters, numbers, underscores, and hyphens",
    };
  }

  return { valid: true };
}

/**
 * Mask an email for privacy.
 * Example: "john.doe@example.com" → "j***@example.com"
 */
export function maskEmail(email: string): string {
  const [localPart, domain] = email.split("@");
  if (!localPart || !domain) return "***@***";

  const maskedLocal = localPart.length > 1 ? localPart[0] + "***" : "***";

  return `${maskedLocal}@${domain}`;
}

/**
 * Check if a referral is expired (older than configured days).
 */
export function isExpired(capturedAt: string): boolean {
  const capturedDate = new Date(capturedAt);
  const expiryMs = REFERRAL_CONFIG.REFERRAL_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
  const expiryDate = new Date(capturedDate.getTime() + expiryMs);
  return new Date() > expiryDate;
}

/**
 * Truncate code to max length if too long.
 */
export function truncateCode(code: string): string {
  return code.slice(0, REFERRAL_CONFIG.CODE_MAX_LENGTH);
}

/**
 * Format a date for display.
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Format a date with time for display.
 */
export function formatDateTime(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}


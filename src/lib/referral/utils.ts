/**
 * Referral System Utilities
 *
 * Helper functions for validation, masking, etc.
 */


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


/**
 * Referral Code Validation Utilities
 *
 * Client-safe validation functions that don't require database access.
 * These can be imported in client components.
 */

/**
 * Character set for code generation.
 * Excludes ambiguous characters: 0, O, I, l, 1
 * Total: 32 characters (uppercase + digits)
 */
export const CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/**
 * Code length (6 characters = 32^6 = 1+ billion possible codes)
 */
export const CODE_LENGTH = 6;

/**
 * Validate a code format (6 uppercase alphanumeric characters).
 * Does NOT check if the code exists or is active.
 */
export function isValidCodeFormat(code: string): boolean {
  if (!code || typeof code !== "string") return false;
  if (code.length !== CODE_LENGTH) return false;

  // Check each character is in our charset
  for (const char of code.toUpperCase()) {
    if (!CHARSET.includes(char)) return false;
  }

  return true;
}

/**
 * Normalize a code to uppercase.
 * Codes are case-insensitive for user input.
 */
export function normalizeCode(code: string): string {
  return code.toUpperCase().trim();
}

/**
 * Referral Code Generator
 *
 * Generates unique 6-character alphanumeric codes.
 * Uses a charset that avoids ambiguous characters (0/O, 1/I/l).
 */

import { db } from "@/lib/db/client";
import { referralCodes, type ReferralCode } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * Character set for code generation.
 * Excludes ambiguous characters: 0, O, I, l, 1
 * Total: 32 characters (uppercase + digits)
 */
const CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/**
 * Code length (6 characters = 32^6 = 1+ billion possible codes)
 */
const CODE_LENGTH = 6;

/**
 * Maximum attempts to generate a unique code before failing.
 */
const MAX_GENERATION_ATTEMPTS = 10;

/**
 * Generate a random 6-character code.
 * This does NOT check for uniqueness - use generateUniqueCode() for that.
 */
export function generateShortCode(): string {
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    const randomIndex = Math.floor(Math.random() * CHARSET.length);
    code += CHARSET[randomIndex];
  }
  return code;
}

/**
 * Generate a unique 6-character code that doesn't exist in the database.
 * Retries up to MAX_GENERATION_ATTEMPTS times.
 *
 * @throws Error if unable to generate a unique code after max attempts
 */
export async function generateUniqueCode(): Promise<string> {
  let attempts = 0;

  while (attempts < MAX_GENERATION_ATTEMPTS) {
    const code = generateShortCode();

    // Check if code already exists
    const [existing]: ReferralCode[] = await db
      .select()
      .from(referralCodes)
      .where(eq(referralCodes.code, code))
      .limit(1);

    if (!existing) {
      return code;
    }

    attempts++;
  }

  throw new Error(
    `Failed to generate unique referral code after ${MAX_GENERATION_ATTEMPTS} attempts`
  );
}

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

/**
 * Check if a code exists and is valid for use.
 * Returns the code record if valid, null otherwise.
 */
export async function validateCode(code: string): Promise<{
  isValid: boolean;
  code?: ReferralCode;
  reason?: "not_found" | "inactive" | "expired" | "invalid_format";
}> {
  // Check format first
  if (!isValidCodeFormat(code)) {
    return { isValid: false, reason: "invalid_format" };
  }

  const normalizedCode = normalizeCode(code);

  // Look up the code
  const [codeRecord]: ReferralCode[] = await db
    .select()
    .from(referralCodes)
    .where(eq(referralCodes.code, normalizedCode))
    .limit(1);

  if (!codeRecord) {
    return { isValid: false, reason: "not_found" };
  }

  if (!codeRecord.isActive) {
    return { isValid: false, reason: "inactive" };
  }

  if (codeRecord.expiresAt && codeRecord.expiresAt < new Date()) {
    return { isValid: false, reason: "expired" };
  }

  return { isValid: true, code: codeRecord };
}

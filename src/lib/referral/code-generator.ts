/**
 * Referral Code Generator
 *
 * Generates unique 6-character alphanumeric codes.
 * Uses a charset that avoids ambiguous characters (0/O, 1/I/l).
 *
 * NOTE: This file imports the database client and should only be used
 * in server-side code. For client-safe validation functions, use
 * './validation' instead.
 */

import { db } from "@/lib/db/client";
import { referralCodes } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { CHARSET, CODE_LENGTH, isValidCodeFormat, normalizeCode } from "./validation";

// Re-export client-safe utilities for convenience in server code
export { isValidCodeFormat, normalizeCode } from "./validation";

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
    const existing = await db.query.referralCodes.findFirst({
      where: eq(referralCodes.code, code),
    });

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
 * Check if a code exists and is valid for use.
 * Returns the code record if valid, null otherwise.
 */
export async function validateCode(code: string): Promise<{
  isValid: boolean;
  code?: typeof referralCodes.$inferSelect;
  reason?: "not_found" | "inactive" | "expired" | "invalid_format";
}> {
  // Check format first
  if (!isValidCodeFormat(code)) {
    return { isValid: false, reason: "invalid_format" };
  }

  const normalizedCode = normalizeCode(code);

  // Look up the code
  const codeRecord = await db.query.referralCodes.findFirst({
    where: eq(referralCodes.code, normalizedCode),
  });

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

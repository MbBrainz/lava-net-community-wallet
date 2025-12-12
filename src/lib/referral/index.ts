/**
 * Referral System Exports
 *
 * Central export file for the referral system.
 *
 * NOTE: This barrel export only includes CLIENT-SAFE modules.
 * Server-only modules (code-generator) must be imported directly:
 *   import { generateUniqueCode } from "@/lib/referral/code-generator";
 */

export * from "./constants";
export * from "./storage";
export * from "./utils";
export * from "./validation";


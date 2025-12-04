/**
 * Auth Module Exports
 *
 * Server-side:
 * - getAuthenticatedUser: Verify auth and get user info
 * - requireAdmin: Verify auth and admin status
 *
 * Client-side:
 * - useAuthFetch: Hook for authenticated fetch requests
 * - createAuthHeaders: Create auth headers from token
 * - createAuthFetch: Create authenticated fetch function
 */

// Re-export server utilities (only for use in API routes / server components)
export {
  getAuthenticatedUser,
  requireAdmin,
  type AuthResult,
  type AdminAuthResult,
  type AuthenticatedUser,
} from "./server";

// Re-export client utilities (only for use in client components)
export {
  useAuthFetch,
  createAuthHeaders,
  createAuthFetch,
} from "./client";


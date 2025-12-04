/**
 * Server-Side Authentication Utilities
 *
 * Provides DRY authentication verification for API routes using Dynamic's JWT tokens.
 *
 * Usage:
 * ```typescript
 * export async function GET(request: NextRequest) {
 *   const auth = await getAuthenticatedUser(request);
 *   if (!auth.success) {
 *     return auth.response;
 *   }
 *   // Use auth.user.email and auth.user.userId
 * }
 * ```
 *
 * For admin routes:
 * ```typescript
 * export async function GET(request: NextRequest) {
 *   const auth = await requireAdmin(request);
 *   if (!auth.success) {
 *     return auth.response;
 *   }
 *   // Proceed with admin-only logic
 * }
 * ```
 */

import { NextRequest, NextResponse } from "next/server";
import { jwtVerify, createRemoteJWKSet, JWTPayload } from "jose";
import { db } from "@/lib/db/client";
import { admins } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// Types
export interface AuthenticatedUser {
  email: string;
  userId: string;
}

interface AuthSuccessResult {
  success: true;
  user: AuthenticatedUser;
}

interface AuthFailureResult {
  success: false;
  response: NextResponse;
}

export type AuthResult = AuthSuccessResult | AuthFailureResult;

interface AdminSuccessResult {
  success: true;
  user: AuthenticatedUser;
  isAdmin: true;
}

interface AdminFailureResult {
  success: false;
  response: NextResponse;
}

export type AdminAuthResult = AdminSuccessResult | AdminFailureResult;

// Dynamic JWT payload structure
interface DynamicJWTPayload extends JWTPayload {
  email?: string;
  verified_credentials?: Array<{
    email?: string;
    format?: string;
    address?: string;
  }>;
  environment_id?: string;
}

// Cache the JWKS for performance
let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

/**
 * Get the JWKS (JSON Web Key Set) for Dynamic token verification.
 * Uses the standard Dynamic JWKS endpoint.
 */
function getJWKS() {
  if (!jwks) {
    const environmentId = process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID;
    if (!environmentId) {
      throw new Error("NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID is not configured");
    }
    // Dynamic's JWKS endpoint
    const jwksUrl = new URL(
      `https://app.dynamic.xyz/api/v0/sdk/${environmentId}/.well-known/jwks`
    );
    jwks = createRemoteJWKSet(jwksUrl);
  }
  return jwks;
}

/**
 * Extract and verify the JWT token from the request.
 * Returns the authenticated user or null if invalid/missing.
 */
async function verifyToken(
  request: NextRequest
): Promise<AuthenticatedUser | null> {
  const authHeader = request.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.slice(7);

  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify<DynamicJWTPayload>(token, getJWKS());

    // Extract email from various possible locations in the JWT
    let email = payload.email;

    // If email not directly in payload, check verified_credentials
    if (!email && payload.verified_credentials?.length) {
      const emailCredential = payload.verified_credentials.find(
        (cred) => cred.format === "email" || cred.email
      );
      email = emailCredential?.email;
    }

    const userId = payload.sub;

    if (!email || !userId) {
      console.error("[Auth] JWT missing required fields:", {
        hasEmail: !!email,
        hasUserId: !!userId,
      });
      return null;
    }

    return { email, userId };
  } catch (error) {
    // Log error in development only
    if (process.env.NODE_ENV === "development") {
      console.error("[Auth] JWT verification failed:", error);
    }
    return null;
  }
}

/**
 * Authenticate a request and return the user info.
 *
 * Returns either:
 * - { success: true, user: { email, userId } }
 * - { success: false, response: NextResponse } (401 Unauthorized)
 *
 * @example
 * ```typescript
 * export async function GET(request: NextRequest) {
 *   const auth = await getAuthenticatedUser(request);
 *   if (!auth.success) {
 *     return auth.response;
 *   }
 *   // auth.user.email is the verified email
 *   // auth.user.userId is the verified Dynamic user ID
 * }
 * ```
 */
export async function getAuthenticatedUser(
  request: NextRequest
): Promise<AuthResult> {
  const user = await verifyToken(request);

  if (!user) {
    return {
      success: false,
      response: NextResponse.json(
        {
          error: "unauthorized",
          message: "Authentication required",
        },
        { status: 401 }
      ),
    };
  }

  return { success: true, user };
}

/**
 * Check if a user email is an admin.
 */
async function isUserAdmin(email: string): Promise<boolean> {
  const admin = await db.query.admins.findFirst({
    where: eq(admins.email, email),
  });
  return !!admin;
}

/**
 * Authenticate a request and verify admin status.
 *
 * Returns either:
 * - { success: true, user: { email, userId }, isAdmin: true }
 * - { success: false, response: NextResponse } (401 or 403)
 *
 * @example
 * ```typescript
 * export async function GET(request: NextRequest) {
 *   const auth = await requireAdmin(request);
 *   if (!auth.success) {
 *     return auth.response;
 *   }
 *   // User is authenticated AND is an admin
 * }
 * ```
 */
export async function requireAdmin(
  request: NextRequest
): Promise<AdminAuthResult> {
  // First verify authentication
  const authResult = await getAuthenticatedUser(request);

  if (!authResult.success) {
    return authResult;
  }

  // Then verify admin status
  const adminStatus = await isUserAdmin(authResult.user.email);

  if (!adminStatus) {
    return {
      success: false,
      response: NextResponse.json(
        {
          error: "forbidden",
          message: "Admin access required",
        },
        { status: 403 }
      ),
    };
  }

  return {
    success: true,
    user: authResult.user,
    isAdmin: true,
  };
}


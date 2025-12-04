/**
 * API Security Middleware
 *
 * Ensures all API routes are only accessible from the app itself.
 * Uses multiple layers of verification:
 * 1. Sec-Fetch-Site header (modern browsers)
 * 2. Origin header validation
 * 3. Referer header fallback
 *
 * External requests to /api/* are blocked with 403 Forbidden.
 *
 * PUBLIC ROUTES:
 * Routes listed in PUBLIC_API_ROUTES are accessible from external sources.
 * Use this for webhooks, public APIs, or partner integrations.
 */

import { NextRequest, NextResponse } from "next/server";

/**
 * API routes that are publicly accessible from external sources.
 * Add paths here to bypass same-origin restrictions.
 *
 * Examples:
 * - "/api/webhooks/stripe" - Stripe webhook callbacks
 * - "/api/public/health" - Health check endpoint
 * - "/api/v1/prices" - Public pricing API
 *
 * Supports:
 * - Exact matches: "/api/public/health"
 * - Wildcard suffixes: "/api/webhooks/*" (matches /api/webhooks/anything)
 */
const PUBLIC_API_ROUTES: string[] = [
  // Add public routes here as needed, e.g.:
  // "/api/webhooks/*",
  // "/api/public/*",
  // "/api/health",
];

/**
 * Check if a route is in the public allowlist
 */
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_API_ROUTES.some((pattern) => {
    // Wildcard pattern (e.g., "/api/webhooks/*")
    if (pattern.endsWith("/*")) {
      const prefix = pattern.slice(0, -1); // Remove the "*"
      return pathname.startsWith(prefix);
    }
    // Exact match
    return pathname === pattern;
  });
}

// Get allowed origins from environment, with fallback to localhost for dev
function getAllowedOrigins(): string[] {
  const origins: string[] = [];

  // Production URL
  if (process.env.NEXT_PUBLIC_APP_URL) {
    origins.push(process.env.NEXT_PUBLIC_APP_URL);
  }

  // Vercel deployment URLs
  if (process.env.VERCEL_URL) {
    origins.push(`https://${process.env.VERCEL_URL}`);
  }

  // Vercel preview URLs
  if (process.env.VERCEL_BRANCH_URL) {
    origins.push(`https://${process.env.VERCEL_BRANCH_URL}`);
  }

  // Development
  if (process.env.NODE_ENV === "development") {
    origins.push("http://localhost:3000");
    origins.push("http://127.0.0.1:3000");
  }

  return origins;
}

/**
 * Check if a request is coming from an allowed origin
 */
function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;

  const allowedOrigins = getAllowedOrigins();

  // Direct match
  if (allowedOrigins.includes(origin)) {
    return true;
  }

  // Allow Vercel preview deployments (*.vercel.app)
  if (origin.endsWith(".vercel.app")) {
    return true;
  }

  return false;
}

/**
 * Verify the request originates from the same site using multiple signals
 */
function isSameOriginRequest(request: NextRequest): boolean {
  // 1. Check Sec-Fetch-Site header (most reliable, modern browsers)
  // Values: same-origin, same-site, cross-site, none
  const secFetchSite = request.headers.get("sec-fetch-site");

  if (secFetchSite) {
    // "same-origin" means exact same origin (protocol + host + port)
    // "same-site" means same registrable domain (e.g., sub.example.com to example.com)
    // "none" means user-initiated navigation (typing URL, bookmarks)
    if (secFetchSite === "same-origin" || secFetchSite === "same-site") {
      return true;
    }

    // If the header is present and says "cross-site", it's definitely external
    if (secFetchSite === "cross-site") {
      return false;
    }

    // "none" - could be direct navigation, let other checks decide
  }

  // 2. Check Origin header
  const origin = request.headers.get("origin");
  if (origin && isAllowedOrigin(origin)) {
    return true;
  }

  // 3. Fall back to Referer header check
  const referer = request.headers.get("referer");
  if (referer) {
    try {
      const refererUrl = new URL(referer);
      const refererOrigin = refererUrl.origin;
      if (isAllowedOrigin(refererOrigin)) {
        return true;
      }
    } catch {
      // Invalid referer URL
    }
  }

  // 4. In development, be more lenient for testing tools (Postman, curl, etc.)
  if (process.env.NODE_ENV === "development") {
    // If no headers at all, it might be a direct request from dev tools
    // Log it but allow in dev
    if (!origin && !referer && !secFetchSite) {
      console.warn("[Middleware] Dev: Allowing request without origin headers");
      return true;
    }
  }

  return false;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect API routes
  if (!pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // Allow public routes to be accessed externally
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // Check if request is from allowed origin
  if (!isSameOriginRequest(request)) {
    console.warn("[Middleware] Blocked external API request:", {
      path: pathname,
      origin: request.headers.get("origin"),
      referer: request.headers.get("referer"),
      secFetchSite: request.headers.get("sec-fetch-site"),
      ip: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip"),
    });

    return NextResponse.json(
      {
        error: "forbidden",
        message: "API access denied",
      },
      { status: 403 }
    );
  }

  // Add security headers to the response
  const response = NextResponse.next();

  // Prevent the API from being embedded in iframes
  response.headers.set("X-Frame-Options", "DENY");

  // Prevent MIME type sniffing
  response.headers.set("X-Content-Type-Options", "nosniff");

  return response;
}

// Only run middleware on API routes
export const config = {
  matcher: "/api/:path*",
};


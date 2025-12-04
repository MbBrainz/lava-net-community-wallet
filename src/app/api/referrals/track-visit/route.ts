/**
 * POST /api/referrals/track-visit
 *
 * Purpose: Record a pending referral visit for server-side probabilistic matching.
 *          Called when a user visits the site with a referral code.
 *          This enables referral attribution even when localStorage isn't shared
 *          between the browser and PWA (common on iOS).
 *
 * Auth required: No (public endpoint - captures visits before signup)
 *
 * Request body:
 * - referralData: { ref, tag?, source?, fullParams, capturedAt }
 * - fingerprint?: { screenResolution? }
 *
 * Headers used for matching (server extracts these):
 * - x-forwarded-for or socket IP
 * - user-agent
 *
 * Responses:
 * - { success: true, visitId: string }
 * - { success: false, error: string, message: string }
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { pendingReferralVisits } from "@/lib/db/schema";
import { trackVisitRequestSchema, REFERRAL_CONFIG } from "@/lib/referral";
import { lt } from "drizzle-orm";

const { PROBABILISTIC_MATCHING } = REFERRAL_CONFIG;

/**
 * Extract the client IP address from the request.
 * Handles various proxy scenarios (Vercel, Cloudflare, etc.)
 */
function getClientIP(request: NextRequest): string {
  // Vercel/Next.js provides this
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    // x-forwarded-for may contain multiple IPs, take the first (original client)
    return forwardedFor.split(",")[0].trim();
  }

  // Cloudflare
  const cfConnectingIP = request.headers.get("cf-connecting-ip");
  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  // Real IP from various proxies
  const realIP = request.headers.get("x-real-ip");
  if (realIP) {
    return realIP;
  }

  // Fallback - this shouldn't happen in production
  return "unknown";
}

/**
 * Clean up expired pending visits.
 * Called opportunistically to keep the table clean.
 */
async function cleanupExpiredVisits(): Promise<void> {
  try {
    await db
      .delete(pendingReferralVisits)
      .where(lt(pendingReferralVisits.expiresAt, new Date()));
  } catch (error) {
    // Don't fail the request if cleanup fails
    console.error("[TrackVisit] Cleanup error:", error);
  }
}

export async function POST(request: NextRequest) {
  console.log("[TrackVisit] 📥 Incoming track-visit request");

  try {
    // Check if feature is enabled
    if (!PROBABILISTIC_MATCHING.ENABLED) {
      console.log("[TrackVisit] ⚠️ Feature disabled");
      return NextResponse.json({
        success: false,
        error: "disabled",
        message: "Probabilistic matching is disabled",
      });
    }

    // Parse and validate request body
    const body = await request.json();
    const parseResult = trackVisitRequestSchema.safeParse(body);

    if (!parseResult.success) {
      console.warn("[TrackVisit] ❌ Invalid request body:", parseResult.error.issues);
      return NextResponse.json(
        {
          success: false,
          error: "invalid_request",
          message: parseResult.error.issues[0]?.message || "Invalid request",
        },
        { status: 400 }
      );
    }

    const { referralData, fingerprint } = parseResult.data;

    // Extract fingerprint data from request headers
    const ipAddress = getClientIP(request);
    const userAgent = request.headers.get("user-agent") || "unknown";

    console.log("[TrackVisit] 🔍 Extracted fingerprint from request:", {
      ipAddress,
      userAgentPreview: userAgent.slice(0, 80) + (userAgent.length > 80 ? "..." : ""),
      screenResolution: fingerprint?.screenResolution || "(not provided)",
      referralCode: referralData.ref,
    });

    // Validate we have usable fingerprint data
    if (ipAddress === "unknown") {
      console.warn("[TrackVisit] ❌ Could not determine client IP - headers:", {
        "x-forwarded-for": request.headers.get("x-forwarded-for"),
        "cf-connecting-ip": request.headers.get("cf-connecting-ip"),
        "x-real-ip": request.headers.get("x-real-ip"),
      });
      return NextResponse.json({
        success: false,
        error: "no_ip",
        message: "Could not determine client IP address",
      });
    }

    // Calculate expiry time
    const expiresAt = new Date(
      Date.now() + PROBABILISTIC_MATCHING.MATCH_WINDOW_MINUTES * 60 * 1000
    );

    // Opportunistically clean up expired visits (non-blocking)
    cleanupExpiredVisits();

    // Insert pending visit record
    const [inserted] = await db
      .insert(pendingReferralVisits)
      .values({
        ipAddress,
        userAgent: userAgent.slice(0, 512), // Truncate to fit column
        screenResolution: fingerprint?.screenResolution || null,
        referralCode: referralData.ref,
        customTag: referralData.tag || null,
        source: referralData.source || null,
        fullParams: referralData.fullParams,
        expiresAt,
      })
      .returning({ id: pendingReferralVisits.id });

    console.log("[TrackVisit] ✅ Stored pending referral visit:", {
      visitId: inserted.id,
      referralCode: referralData.ref,
      tag: referralData.tag || "(none)",
      source: referralData.source || "(none)",
      fingerprint: {
        ipAddress,
        userAgentLength: userAgent.length,
        screenResolution: fingerprint?.screenResolution || "(none)",
      },
      expiresAt: expiresAt.toISOString(),
      matchWindowMinutes: PROBABILISTIC_MATCHING.MATCH_WINDOW_MINUTES,
    });

    return NextResponse.json({
      success: true,
      visitId: inserted.id,
    });
  } catch (error) {
    console.error("[TrackVisit] ❌ Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "server_error",
        message: "Internal server error",
      },
      { status: 500 }
    );
  }
}


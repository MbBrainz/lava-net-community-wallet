/**
 * POST /api/referrals/match-visit
 *
 * Purpose: Match a PWA visitor to a pending referral visit using server-side
 *          probabilistic matching based on IP address and User Agent.
 *
 * How it works:
 * 1. PWA calls this endpoint when user has no referral in localStorage
 * 2. Server extracts IP and User Agent from request headers
 * 3. Server looks for pending visits with matching fingerprint within time window
 * 4. If exactly one match is found, return the referral data and delete the record
 * 5. If no match or multiple matches, indicate fallback is needed
 *
 * Auth required: No (called before/during signup)
 *
 * Request body:
 * - fingerprint?: { screenResolution? }
 *
 * Responses:
 * - { matched: true, referralData: { ref, tag, source, fullParams, capturedAt } }
 * - { matched: false, reason: "no_match" | "multiple_matches" | "disabled" }
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { pendingReferralVisits } from "@/lib/db/schema";
import { matchVisitRequestSchema, REFERRAL_CONFIG } from "@/lib/referral";
import { eq, and, gt } from "drizzle-orm";

const { PROBABILISTIC_MATCHING } = REFERRAL_CONFIG;

/**
 * Extract the client IP address from the request.
 * Handles various proxy scenarios (Vercel, Cloudflare, etc.)
 */
function getClientIP(request: NextRequest): string {
  // Vercel/Next.js provides this
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
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

  return "unknown";
}

export async function POST(request: NextRequest) {
  console.log("[MatchVisit] 📥 Incoming match-visit request");

  try {
    // Check if feature is enabled
    if (!PROBABILISTIC_MATCHING.ENABLED) {
      console.log("[MatchVisit] ⚠️ Feature disabled");
      return NextResponse.json({
        matched: false,
        reason: "disabled",
      });
    }

    // Parse request body (optional fingerprint data)
    let fingerprint: { screenResolution?: string } | undefined;
    try {
      const body = await request.json();
      const parseResult = matchVisitRequestSchema.safeParse(body);
      if (parseResult.success) {
        fingerprint = parseResult.data.fingerprint;
      }
    } catch {
      // Empty body is fine
    }

    // Extract fingerprint from request headers
    const ipAddress = getClientIP(request);
    const userAgent = request.headers.get("user-agent") || "unknown";

    console.log("[MatchVisit] 🔍 Extracted fingerprint from request:", {
      ipAddress,
      userAgentPreview: userAgent.slice(0, 80) + (userAgent.length > 80 ? "..." : ""),
      screenResolution: fingerprint?.screenResolution || "(not provided)",
    });

    if (ipAddress === "unknown") {
      console.warn("[MatchVisit] ❌ Could not determine client IP");
      return NextResponse.json({
        matched: false,
        reason: "no_match",
      });
    }

    const now = new Date();

    // Find pending visits matching the fingerprint
    // We start with IP match, then filter further
    console.log("[MatchVisit] 🔎 Searching for pending visits with IP:", ipAddress);
    
    const pendingVisits = await db
      .select()
      .from(pendingReferralVisits)
      .where(
        and(
          eq(pendingReferralVisits.ipAddress, ipAddress),
          gt(pendingReferralVisits.expiresAt, now)
        )
      )
      .limit(PROBABILISTIC_MATCHING.MAX_PENDING_PER_IP);

    console.log("[MatchVisit] 📊 Found pending visits for IP:", {
      count: pendingVisits.length,
      visits: pendingVisits.map((v) => ({
        id: v.id,
        code: v.referralCode,
        createdAt: v.createdAt.toISOString(),
        expiresAt: v.expiresAt.toISOString(),
      })),
    });

    if (pendingVisits.length === 0) {
      console.log("[MatchVisit] ❌ No pending visits found for this IP");
      return NextResponse.json({
        matched: false,
        reason: "no_match",
      });
    }

    // Filter by User Agent if strict matching is enabled
    let matchingVisits = pendingVisits;

    if (PROBABILISTIC_MATCHING.STRICT_USER_AGENT_MATCH) {
      const truncatedUA = userAgent.slice(0, 512);
      matchingVisits = pendingVisits.filter(
        (visit) => visit.userAgent === truncatedUA
      );
      
      console.log("[MatchVisit] 🔎 After User-Agent filter:", {
        strictMatch: true,
        beforeCount: pendingVisits.length,
        afterCount: matchingVisits.length,
        currentUA: truncatedUA.slice(0, 60) + "...",
      });
    }

    // Optionally filter by screen resolution if provided
    if (fingerprint?.screenResolution && matchingVisits.length > 1) {
      const screenMatches = matchingVisits.filter(
        (visit) => visit.screenResolution === fingerprint.screenResolution
      );
      console.log("[MatchVisit] 🔎 After screen resolution filter:", {
        requestedResolution: fingerprint.screenResolution,
        beforeCount: matchingVisits.length,
        afterCount: screenMatches.length,
      });
      // Only use screen filter if it doesn't eliminate all matches
      if (screenMatches.length > 0) {
        matchingVisits = screenMatches;
      }
    }

    if (matchingVisits.length === 0) {
      console.log("[MatchVisit] ❌ No visits match User-Agent for this IP");
      return NextResponse.json({
        matched: false,
        reason: "no_match",
      });
    }

    if (matchingVisits.length > 1) {
      // Multiple matches - ambiguous, can't reliably attribute
      // Don't delete records - let them expire naturally or be matched individually
      console.log("[MatchVisit] ⚠️ Multiple matches found - ambiguous:", {
        count: matchingVisits.length,
        codes: matchingVisits.map((v) => v.referralCode),
        note: "Cannot attribute when multiple pending visits match",
      });
      return NextResponse.json({
        matched: false,
        reason: "multiple_matches",
      });
    }

    // Exactly one match - perfect!
    const match = matchingVisits[0];

    console.log("[MatchVisit] ✅ Single match found! Attributing referral:", {
      visitId: match.id,
      referralCode: match.referralCode,
      tag: match.customTag || "(none)",
      source: match.source || "(none)",
      originalVisitTime: match.createdAt.toISOString(),
      matchedFingerprint: {
        ipAddress,
        userAgentMatched: true,
        screenResolution: match.screenResolution || "(none)",
      },
    });

    // Delete the pending record to prevent reuse
    await db
      .delete(pendingReferralVisits)
      .where(eq(pendingReferralVisits.id, match.id));

    console.log("[MatchVisit] 🗑️ Deleted pending visit to prevent reuse");

    // Return the referral data
    return NextResponse.json({
      matched: true,
      referralData: {
        ref: match.referralCode,
        tag: match.customTag,
        source: match.source,
        fullParams: (match.fullParams as Record<string, string>) || {},
        capturedAt: match.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("[MatchVisit] ❌ Error:", error);
    // On error, indicate no match - caller should fallback gracefully
    return NextResponse.json({
      matched: false,
      reason: "no_match",
    });
  }
}


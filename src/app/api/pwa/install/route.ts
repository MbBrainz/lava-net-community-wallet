/**
 * POST /api/pwa/install
 *
 * Records install telemetry so we can audit how many PWAs are installed,
 * when installs happen, and which authenticated account initiated them.
 *
 * This endpoint accepts optional authentication. When a Dynamic JWT is
 * present we attach the verified user to the record; otherwise we fallback
 * to anonymous logging (still useful for device-level metrics).
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db/client";
import { pwaInstallEvents } from "@/lib/db/schema";
import { getOptionalAuthenticatedUser } from "@/lib/auth/server";
import {
  PWA_INSTALL_EVENT_TYPES,
  PWA_INSTALL_TRIGGER_SOURCES,
} from "@/lib/pwa/install-events";

const installEventSchema = z.object({
  eventType: z.enum(PWA_INSTALL_EVENT_TYPES),
  triggeredBy: z.enum(PWA_INSTALL_TRIGGER_SOURCES).optional(),
  occurredAt: z.string().datetime().optional(),
  platform: z.string().max(128).optional(),
  userAgent: z.string().max(512).optional(),
  installSurface: z.string().max(64).optional(),
  walletAddress: z.string().max(255).optional().nullable(),
  isStandalone: z.boolean().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const payload = installEventSchema.parse(json);

    const user = await getOptionalAuthenticatedUser(request);

    await db.insert(pwaInstallEvents).values({
      eventType: payload.eventType,
      triggeredBy: payload.triggeredBy ?? null,
      installSurface: payload.installSurface ?? null,
      platform: payload.platform ?? null,
      userAgent: payload.userAgent ?? null,
      isStandalone: payload.isStandalone ?? null,
      metadata: payload.metadata ?? null,
      walletAddress: payload.walletAddress ?? null,
      occurredAt: payload.occurredAt
        ? new Date(payload.occurredAt)
        : new Date(),
      userEmail: user?.email ?? null,
      userId: user?.userId ?? null,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "invalid_payload",
          message: "Install event payload failed validation",
          issues: error.issues,
        },
        { status: 400 }
      );
    }

    console.error("[PWA Install] Failed to record event", error);
    return NextResponse.json(
      { error: "server_error", message: "Unable to record install event" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/check
 *
 * Purpose: Check if current authenticated user is an admin
 * Auth required: Yes (verified via JWT token)
 *
 * Headers:
 * - Authorization: Bearer <token>
 *
 * Responses:
 * - { isAdmin: true }
 * - { isAdmin: false }
 * - { error: "unauthorized", message: "..." } (401)
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { admins } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getAuthenticatedUser } from "@/lib/auth/server";

export async function GET(request: NextRequest) {
  try {
    // Verify authentication via JWT
    const auth = await getAuthenticatedUser(request);
    if (!auth.success) {
      return auth.response;
    }

    // Check admins table using the VERIFIED email
    const admin = await db.query.admins.findFirst({
      where: eq(admins.email, auth.user.email),
    });

    return NextResponse.json({ isAdmin: !!admin });
  } catch (error) {
    console.error("[Admin Check] Error:", error);
    return NextResponse.json(
      { isAdmin: false, error: "server_error" },
      { status: 500 }
    );
  }
}

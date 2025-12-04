/**
 * GET /api/admin/check
 *
 * Purpose: Check if current user is an admin
 * Auth required: Yes (email passed as query param)
 *
 * Query params:
 * - email: string (from authenticated user)
 *
 * Responses:
 * - { isAdmin: true }
 * - { isAdmin: false }
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { admins } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    // Validate email parameter
    if (!email) {
      return NextResponse.json(
        { error: "missing_email", message: "Email parameter is required" },
        { status: 400 }
      );
    }

    // Check admins table
    const admin = await db.query.admins.findFirst({
      where: eq(admins.email, email),
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


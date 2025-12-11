/**
 * Referral Data Migration Script
 *
 * Migrates data from v1 tables to v2 tables.
 * Run with: npx tsx scripts/migrate-referrals.ts
 */

import { config } from "dotenv";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq, sql } from "drizzle-orm";

// Load environment
config({ path: ".env" });
config({ path: ".env.local" });

// Import old schema
import { referrerCodes, userReferrals } from "../src/lib/db/schema/referrals";

// Import new schema
import {
  referrers,
  referralCodes as referralCodesV2,
  userReferrals as userReferralsV2,
} from "../src/lib/db/schema/referrers";

// Import code generator
const CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function generateShortCode(): string {
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += CHARSET[Math.floor(Math.random() * CHARSET.length)];
  }
  return code;
}

async function migrate() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("❌ DATABASE_URL not found in environment");
    process.exit(1);
  }

  console.log("🚀 Starting referral data migration...\n");

  const sqlClient = neon(dbUrl);
  const db = drizzle(sqlClient);

  try {
    // Step 1: Get all old referrer codes
    console.log("📋 Fetching old referrer codes...");
    const oldCodes = await db.select().from(referrerCodes);
    console.log(`   Found ${oldCodes.length} referrer codes\n`);

    if (oldCodes.length === 0) {
      console.log("✅ No data to migrate!");
      return;
    }

    // Step 2: Create referrer entries for approved codes
    console.log("👤 Creating referrer entries...");
    const codeMapping: Map<string, { referrerId: string; newCode: string }> = new Map();

    for (const oldCode of oldCodes) {
      if (!oldCode.isApproved) {
        console.log(`   ⏭️  Skipping unapproved: ${oldCode.code}`);
        continue;
      }

      // Check if referrer already exists
      const existingReferrer = await db
        .select()
        .from(referrers)
        .where(eq(referrers.email, oldCode.ownerEmail))
        .limit(1);

      let referrerId: string;

      if (existingReferrer.length > 0) {
        referrerId = existingReferrer[0].id;
        console.log(`   ♻️  Referrer exists: ${oldCode.ownerEmail}`);
      } else {
        // Create new referrer
        const [newReferrer] = await db
          .insert(referrers)
          .values({
            email: oldCode.ownerEmail,
            dynamicUserId: oldCode.ownerDynamicUserId,
            isApproved: true,
            canSendNotifications: false,
            approvedAt: oldCode.approvedAt,
            createdAt: oldCode.requestedAt,
            updatedAt: new Date(),
          })
          .returning();

        referrerId = newReferrer.id;
        console.log(`   ✅ Created referrer: ${oldCode.ownerEmail}`);
      }

      // Generate new 6-char code
      let newCode: string;
      let attempts = 0;
      do {
        newCode = generateShortCode();
        attempts++;
      } while (codeMapping.has(newCode) && attempts < 10);

      // Create the new referral code
      await db.insert(referralCodesV2).values({
        code: newCode,
        referrerId,
        label: `Migrated from: ${oldCode.code}`,
        isActive: true,
        usageCount: 0, // Will update after migrating referrals
        createdAt: oldCode.requestedAt,
      });

      codeMapping.set(oldCode.code, { referrerId, newCode });
      console.log(`   🔄 ${oldCode.code} → ${newCode}`);
    }

    console.log(`\n   Created ${codeMapping.size} new codes\n`);

    // Step 3: Migrate user referrals
    console.log("📥 Fetching old user referrals...");
    const oldReferrals = await db.select().from(userReferrals);
    console.log(`   Found ${oldReferrals.length} user referrals\n`);

    console.log("🔗 Migrating user referrals...");
    let migratedCount = 0;
    const usageCountMap: Map<string, number> = new Map();

    for (const oldRef of oldReferrals) {
      const mapping = codeMapping.get(oldRef.referrerCode);

      if (!mapping) {
        console.log(`   ⚠️  No mapping for code: ${oldRef.referrerCode} (user: ${oldRef.userEmail})`);
        continue;
      }

      // Check if already migrated
      const existing = await db
        .select()
        .from(userReferralsV2)
        .where(eq(userReferralsV2.userEmail, oldRef.userEmail))
        .limit(1);

      if (existing.length > 0) {
        console.log(`   ♻️  Already migrated: ${oldRef.userEmail}`);
        continue;
      }

      // Create new user referral
      await db.insert(userReferralsV2).values({
        userEmail: oldRef.userEmail,
        userDynamicId: oldRef.dynamicUserId,
        userWalletAddress: oldRef.walletAddress,
        codeUsed: mapping.newCode,
        referrerId: mapping.referrerId,
        convertedAt: oldRef.convertedAt,
      });

      // Track usage count
      usageCountMap.set(mapping.newCode, (usageCountMap.get(mapping.newCode) || 0) + 1);

      migratedCount++;
      console.log(`   ✅ ${oldRef.userEmail} → ${mapping.newCode}`);
    }

    console.log(`\n   Migrated ${migratedCount} user referrals\n`);

    // Step 4: Update usage counts
    console.log("📊 Updating usage counts...");
    for (const [code, count] of usageCountMap) {
      await db
        .update(referralCodesV2)
        .set({ usageCount: count })
        .where(eq(referralCodesV2.code, code));
      console.log(`   ${code}: ${count} referrals`);
    }

    console.log("\n✅ Migration complete!");
    console.log("\n📋 Summary:");
    console.log(`   - Referrers created: ${codeMapping.size}`);
    console.log(`   - Codes generated: ${codeMapping.size}`);
    console.log(`   - Referrals migrated: ${migratedCount}`);

    console.log("\n📌 Code Mapping:");
    for (const [oldCode, { newCode }] of codeMapping) {
      console.log(`   ${oldCode} → ${newCode}`);
    }

    console.log("\n⚠️  Next steps:");
    console.log("   1. Verify the migration data in your database");
    console.log("   2. Update users with the new short codes");
    console.log("   3. Test the v2 API endpoints");
    console.log("   4. Once verified, rename tables and drop old ones");

  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    process.exit(1);
  }
}

migrate();

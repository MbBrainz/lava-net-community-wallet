/**
 * Database Client
 *
 * Configured for Neon PostgreSQL with Drizzle ORM.
 */

import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";

// Import all schemas for relational queries
import * as schema from "./schema";

config({ path: ".env" });

const sql = neon(process.env.DATABASE_URL!);

// Export db with schema for relational queries
export const db = drizzle(sql, { schema });

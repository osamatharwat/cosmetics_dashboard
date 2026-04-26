import { getDb } from "./db";
import { sql } from "drizzle-orm";

export async function runMigration() {
  const db = await getDb();
  if (!db) {
    console.error("Database not available");
    return false;
  }

  try {
    console.log("Running migration: Adding productionCost column...");
    
    // Try to add the column
    await db.execute(
      sql.raw(`ALTER TABLE \`products\` ADD \`productionCost\` decimal(10,2) DEFAULT '0'`)
    );
    
    console.log("✓ Migration successful");
    return true;
  } catch (error: any) {
    // Check if column already exists
    if (error?.message?.includes("Duplicate column")) {
      console.log("✓ Column already exists");
      return true;
    }
    console.error("Migration error:", error?.message || error);
    return false;
  }
}

// Run on startup
runMigration().catch(console.error);

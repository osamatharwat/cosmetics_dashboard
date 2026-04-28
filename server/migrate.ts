import { getDb } from "./db";
import { sql } from "drizzle-orm";

export async function runMigration() {
  const db = await getDb();
  if (!db) {
    console.error("Database not available");
    return false;
  }

  try {
    console.log("Running migrations...");
    
    // Migration 1: Add productionCost to products
    try {
      await db.execute(
        sql.raw(`ALTER TABLE \`products\` ADD \`productionCost\` decimal(10,2) DEFAULT '0'`)
      );
      console.log("✓ Added productionCost column");
    } catch (e: any) {
      if (!e?.message?.includes("Duplicate")) throw e;
      console.log("✓ productionCost column already exists");
    }

    // Migration 2: Add discount fields to sales
    try {
      await db.execute(
        sql.raw(`ALTER TABLE \`sales\` ADD \`discountType\` enum('none','percentage','fixed') DEFAULT 'none' NOT NULL`)
      );
      console.log("✓ Added discountType column");
    } catch (e: any) {
      if (!e?.message?.includes("Duplicate")) throw e;
      console.log("✓ discountType column already exists");
    }

    try {
      await db.execute(
        sql.raw(`ALTER TABLE \`sales\` ADD \`discountValue\` decimal(10,2) DEFAULT '0' NOT NULL`)
      );
      console.log("✓ Added discountValue column");
    } catch (e: any) {
      if (!e?.message?.includes("Duplicate")) throw e;
      console.log("✓ discountValue column already exists");
    }
    
    console.log("✓ All migrations successful");
    return true;
  } catch (error: any) {
    console.error("Migration error:", error?.message || error);
    return false;
  }
}

// Run on startup
runMigration().catch(console.error);

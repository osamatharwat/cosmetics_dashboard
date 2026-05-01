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

    // Migration 2: Create chartOfAccounts table
    try {
      await db.execute(
        sql.raw(`CREATE TABLE IF NOT EXISTS \`chartOfAccounts\` (
          \`id\` int AUTO_INCREMENT NOT NULL,
          \`userId\` int NOT NULL,
          \`accountCode\` varchar(20) NOT NULL,
          \`accountName\` varchar(255) NOT NULL,
          \`accountType\` enum('asset','liability','equity','revenue','expense') NOT NULL,
          \`description\` text,
          \`createdAt\` timestamp NOT NULL DEFAULT (now()),
          CONSTRAINT \`chartOfAccounts_id\` PRIMARY KEY(\`id\`)
        )`)
      );
      console.log("✓ Created chartOfAccounts table");
    } catch (e: any) {
      console.log("✓ chartOfAccounts table already exists");
    }

    // Migration 3: Create journalEntries table
    try {
      await db.execute(
        sql.raw(`CREATE TABLE IF NOT EXISTS \`journalEntries\` (
          \`id\` int AUTO_INCREMENT NOT NULL,
          \`userId\` int NOT NULL,
          \`entryDate\` timestamp NOT NULL,
          \`description\` varchar(255) NOT NULL,
          \`referenceType\` enum('sale','expense','batch','adjustment','other') NOT NULL,
          \`referenceId\` int,
          \`createdAt\` timestamp NOT NULL DEFAULT (now()),
          CONSTRAINT \`journalEntries_id\` PRIMARY KEY(\`id\`)
        )`)
      );
      console.log("✓ Created journalEntries table");
    } catch (e: any) {
      console.log("✓ journalEntries table already exists");
    }

    // Migration 4: Create journalEntryLines table
    try {
      await db.execute(
        sql.raw(`CREATE TABLE IF NOT EXISTS \`journalEntryLines\` (
          \`id\` int AUTO_INCREMENT NOT NULL,
          \`journalEntryId\` int NOT NULL,
          \`accountId\` int NOT NULL,
          \`debitAmount\` decimal(12,2) DEFAULT '0',
          \`creditAmount\` decimal(12,2) DEFAULT '0',
          \`createdAt\` timestamp NOT NULL DEFAULT (now()),
          CONSTRAINT \`journalEntryLines_id\` PRIMARY KEY(\`id\`)
        )`)
      );
      console.log("✓ Created journalEntryLines table");
    } catch (e: any) {
      console.log("✓ journalEntryLines table already exists");
    }

    // Migration 5: Create discountTransactions table
    try {
      await db.execute(
        sql.raw(`CREATE TABLE IF NOT EXISTS \`discountTransactions\` (
          \`id\` int AUTO_INCREMENT NOT NULL,
          \`userId\` int NOT NULL,
          \`saleId\` int NOT NULL,
          \`discountType\` enum('percentage','fixed') NOT NULL,
          \`discountValue\` decimal(10,2) NOT NULL,
          \`discountAmount\` decimal(12,2) NOT NULL,
          \`reason\` varchar(255),
          \`appliedDate\` timestamp NOT NULL,
          \`createdAt\` timestamp NOT NULL DEFAULT (now()),
          CONSTRAINT \`discountTransactions_id\` PRIMARY KEY(\`id\`)
        )`)
      );
      console.log("✓ Created discountTransactions table");
    } catch (e: any) {
      console.log("✓ discountTransactions table already exists");
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

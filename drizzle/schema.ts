import { decimal, int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

/**
 * Core user table backing auth flow.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Products table - stores product information
 * Each product can have multiple batches produced
 */
export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  sku: varchar("sku", { length: 100 }).notNull().unique(),
  sellingPrice: decimal("sellingPrice", { precision: 10, scale: 2 }).notNull(),
  productionCost: decimal("productionCost", { precision: 10, scale: 2 }).default("0"), // تكلفة الإنتاج للوحدة الواحدة
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

/**
 * Batches table - tracks production batches
 * Each batch has a cost, size, and can be linked to multiple sales
 */
export const batches = mysqlTable("batches", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  productId: int("productId").notNull(),
  batchSize: int("batchSize").notNull(), // quantity produced
  totalCost: decimal("totalCost", { precision: 12, scale: 2 }).notNull(),
  costPerUnit: decimal("costPerUnit", { precision: 10, scale: 2 }).notNull(),
  productionDate: timestamp("productionDate").notNull(),
  expiryDate: timestamp("expiryDate"),
  remainingStock: int("remainingStock").notNull(), // auto-updated when sales occur
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Batch = typeof batches.$inferSelect;
export type InsertBatch = typeof batches.$inferInsert;

/**
 * Sales table - tracks individual sales transactions
 * Each sale is linked to a product and optionally a batch (for FIFO)
 */
export const sales = mysqlTable("sales", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  productId: int("productId").notNull(),
  batchId: int("batchId"), // optional, for FIFO tracking
  quantity: int("quantity").notNull(),
  unitPrice: decimal("unitPrice", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("totalPrice", { precision: 12, scale: 2 }).notNull(),
  costPerUnit: decimal("costPerUnit", { precision: 10, scale: 2 }).notNull(),
  profit: decimal("profit", { precision: 12, scale: 2 }).notNull(),
  customerName: varchar("customerName", { length: 255 }),
  saleDate: timestamp("saleDate").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Sale = typeof sales.$inferSelect;
export type InsertSale = typeof sales.$inferInsert;

/**
 * Expenses table - tracks business expenses by category
 * Used for financial tracking and cash flow analysis
 */
export const expenses = mysqlTable("expenses", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  category: varchar("category", { length: 100 }).notNull(), // materials, packaging, marketing, etc.
  description: text("description"),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  expenseDate: timestamp("expenseDate").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = typeof expenses.$inferInsert;

/**
 * Other Income table - tracks non-sales income
 * Used for complete financial picture
 */
export const otherIncome = mysqlTable("otherIncome", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  description: varchar("description", { length: 255 }).notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  incomeDate: timestamp("incomeDate").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type OtherIncome = typeof otherIncome.$inferSelect;
export type InsertOtherIncome = typeof otherIncome.$inferInsert;

/**
 * Cost Breakdown table - stores itemized costs for products
 * Used for cost analysis and pricing calculations
 */
export const costBreakdowns = mysqlTable("costBreakdowns", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  productId: int("productId").notNull(),
  rawMaterialsCost: decimal("rawMaterialsCost", { precision: 10, scale: 2 }).default("0"),
  packagingCost: decimal("packagingCost", { precision: 10, scale: 2 }).default("0"),
  marketingCost: decimal("marketingCost", { precision: 10, scale: 2 }).default("0"),
  laborCost: decimal("laborCost", { precision: 10, scale: 2 }).default("0"),
  otherCost: decimal("otherCost", { precision: 10, scale: 2 }).default("0"),
  totalCost: decimal("totalCost", { precision: 10, scale: 2 }).notNull(),
  suggestedMarginPercent: decimal("suggestedMarginPercent", { precision: 5, scale: 2 }).default("30"),
  suggestedSellingPrice: decimal("suggestedSellingPrice", { precision: 10, scale: 2 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CostBreakdown = typeof costBreakdowns.$inferSelect;
export type InsertCostBreakdown = typeof costBreakdowns.$inferInsert;
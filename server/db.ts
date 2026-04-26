import { eq, and, desc, gte, lte, sum } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, products, batches, sales, expenses, otherIncome, costBreakdowns, Product, Batch, Sale, Expense, OtherIncome, CostBreakdown } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============= PRODUCTS =============
export async function getProductsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(products).where(eq(products.userId, userId));
}

export async function getProductById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(products).where(and(eq(products.id, id), eq(products.userId, userId)));
  return result[0];
}

export async function createProduct(data: { userId: number; name: string; sku: string; sellingPrice: string; description?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(products).values(data);
  return result;
}

export async function updateProduct(id: number, userId: number, data: Partial<Omit<Product, 'id' | 'userId' | 'createdAt'>>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(products).set(data).where(and(eq(products.id, id), eq(products.userId, userId)));
}

export async function deleteProduct(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(products).where(and(eq(products.id, id), eq(products.userId, userId)));
}

// ============= BATCHES =============
export async function getBatchesByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(batches).where(eq(batches.userId, userId)).orderBy(desc(batches.productionDate));
}

export async function getBatchById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(batches).where(and(eq(batches.id, id), eq(batches.userId, userId)));
  return result[0];
}

export async function getBatchesByProductId(productId: number, userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(batches).where(and(eq(batches.productId, productId), eq(batches.userId, userId))).orderBy(desc(batches.productionDate));
}

export async function createBatch(data: { userId: number; productId: number; batchSize: number; totalCost: string; costPerUnit: string; productionDate: Date; expiryDate?: Date }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const batchData = { ...data, remainingStock: data.batchSize };
  const result = await db.insert(batches).values(batchData);
  return result;
}

export async function updateBatch(id: number, userId: number, data: Partial<Omit<Batch, 'id' | 'userId' | 'createdAt'>>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(batches).set(data).where(and(eq(batches.id, id), eq(batches.userId, userId)));
}

export async function deleteBatch(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(batches).where(and(eq(batches.id, id), eq(batches.userId, userId)));
}

// ============= SALES =============
export async function getSalesByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(sales).where(eq(sales.userId, userId)).orderBy(desc(sales.saleDate));
}

export async function getSalesInDateRange(userId: number, startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(sales).where(and(eq(sales.userId, userId), gte(sales.saleDate, startDate), lte(sales.saleDate, endDate))).orderBy(desc(sales.saleDate));
}

export async function getSaleById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(sales).where(and(eq(sales.id, id), eq(sales.userId, userId)));
  return result[0];
}

export async function createSale(data: { userId: number; productId: number; batchId?: number; quantity: number; unitPrice: string; totalPrice: string; costPerUnit: string; profit: string; customerName?: string; saleDate: Date }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(sales).values(data);
  return result;
}

export async function updateSale(id: number, userId: number, data: Partial<Omit<Sale, 'id' | 'userId' | 'createdAt'>>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(sales).set(data).where(and(eq(sales.id, id), eq(sales.userId, userId)));
}

export async function deleteSale(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(sales).where(and(eq(sales.id, id), eq(sales.userId, userId)));
}

// ============= EXPENSES =============
export async function getExpensesByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(expenses).where(eq(expenses.userId, userId)).orderBy(desc(expenses.expenseDate));
}

export async function getExpensesInDateRange(userId: number, startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(expenses).where(and(eq(expenses.userId, userId), gte(expenses.expenseDate, startDate), lte(expenses.expenseDate, endDate))).orderBy(desc(expenses.expenseDate));
}

export async function createExpense(data: { userId: number; category: string; description?: string; amount: string; expenseDate: Date }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(expenses).values(data);
}

export async function deleteExpense(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(expenses).where(and(eq(expenses.id, id), eq(expenses.userId, userId)));
}

// ============= OTHER INCOME =============
export async function getOtherIncomeByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(otherIncome).where(eq(otherIncome.userId, userId)).orderBy(desc(otherIncome.incomeDate));
}

export async function getOtherIncomeInDateRange(userId: number, startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(otherIncome).where(and(eq(otherIncome.userId, userId), gte(otherIncome.incomeDate, startDate), lte(otherIncome.incomeDate, endDate))).orderBy(desc(otherIncome.incomeDate));
}

export async function createOtherIncome(data: { userId: number; description: string; amount: string; incomeDate: Date }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(otherIncome).values(data);
}

export async function deleteOtherIncome(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(otherIncome).where(and(eq(otherIncome.id, id), eq(otherIncome.userId, userId)));
}

// ============= COST BREAKDOWNS =============
export async function getCostBreakdownByProductId(productId: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(costBreakdowns).where(and(eq(costBreakdowns.productId, productId), eq(costBreakdowns.userId, userId)));
  return result[0];
}

export async function createOrUpdateCostBreakdown(data: { userId: number; productId: number; rawMaterialsCost?: string; packagingCost?: string; marketingCost?: string; laborCost?: string; otherCost?: string; totalCost: string; suggestedMarginPercent?: string; suggestedSellingPrice?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existing = await getCostBreakdownByProductId(data.productId, data.userId);
  if (existing) {
    return db.update(costBreakdowns).set(data).where(eq(costBreakdowns.id, existing.id));
  } else {
    return db.insert(costBreakdowns).values(data);
  }
}

// ============= ANALYTICS =============
export async function getTotalSalesByUserId(userId: number) {
  const db = await getDb();
  if (!db) return "0";
  const result = await db.select({ total: sum(sales.totalPrice) }).from(sales).where(eq(sales.userId, userId));
  return result[0]?.total?.toString() || "0";
}

export async function getTotalProfitByUserId(userId: number) {
  const db = await getDb();
  if (!db) return "0";
  
  // Get all sales and products for calculation
  const allSales = await db.select().from(sales).where(eq(sales.userId, userId));
  const allProducts = await db.select().from(products).where(eq(products.userId, userId));
  
  // Calculate profit from sales using product production costs
  let totalSalesProfit = 0;
  for (const sale of allSales) {
    const product = allProducts.find(p => p.id === sale.productId);
    if (product) {
      const productionCost = parseFloat(product.productionCost?.toString() || "0");
      const profit = sale.quantity * (parseFloat(sale.unitPrice.toString()) - productionCost);
      totalSalesProfit += profit;
    }
  }
  
  // Get total expenses
  const expensesResult = await db.select({ total: sum(expenses.amount) }).from(expenses).where(eq(expenses.userId, userId));
  const totalExpenses = parseFloat(expensesResult[0]?.total?.toString() || "0");
  
  // Get total other income
  const incomeResult = await db.select({ total: sum(otherIncome.amount) }).from(otherIncome).where(eq(otherIncome.userId, userId));
  const totalOtherIncome = parseFloat(incomeResult[0]?.total?.toString() || "0");
  
  // Net Profit = Sales Profit - Expenses + Other Income
  const netProfit = totalSalesProfit - totalExpenses + totalOtherIncome;
  return netProfit.toFixed(2);
}

export async function getTotalExpensesByUserId(userId: number) {
  const db = await getDb();
  if (!db) return "0";
  const result = await db.select({ total: sum(expenses.amount) }).from(expenses).where(eq(expenses.userId, userId));
  return result[0]?.total?.toString() || "0";
}

export async function getTotalOtherIncomeByUserId(userId: number) {
  const db = await getDb();
  if (!db) return "0";
  const result = await db.select({ total: sum(otherIncome.amount) }).from(otherIncome).where(eq(otherIncome.userId, userId));
  return result[0]?.total?.toString() || "0";
}

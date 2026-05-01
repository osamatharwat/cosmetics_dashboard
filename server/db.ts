import { eq, and, desc, gte, lte, sum, count, sql } from "drizzle-orm";
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

export async function createSale(data: { userId: number; productId: number; batchId?: number; quantity: number; unitPrice: string; discountType?: "none" | "percentage" | "fixed"; discountValue?: string; totalPrice: string; costPerUnit: string; profit: string; customerName?: string; saleDate: Date }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const saleData = {
    ...data,
    discountType: (data.discountType || "none") as "none" | "percentage" | "fixed",
    discountValue: data.discountValue || "0",
  };
  const result = await db.insert(sales).values(saleData);
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

// Gross Profit = Revenue - COGS (Cost of Goods Sold)
export async function getGrossProfitByUserId(userId: number) {
  const db = await getDb();
  if (!db) return "0";
  const result = await db.select({ total: sum(sales.profit) }).from(sales).where(eq(sales.userId, userId));
  return result[0]?.total?.toString() || "0";
}

// Keep for backward compatibility
export async function getTotalProfitByUserId(userId: number) {
  return getGrossProfitByUserId(userId);
}

// Net Profit = Gross Profit - Expenses + Other Income
export async function getNetProfitByUserId(userId: number) {
  const toNum = (v: any) => Number.parseFloat(String(v ?? 0)) || 0;
  const grossProfit = await getGrossProfitByUserId(userId);
  const totalExpenses = await getTotalExpensesByUserId(userId);
  const otherIncome = await getTotalOtherIncomeByUserId(userId);

  // Net Profit = Gross Profit - Expenses + Other Income
  return (toNum(grossProfit) - toNum(totalExpenses) + toNum(otherIncome)).toFixed(2);
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


// ============= REPORTING & ANALYTICS =============

export interface MonthlyReport {
  month: string;
  year: number;
  totalSales: number;
  totalProfit: number;
  totalExpenses: number;
  otherIncome: number;
  netProfit: number;
  profitMargin: number;
  salesCount: number;
  expensesCount: number;
}

export interface YearlyReport {
  year: number;
  totalSales: number;
  totalProfit: number;
  totalExpenses: number;
  otherIncome: number;
  netProfit: number;
  profitMargin: number;
  monthlyBreakdown: MonthlyReport[];
  bestMonth: MonthlyReport | null;
  worstMonth: MonthlyReport | null;
}

export async function getMonthlyReport(userId: number, year: number, month: number): Promise<MonthlyReport> {
  const db = await getDb();
  if (!db) {
    return {
      month: new Date(year, month - 1).toLocaleString('en-US', { month: 'long' }),
      year,
      totalSales: 0,
      totalProfit: 0,
      totalExpenses: 0,
      otherIncome: 0,
      netProfit: 0,
      profitMargin: 0,
      salesCount: 0,
      expensesCount: 0,
    };
  }

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  // Get sales for the month
  const allSales = await db.select().from(sales)
    .where(eq(sales.userId, userId));
  const allProducts = await db.select().from(products)
    .where(eq(products.userId, userId));

  const monthlySales = allSales.filter(s => {
    const saleDate = new Date(s.saleDate);
    return saleDate >= startDate && saleDate <= endDate;
  });

  let totalSalesAmount = 0;
  let totalSalesProfit = 0;
  for (const sale of monthlySales) {
    const product = allProducts.find(p => p.id === sale.productId);
    totalSalesAmount += parseFloat(sale.totalPrice.toString());
    if (product) {
      const productionCost = parseFloat(product.productionCost?.toString() || "0");
      totalSalesProfit += sale.quantity * (parseFloat(sale.unitPrice.toString()) - productionCost);
    }
  }

  // Get expenses for the month
  const monthlyExpenses = await db.select().from(expenses)
    .where(eq(expenses.userId, userId));
  const filteredExpenses = monthlyExpenses.filter(e => {
    const expenseDate = new Date(e.expenseDate);
    return expenseDate >= startDate && expenseDate <= endDate;
  });
  const totalExpensesAmount = filteredExpenses.reduce((sum, e) => sum + parseFloat(e.amount.toString()), 0);

  // Get other income for the month
  const monthlyIncome = await db.select().from(otherIncome)
    .where(eq(otherIncome.userId, userId));
  const filteredIncome = monthlyIncome.filter(i => {
    const incomeDate = new Date(i.incomeDate);
    return incomeDate >= startDate && incomeDate <= endDate;
  });
  const totalOtherIncomeAmount = filteredIncome.reduce((sum, i) => sum + parseFloat(i.amount.toString()), 0);

  const netProfit = totalSalesProfit - totalExpensesAmount + totalOtherIncomeAmount;
  const profitMargin = totalSalesAmount > 0 ? (netProfit / totalSalesAmount) * 100 : 0;

  return {
    month: new Date(year, month - 1).toLocaleString('en-US', { month: 'long' }),
    year,
    totalSales: totalSalesAmount,
    totalProfit: totalSalesProfit,
    totalExpenses: totalExpensesAmount,
    otherIncome: totalOtherIncomeAmount,
    netProfit,
    profitMargin,
    salesCount: monthlySales.length,
    expensesCount: filteredExpenses.length,
  };
}

export async function getYearlyReport(userId: number, year: number): Promise<YearlyReport> {
  const monthlyReports: MonthlyReport[] = [];

  for (let month = 1; month <= 12; month++) {
    const report = await getMonthlyReport(userId, year, month);
    monthlyReports.push(report);
  }

  const totalSales = monthlyReports.reduce((sum, m) => sum + m.totalSales, 0);
  const totalProfit = monthlyReports.reduce((sum, m) => sum + m.totalProfit, 0);
  const totalExpenses = monthlyReports.reduce((sum, m) => sum + m.totalExpenses, 0);
  const totalOtherIncome = monthlyReports.reduce((sum, m) => sum + m.otherIncome, 0);
  const netProfit = monthlyReports.reduce((sum, m) => sum + m.netProfit, 0);
  const profitMargin = totalSales > 0 ? (netProfit / totalSales) * 100 : 0;

  // Find best and worst months
  const validMonths = monthlyReports.filter(m => m.netProfit !== 0);
  const bestMonth = validMonths.length > 0 ? validMonths.reduce((best, m) => m.netProfit > best.netProfit ? m : best) : null;
  const worstMonth = validMonths.length > 0 ? validMonths.reduce((worst, m) => m.netProfit < worst.netProfit ? m : worst) : null;

  return {
    year,
    totalSales,
    totalProfit,
    totalExpenses,
    otherIncome: totalOtherIncome,
    netProfit,
    profitMargin,
    monthlyBreakdown: monthlyReports,
    bestMonth,
    worstMonth,
  };
}

export async function getProductProfitability(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const allProducts = await db.select().from(products).where(eq(products.userId, userId));
  const allSales = await db.select().from(sales).where(eq(sales.userId, userId));

  const profitability = allProducts.map(product => {
    const productSales = allSales.filter(s => s.productId === product.id);
    const totalQuantity = productSales.reduce((sum, s) => sum + s.quantity, 0);
    const totalRevenue = productSales.reduce((sum, s) => sum + parseFloat(s.totalPrice.toString()), 0);
    
    const productionCost = parseFloat(product.productionCost?.toString() || "0");
    const totalCost = totalQuantity * productionCost;
    const totalProfit = totalRevenue - totalCost;
    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    return {
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      sellingPrice: parseFloat(product.sellingPrice.toString()),
      productionCost,
      profitPerUnit: parseFloat(product.sellingPrice.toString()) - productionCost,
      totalQuantitySold: totalQuantity,
      totalRevenue,
      totalCost,
      totalProfit,
      profitMargin,
    };
  });

  return profitability.sort((a, b) => b.totalProfit - a.totalProfit);
}

export async function getExpenseBreakdown(userId: number, year?: number, month?: number) {
  const db = await getDb();
  if (!db) return [];

  let expenseList = await db.select().from(expenses).where(eq(expenses.userId, userId));

  if (year !== undefined && month !== undefined) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);
    expenseList = expenseList.filter(e => {
      const expenseDate = new Date(e.expenseDate);
      return expenseDate >= startDate && expenseDate <= endDate;
    });
  } else if (year !== undefined) {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59);
    expenseList = expenseList.filter(e => {
      const expenseDate = new Date(e.expenseDate);
      return expenseDate >= startDate && expenseDate <= endDate;
    });
  }

  const breakdown: Record<string, number> = {};
  expenseList.forEach(expense => {
    const category = expense.category;
    breakdown[category] = (breakdown[category] || 0) + parseFloat(expense.amount.toString());
  });

  return Object.entries(breakdown)
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);
}

// ============= ATOMIC SALES TRANSACTIONS =============
// These functions ensure data consistency and prevent negative stock

export async function createSaleAtomic(data: { userId: number; productId: number; batchId?: number; quantity: number; unitPrice: string; totalPrice: string; costPerUnit: string; profit: string; customerName?: string; saleDate: Date }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    // Validate stock availability if batch is specified
    if (data.batchId) {
      const batch = await db.select().from(batches).where(eq(batches.id, data.batchId)).limit(1);
      if (batch.length === 0) throw new Error("Batch not found");
      if (batch[0].remainingStock < data.quantity) {
        throw new Error(`Insufficient stock. Available: ${batch[0].remainingStock}, Requested: ${data.quantity}`);
      }
    }

    // Create the sale
    const result = await db.insert(sales).values(data);

    // Update batch remaining stock if batch is specified
    if (data.batchId) {
      const batch = await db.select().from(batches).where(eq(batches.id, data.batchId)).limit(1);
      if (batch.length > 0) {
        const newRemainingStock = batch[0].remainingStock - data.quantity;
        await db.update(batches)
          .set({ remainingStock: newRemainingStock })
          .where(eq(batches.id, data.batchId));
      }
    }

    return result;
  } catch (error) {
    console.error("[Database] Error creating sale:", error);
    throw error;
  }
}

export async function updateSaleAtomic(id: number, userId: number, oldBatchId: number | undefined, newBatchId: number | undefined, oldQuantity: number, newQuantity: number, data: Partial<Omit<Sale, 'id' | 'userId' | 'createdAt'>>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    // If batch changed or quantity changed, update batch stock
    if (oldBatchId !== newBatchId || oldQuantity !== newQuantity) {
      // Restore old batch stock
      if (oldBatchId) {
        const oldBatch = await db.select().from(batches).where(eq(batches.id, oldBatchId)).limit(1);
        if (oldBatch.length > 0) {
          await db.update(batches)
            .set({ remainingStock: oldBatch[0].remainingStock + oldQuantity })
            .where(eq(batches.id, oldBatchId));
        }
      }

      // Deduct from new batch
      if (newBatchId) {
        const newBatch = await db.select().from(batches).where(eq(batches.id, newBatchId)).limit(1);
        if (newBatch.length === 0) throw new Error("New batch not found");
        if (newBatch[0].remainingStock < newQuantity) {
          throw new Error(`Insufficient stock in new batch. Available: ${newBatch[0].remainingStock}, Requested: ${newQuantity}`);
        }
        await db.update(batches)
          .set({ remainingStock: newBatch[0].remainingStock - newQuantity })
          .where(eq(batches.id, newBatchId));
      }
    }

    return db.update(sales).set(data).where(and(eq(sales.id, id), eq(sales.userId, userId)));
  } catch (error) {
    console.error("[Database] Error updating sale:", error);
    throw error;
  }
}

export async function deleteSaleAtomic(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    // Get the sale to retrieve batch and quantity info
    const sale = await db.select().from(sales).where(and(eq(sales.id, id), eq(sales.userId, userId))).limit(1);
    if (sale.length === 0) throw new Error("Sale not found");

    // Restore batch stock
    if (sale[0].batchId) {
      const batch = await db.select().from(batches).where(eq(batches.id, sale[0].batchId)).limit(1);
      if (batch.length > 0) {
        await db.update(batches)
          .set({ remainingStock: batch[0].remainingStock + sale[0].quantity })
          .where(eq(batches.id, sale[0].batchId));
      }
    }

    // Delete the sale
    return db.delete(sales).where(and(eq(sales.id, id), eq(sales.userId, userId)));
  } catch (error) {
    console.error("[Database] Error deleting sale:", error);
    throw error;
  }
}


// ============================================================================

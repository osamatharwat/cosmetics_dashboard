import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";

// ============= VALIDATION SCHEMAS =============
const productSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  sku: z.string().min(1, "SKU is required"),
  sellingPrice: z.string().regex(/^\d+(\.\d{1,2})?$/, "Valid selling price required"),
  productionCost: z.string().regex(/^\d+(\.\d{1,2})?$/, "Valid production cost required"),
  description: z.string().optional(),
});

const batchSchema = z.object({
  productId: z.number().int().positive(),
  batchSize: z.number().int().positive("Batch size must be positive"),
  totalCost: z.string().regex(/^\d+(\.\d{1,2})?$/, "Valid cost required"),
  productionDate: z.coerce.date(),
  expiryDate: z.coerce.date().optional(),
});

const saleSchema = z.object({
  productId: z.number().int().positive(),
  batchId: z.number().int().positive().optional(),
  quantity: z.number().int().positive("Quantity must be positive"),
  unitPrice: z.string().regex(/^\d+(\.\d{1,2})?$/, "Valid price required"),
  customerName: z.string().optional(),
  saleDate: z.coerce.date(),
});

const expenseSchema = z.object({
  category: z.string().min(1, "Category is required"),
  description: z.string().optional(),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, "Valid amount required"),
  expenseDate: z.coerce.date(),
});

const otherIncomeSchema = z.object({
  description: z.string().min(1, "Description is required"),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, "Valid amount required"),
  incomeDate: z.coerce.date(),
});

const costBreakdownSchema = z.object({
  productId: z.number().int().positive(),
  rawMaterialsCost: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  packagingCost: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  marketingCost: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  laborCost: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  otherCost: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  suggestedMarginPercent: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
});

// ============= ROUTERS =============
export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ============= PRODUCTS =============
  products: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getProductsByUserId(ctx.user.id);
    }),

    get: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .query(async ({ ctx, input }) => {
        return db.getProductById(input.id, ctx.user.id);
      }),

    create: protectedProcedure
      .input(productSchema)
      .mutation(async ({ ctx, input }) => {
        return db.createProduct({
          userId: ctx.user.id,
          ...input,
        });
      }),

    update: protectedProcedure
      .input(z.object({ id: z.number().int().positive(), ...productSchema.shape }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        return db.updateProduct(id, ctx.user.id, data);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        return db.deleteProduct(input.id, ctx.user.id);
      }),
  }),

  // ============= BATCHES =============
  batches: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getBatchesByUserId(ctx.user.id);
    }),

    get: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .query(async ({ ctx, input }) => {
        return db.getBatchById(input.id, ctx.user.id);
      }),

    getByProduct: protectedProcedure
      .input(z.object({ productId: z.number().int().positive() }))
      .query(async ({ ctx, input }) => {
        return db.getBatchesByProductId(input.productId, ctx.user.id);
      }),

    create: protectedProcedure
      .input(batchSchema)
      .mutation(async ({ ctx, input }) => {
        // Calculate cost per unit
        const costPerUnit = (parseFloat(input.totalCost) / input.batchSize).toFixed(2);
        
        return db.createBatch({
          userId: ctx.user.id,
          productId: input.productId,
          batchSize: input.batchSize,
          totalCost: input.totalCost,
          costPerUnit,
          productionDate: input.productionDate,
          expiryDate: input.expiryDate,
        });
      }),

    update: protectedProcedure
      .input(z.object({ id: z.number().int().positive(), ...batchSchema.shape }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        const costPerUnit = (parseFloat(data.totalCost) / data.batchSize).toFixed(2);
        
        return db.updateBatch(id, ctx.user.id, {
          ...data,
          costPerUnit,
        });
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        return db.deleteBatch(input.id, ctx.user.id);
      }),
  }),

  // ============= SALES =============
  sales: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getSalesByUserId(ctx.user.id);
    }),

    getByDateRange: protectedProcedure
      .input(z.object({ startDate: z.coerce.date(), endDate: z.coerce.date() }))
      .query(async ({ ctx, input }) => {
        return db.getSalesInDateRange(ctx.user.id, input.startDate, input.endDate);
      }),

    get: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .query(async ({ ctx, input }) => {
        return db.getSaleById(input.id, ctx.user.id);
      }),

    create: protectedProcedure
      .input(saleSchema)
      .mutation(async ({ ctx, input }) => {
        // Get batch cost if batchId provided
        let costPerUnit = "0";
        if (input.batchId) {
          const batch = await db.getBatchById(input.batchId, ctx.user.id);
          if (batch) {
            costPerUnit = batch.costPerUnit.toString();
          }
        }

        const totalPrice = (parseFloat(input.unitPrice) * input.quantity).toFixed(2);
        const totalCost = (parseFloat(costPerUnit) * input.quantity).toFixed(2);
        const profit = (parseFloat(totalPrice) - parseFloat(totalCost)).toFixed(2);

        // Update batch remaining stock if batchId provided
        if (input.batchId) {
          const batch = await db.getBatchById(input.batchId, ctx.user.id);
          if (batch) {
            const newRemainingStock = batch.remainingStock - input.quantity;
            await db.updateBatch(input.batchId, ctx.user.id, {
              remainingStock: newRemainingStock,
            });
          }
        }

        return db.createSale({
          userId: ctx.user.id,
          productId: input.productId,
          batchId: input.batchId,
          quantity: input.quantity,
          unitPrice: input.unitPrice,
          totalPrice,
          costPerUnit,
          profit,
          customerName: input.customerName,
          saleDate: input.saleDate,
        });
      }),

    update: protectedProcedure
      .input(z.object({ id: z.number().int().positive(), ...saleSchema.shape }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        
        // Get old sale to restore batch stock
        const oldSale = await db.getSaleById(id, ctx.user.id);
        if (oldSale && oldSale.batchId) {
          const batch = await db.getBatchById(oldSale.batchId, ctx.user.id);
          if (batch) {
            const restoredStock = batch.remainingStock + oldSale.quantity;
            await db.updateBatch(oldSale.batchId, ctx.user.id, {
              remainingStock: restoredStock,
            });
          }
        }

        // Get new batch cost if batchId provided
        let costPerUnit = "0";
        if (data.batchId) {
          const batch = await db.getBatchById(data.batchId, ctx.user.id);
          if (batch) {
            costPerUnit = batch.costPerUnit.toString();
          }
        }

        const totalPrice = (parseFloat(data.unitPrice) * data.quantity).toFixed(2);
        const totalCost = (parseFloat(costPerUnit) * data.quantity).toFixed(2);
        const profit = (parseFloat(totalPrice) - parseFloat(totalCost)).toFixed(2);

        // Update new batch remaining stock
        if (data.batchId) {
          const batch = await db.getBatchById(data.batchId, ctx.user.id);
          if (batch) {
            const newRemainingStock = batch.remainingStock - data.quantity;
            await db.updateBatch(data.batchId, ctx.user.id, {
              remainingStock: newRemainingStock,
            });
          }
        }

        return db.updateSale(id, ctx.user.id, {
          ...data,
          totalPrice,
          costPerUnit,
          profit,
        });
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        // Restore batch stock
        const sale = await db.getSaleById(input.id, ctx.user.id);
        if (sale && sale.batchId) {
          const batch = await db.getBatchById(sale.batchId, ctx.user.id);
          if (batch) {
            const restoredStock = batch.remainingStock + sale.quantity;
            await db.updateBatch(sale.batchId, ctx.user.id, {
              remainingStock: restoredStock,
            });
          }
        }

        return db.deleteSale(input.id, ctx.user.id);
      }),
  }),

  // ============= EXPENSES =============
  expenses: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getExpensesByUserId(ctx.user.id);
    }),

    getByDateRange: protectedProcedure
      .input(z.object({ startDate: z.coerce.date(), endDate: z.coerce.date() }))
      .query(async ({ ctx, input }) => {
        return db.getExpensesInDateRange(ctx.user.id, input.startDate, input.endDate);
      }),

    create: protectedProcedure
      .input(expenseSchema)
      .mutation(async ({ ctx, input }) => {
        return db.createExpense({
          userId: ctx.user.id,
          ...input,
        });
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        return db.deleteExpense(input.id, ctx.user.id);
      }),
  }),

  // ============= OTHER INCOME =============
  otherIncome: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getOtherIncomeByUserId(ctx.user.id);
    }),

    getByDateRange: protectedProcedure
      .input(z.object({ startDate: z.coerce.date(), endDate: z.coerce.date() }))
      .query(async ({ ctx, input }) => {
        return db.getOtherIncomeInDateRange(ctx.user.id, input.startDate, input.endDate);
      }),

    create: protectedProcedure
      .input(otherIncomeSchema)
      .mutation(async ({ ctx, input }) => {
        return db.createOtherIncome({
          userId: ctx.user.id,
          ...input,
        });
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        return db.deleteOtherIncome(input.id, ctx.user.id);
      }),
  }),

  // ============= COST BREAKDOWNS =============
  costBreakdowns: router({
    get: protectedProcedure
      .input(z.object({ productId: z.number().int().positive() }))
      .query(async ({ ctx, input }) => {
        return db.getCostBreakdownByProductId(input.productId, ctx.user.id);
      }),

    createOrUpdate: protectedProcedure
      .input(costBreakdownSchema)
      .mutation(async ({ ctx, input }) => {
        const rawMaterials = parseFloat(input.rawMaterialsCost || "0");
        const packaging = parseFloat(input.packagingCost || "0");
        const marketing = parseFloat(input.marketingCost || "0");
        const labor = parseFloat(input.laborCost || "0");
        const other = parseFloat(input.otherCost || "0");
        const totalCost = (rawMaterials + packaging + marketing + labor + other).toFixed(2);

        const marginPercent = parseFloat(input.suggestedMarginPercent || "30");
        const suggestedSellingPrice = (parseFloat(totalCost) * (1 + marginPercent / 100)).toFixed(2);

        return db.createOrUpdateCostBreakdown({
          userId: ctx.user.id,
          productId: input.productId,
          rawMaterialsCost: input.rawMaterialsCost,
          packagingCost: input.packagingCost,
          marketingCost: input.marketingCost,
          laborCost: input.laborCost,
          otherCost: input.otherCost,
          totalCost,
          suggestedMarginPercent: input.suggestedMarginPercent,
          suggestedSellingPrice,
        });
      }),
  }),

  // ============= ANALYTICS =============
  analytics: router({
    dashboard: protectedProcedure.query(async ({ ctx }) => {
      const totalSales = await db.getTotalSalesByUserId(ctx.user.id);
      const totalProfit = await db.getTotalProfitByUserId(ctx.user.id);
      const netProfit = await db.getNetProfitByUserId(ctx.user.id);
      const totalExpenses = await db.getTotalExpensesByUserId(ctx.user.id);
      const totalOtherIncome = await db.getTotalOtherIncomeByUserId(ctx.user.id);

      const sales = await db.getSalesByUserId(ctx.user.id);
      const batches = await db.getBatchesByUserId(ctx.user.id);
      const products = await db.getProductsByUserId(ctx.user.id);

      // Calculate inventory value
      let inventoryValue = "0";
      if (batches.length > 0) {
        const totalValue = batches.reduce((sum, batch) => {
          const batchValue = parseFloat(batch.costPerUnit.toString()) * batch.remainingStock;
          return sum + batchValue;
        }, 0);
        inventoryValue = totalValue.toFixed(2);
      }

      // Find best-selling products
      const productSales: Record<number, { name: string; quantity: number; revenue: number }> = {};
      sales.forEach(sale => {
        const product = products.find(p => p.id === sale.productId);
        if (product) {
          if (!productSales[sale.productId]) {
            productSales[sale.productId] = { name: product.name, quantity: 0, revenue: 0 };
          }
          productSales[sale.productId].quantity += sale.quantity;
          productSales[sale.productId].revenue += parseFloat(sale.totalPrice.toString());
        }
      });

      const bestSellers = Object.values(productSales)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      // Find low stock alerts
      const lowStockAlerts = batches.filter(b => b.remainingStock < 10);

      // Find expiring batches
      const now = new Date();
      const expiringBatches = batches.filter(b => {
        if (!b.expiryDate) return false;
        const daysUntilExpiry = (b.expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
      });

      return {
  totalSales,
  totalProfit,
  totalExpenses,
  netProfit,
  inventoryValue,
  bestSellers,
  lowStockAlerts,
  expiringBatches,
};
    }),

    salesOverTime: protectedProcedure
      .input(z.object({ days: z.number().int().positive().default(30) }))
      .query(async ({ ctx, input }) => {
        const endDate = new Date();
        const startDate = new Date(endDate.getTime() - input.days * 24 * 60 * 60 * 1000);
        
        const sales = await db.getSalesInDateRange(ctx.user.id, startDate, endDate);
        
        // Group by date
        const grouped: Record<string, number> = {};
        sales.forEach(sale => {
          const dateStr = sale.saleDate.toISOString().split('T')[0];
          if (!grouped[dateStr]) grouped[dateStr] = 0;
          grouped[dateStr] += parseFloat(sale.totalPrice.toString());
        });

        return Object.entries(grouped).map(([date, amount]) => ({ date, amount }));
      }),

    profitTrend: protectedProcedure
      .input(z.object({ days: z.number().int().positive().default(30) }))
      .query(async ({ ctx, input }) => {
        const endDate = new Date();
        const startDate = new Date(endDate.getTime() - input.days * 24 * 60 * 60 * 1000);
        
        const sales = await db.getSalesInDateRange(ctx.user.id, startDate, endDate);
        
        // Group by date
        const grouped: Record<string, number> = {};
        sales.forEach(sale => {
          const dateStr = sale.saleDate.toISOString().split('T')[0];
          if (!grouped[dateStr]) grouped[dateStr] = 0;
          grouped[dateStr] += parseFloat(sale.profit.toString());
        });

        return Object.entries(grouped).map(([date, profit]) => ({ date, profit }));
      }),

    profitPerProduct: protectedProcedure.query(async ({ ctx }) => {
      const sales = await db.getSalesByUserId(ctx.user.id);
      const products = await db.getProductsByUserId(ctx.user.id);

      const productProfits: Record<number, { name: string; profit: number; sales: number }> = {};
      sales.forEach(sale => {
        const product = products.find(p => p.id === sale.productId);
        if (product) {
          if (!productProfits[sale.productId]) {
            productProfits[sale.productId] = { name: product.name, profit: 0, sales: 0 };
          }
          productProfits[sale.productId].profit += parseFloat(sale.profit.toString());
          productProfits[sale.productId].sales += 1;
        }
      });

      return Object.entries(productProfits).map(([productId, data]) => ({
        productId: parseInt(productId),
        ...data,
      }));
    }),

    profitPerBatch: protectedProcedure.query(async ({ ctx }) => {
      const sales = await db.getSalesByUserId(ctx.user.id);
      const batches = await db.getBatchesByUserId(ctx.user.id);

      const batchProfits: Record<number, { productId: number; totalProfit: number; salesCount: number; remainingStock: number }> = {};
      sales.forEach(sale => {
        if (sale.batchId) {
          if (!batchProfits[sale.batchId]) {
            const batch = batches.find(b => b.id === sale.batchId);
            batchProfits[sale.batchId] = {
              productId: batch?.productId || 0,
              totalProfit: 0,
              salesCount: 0,
              remainingStock: batch?.remainingStock || 0,
            };
          }
          batchProfits[sale.batchId].totalProfit += parseFloat(sale.profit.toString());
          batchProfits[sale.batchId].salesCount += 1;
        }
      });

      return Object.entries(batchProfits).map(([batchId, data]) => ({
        batchId: parseInt(batchId),
        ...data,
      }));
    }),

    monthlyFinancial: protectedProcedure
      .input(z.object({ month: z.number().int().min(1).max(12), year: z.number().int() }))
      .query(async ({ ctx, input }) => {
        const startDate = new Date(input.year, input.month - 1, 1);
        const endDate = new Date(input.year, input.month, 0);

        const sales = await db.getSalesInDateRange(ctx.user.id, startDate, endDate);
        const expenses = await db.getExpensesInDateRange(ctx.user.id, startDate, endDate);
        const otherIncomeList = await db.getOtherIncomeInDateRange(ctx.user.id, startDate, endDate);

        const totalRevenue = sales.reduce((sum, s) => sum + parseFloat(s.totalPrice.toString()), 0);
        const totalExpenses = expenses.reduce((sum, e) => sum + parseFloat(e.amount.toString()), 0);
        const totalOtherIncome = otherIncomeList.reduce((sum, i) => sum + parseFloat(i.amount.toString()), 0);
        const totalProfit = sales.reduce((sum, s) => sum + parseFloat(s.profit.toString()), 0);
        const netProfit = totalProfit + totalOtherIncome - totalExpenses;

        return {
          totalRevenue: totalRevenue.toFixed(2),
          totalExpenses: totalExpenses.toFixed(2),
          totalOtherIncome: totalOtherIncome.toFixed(2),
          totalProfit: totalProfit.toFixed(2),
          netProfit: netProfit.toFixed(2),
        };
      }),
   }),

  // ============= REPORTING & ANALYTICS =============
  reports: router({
    monthlyReport: protectedProcedure
      .input(z.object({ year: z.number().int(), month: z.number().int().min(1).max(12) }))
      .query(async ({ ctx, input }) => {
        return db.getMonthlyReport(ctx.user.id, input.year, input.month);
      }),

    yearlyReport: protectedProcedure
      .input(z.object({ year: z.number().int() }))
      .query(async ({ ctx, input }) => {
        return db.getYearlyReport(ctx.user.id, input.year);
      }),

    productProfitability: protectedProcedure.query(async ({ ctx }) => {
      return db.getProductProfitability(ctx.user.id);
    }),

    expenseBreakdown: protectedProcedure
      .input(z.object({ year: z.number().int().optional(), month: z.number().int().min(1).max(12).optional() }))
      .query(async ({ ctx, input }) => {
        return db.getExpenseBreakdown(ctx.user.id, input.year, input.month);
      }),
  }),
});
export type AppRouter = typeof appRouter;

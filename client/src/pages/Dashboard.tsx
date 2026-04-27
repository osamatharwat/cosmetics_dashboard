import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, TrendingUp, DollarSign, Package, ShoppingCart, ArrowUp, ArrowDown, Info } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useState } from "react";

export default function Dashboard() {
  const { data: analytics, isLoading } = trpc.analytics.dashboard.useQuery();
  const { data: salesData } = trpc.analytics.salesOverTime.useQuery({ days: 30 });
  const { data: profitData } = trpc.analytics.profitTrend.useQuery({ days: 30 });
  const [showCalculation, setShowCalculation] = useState(false);

  if (isLoading) {
    return <div className="space-y-6"><Skeleton className="h-96 w-full" /></div>;
  }

  const totalSales = parseFloat(analytics?.totalSales || "0");
  const grossProfit = parseFloat(analytics?.totalProfit || "0"); // Gross Profit = Revenue - COGS
  const totalExpenses = parseFloat(analytics?.totalExpenses || "0");
  const totalOtherIncome = parseFloat(analytics?.totalOtherIncome || "0");
  const netProfit = parseFloat(analytics?.netProfit || "0"); // Net Profit = Gross Profit - Expenses + Other Income
  const inventoryValue = parseFloat(analytics?.inventoryValue || "0");

  // Calculate profit margin based on Net Profit
  const profitMargin = totalSales > 0 ? ((netProfit / totalSales) * 100).toFixed(1) : "0";
  const isProfit = netProfit >= 0;

  const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b'];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <button
          onClick={() => setShowCalculation(!showCalculation)}
          className="flex items-center gap-2 px-3 py-1 text-sm bg-muted rounded-md hover:bg-muted/80 transition"
        >
          <Info className="h-4 w-4" />
          {showCalculation ? "Hide" : "Show"} Calculation
        </button>
      </div>

      {/* Calculation Breakdown */}
      {showCalculation && (
        <Card className="border-blue-500/50 bg-blue-950/20">
          <CardHeader>
            <CardTitle className="text-sm">Net Profit Calculation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Gross Profit (Revenue - COGS):</span>
              <span className="font-mono">${grossProfit.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>− Total Expenses:</span>
              <span className="font-mono">-${totalExpenses.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>+ Other Income:</span>
              <span className="font-mono">+${totalOtherIncome.toFixed(2)}</span>
            </div>
            <div className="border-t pt-2 flex justify-between font-bold">
              <span>= Net Profit:</span>
              <span className={`font-mono ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
                ${netProfit.toFixed(2)}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sales */}
        <Card className="hover:shadow-lg transition cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <ShoppingCart className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalSales.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">Revenue from all sales</p>
          </CardContent>
        </Card>

        {/* Net Profit */}
        <Card className={`hover:shadow-lg transition cursor-pointer border-2 ${isProfit ? 'border-green-500/50' : 'border-red-500/50'}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            <div className={isProfit ? 'text-green-500' : 'text-red-500'}>
              {isProfit ? <TrendingUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
              ${parseFloat(analytics?.netProfit || "0").toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {profitMargin}% margin
            </p>
          </CardContent>
        </Card>

        {/* Total Expenses */}
        <Card className="hover:shadow-lg transition cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <DollarSign className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalExpenses.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">All business expenses</p>
          </CardContent>
        </Card>

        {/* Inventory Value */}
        <Card className="hover:shadow-lg transition cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
            <Package className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${inventoryValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">Current stock value</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Sales Over Time */}
        {salesData && salesData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Sales Over Time (Last 30 Days)</CardTitle>
              <CardDescription>Daily sales revenue</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => `$${typeof value === 'number' ? value.toFixed(2) : value}`} />
                  <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Profit Trend */}
        {profitData && profitData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Profit Trend (Last 30 Days)</CardTitle>
              <CardDescription>Daily net profit</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={profitData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => `$${typeof value === 'number' ? value.toFixed(2) : value}`} />
                  <Bar dataKey="profit" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Best Sellers */}
      {analytics?.bestSellers && analytics.bestSellers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Best-Selling Products</CardTitle>
            <CardDescription>By revenue</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.bestSellers.map((product, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-muted-foreground">{product.quantity} units sold</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">${product.revenue.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alerts */}
      <div className="space-y-3">
        {/* Low Stock Alerts */}
        {analytics?.lowStockAlerts && analytics.lowStockAlerts.length > 0 && (
          <Alert className="border-yellow-500/50 bg-yellow-950/20">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            <AlertDescription>
              <strong>Low Stock Alert:</strong> {analytics.lowStockAlerts.length} batch(es) have less than 10 units remaining
              <ul className="mt-2 ml-4 text-sm space-y-1">
                {analytics.lowStockAlerts.map((batch, idx) => (
                  <li key={idx}>• Batch {batch.id}: {batch.remainingStock} units left</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Expiring Batches */}
        {analytics?.expiringBatches && analytics.expiringBatches.length > 0 && (
          <Alert className="border-red-500/50 bg-red-950/20">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <AlertDescription>
              <strong>Expiring Soon:</strong> {analytics.expiringBatches.length} batch(es) expiring within 30 days
              <ul className="mt-2 ml-4 text-sm space-y-1">
                {analytics.expiringBatches.map((batch, idx) => (
                  <li key={idx}>• Batch {batch.id}: Expires {batch.expiryDate ? new Date(batch.expiryDate).toLocaleDateString() : 'N/A'}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}

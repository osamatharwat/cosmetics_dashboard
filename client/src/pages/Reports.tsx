import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Download, TrendingUp, TrendingDown } from "lucide-react";

export default function Reports() {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [selectedYear, setSelectedYear] = useState(currentYear.toString());
  const [selectedMonth, setSelectedMonth] = useState(currentMonth.toString());

  const { data: monthlyReport, isLoading: monthlyLoading } = trpc.reports.monthlyReport.useQuery({
    year: parseInt(selectedYear),
    month: parseInt(selectedMonth),
  });

  const { data: yearlyReport, isLoading: yearlyLoading } = trpc.reports.yearlyReport.useQuery({
    year: parseInt(selectedYear),
  });

  const { data: productProfitability } = trpc.reports.productProfitability.useQuery();
  const { data: expenseBreakdown } = trpc.reports.expenseBreakdown.useQuery({
    year: parseInt(selectedYear),
  });

  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
  const months = [
    { value: "1", label: "January" },
    { value: "2", label: "February" },
    { value: "3", label: "March" },
    { value: "4", label: "April" },
    { value: "5", label: "May" },
    { value: "6", label: "June" },
    { value: "7", label: "July" },
    { value: "8", label: "August" },
    { value: "9", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ];

  const downloadCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) return;
    const csv = [
      Object.keys(data[0]).join(","),
      ...data.map((row) => Object.values(row).map((v) => JSON.stringify(v)).join(",")),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const monthlyChartData = yearlyReport?.monthlyBreakdown.map((m) => ({
    month: m.month.slice(0, 3),
    revenue: m.totalSales,
    profit: m.netProfit,
    expenses: m.totalExpenses,
  })) || [];

  const pieColors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Business Reports & Analytics</h1>
        <p className="text-muted-foreground mt-1">Track your business performance with detailed monthly and yearly reports</p>
      </div>

      <Tabs defaultValue="monthly" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
          <TabsTrigger value="yearly">Yearly</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
        </TabsList>

        {/* MONTHLY REPORT */}
        <TabsContent value="monthly" className="space-y-6">
          <div className="flex gap-4">
            <div className="flex-1 max-w-xs">
              <label className="text-sm font-medium">Select Month</label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 max-w-xs">
              <label className="text-sm font-medium">Select Year</label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((y) => (
                    <SelectItem key={y} value={y.toString()}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {monthlyLoading ? (
            <Card><CardContent className="pt-6">Loading...</CardContent></Card>
          ) : monthlyReport ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Sales</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${monthlyReport.totalSales.toFixed(2)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Expenses</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-500">${monthlyReport.totalExpenses.toFixed(2)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Other Income</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-500">${monthlyReport.otherIncome.toFixed(2)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Net Profit</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${monthlyReport.netProfit >= 0 ? "text-green-500" : "text-red-500"}`}>
                      ${monthlyReport.netProfit.toFixed(2)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{monthlyReport.profitMargin.toFixed(1)}% margin</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Monthly Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Sales Transactions:</span>
                      <span className="font-medium">{monthlyReport.salesCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Expense Entries:</span>
                      <span className="font-medium">{monthlyReport.expensesCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Profit from Sales:</span>
                      <span className="font-medium text-green-500">${monthlyReport.totalProfit.toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : null}
        </TabsContent>

        {/* YEARLY REPORT */}
        <TabsContent value="yearly" className="space-y-6">
          <div className="flex-1 max-w-xs">
            <label className="text-sm font-medium">Select Year</label>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y} value={y.toString()}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {yearlyLoading ? (
            <Card><CardContent className="pt-6">Loading...</CardContent></Card>
          ) : yearlyReport ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Annual Revenue</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${yearlyReport.totalSales.toFixed(2)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Expenses</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-500">${yearlyReport.totalExpenses.toFixed(2)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Annual Profit</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${yearlyReport.netProfit >= 0 ? "text-green-500" : "text-red-500"}`}>
                      ${yearlyReport.netProfit.toFixed(2)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{yearlyReport.profitMargin.toFixed(1)}% margin</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Other Income</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-500">${yearlyReport.otherIncome.toFixed(2)}</div>
                  </CardContent>
                </Card>
              </div>

              {yearlyReport.bestMonth && yearlyReport.worstMonth && (
                <div className="grid grid-cols-2 gap-4">
                  <Card className="border-green-500/50 bg-green-950/20">
                    <CardHeader>
                      <CardTitle className="text-green-400 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        Best Month
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="font-semibold">{yearlyReport.bestMonth.month}</p>
                      <p className="text-sm text-muted-foreground">Profit: ${yearlyReport.bestMonth.netProfit.toFixed(2)}</p>
                    </CardContent>
                  </Card>
                  <Card className="border-red-500/50 bg-red-950/20">
                    <CardHeader>
                      <CardTitle className="text-red-400 flex items-center gap-2">
                        <TrendingDown className="w-4 h-4" />
                        Worst Month
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="font-semibold">{yearlyReport.worstMonth.month}</p>
                      <p className="text-sm text-muted-foreground">Profit: ${yearlyReport.worstMonth.netProfit.toFixed(2)}</p>
                    </CardContent>
                  </Card>
                </div>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Monthly Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={monthlyChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => `$${typeof value === "number" ? value.toFixed(2) : value}`} />
                      <Legend />
                      <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} name="Revenue" />
                      <Line type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2} name="Net Profit" />
                      <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} name="Expenses" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Monthly Summary Table</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Month</TableHead>
                          <TableHead>Revenue</TableHead>
                          <TableHead>Expenses</TableHead>
                          <TableHead>Profit</TableHead>
                          <TableHead>Margin %</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {yearlyReport.monthlyBreakdown.map((m) => (
                          <TableRow key={m.month}>
                            <TableCell className="font-medium">{m.month}</TableCell>
                            <TableCell>${m.totalSales.toFixed(2)}</TableCell>
                            <TableCell>${m.totalExpenses.toFixed(2)}</TableCell>
                            <TableCell className={m.netProfit >= 0 ? "text-green-500 font-medium" : "text-red-500 font-medium"}>
                              ${m.netProfit.toFixed(2)}
                            </TableCell>
                            <TableCell>{m.profitMargin.toFixed(1)}%</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : null}
        </TabsContent>

        {/* PRODUCT ANALYSIS */}
        <TabsContent value="products" className="space-y-6">
          {productProfitability && productProfitability.length > 0 ? (
            <>
              <div className="flex justify-end">
                <Button
                  onClick={() =>
                    downloadCSV(
                      productProfitability.map((p) => ({
                        Product: p.productName,
                        SKU: p.sku,
                        "Production Cost": p.productionCost.toFixed(2),
                        "Selling Price": p.sellingPrice.toFixed(2),
                        "Profit/Unit": p.profitPerUnit.toFixed(2),
                        "Units Sold": p.totalQuantitySold,
                        "Total Revenue": p.totalRevenue.toFixed(2),
                        "Total Profit": p.totalProfit.toFixed(2),
                        "Margin %": p.profitMargin.toFixed(1),
                      })),
                      "product-profitability.csv"
                    )
                  }
                  variant="outline"
                  size="sm"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Product Profitability Analysis</CardTitle>
                  <CardDescription>Ranked by total profit contribution</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead>SKU</TableHead>
                          <TableHead>Cost</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Profit/Unit</TableHead>
                          <TableHead>Units Sold</TableHead>
                          <TableHead>Total Profit</TableHead>
                          <TableHead>Margin %</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {productProfitability.map((p) => (
                          <TableRow key={p.productId}>
                            <TableCell className="font-medium">{p.productName}</TableCell>
                            <TableCell>{p.sku}</TableCell>
                            <TableCell>${p.productionCost.toFixed(2)}</TableCell>
                            <TableCell>${p.sellingPrice.toFixed(2)}</TableCell>
                            <TableCell className="text-green-500">${p.profitPerUnit.toFixed(2)}</TableCell>
                            <TableCell>{p.totalQuantitySold}</TableCell>
                            <TableCell className={p.totalProfit >= 0 ? "text-green-500 font-medium" : "text-red-500 font-medium"}>
                              ${p.totalProfit.toFixed(2)}
                            </TableCell>
                            <TableCell>{p.profitMargin.toFixed(1)}%</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top Products by Profit</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={productProfitability.slice(0, 10)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="productName" angle={-45} textAnchor="end" height={100} />
                      <YAxis />
                      <Tooltip formatter={(value) => `$${typeof value === "number" ? value.toFixed(2) : value}`} />
                      <Bar dataKey="totalProfit" fill="#10b981" name="Total Profit" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">No product data available yet</CardContent>
            </Card>
          )}
        </TabsContent>

        {/* EXPENSE BREAKDOWN */}
        <TabsContent value="expenses" className="space-y-6">
          {expenseBreakdown && expenseBreakdown.length > 0 ? (
            <>
              <div className="flex justify-end">
                <Button
                  onClick={() =>
                    downloadCSV(
                      expenseBreakdown.map((e) => ({
                        Category: e.category,
                        Amount: e.amount.toFixed(2),
                      })),
                      "expense-breakdown.csv"
                    )
                  }
                  variant="outline"
                  size="sm"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Expense Breakdown for {selectedYear}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={expenseBreakdown} dataKey="amount" nameKey="category" cx="50%" cy="50%" outerRadius={100} label>
                        {expenseBreakdown.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `$${typeof value === "number" ? value.toFixed(2) : value}`} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Expense Categories</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {expenseBreakdown.map((e, i) => (
                      <div key={i} className="flex justify-between items-center p-2 border rounded">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded" style={{ backgroundColor: pieColors[i % pieColors.length] }} />
                          <span>{e.category}</span>
                        </div>
                        <span className="font-medium">${e.amount.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">No expense data available yet</CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

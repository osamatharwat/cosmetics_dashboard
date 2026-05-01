import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Download, TrendingUp, TrendingDown, DollarSign, Percent } from "lucide-react";

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
      ...data.map(row => Object.values(row).join(",")),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
  };

  const formatCurrency = (value: any) => {
    const num = parseFloat(value || 0);
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(num);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Financial Reports</h1>
        <p className="text-muted-foreground mt-2">Professional accounting reports and analytics</p>
      </div>

      <Tabs defaultValue="income-statement" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="income-statement">Income Statement</TabsTrigger>
          <TabsTrigger value="monthly">Monthly Analysis</TabsTrigger>
          <TabsTrigger value="products">Product Analysis</TabsTrigger>
          <TabsTrigger value="expenses">Expense Breakdown</TabsTrigger>
        </TabsList>

        {/* INCOME STATEMENT TAB */}
        <TabsContent value="income-statement" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Income Statement - {selectedYear}</CardTitle>
              <CardDescription>Professional accounting report showing revenue, expenses, and net profit</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {yearlyReport ? (
                <div className="space-y-4">
                  {/* Revenue Section */}
                  <div className="border-b pb-4">
                    <h3 className="font-semibold text-lg mb-3">Revenue</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Total Sales Revenue</span>
                        <span className="font-semibold">{formatCurrency(yearlyReport.totalSales)}</span>
                      </div>
                    </div>
                  </div>

                  {/* COGS Section */}
                  <div className="border-b pb-4">
                    <h3 className="font-semibold text-lg mb-3">Cost of Goods Sold</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Production Costs</span>
                        <span className="font-semibold">{formatCurrency((parseFloat(yearlyReport.totalSales.toString()) - parseFloat(yearlyReport.totalProfit.toString())))}</span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t">
                        <span className="font-semibold">Gross Profit</span>
                        <span className="font-bold text-green-600">{formatCurrency(yearlyReport.totalProfit)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Gross Margin</span>
                        <span className="text-sm">{(yearlyReport.profitMargin).toFixed(2)}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Operating Expenses Section */}
                  <div className="border-b pb-4">
                    <h3 className="font-semibold text-lg mb-3">Operating Expenses</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Total Expenses</span>
                        <span className="font-semibold">{formatCurrency(yearlyReport.totalExpenses)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Other Income Section */}
                  <div className="border-b pb-4">
                    <h3 className="font-semibold text-lg mb-3">Other Income</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Other Income</span>
                        <span className="font-semibold text-green-600">{formatCurrency(yearlyReport.otherIncome)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Net Profit Section */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-lg">Net Profit</span>
                      <span className={`font-bold text-xl ${parseFloat(yearlyReport.netProfit.toString()) >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {formatCurrency(yearlyReport.netProfit)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-sm text-muted-foreground">Net Profit Margin</span>
                      <span className={`text-sm font-semibold ${parseFloat(yearlyReport.profitMargin.toString()) >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {(yearlyReport.profitMargin).toFixed(2)}%
                      </span>
                    </div>
                  </div>

                  <Button onClick={() => downloadCSV([yearlyReport], `income-statement-${selectedYear}.csv`)}>
                    <Download className="w-4 h-4 mr-2" />
                    Download Report
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">No data available</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* MONTHLY ANALYSIS TAB */}
        <TabsContent value="monthly" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Financial Analysis</CardTitle>
              <CardDescription>Detailed breakdown of monthly revenue, expenses, and profit</CardDescription>
              <div className="flex gap-4 mt-4">
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map(year => (
                      <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map(month => (
                      <SelectItem key={month.value} value={month.value}>{month.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {monthlyReport ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground mb-1">Monthly Revenue</p>
                          <p className="text-2xl font-bold text-blue-600">{formatCurrency(monthlyReport.totalSales)}</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground mb-1">Gross Profit</p>
                          <p className="text-2xl font-bold text-green-600">{formatCurrency(monthlyReport.totalProfit)}</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground mb-1">Expenses</p>
                          <p className="text-2xl font-bold text-orange-600">{formatCurrency(monthlyReport.totalExpenses)}</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground mb-1">Net Profit</p>
                          <p className={`text-2xl font-bold ${parseFloat(monthlyReport.netProfit.toString()) >= 0 ? "text-green-600" : "text-red-600"}`}>
                            {formatCurrency(monthlyReport.netProfit)}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="pt-4">
                    <h3 className="font-semibold mb-4">Monthly Trend</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={[monthlyReport]}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={(value) => formatCurrency(value)} />
                        <Legend />
                        <Line type="monotone" dataKey="totalSales" stroke="#3b82f6" name="Revenue" />
                        <Line type="monotone" dataKey="totalProfit" stroke="#10b981" name="Gross Profit" />
                        <Line type="monotone" dataKey="totalExpenses" stroke="#f97316" name="Expenses" />
                        <Line type="monotone" dataKey="netProfit" stroke="#8b5cf6" name="Net Profit" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">No data available for selected month</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* PRODUCT ANALYSIS TAB */}
        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Product Profitability Analysis</CardTitle>
              <CardDescription>Detailed breakdown of profit by product</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {productProfitability && productProfitability.length > 0 ? (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead>SKU</TableHead>
                          <TableHead className="text-right">Sales Count</TableHead>
                          <TableHead className="text-right">Units Sold</TableHead>
                          <TableHead className="text-right">Revenue</TableHead>
                          <TableHead className="text-right">Profit</TableHead>
                          <TableHead className="text-right">Margin %</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {productProfitability.map((product: any) => (
                          <TableRow key={product.id}>
                            <TableCell className="font-medium">{product.name}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{product.sku}</TableCell>
                            <TableCell className="text-right">{product.salesCount || 0}</TableCell>
                            <TableCell className="text-right">{product.totalQuantitySold || 0}</TableCell>
                            <TableCell className="text-right">{formatCurrency(product.totalRevenue || 0)}</TableCell>
                            <TableCell className={`text-right font-semibold ${parseFloat(product.totalProfit || 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
                              {formatCurrency(product.totalProfit || 0)}
                            </TableCell>
                            <TableCell className={`text-right font-semibold ${parseFloat(product.profitMarginPercent || 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
                              {product.profitMarginPercent || 0}%
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <Button onClick={() => downloadCSV(productProfitability, "product-profitability.csv")}>
                    <Download className="w-4 h-4 mr-2" />
                    Download Report
                  </Button>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">No product data available</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* EXPENSE BREAKDOWN TAB */}
        <TabsContent value="expenses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Expense Breakdown Analysis</CardTitle>
              <CardDescription>Where your money is being spent</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {expenseBreakdown && expenseBreakdown.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={expenseBreakdown}
                        dataKey="totalAmount"
                        nameKey="category"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label
                      >
                        {expenseBreakdown.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={["#3b82f6", "#10b981", "#f97316", "#8b5cf6", "#ec4899", "#14b8a6", "#f59e0b", "#6366f1", "#ef4444"][index % 9]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>

                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Category</TableHead>
                          <TableHead className="text-right">Count</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead className="text-right">% of Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {expenseBreakdown.map((expense: any) => (
                          <TableRow key={expense.category}>
                            <TableCell className="font-medium">{expense.category}</TableCell>
                            <TableCell className="text-right">{expense.count}</TableCell>
                            <TableCell className="text-right">{formatCurrency(expense.totalAmount)}</TableCell>
                            <TableCell className="text-right">{expense.percentageOfTotal}%</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <Button onClick={() => downloadCSV(expenseBreakdown, "expense-breakdown.csv")}>
                    <Download className="w-4 h-4 mr-2" />
                    Download Report
                  </Button>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">No expense data available</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

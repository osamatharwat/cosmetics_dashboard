import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, TrendingUp, Package, DollarSign } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Reports() {
  const { data: analytics, isLoading } = trpc.analytics.dashboard.useQuery();
  const { data: sales } = trpc.sales.list.useQuery();
  const { data: batches } = trpc.batches.list.useQuery();
  const { data: products } = trpc.products.list.useQuery();

  const exportToCSV = (filename: string, data: any[]) => {
    if (!data || data.length === 0) return;
    
    const headers = Object.keys(data[0]);
    const csv = [
      headers.join(","),
      ...data.map(row => headers.map(h => JSON.stringify(row[h])).join(","))
    ].join("\n");
    
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const calculateProfitByProduct = () => {
    const profitMap: Record<number, { name: string; revenue: number; cost: number; profit: number }> = {};
    
    products?.forEach(p => {
      profitMap[p.id] = { name: p.name, revenue: 0, cost: 0, profit: 0 };
    });
    
    sales?.forEach(s => {
      if (profitMap[s.productId]) {
        profitMap[s.productId].revenue += parseFloat(s.totalPrice.toString());
        profitMap[s.productId].cost += parseFloat(s.profit.toString()) ? parseFloat(s.totalPrice.toString()) - parseFloat(s.profit.toString()) : 0;
        profitMap[s.productId].profit += parseFloat(s.profit.toString());
      }
    });
    
    return Object.values(profitMap).filter(p => p.revenue > 0);
  };

  const calculateProfitByBatch = () => {
    const profitMap: Record<number, { batchId: number; productName: string; totalCost: number; revenue: number; profit: number }> = {};
    
    batches?.forEach(b => {
      profitMap[b.id] = {
        batchId: b.id,
        productName: products?.find(p => p.id === b.productId)?.name || "Unknown",
        totalCost: parseFloat(b.totalCost.toString()),
        revenue: 0,
        profit: 0,
      };
    });
    
    sales?.forEach(s => {
      if (s.batchId && profitMap[s.batchId]) {
        profitMap[s.batchId].revenue += parseFloat(s.totalPrice.toString());
        profitMap[s.batchId].profit += parseFloat(s.profit.toString());
      }
    });
    
    return Object.values(profitMap).filter(p => p.revenue > 0);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const profitByProduct = calculateProfitByProduct();
  const profitByBatch = calculateProfitByBatch();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reports & Analytics</h1>
        <p className="text-muted-foreground mt-1">View detailed business analytics and export data</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${parseFloat(analytics?.totalSales || "0").toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${parseFloat(analytics?.totalProfit || "0").toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
            <Package className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics?.totalSales && parseFloat(analytics.totalSales.toString()) > 0
                ? ((parseFloat(analytics.totalProfit.toString()) / parseFloat(analytics.totalSales.toString())) * 100).toFixed(1)
                : "0"}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Reports */}
      <Tabs defaultValue="product" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="product">Profit by Product</TabsTrigger>
          <TabsTrigger value="batch">Profit by Batch</TabsTrigger>
        </TabsList>

        <TabsContent value="product" className="space-y-4">
          <div className="flex justify-end">
            <Button
              onClick={() => exportToCSV("profit-by-product.csv", profitByProduct.map(p => ({
                Product: p.name,
                Revenue: p.revenue.toFixed(2),
                Cost: p.cost.toFixed(2),
                Profit: p.profit.toFixed(2),
                "Profit Margin %": p.revenue > 0 ? ((p.profit / p.revenue) * 100).toFixed(2) : "0",
              })))}
              variant="outline"
              size="sm"
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Profit Analysis by Product</CardTitle>
              <CardDescription>Revenue, costs, and profit for each product</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Revenue</TableHead>
                      <TableHead>Cost</TableHead>
                      <TableHead>Profit</TableHead>
                      <TableHead>Margin %</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {profitByProduct.length > 0 ? (
                      profitByProduct.map((p, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">{p.name}</TableCell>
                          <TableCell>${p.revenue.toFixed(2)}</TableCell>
                          <TableCell>${p.cost.toFixed(2)}</TableCell>
                          <TableCell className="font-semibold text-green-600">${p.profit.toFixed(2)}</TableCell>
                          <TableCell>{p.revenue > 0 ? ((p.profit / p.revenue) * 100).toFixed(1) : "0"}%</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-4">
                          No sales data available
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="batch" className="space-y-4">
          <div className="flex justify-end">
            <Button
              onClick={() => exportToCSV("profit-by-batch.csv", profitByBatch.map(b => ({
                "Batch ID": b.batchId,
                Product: b.productName,
                "Total Cost": b.totalCost.toFixed(2),
                Revenue: b.revenue.toFixed(2),
                Profit: b.profit.toFixed(2),
                "Profit Margin %": b.revenue > 0 ? ((b.profit / b.revenue) * 100).toFixed(2) : "0",
              })))}
              variant="outline"
              size="sm"
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Profit Analysis by Batch</CardTitle>
              <CardDescription>Performance metrics for each production batch</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Batch ID</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Total Cost</TableHead>
                      <TableHead>Revenue</TableHead>
                      <TableHead>Profit</TableHead>
                      <TableHead>Margin %</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {profitByBatch.length > 0 ? (
                      profitByBatch.map((b) => (
                        <TableRow key={b.batchId}>
                          <TableCell className="font-medium">#{b.batchId}</TableCell>
                          <TableCell>{b.productName}</TableCell>
                          <TableCell>${b.totalCost.toFixed(2)}</TableCell>
                          <TableCell>${b.revenue.toFixed(2)}</TableCell>
                          <TableCell className="font-semibold text-green-600">${b.profit.toFixed(2)}</TableCell>
                          <TableCell>{b.revenue > 0 ? ((b.profit / b.revenue) * 100).toFixed(1) : "0"}%</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-4">
                          No batch data available
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

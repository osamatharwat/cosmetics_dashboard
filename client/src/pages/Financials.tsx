import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertCircle, Plus, Trash2, Edit2, TrendingUp, TrendingDown } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

const EXPENSE_CATEGORIES = [
  "Materials",
  "Packaging",
  "Marketing",
  "Utilities",
  "Rent",
  "Salaries",
  "Transportation",
  "Equipment",
  "Other",
];

export default function Financials() {
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [incomeOpen, setIncomeOpen] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<number | null>(null);
  const [editingIncomeId, setEditingIncomeId] = useState<number | null>(null);
  
  const [expenseData, setExpenseData] = useState({
    category: "",
    amount: "",
    description: "",
    date: new Date().toISOString().split('T')[0],
  });

  const [incomeData, setIncomeData] = useState({
    source: "",
    amount: "",
    description: "",
    date: new Date().toISOString().split('T')[0],
  });

  const { data: expenses, isLoading: expensesLoading, refetch: refetchExpenses } = trpc.expenses.list.useQuery();
  const { data: otherIncome, isLoading: incomeLoading, refetch: refetchIncome } = trpc.otherIncome.list.useQuery();
  const { data: analytics } = trpc.analytics.dashboard.useQuery();

  const createExpense = trpc.expenses.create.useMutation();
  const deleteExpense = trpc.expenses.delete.useMutation();
  const createIncome = trpc.otherIncome.create.useMutation();
  const deleteIncome = trpc.otherIncome.delete.useMutation();

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!expenseData.category || !expenseData.amount) {
      toast.error("Please fill in required fields");
      return;
    }

    try {
      if (editingExpenseId) {
        await deleteExpense.mutateAsync({ id: editingExpenseId });
        await createExpense.mutateAsync({
          category: expenseData.category,
          amount: expenseData.amount,
          description: expenseData.description,
          expenseDate: new Date(expenseData.date),
        });
        toast.success("Expense updated");
      } else {
        await createExpense.mutateAsync({
          category: expenseData.category,
          amount: expenseData.amount,
          description: expenseData.description,
          expenseDate: new Date(expenseData.date),
        });
        toast.success("Expense recorded");
      }
      
      setExpenseData({ category: "", amount: "", description: "", date: new Date().toISOString().split('T')[0] });
      setEditingExpenseId(null);
      setExpenseOpen(false);
      refetchExpenses();
    } catch (error) {
      toast.error("Failed to save expense");
    }
  };

  const handleIncomeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!incomeData.source || !incomeData.amount) {
      toast.error("Please fill in required fields");
      return;
    }

    try {
      if (editingIncomeId) {
        await deleteIncome.mutateAsync({ id: editingIncomeId });
        await createIncome.mutateAsync({
          amount: incomeData.amount,
          description: incomeData.description,
          incomeDate: new Date(incomeData.date),
        });
        toast.success("Income updated");
      } else {
        await createIncome.mutateAsync({
          amount: incomeData.amount,
          description: incomeData.description,
          incomeDate: new Date(incomeData.date),
        });
        toast.success("Income recorded");
      }
      
      setIncomeData({ source: "", amount: "", description: "", date: new Date().toISOString().split('T')[0] });
      setEditingIncomeId(null);
      setIncomeOpen(false);
      refetchIncome();
    } catch (error) {
      toast.error("Failed to save income");
    }
  };

  const handleDeleteExpense = async (id: number) => {
    if (!confirm("Delete this expense?")) return;
    try {
      await deleteExpense.mutateAsync({ id });
      toast.success("Expense deleted");
      refetchExpenses();
    } catch (error) {
      toast.error("Failed to delete expense");
    }
  };

  const handleDeleteIncome = async (id: number) => {
    if (!confirm("Delete this income?")) return;
    try {
      await deleteIncome.mutateAsync({ id });
      toast.success("Income deleted");
      refetchIncome();
    } catch (error) {
      toast.error("Failed to delete income");
    }
  };

  const totalExpenses = expenses?.reduce((sum, e) => sum + parseFloat(e.amount.toString()), 0) || 0;
  const totalOtherIncome = otherIncome?.reduce((sum, i) => sum + parseFloat(i.amount.toString()), 0) || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Financials & Liquidity</h1>
        <p className="text-muted-foreground mt-1">Track expenses, income, and cash flow</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalExpenses.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium">Other Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalOtherIncome.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${parseFloat(analytics?.totalProfit || "0").toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="expenses" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="income">Other Income</TabsTrigger>
        </TabsList>

        <TabsContent value="expenses" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={expenseOpen} onOpenChange={setExpenseOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingExpenseId(null);
                  setExpenseData({ category: "", amount: "", description: "", date: new Date().toISOString().split('T')[0] });
                }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Expense
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingExpenseId ? "Edit Expense" : "Add Expense"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleExpenseSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={expenseData.category} onValueChange={(value) => setExpenseData({ ...expenseData, category: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {EXPENSE_CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Amount ($)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={expenseData.amount}
                      onChange={(e) => setExpenseData({ ...expenseData, amount: e.target.value })}
                      placeholder="e.g., 100.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input
                      value={expenseData.description}
                      onChange={(e) => setExpenseData({ ...expenseData, description: e.target.value })}
                      placeholder="Optional details"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={expenseData.date}
                      onChange={(e) => setExpenseData({ ...expenseData, date: e.target.value })}
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    {editingExpenseId ? "Update" : "Add"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {expensesLoading ? (
            <Card><CardContent className="pt-6">Loading...</CardContent></Card>
          ) : expenses && expenses.length > 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {expenses.map((expense) => (
                        <TableRow key={expense.id}>
                          <TableCell>{new Date(expense.expenseDate).toLocaleDateString()}</TableCell>
                          <TableCell>{expense.category}</TableCell>
                          <TableCell className="font-semibold">${parseFloat(expense.amount.toString()).toFixed(2)}</TableCell>
                          <TableCell>{expense.description || "-"}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm" onClick={() => {
                                setEditingExpenseId(expense.id);
                                setExpenseData({
                                  category: expense.category,
                                  amount: expense.amount.toString(),
                                  description: expense.description || "",
                                  date: new Date(expense.expenseDate).toISOString().split('T')[0],
                                });
                                setExpenseOpen(true);
                              }}>
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDeleteExpense(expense.id)} className="text-destructive">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>No expenses recorded yet.</AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="income" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={incomeOpen} onOpenChange={setIncomeOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingIncomeId(null);
                  setIncomeData({ source: "", amount: "", description: "", date: new Date().toISOString().split('T')[0] });
                }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Income
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingIncomeId ? "Edit Income" : "Add Income"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleIncomeSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Source</Label>
                    <Input
                      value={incomeData.source}
                      onChange={(e) => setIncomeData({ ...incomeData, source: e.target.value })}
                      placeholder="e.g., Wholesale, Refund"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Amount ($)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={incomeData.amount}
                      onChange={(e) => setIncomeData({ ...incomeData, amount: e.target.value })}
                      placeholder="e.g., 500.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input
                      value={incomeData.description}
                      onChange={(e) => setIncomeData({ ...incomeData, description: e.target.value })}
                      placeholder="Optional details"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={incomeData.date}
                      onChange={(e) => setIncomeData({ ...incomeData, date: e.target.value })}
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    {editingIncomeId ? "Update" : "Add"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {incomeLoading ? (
            <Card><CardContent className="pt-6">Loading...</CardContent></Card>
          ) : otherIncome && otherIncome.length > 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {otherIncome.map((income) => (
                        <TableRow key={income.id}>
                          <TableCell>{new Date(income.incomeDate).toLocaleDateString()}</TableCell>
                          <TableCell>Other Income</TableCell>
                          <TableCell className="font-semibold text-green-600">${parseFloat(income.amount.toString()).toFixed(2)}</TableCell>
                          <TableCell>{income.description || "-"}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm" onClick={() => {
                                setEditingIncomeId(income.id);
                                setIncomeData({
                                  source: "Other Income",
                                  amount: income.amount.toString(),
                                  description: income.description || "",
                                  date: new Date(income.incomeDate).toISOString().split('T')[0],
                                });
                                setIncomeOpen(true);
                              }}>
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDeleteIncome(income.id)} className="text-destructive">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>No other income recorded yet.</AlertDescription>
            </Alert>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertCircle, Plus, Trash2, Edit2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

export default function Sales() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    productId: "",
    batchId: "",
    quantity: "",
    unitPrice: "",
    discountType: "none",
    discountValue: "",
    customerName: "",
    saleDate: new Date().toISOString().split('T')[0],
  });

  const { data: sales, isLoading, refetch } = trpc.sales.list.useQuery();
  const { data: products } = trpc.products.list.useQuery();
  const { data: batches } = trpc.batches.list.useQuery();
  const createSale = trpc.sales.create.useMutation();
  const updateSale = trpc.sales.update.useMutation();
  const deleteSale = trpc.sales.delete.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.productId || !formData.quantity || !formData.unitPrice) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      if (editingId) {
        await updateSale.mutateAsync({
          id: editingId,
          productId: parseInt(formData.productId),
          batchId: formData.batchId ? parseInt(formData.batchId) : undefined,
          quantity: parseInt(formData.quantity),
          unitPrice: formData.unitPrice,
          customerName: formData.customerName,
          saleDate: new Date(formData.saleDate),
        });
        toast.success("Sale updated");
      } else {
        await createSale.mutateAsync({
          productId: parseInt(formData.productId),
          batchId: formData.batchId ? parseInt(formData.batchId) : undefined,
          quantity: parseInt(formData.quantity),
          unitPrice: formData.unitPrice,
          customerName: formData.customerName,
          saleDate: new Date(formData.saleDate),
        });
        toast.success("Sale recorded");
      }
      
      setFormData({
        productId: "",
        batchId: "",
        quantity: "",
        unitPrice: "",
        discountType: "none",
        discountValue: "",
        customerName: "",
        saleDate: new Date().toISOString().split('T')[0],
      });
      setEditingId(null);
      setIsOpen(false);
      refetch();
    } catch (error) {
      toast.error("Failed to save sale");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this sale?")) return;
    try {
      await deleteSale.mutateAsync({ id });
      toast.success("Sale deleted");
      refetch();
    } catch (error) {
      toast.error("Failed to delete sale");
    }
  };

  const handleEdit = (sale: any) => {
    setEditingId(sale.id);
    setFormData({
      productId: sale.productId.toString(),
      batchId: sale.batchId ? sale.batchId.toString() : "",
      quantity: sale.quantity.toString(),
      unitPrice: sale.unitPrice.toString(),
      discountType: sale.discountType || "none",
      discountValue: sale.discountValue?.toString() || "",
      customerName: sale.customerName || "",
      saleDate: new Date(sale.saleDate).toISOString().split('T')[0],
    });
    setIsOpen(true);
  };

  const subtotal = formData.quantity && formData.unitPrice 
    ? parseInt(formData.quantity) * parseFloat(formData.unitPrice)
    : 0;
  
  let discountAmount = 0;
  if (formData.discountType === "percentage" && formData.discountValue) {
    discountAmount = (subtotal * parseFloat(formData.discountValue)) / 100;
  } else if (formData.discountType === "fixed" && formData.discountValue) {
    discountAmount = parseFloat(formData.discountValue);
  }
  
  const totalPrice = (subtotal - discountAmount).toFixed(2);
  const discountDisplay = discountAmount > 0 ? `-$${discountAmount.toFixed(2)}` : "No discount";

  const selectedProduct = products?.find(p => p.id === parseInt(formData.productId));
  const profitPerUnit = selectedProduct 
    ? (parseFloat(selectedProduct.sellingPrice.toString()) - parseFloat((selectedProduct.productionCost || "0").toString())).toFixed(2)
    : "0.00";
  const totalProfit = formData.quantity && selectedProduct
    ? (parseInt(formData.quantity) * parseFloat(profitPerUnit)).toFixed(2)
    : "0.00";

  const productBatches = formData.productId 
    ? batches?.filter(b => b.productId === parseInt(formData.productId)) || []
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sales Management</h1>
          <p className="text-muted-foreground mt-1">Record and track sales transactions</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingId(null);
              setFormData({
                productId: "",
                batchId: "",
                quantity: "",
                unitPrice: "",
                discountType: "none",
                discountValue: "",
                customerName: "",
                saleDate: new Date().toISOString().split('T')[0],
              });
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Record Sale
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Sale" : "Record New Sale"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Product</Label>
                <Select value={formData.productId} onValueChange={(value) => setFormData({ ...formData, productId: value, batchId: "" })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products?.map((p) => (
                      <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Batch (optional - for FIFO)</Label>
                <Select value={formData.batchId} onValueChange={(value) => setFormData({ ...formData, batchId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select batch" />
                  </SelectTrigger>
                  <SelectContent>
                    {productBatches.map((b) => (
                      <SelectItem key={b.id} value={b.id.toString()}>
                        Batch {b.id} - {b.remainingStock} units
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Quantity</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  placeholder="e.g., 10"
                />
              </div>

              <div className="space-y-2">
                <Label>Unit Price ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.unitPrice}
                  onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                  placeholder="e.g., 15.99"
                />
              </div>

              <div className="space-y-2">
                <Label>Discount Type</Label>
                <Select value={formData.discountType} onValueChange={(value) => setFormData({ ...formData, discountType: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Discount</SelectItem>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="fixed">Fixed Amount ($)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.discountType !== "none" && (
                <div className="space-y-2">
                  <Label>{formData.discountType === "percentage" ? "Discount (%)" : "Discount ($)"}</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                    placeholder={formData.discountType === "percentage" ? "e.g., 10" : "e.g., 5.00"}
                  />
                </div>
              )}

              <div className="space-y-2">
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-sm text-muted-foreground">Total Sale</p>
                  <p className="text-lg font-semibold">${totalPrice}</p>
                  {discountAmount > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">Subtotal: ${subtotal.toFixed(2)} {discountDisplay}</p>
                  )}
                </div>
                {selectedProduct && (
                  <div className="bg-green-950/30 border border-green-500/50 p-3 rounded-lg">
                    <p className="text-sm text-muted-foreground">Profit per Unit</p>
                    <p className="text-lg font-semibold text-green-400">${profitPerUnit}</p>
                    <p className="text-xs text-muted-foreground mt-1">Selling: ${parseFloat(selectedProduct.sellingPrice.toString()).toFixed(2)} - Cost: ${parseFloat((selectedProduct.productionCost || "0").toString()).toFixed(2)}</p>
                  </div>
                )}
                {formData.quantity && selectedProduct && (
                  <div className="bg-blue-950/30 border border-blue-500/50 p-3 rounded-lg">
                    <p className="text-sm text-muted-foreground">Total Profit</p>
                    <p className="text-lg font-semibold text-blue-400">${totalProfit}</p>
                    <p className="text-xs text-muted-foreground mt-1">{formData.quantity} units × ${profitPerUnit}</p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Customer Name (optional)</Label>
                <Input
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  placeholder="e.g., John Doe"
                />
              </div>

              <div className="space-y-2">
                <Label>Sale Date</Label>
                <Input
                  type="date"
                  value={formData.saleDate}
                  onChange={(e) => setFormData({ ...formData, saleDate: e.target.value })}
                />
              </div>

              <Button type="submit" className="w-full">
                {editingId ? "Update Sale" : "Record Sale"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <Card><CardContent className="pt-6">Loading...</CardContent></Card>
      ) : sales && sales.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Sales History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Unit Price</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Profit</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales.map((sale) => {
                    const product = products?.find(p => p.id === sale.productId);
                    const profit = product
                      ? (sale.quantity * (parseFloat(product.sellingPrice.toString()) - parseFloat((product.productionCost || "0").toString()))).toFixed(2)
                      : sale.profit.toString();
                    const profitNum = parseFloat(profit);
                    return (
                      <TableRow key={sale.id}>
                        <TableCell>{new Date(sale.saleDate).toLocaleDateString()}</TableCell>
                        <TableCell className="font-medium">{product?.name}</TableCell>
                        <TableCell>{sale.quantity}</TableCell>
                        <TableCell>${parseFloat(sale.unitPrice.toString()).toFixed(2)}</TableCell>
                        <TableCell>${parseFloat(sale.totalPrice.toString()).toFixed(2)}</TableCell>
                        <TableCell className={`font-semibold ${profitNum >= 0 ? 'text-green-400' : 'text-red-400'}`}>${profit}</TableCell>
                        <TableCell>{sale.customerName || "-"}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(sale)}>
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(sale.id)} className="text-destructive">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>No sales yet. Record your first sale.</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

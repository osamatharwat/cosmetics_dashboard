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

export default function Production() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    productId: "",
    batchSize: "",
    totalCost: "",
    productionDate: new Date().toISOString().split('T')[0],
    expiryDate: "",
  });

  const { data: batches, isLoading: batchesLoading, refetch: refetchBatches } = trpc.batches.list.useQuery();
  const { data: products } = trpc.products.list.useQuery();
  const createBatch = trpc.batches.create.useMutation();
  const updateBatch = trpc.batches.update.useMutation();
  const deleteBatch = trpc.batches.delete.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.productId || !formData.batchSize || !formData.totalCost) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      if (editingId) {
        await updateBatch.mutateAsync({
          id: editingId,
          productId: parseInt(formData.productId),
          batchSize: parseInt(formData.batchSize),
          totalCost: formData.totalCost,
          productionDate: new Date(formData.productionDate),
          expiryDate: formData.expiryDate ? new Date(formData.expiryDate) : undefined,
        });
        toast.success("Batch updated successfully");
      } else {
        await createBatch.mutateAsync({
          productId: parseInt(formData.productId),
          batchSize: parseInt(formData.batchSize),
          totalCost: formData.totalCost,
          productionDate: new Date(formData.productionDate),
          expiryDate: formData.expiryDate ? new Date(formData.expiryDate) : undefined,
        });
        toast.success("Batch created successfully");
      }
      
      setFormData({
        productId: "",
        batchSize: "",
        totalCost: "",
        productionDate: new Date().toISOString().split('T')[0],
        expiryDate: "",
      });
      setEditingId(null);
      setIsOpen(false);
      refetchBatches();
    } catch (error) {
      toast.error("Failed to save batch");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this batch?")) return;
    
    try {
      await deleteBatch.mutateAsync({ id });
      toast.success("Batch deleted successfully");
      refetchBatches();
    } catch (error) {
      toast.error("Failed to delete batch");
    }
  };

  const handleEdit = (batch: any) => {
    setEditingId(batch.id);
    setFormData({
      productId: batch.productId.toString(),
      batchSize: batch.batchSize.toString(),
      totalCost: batch.totalCost.toString(),
      productionDate: new Date(batch.productionDate).toISOString().split('T')[0],
      expiryDate: batch.expiryDate ? new Date(batch.expiryDate).toISOString().split('T')[0] : "",
    });
    setIsOpen(true);
  };

  const costPerUnit = formData.batchSize && formData.totalCost 
    ? (parseFloat(formData.totalCost) / parseInt(formData.batchSize)).toFixed(2)
    : "0.00";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Production & Batch Management</h1>
          <p className="text-muted-foreground mt-1">Create and track production batches</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingId(null);
              setFormData({
                productId: "",
                batchSize: "",
                totalCost: "",
                productionDate: new Date().toISOString().split('T')[0],
                expiryDate: "",
              });
            }}>
              <Plus className="w-4 h-4 mr-2" />
              New Batch
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Batch" : "Create New Batch"}</DialogTitle>
              <DialogDescription>
                {editingId ? "Update batch details" : "Add a new production batch"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="product">Product</Label>
                <Select value={formData.productId} onValueChange={(value) => setFormData({ ...formData, productId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products?.map((product) => (
                      <SelectItem key={product.id} value={product.id.toString()}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="batchSize">Batch Size (units)</Label>
                <Input
                  id="batchSize"
                  type="number"
                  min="1"
                  value={formData.batchSize}
                  onChange={(e) => setFormData({ ...formData, batchSize: e.target.value })}
                  placeholder="e.g., 100"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="totalCost">Total Cost ($)</Label>
                <Input
                  id="totalCost"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.totalCost}
                  onChange={(e) => setFormData({ ...formData, totalCost: e.target.value })}
                  placeholder="e.g., 500.00"
                />
              </div>

              <div className="bg-muted p-3 rounded-lg">
                <p className="text-sm text-muted-foreground">Cost per unit</p>
                <p className="text-lg font-semibold">${costPerUnit}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="productionDate">Production Date</Label>
                <Input
                  id="productionDate"
                  type="date"
                  value={formData.productionDate}
                  onChange={(e) => setFormData({ ...formData, productionDate: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiryDate">Expiry Date (optional)</Label>
                <Input
                  id="expiryDate"
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                />
              </div>

              <Button type="submit" className="w-full">
                {editingId ? "Update Batch" : "Create Batch"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {batchesLoading ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">Loading batches...</p>
          </CardContent>
        </Card>
      ) : batches && batches.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Production Batches</CardTitle>
            <CardDescription>All production batches and their status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Batch Size</TableHead>
                    <TableHead>Total Cost</TableHead>
                    <TableHead>Cost/Unit</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Prod. Date</TableHead>
                    <TableHead>Expiry</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {batches.map((batch) => {
                    const product = products?.find(p => p.id === batch.productId);
                    return (
                      <TableRow key={batch.id}>
                        <TableCell className="font-medium">{product?.name}</TableCell>
                        <TableCell>{batch.batchSize}</TableCell>
                        <TableCell>${parseFloat(batch.totalCost.toString()).toFixed(2)}</TableCell>
                        <TableCell>${parseFloat(batch.costPerUnit.toString()).toFixed(2)}</TableCell>
                        <TableCell>
                          {batch.remainingStock < 10 ? (
                            <span className="text-destructive font-semibold">{batch.remainingStock}</span>
                          ) : (
                            batch.remainingStock
                          )}
                        </TableCell>
                        <TableCell>{new Date(batch.productionDate).toLocaleDateString()}</TableCell>
                        <TableCell>
                          {batch.expiryDate ? new Date(batch.expiryDate).toLocaleDateString() : "-"}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(batch)}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(batch.id)}
                              className="text-destructive hover:text-destructive"
                            >
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
              <AlertDescription>
                No batches yet. Create your first batch to get started.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

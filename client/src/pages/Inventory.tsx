import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertCircle, Plus, Trash2, Edit2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

export default function Inventory() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    sellingPrice: "",
    productionCost: "",
    description: "",
  });

  const { data: products, isLoading, refetch } = trpc.products.list.useQuery();
  const { data: batches } = trpc.batches.list.useQuery();
  const createProduct = trpc.products.create.useMutation();
  const updateProduct = trpc.products.update.useMutation();
  const deleteProduct = trpc.products.delete.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.sku || !formData.sellingPrice || !formData.productionCost) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      if (editingId) {
        await updateProduct.mutateAsync({
          id: editingId,
          name: formData.name,
          sku: formData.sku,
          sellingPrice: formData.sellingPrice,
          productionCost: formData.productionCost,
          description: formData.description,
        });
        toast.success("Product updated");
      } else {
        await createProduct.mutateAsync({
          name: formData.name,
          sku: formData.sku,
          sellingPrice: formData.sellingPrice,
          productionCost: formData.productionCost,
          description: formData.description,
        });
        toast.success("Product created");
      }
      
      setFormData({ name: "", sku: "", sellingPrice: "", productionCost: "", description: "" });
      setEditingId(null);
      setIsOpen(false);
      refetch();
    } catch (error) {
      toast.error("Failed to save product");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this product?")) return;
    try {
      await deleteProduct.mutateAsync({ id });
      toast.success("Product deleted");
      refetch();
    } catch (error) {
      toast.error("Failed to delete product");
    }
  };

  const handleEdit = (product: any) => {
    setEditingId(product.id);
    setFormData({
      name: product.name,
      sku: product.sku,
      sellingPrice: product.sellingPrice.toString(),
      productionCost: product.productionCost.toString(),
      description: product.description || "",
    });
    setIsOpen(true);
  };

  const getStockForProduct = (productId: number) => {
    return batches?.reduce((sum, batch) => {
      if (batch.productId === productId) return sum + batch.remainingStock;
      return sum;
    }, 0) || 0;
  };

  const calculateProfit = (sellingPrice: string, productionCost: string) => {
    const selling = parseFloat(sellingPrice) || 0;
    const production = parseFloat(productionCost) || 0;
    return (selling - production).toFixed(2);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Inventory Management</h1>
          <p className="text-muted-foreground mt-1">Manage products, costs, and stock levels</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingId(null);
              setFormData({ name: "", sku: "", sellingPrice: "", productionCost: "", description: "" });
            }}>
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Product" : "Add New Product"}</DialogTitle>
              <DialogDescription>
                Set both the production cost and selling price for accurate profit calculations
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Body Splash Rose"
                />
              </div>
              <div>
                <Label htmlFor="sku">SKU *</Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  placeholder="e.g., BS-ROSE-001"
                />
              </div>
              <div>
                <Label htmlFor="productionCost">Production Cost per Unit *</Label>
                <Input
                  id="productionCost"
                  type="number"
                  step="0.01"
                  value={formData.productionCost}
                  onChange={(e) => setFormData({ ...formData, productionCost: e.target.value })}
                  placeholder="e.g., 2.50"
                />
                <p className="text-xs text-muted-foreground mt-1">Cost to produce one unit</p>
              </div>
              <div>
                <Label htmlFor="sellingPrice">Selling Price per Unit *</Label>
                <Input
                  id="sellingPrice"
                  type="number"
                  step="0.01"
                  value={formData.sellingPrice}
                  onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                  placeholder="e.g., 9.99"
                />
                <p className="text-xs text-muted-foreground mt-1">Price you sell for</p>
              </div>
              
              {formData.productionCost && formData.sellingPrice && (
                <div className="p-3 bg-blue-950/30 rounded-lg border border-blue-500/50">
                  <p className="text-sm font-medium">Profit per Unit:</p>
                  <p className={`text-lg font-bold ${parseFloat(calculateProfit(formData.sellingPrice, formData.productionCost)) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    ${calculateProfit(formData.sellingPrice, formData.productionCost)}
                  </p>
                </div>
              )}

              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional description"
                />
              </div>
              <Button type="submit" className="w-full">
                {editingId ? "Update Product" : "Create Product"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div>Loading...</div>
      ) : products && products.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Products ({products.length})</CardTitle>
            <CardDescription>All your products with pricing and stock information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product Name</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Production Cost</TableHead>
                    <TableHead>Selling Price</TableHead>
                    <TableHead>Profit/Unit</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => {
                    const stock = getStockForProduct(product.id);
                    const profit = calculateProfit(
                      product.sellingPrice.toString(),
                      (product.productionCost || "0").toString()
                    );
                    const profitNum = parseFloat(profit);
                    
                    return (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>{product.sku}</TableCell>
                        <TableCell>${parseFloat((product.productionCost || "0").toString()).toFixed(2)}</TableCell>
                        <TableCell>${parseFloat(product.sellingPrice.toString()).toFixed(2)}</TableCell>
                        <TableCell>
                          <span className={profitNum >= 0 ? "text-green-400 font-medium" : "text-red-400 font-medium"}>
                            ${profit}
                          </span>
                        </TableCell>
                        <TableCell>{stock} units</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(product)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(product.id)}
                              className="text-red-500 hover:text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
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
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No products yet. Create your first product to get started!
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

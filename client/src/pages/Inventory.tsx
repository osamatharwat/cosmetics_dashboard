import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Inventory() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Inventory Management</h1>
      <Card>
        <CardHeader>
          <CardTitle>Products</CardTitle>
          <CardDescription>Manage your products and stock levels</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Inventory management coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
}

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Sales() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Sales Management</h1>
      <Card>
        <CardHeader>
          <CardTitle>Sales Records</CardTitle>
          <CardDescription>Track and manage your sales</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Sales management coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
}

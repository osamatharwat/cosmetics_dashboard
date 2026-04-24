import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Reports() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Reports & Analytics</h1>
      <Card>
        <CardHeader>
          <CardTitle>Reports</CardTitle>
          <CardDescription>View detailed reports and analytics</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Reports coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
}

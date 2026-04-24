import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Financials() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Financials & Liquidity</h1>
      <Card>
        <CardHeader>
          <CardTitle>Financial Overview</CardTitle>
          <CardDescription>Track expenses and cash flow</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Financial tracking coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
}

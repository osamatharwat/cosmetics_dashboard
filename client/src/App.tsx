import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Production from "./pages/Production";
import Inventory from "./pages/Inventory";
import Sales from "./pages/Sales";
import Financials from "./pages/Financials";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";

function Router() {
  return (
    <Switch>
      <Route path={"/dashboard"} component={() => (
        <DashboardLayout>
          <Dashboard />
        </DashboardLayout>
      )} />
      <Route path={"/production"} component={() => (
        <DashboardLayout>
          <Production />
        </DashboardLayout>
      )} />
      <Route path={"/inventory"} component={() => (
        <DashboardLayout>
          <Inventory />
        </DashboardLayout>
      )} />
      <Route path={"/sales"} component={() => (
        <DashboardLayout>
          <Sales />
        </DashboardLayout>
      )} />
      <Route path={"/financials"} component={() => (
        <DashboardLayout>
          <Financials />
        </DashboardLayout>
      )} />
      <Route path={"/reports"} component={() => (
        <DashboardLayout>
          <Reports />
        </DashboardLayout>
      )} />
      <Route path={"/settings"} component={() => (
        <DashboardLayout>
          <Settings />
        </DashboardLayout>
      )} />
      <Route path={"/404"} component={NotFound} />
      {/* Default redirect to dashboard */}
      <Route path={"/"} component={() => {
        window.location.href = "/dashboard";
        return null;
      }} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="dark"
        switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Layout } from "@/components/Layout";

import Dashboard from "@/pages/Dashboard";
import Simulator from "@/pages/Simulator";
import Analyzer from "@/pages/Analyzer";
import Copilot from "@/pages/Copilot";
import Upload from "@/pages/Upload";
import Report from "@/pages/Report";

const queryClient = new QueryClient();

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/simulator" component={Simulator} />
        <Route path="/analyzer" component={Analyzer} />
        <Route path="/copilot" component={Copilot} />
        <Route path="/upload" component={Upload} />
        <Route path="/report" component={Report} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

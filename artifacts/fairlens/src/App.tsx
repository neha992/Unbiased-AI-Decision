import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect } from "react";
import NotFound from "@/pages/not-found";
import { Layout } from "@/components/Layout";

import Dashboard from "@/pages/Dashboard";
import Simulator from "@/pages/Simulator";
import Analyzer from "@/pages/Analyzer";
import Copilot from "@/pages/Copilot";
import Upload from "@/pages/Upload";
import Report from "@/pages/Report";
import Pipeline from "@/pages/Pipeline";
import Login from "@/pages/Login";

const queryClient = new QueryClient();

const isAuthed = () => typeof window !== 'undefined' && localStorage.getItem('equify_auth') === '1';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const [, setLocation] = useLocation();
  const authed = isAuthed();

  useEffect(() => {
    if (!authed) {
      setLocation("/login");
    }
  }, [authed, setLocation]);

  if (!authed) {
    return null;
  }

  return <Layout>{children}</Layout>;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/">
        <RequireAuth><Dashboard /></RequireAuth>
      </Route>
      <Route path="/simulator">
        <RequireAuth><Simulator /></RequireAuth>
      </Route>
      <Route path="/analyzer">
        <RequireAuth><Analyzer /></RequireAuth>
      </Route>
      <Route path="/copilot">
        <RequireAuth><Copilot /></RequireAuth>
      </Route>
      <Route path="/upload">
        <RequireAuth><Upload /></RequireAuth>
      </Route>
      <Route path="/pipeline">
        <RequireAuth><Pipeline /></RequireAuth>
      </Route>
      <Route path="/report">
        <RequireAuth><Report /></RequireAuth>
      </Route>
      <Route>
        <RequireAuth><NotFound /></RequireAuth>
      </Route>
    </Switch>
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

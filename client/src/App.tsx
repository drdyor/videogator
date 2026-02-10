import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import Login from "@/pages/Login";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Services from "./pages/Services";
import Projects from "./pages/Projects";
import Pharma from "./pages/Pharma";
import Admin from "./pages/Admin";
import VideoFoundry from "./pages/VideoFoundry";
import { supabase } from "@/lib/supabase";
import { useState, useEffect } from "react";
import type { Session } from "@supabase/supabase-js";
import { Loader2 } from "lucide-react";

function Router() {
  return (
    <Switch>
      <Route path="/dashboard">
        {() => (
          <DashboardLayout>
            <Dashboard />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/services">
        {() => (
          <DashboardLayout>
            <Services />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/projects">
        {() => (
          <DashboardLayout>
            <Projects />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/pharma">
        {() => (
          <DashboardLayout>
            <Pharma />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/foundry">
        {() => (
          <DashboardLayout>
            <VideoFoundry />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/admin">
        {() => (
          <DashboardLayout>
            <Admin />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/404" component={NotFound} />
      <Route>
        {() => (
          <DashboardLayout>
            <Dashboard />
          </DashboardLayout>
        )}
      </Route>
    </Switch>
  );
}

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          {session ? <Router /> : <Login />}
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

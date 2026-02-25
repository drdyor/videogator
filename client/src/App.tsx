import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import Login from "@/pages/Login";
import Landing from "@/pages/Landing";
import Directory from "@/pages/Directory";
import Guides from "@/pages/Guides";
import Prompts from "@/pages/Prompts";
import ServiceDetail from "@/pages/ServiceDetail";
import Compare from "@/pages/Compare";
import GetStarted from "@/pages/GetStarted";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import PublicLayout from "./components/PublicLayout";
import Dashboard from "./pages/Dashboard";
import Services from "./pages/Services";
import Projects from "./pages/Projects";
import Pharma from "./pages/Pharma";
import Admin from "@/pages/Admin";
import VideoFoundry from "@/pages/VideoFoundry";
import VideoGallery from "@/pages/VideoGallery";
import { supabase } from "@/lib/supabase";
import { useState, useEffect } from "react";
import type { Session } from "@supabase/supabase-js";
import { Loader2 } from "lucide-react";

function AuthRouter() {
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
      <Route path="/gallery">
        {() => (
          <DashboardLayout>
            <VideoGallery />
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
      {/* Fallback: if logged in but on unknown auth route, go to dashboard */}
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
    // Dev bypass: skip Supabase auth in development
    if (import.meta.env.DEV && localStorage.getItem("dev-bypass-auth")) {
      setSession({ user: { id: "dev-user", email: "dev@localhost" } } as any);
      setLoading(false);
      return;
    }

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
          <Switch>
            {/* Public routes — no auth required */}
            <Route path="/">
              {() => (
                <PublicLayout>
                  <Landing />
                </PublicLayout>
              )}
            </Route>
            <Route path="/directory">
              {() => (
                <PublicLayout>
                  <Directory />
                </PublicLayout>
              )}
            </Route>
            <Route path="/guides">
              {() => (
                <PublicLayout>
                  <Guides />
                </PublicLayout>
              )}
            </Route>
            <Route path="/prompts">
              {() => (
                <PublicLayout>
                  <Prompts />
                </PublicLayout>
              )}
            </Route>
            <Route path="/service/:id">
              {() => (
                <PublicLayout>
                  <ServiceDetail />
                </PublicLayout>
              )}
            </Route>
            <Route path="/compare/:slug">
              {() => (
                <PublicLayout>
                  <Compare />
                </PublicLayout>
              )}
            </Route>
            <Route path="/get-started">
              {() => (
                <PublicLayout>
                  <GetStarted />
                </PublicLayout>
              )}
            </Route>
            <Route path="/login">
              {() => session ? <AuthRouter /> : <Login />}
            </Route>

            {/* Auth-protected routes */}
            <Route path="/dashboard">
              {() => session ? <AuthRouter /> : <Login />}
            </Route>
            <Route path="/services">
              {() => session ? <AuthRouter /> : <Login />}
            </Route>
            <Route path="/projects">
              {() => session ? <AuthRouter /> : <Login />}
            </Route>
            <Route path="/pharma">
              {() => session ? <AuthRouter /> : <Login />}
            </Route>
            <Route path="/foundry">
              {() => session ? <AuthRouter /> : <Login />}
            </Route>
            <Route path="/admin">
              {() => session ? <AuthRouter /> : <Login />}
            </Route>

            {/* 404 */}
            <Route path="/404" component={NotFound} />
            <Route>
              {() => (
                <PublicLayout>
                  <Landing />
                </PublicLayout>
              )}
            </Route>
          </Switch>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

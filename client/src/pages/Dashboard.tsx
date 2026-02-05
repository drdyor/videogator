import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Loader2, Sparkles, Zap, TrendingUp, Users } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { data: projects, isLoading: projectsLoading } = trpc.projects.list.useQuery();
  const { data: services, isLoading: servicesLoading } = trpc.services.list.useQuery();

  const stats = [
    {
      label: "Total Projects",
      value: projects?.length || 0,
      icon: "📁",
      color: "from-blue-500 to-blue-600",
    },
    {
      label: "Available Services",
      value: services?.length || 0,
      icon: "🎬",
      color: "from-purple-500 to-purple-600",
    },
    {
      label: "Pharma Templates",
      value: "5+",
      icon: "🧬",
      color: "from-emerald-500 to-emerald-600",
    },
    {
      label: "API Integrations",
      value: "0",
      icon: "⚡",
      color: "from-orange-500 to-orange-600",
    },
  ];

  const quickActions = [
    {
      title: "Create New Project",
      description: "Start a new video generation project",
      icon: "✨",
      action: () => setLocation("/projects"),
      color: "from-accent to-secondary",
    },
    {
      title: "Explore Services",
      description: "Browse all available AI video generators",
      icon: "🎬",
      action: () => setLocation("/services"),
      color: "from-blue-500 to-blue-600",
    },
    {
      title: "Pharma Visualizer",
      description: "Create molecular animations",
      icon: "🧬",
      action: () => setLocation("/pharma"),
      color: "from-emerald-500 to-emerald-600",
    },
  ];

  const recentProjects = projects?.slice(0, 5) || [];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold">
          Welcome back, <span className="gradient-text">{user?.name || "User"}</span>
        </h1>
        <p className="text-muted-foreground text-lg">
          Your unified video generation orchestrator dashboard
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <Card key={idx} className="p-6 hover-lift">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                <p className="text-3xl font-bold mt-2">{stat.value}</p>
              </div>
              <span className="text-3xl">{stat.icon}</span>
            </div>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickActions.map((action, idx) => (
            <Card
              key={idx}
              className="p-6 hover-lift cursor-pointer group overflow-hidden relative"
              onClick={action.action}
            >
              {/* Background gradient */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-0 group-hover:opacity-10 transition-opacity`}
              />

              <div className="relative space-y-3">
                <span className="text-4xl block">{action.icon}</span>
                <div>
                  <h3 className="font-bold text-lg group-hover:text-accent transition-colors">
                    {action.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {action.description}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-4 text-accent hover:bg-accent/10 group-hover:translate-x-1 transition-transform"
                >
                  Get Started →
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Projects */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Recent Projects</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLocation("/projects")}
          >
            View All
          </Button>
        </div>

        {projectsLoading ? (
          <Card className="p-8 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-accent" />
          </Card>
        ) : recentProjects.length > 0 ? (
          <div className="space-y-3">
            {recentProjects.map((project: any) => (
              <Card
                key={project.id}
                className="p-4 hover-lift cursor-pointer flex items-center justify-between"
                onClick={() => setLocation(`/projects/${project.id}`)}
              >
                <div className="flex-1">
                  <h3 className="font-semibold">{project.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {project.description || "No description"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    project.status === "completed"
                      ? "bg-emerald-500/20 text-emerald-300"
                      : project.status === "generating"
                      ? "bg-blue-500/20 text-blue-300"
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {project.status}
                  </span>
                  <span className="text-muted-foreground">→</span>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">No projects yet</p>
            <Button
              className="mt-4 bg-accent text-accent-foreground hover:bg-accent/90"
              onClick={() => setLocation("/projects")}
            >
              Create Your First Project
            </Button>
          </Card>
        )}
      </div>

      {/* Features Overview */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Platform Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-6 space-y-3">
            <div className="flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-accent" />
              <h3 className="font-bold">AI Service Aggregation</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Access multiple AI video generation services from one unified dashboard. Compare capabilities and choose the best tool for your needs.
            </p>
          </Card>

          <Card className="p-6 space-y-3">
            <div className="flex items-center gap-3">
              <Zap className="w-6 h-6 text-secondary" />
              <h3 className="font-bold">Project Management</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Organize and manage all your video generation projects in one place. Track status, save settings, and access your entire generation history.
            </p>
          </Card>

          <Card className="p-6 space-y-3">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-6 h-6 text-emerald-500" />
              <h3 className="font-bold">Pharma Specialization</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Create stunning molecular animations and scientific visualizations with our specialized pharma module. Perfect for drug discovery and biotech companies.
            </p>
          </Card>

          <Card className="p-6 space-y-3">
            <div className="flex items-center gap-3">
              <Users className="w-6 h-6 text-blue-500" />
              <h3 className="font-bold">Enterprise Ready</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Built for teams and enterprises. Secure authentication, role-based access, and scalable infrastructure for your organization.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}

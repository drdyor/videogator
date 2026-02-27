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
      label: "Video Models",
      value: "8",
      icon: "🎬",
      color: "from-gold to-burgundy",
    },
    {
      label: "Available Services",
      value: services?.length || 0,
      icon: "🛠️",
      color: "from-purple-500 to-purple-600",
    },
    {
      label: "Pharma Templates",
      value: "5+",
      icon: "🧬",
      color: "from-emerald-500 to-emerald-600",
    },
    {
      label: "Your Projects",
      value: projects?.length || 0,
      icon: "📁",
      color: "from-orange-500 to-orange-600",
    },
  ];

  const quickActions = [
    {
      title: "Generate Video",
      description: "Create AI-generated videos using local GPU models",
      icon: "🎬",
      action: () => setLocation("/foundry"),
      color: "from-gold to-burgundy",
    },
    {
      title: "Explore Services",
      description: "Browse all available AI video generators",
      icon: "🛠️",
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
        <h1 className="text-4xl font-display font-bold">
          Welcome back, <span className="gold-gradient-text">{user?.name || "User"}</span>
        </h1>
        <p className="text-gold-dim text-lg">
          Your unified video generation orchestrator dashboard
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <Card key={idx} className="art-deco-card p-6 hover-lift">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gold-dim">{stat.label}</p>
                <p className="text-3xl font-bold mt-2">{stat.value}</p>
              </div>
              <span className="text-3xl">{stat.icon}</span>
            </div>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="space-y-4">
        <div className="art-deco-divider">
          <span className="font-display text-sm tracking-widest uppercase text-gold-dim px-2">
            Quick Actions
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickActions.map((action, idx) => (
            <Card
              key={idx}
              className="art-deco-card p-6 hover-lift cursor-pointer group overflow-hidden relative"
              onClick={action.action}
            >
              {/* Background gradient */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-0 group-hover:opacity-10 transition-opacity`}
              />

              <div className="relative space-y-3">
                <span className="text-4xl block">{action.icon}</span>
                <div>
                  <h3 className="font-display font-bold text-lg group-hover:text-gold transition-colors">
                    {action.title}
                  </h3>
                  <p className="text-sm text-gold-dim mt-1">
                    {action.description}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-4 text-gold hover:bg-gold/10 group-hover:translate-x-1 transition-transform"
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
          <div className="art-deco-divider flex-1">
            <span className="font-display text-sm tracking-widest uppercase text-gold-dim px-2">
              Recent Projects
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-gold-dim/40 text-gold hover:bg-gold/10"
            onClick={() => setLocation("/projects")}
          >
            View All
          </Button>
        </div>

        {projectsLoading ? (
          <Card className="art-deco-card p-8 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-gold" />
          </Card>
        ) : recentProjects.length > 0 ? (
          <div className="space-y-3">
            {recentProjects.map((project: any) => (
              <Card
                key={project.id}
                className="art-deco-card p-4 hover-lift cursor-pointer flex items-center justify-between"
                onClick={() => setLocation(`/projects/${project.id}`)}
              >
                <div className="flex-1">
                  <h3 className="font-semibold">{project.name}</h3>
                  <p className="text-sm text-gold-dim">
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
                  <span className="text-gold">→</span>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="art-deco-card p-8 text-center">
            <p className="text-gold-dim">No projects yet</p>
            <Button
              className="mt-4 bg-gold text-background hover:bg-gold/90"
              onClick={() => setLocation("/projects")}
            >
              Create Your First Project
            </Button>
          </Card>
        )}
      </div>

      {/* Features Overview */}
      <div className="space-y-4">
        <div className="art-deco-divider">
          <span className="font-display text-sm tracking-widest uppercase text-gold-dim px-2">
            Platform Features
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="art-deco-card p-6 space-y-3">
            <div className="flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-gold" />
              <h3 className="font-display font-bold">AI Service Aggregation</h3>
            </div>
            <p className="text-sm text-gold-dim">
              Access multiple AI video generation services from one unified dashboard. Compare capabilities and choose the best tool for your needs.
            </p>
          </Card>

          <Card className="art-deco-card p-6 space-y-3">
            <div className="flex items-center gap-3">
              <Zap className="w-6 h-6 text-gold" />
              <h3 className="font-display font-bold">Project Management</h3>
            </div>
            <p className="text-sm text-gold-dim">
              Organize and manage all your video generation projects in one place. Track status, save settings, and access your entire generation history.
            </p>
          </Card>

          <Card className="art-deco-card p-6 space-y-3">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-6 h-6 text-gold" />
              <h3 className="font-display font-bold">Pharma Specialization</h3>
            </div>
            <p className="text-sm text-gold-dim">
              Create stunning molecular animations and scientific visualizations with our specialized pharma module. Perfect for drug discovery and biotech companies.
            </p>
          </Card>

          <Card className="art-deco-card p-6 space-y-3">
            <div className="flex items-center gap-3">
              <Users className="w-6 h-6 text-gold" />
              <h3 className="font-display font-bold">Enterprise Ready</h3>
            </div>
            <p className="text-sm text-gold-dim">
              Built for teams and enterprises. Secure authentication, role-based access, and scalable infrastructure for your organization.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}

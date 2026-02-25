import { Link, useLocation } from "wouter";
import { Film } from "lucide-react";

const navLinks = [
  { label: "Directory", path: "/directory" },
  { label: "Guides", path: "/guides" },
  { label: "Prompts", path: "/prompts" },
  { label: "Get Started", path: "/get-started" },
];

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-background film-grain">
      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-gold-dim/30 bg-background/90 backdrop-blur-md">
        <nav className="container flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2.5 group">
            <Film className="w-7 h-7 text-gold" />
            <span className="font-display text-xl font-bold gold-gradient-text">
              VideoGator
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                href={link.path}
                className={`text-sm font-medium transition-colors hover:text-gold ${
                  location === link.path
                    ? "text-gold"
                    : "text-muted-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-md bg-gold px-4 py-2 text-sm font-semibold text-background hover:bg-gold/90 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </nav>
      </header>

      {/* Mobile nav */}
      <div className="md:hidden sticky top-16 z-40 border-b border-gold-dim/20 bg-background/95 backdrop-blur-sm">
        <div className="container flex gap-6 py-2 overflow-x-auto">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              href={link.path}
              className={`text-sm whitespace-nowrap transition-colors ${
                location === link.path
                  ? "text-gold font-medium"
                  : "text-muted-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t border-gold-dim/20 mt-20">
        <div className="container py-12">
          <div className="grid gap-8 md:grid-cols-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Film className="w-5 h-5 text-gold" />
                <span className="font-display text-lg font-bold gold-gradient-text">
                  VideoGator
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                The complete directory and toolkit for AI video generation.
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="font-display text-sm font-semibold text-gold-dim">
                Resources
              </h4>
              <div className="flex flex-col gap-2">
                <Link href="/directory" className="text-sm text-muted-foreground hover:text-foreground">
                  Service Directory
                </Link>
                <Link href="/guides" className="text-sm text-muted-foreground hover:text-foreground">
                  Guides & How-To
                </Link>
                <Link href="/prompts" className="text-sm text-muted-foreground hover:text-foreground">
                  Prompt Library
                </Link>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-display text-sm font-semibold text-gold-dim">
                Platform
              </h4>
              <div className="flex flex-col gap-2">
                <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
                  Dashboard
                </Link>
                <Link href="/services" className="text-sm text-muted-foreground hover:text-foreground">
                  API Services
                </Link>
                <Link href="/foundry" className="text-sm text-muted-foreground hover:text-foreground">
                  Video Foundry
                </Link>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-display text-sm font-semibold text-gold-dim">
                Comparisons
              </h4>
              <div className="flex flex-col gap-2">
                <Link href="/compare/runway-vs-pika" className="text-sm text-muted-foreground hover:text-foreground">
                  Runway vs Pika
                </Link>
                <Link href="/compare/runway-vs-kling" className="text-sm text-muted-foreground hover:text-foreground">
                  Runway vs Kling
                </Link>
                <Link href="/compare/text-to-video-services" className="text-sm text-muted-foreground hover:text-foreground">
                  Best Text-to-Video
                </Link>
                <Link href="/compare/open-source-video-models" className="text-sm text-muted-foreground hover:text-foreground">
                  Open Source Models
                </Link>
              </div>
            </div>
          </div>

          <div className="art-deco-divider mt-8 mb-4 text-xs">
            <span className="text-gold-dim/60">&#9670;</span>
          </div>

          <p className="text-center text-xs text-muted-foreground/60">
            &copy; {new Date().getFullYear()} VideoGator. Built for creators, by creators.
          </p>
        </div>
      </footer>
    </div>
  );
}

import { Link } from "wouter";
import { VIDEO_SERVICES } from "@/data/services";
import { GUIDES } from "@/data/guides";
import { COMPARISONS } from "@/data/comparisons";
import GatorMascot from "@/components/GatorMascot";
import { ArrowRight, Layers, BookOpen, Palette, Zap, Shield, Globe } from "lucide-react";

const featuredServices = VIDEO_SERVICES.filter((s) => s.tier === "commercial").slice(0, 6);

export default function Landing() {
  return (
    <div className="space-y-0">
      {/* Hero */}
      <section className="relative overflow-hidden py-24 md:py-36">
        {/* Video background */}
        <div className="absolute inset-0">
          <video
            src="/videogator-video.mp4"
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-background/40" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/40 to-background" />
        </div>

        <div className="container relative z-10 text-center space-y-5">
          <GatorMascot size="lg" variant="pulse" className="mx-auto" />

          <div className="inline-flex items-center gap-2 rounded-full border border-gold-dim/30 bg-gold/5 px-4 py-1.5 text-xs text-gold backdrop-blur-sm">
            <Zap className="w-3 h-3" />
            18 services compared — see real examples, not marketing demos
          </div>

          <h1 className="font-display text-4xl md:text-6xl font-bold leading-tight">
            <span className="gold-gradient-text">Video Generation,</span>
            <br />
            <span className="text-foreground">One Byte at a Time.</span>
          </h1>

          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Compare commercial APIs, open-source models, and GPU infrastructure.
            Learn to generate, prompt, self-host, and ship AI video — from first prompt to production.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/directory"
              className="inline-flex items-center gap-2 rounded-md bg-gold px-6 py-3 text-base font-semibold text-background hover:bg-gold/90 transition-colors"
            >
              Browse Directory
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/guides"
              className="inline-flex items-center gap-2 rounded-md border border-gold-dim/40 bg-background/30 backdrop-blur-sm px-6 py-3 text-base font-medium text-foreground hover:border-gold-dim transition-colors"
            >
              Read Guides
            </Link>
          </div>
        </div>
      </section>

      {/* Three Pillars */}
      <section className="container py-12">
        <div className="text-center mb-8">
          <div className="art-deco-divider mb-6">
            <span className="font-display text-sm tracking-widest uppercase text-gold-dim">
              What You'll Find
            </span>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Link href="/directory" className="group">
            <div className="art-deco-card rounded-lg p-8 space-y-4 hover-lift h-full">
              <div className="w-12 h-12 rounded-lg bg-gold/10 flex items-center justify-center">
                <Layers className="w-6 h-6 text-gold" />
              </div>
              <h3 className="font-display text-xl font-semibold">Service Directory</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Compare Runway, Kling, Pika, Sora, and 10+ more services side-by-side.
                Filter by price, API access, resolution, and capabilities.
              </p>
              <span className="inline-flex items-center gap-1 text-sm text-gold group-hover:gap-2 transition-all">
                Explore <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </Link>

          <Link href="/guides" className="group">
            <div className="art-deco-card rounded-lg p-8 space-y-4 hover-lift h-full">
              <div className="w-12 h-12 rounded-lg bg-gold/10 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-gold" />
              </div>
              <h3 className="font-display text-xl font-semibold">Guides & How-To</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Learn prompt engineering, self-hosting on RunPod, model comparisons,
                and workflows for social media, film, and commercial production.
              </p>
              <span className="inline-flex items-center gap-1 text-sm text-gold group-hover:gap-2 transition-all">
                Read Guides <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </Link>

          <Link href="/prompts" className="group">
            <div className="art-deco-card rounded-lg p-8 space-y-4 hover-lift h-full">
              <div className="w-12 h-12 rounded-lg bg-gold/10 flex items-center justify-center">
                <Palette className="w-6 h-6 text-gold" />
              </div>
              <h3 className="font-display text-xl font-semibold">Prompt Library</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                25+ curated video prompts organized by style — cinematic, anime, retro,
                product shots, sci-fi, and more. Copy and use instantly.
              </p>
              <span className="inline-flex items-center gap-1 text-sm text-gold group-hover:gap-2 transition-all">
                Browse Prompts <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </Link>
        </div>
      </section>

      {/* Featured Services */}
      <section className="container py-12">
        <div className="text-center mb-8">
          <div className="art-deco-divider mb-6">
            <span className="font-display text-sm tracking-widest uppercase text-gold-dim">
              Top Services
            </span>
          </div>
          <h2 className="font-display text-3xl font-bold mb-3">
            Commercial Video Generation APIs
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            The leading platforms for text-to-video and image-to-video generation.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featuredServices.map((service) => (
            <div
              key={service.id}
              className="art-deco-card rounded-lg p-6 space-y-3"
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl">{service.icon}</span>
                <div>
                  <h3 className="font-semibold">{service.name}</h3>
                  <p className="text-xs text-gold-dim">{service.pricing}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {service.tagline}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {service.capabilities.slice(0, 3).map((cap) => (
                  <span
                    key={cap}
                    className="text-xs rounded-full border border-gold-dim/20 bg-gold/5 px-2 py-0.5 text-muted-foreground"
                  >
                    {cap}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-3 pt-1 text-xs text-muted-foreground">
                <span>{service.maxResolution}</span>
                <span className="text-gold-dim/30">|</span>
                <span>Up to {service.maxDuration}</span>
                {service.apiAvailable && (
                  <>
                    <span className="text-gold-dim/30">|</span>
                    <span className="text-gold">API</span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-8">
          <Link
            href="/directory"
            className="inline-flex items-center gap-2 text-sm text-gold hover:text-gold/80 transition-colors"
          >
            View all 18 services <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </section>

      {/* Popular Guides Preview */}
      <section className="container py-12">
        <div className="text-center mb-8">
          <div className="art-deco-divider mb-6">
            <span className="font-display text-sm tracking-widest uppercase text-gold-dim">
              Learn
            </span>
          </div>
          <h2 className="font-display text-3xl font-bold mb-3">
            Most Asked Questions
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {GUIDES.slice(0, 4).map((guide) => (
            <Link key={guide.id} href="/guides" className="group">
              <div className="rounded-lg border border-border/60 p-6 hover:border-gold-dim/40 transition-colors space-y-2">
                <h3 className="font-display text-lg font-semibold group-hover:text-gold transition-colors">
                  {guide.question}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {guide.content.replace(/\*\*/g, "").replace(/`/g, "").replace(/\|/g, "").replace(/^[-#]+\s/gm, "").slice(0, 150)}...
                </p>
                <div className="flex gap-2">
                  {guide.tags.slice(0, 2).map((tag) => (
                    <span
                      key={tag}
                      className="text-xs rounded-full border border-gold-dim/20 px-2 py-0.5 text-muted-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Popular Comparisons */}
      <section className="container py-12">
        <div className="text-center mb-8">
          <div className="art-deco-divider mb-6">
            <span className="font-display text-sm tracking-widest uppercase text-gold-dim">
              Compare
            </span>
          </div>
          <h2 className="font-display text-3xl font-bold mb-3">
            Popular Comparisons
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Side-by-side breakdowns with real examples, pricing, and honest verdicts.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 max-w-4xl mx-auto">
          {COMPARISONS.map((comp) => (
            <Link
              key={comp.slug}
              href={`/compare/${comp.slug}`}
              className="group rounded-lg border border-border/40 p-5 hover:border-gold-dim/40 transition-colors space-y-2"
            >
              <h3 className="font-display text-sm font-semibold group-hover:text-gold transition-colors">
                {comp.title}
              </h3>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {comp.verdict}
              </p>
              <span className="inline-flex items-center gap-1 text-xs text-gold opacity-0 group-hover:opacity-100 transition-opacity">
                Read comparison <ArrowRight className="w-3 h-3" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="container py-12">
        <div className="text-center mb-8">
          <div className="art-deco-divider mb-6">
            <span className="font-display text-sm tracking-widest uppercase text-gold-dim">
              Platform
            </span>
          </div>
          <h2 className="font-display text-3xl font-bold mb-3">
            Generate Videos with VideoGator
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Sign up to access the full platform — generate, edit, and manage AI videos.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3 max-w-4xl mx-auto">
          {[
            {
              step: "01",
              icon: Globe,
              title: "Choose a Service",
              desc: "Pick from integrated APIs or bring your own key for any supported model.",
            },
            {
              step: "02",
              icon: Zap,
              title: "Generate",
              desc: "Write a prompt, set your parameters, and generate videos directly in the platform.",
            },
            {
              step: "03",
              icon: Shield,
              title: "Edit & Export",
              desc: "Trim, upscale, merge clips, and export final videos for any platform.",
            },
          ].map((item) => (
            <div key={item.step} className="text-center space-y-4">
              <div className="font-display text-4xl font-bold text-gold/20">
                {item.step}
              </div>
              <div className="w-12 h-12 rounded-lg bg-gold/10 flex items-center justify-center mx-auto">
                <item.icon className="w-6 h-6 text-gold" />
              </div>
              <h3 className="font-display text-lg font-semibold">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-md bg-gold px-6 py-3 text-base font-semibold text-background hover:bg-gold/90 transition-colors"
          >
            Start Free
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}

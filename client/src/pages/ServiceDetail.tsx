import { useRoute, Link } from "wouter";
import { VIDEO_SERVICES } from "@/data/services";
import { getExamplesForService } from "@/data/examples";
import { PROMPTS } from "@/data/prompts";
import { getComparisonsForService } from "@/data/comparisons";
import VideoEmbed from "@/components/VideoEmbed";
import GatorMascot from "@/components/GatorMascot";
import { ArrowRight, ExternalLink, Check, X, Copy, ArrowLeft } from "lucide-react";
import { useState, useCallback } from "react";

export default function ServiceDetail() {
  const [, params] = useRoute("/service/:id");
  const serviceId = params?.id;
  const service = VIDEO_SERVICES.find((s) => s.id === serviceId);

  if (!service) {
    return (
      <div className="container py-20 text-center space-y-4">
        <GatorMascot size="lg" variant="framed" />
        <h1 className="font-display text-2xl font-bold">Service not found</h1>
        <Link href="/directory" className="text-gold hover:text-gold/80">
          Back to directory
        </Link>
      </div>
    );
  }

  const examples = getExamplesForService(service.id);
  const servicePrompts = PROMPTS.filter((p) =>
    p.bestFor.some((b) => b.toLowerCase().includes(service.name.split(" ")[0].toLowerCase()))
  );
  const comparisons = getComparisonsForService(service.id);

  return (
    <div className="container py-12 space-y-12">
      {/* Back link */}
      <Link
        href="/directory"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-gold transition-colors"
      >
        <ArrowLeft className="w-3 h-3" />
        Back to Directory
      </Link>

      {/* Hero */}
      <div className="flex flex-col md:flex-row gap-8 items-start">
        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-4">
            <span className="text-5xl">{service.icon}</span>
            <div>
              <h1 className="font-display text-4xl font-bold">{service.name}</h1>
              <span className={`text-sm rounded-full px-3 py-0.5 border ${
                service.tier === "commercial" ? "border-gold/30 text-gold" :
                service.tier === "open-source" ? "border-green-500/30 text-green-400" :
                "border-blue-500/30 text-blue-400"
              }`}>
                {service.tier}
              </span>
            </div>
          </div>
          <p className="text-lg text-muted-foreground">{service.tagline}</p>

          {/* Key Facts */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4">
            <KeyFact label="Resolution" value={service.maxResolution} />
            <KeyFact label="Duration" value={service.maxDuration} />
            <KeyFact label="API" value={service.apiAvailable ? "Available" : "No"} />
            <KeyFact label="Self-host" value={service.selfHostable ? "Yes" : "No"} />
          </div>

          <div className="flex flex-wrap gap-2">
            {service.bestFor?.map((tag) => (
              <span
                key={tag}
                className="text-xs rounded-full border border-gold-dim/20 bg-gold/5 px-3 py-1 text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* CTA Card */}
        <div className="art-deco-card rounded-lg p-6 w-full md:w-80 space-y-4 shrink-0">
          <div className="flex items-center gap-2">
            <GatorMascot size="xs" variant="inline" />
            <span className="text-xs text-gold font-medium">VideoGator Pick</span>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-gold font-semibold">{service.pricing}</p>
            {service.pricingDetail && (
              <p className="text-xs text-muted-foreground">{service.pricingDetail}</p>
            )}
          </div>
          <a
            href={service.affiliateUrl || service.website}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full rounded-md bg-gold px-4 py-2.5 text-sm font-semibold text-background hover:bg-gold/90 transition-colors"
          >
            Try {service.name.split(" ")[0]}
            <ArrowRight className="w-4 h-4" />
          </a>
          <a
            href={service.website}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full text-sm text-muted-foreground hover:text-gold transition-colors"
          >
            Visit website <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Capabilities */}
      <section className="space-y-4">
        <div className="art-deco-divider">
          <span className="font-display text-sm tracking-widest uppercase text-gold-dim">
            Capabilities
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {service.capabilities.map((cap) => (
            <span
              key={cap}
              className="inline-flex items-center gap-1.5 text-sm rounded-lg border border-gold-dim/20 bg-gold/5 px-3 py-1.5"
            >
              <Check className="w-3 h-3 text-gold" />
              {cap}
            </span>
          ))}
        </div>
      </section>

      {/* Negative Prompt Tips */}
      {service.negativePromptTips && (
        <section className="space-y-4">
          <div className="art-deco-divider">
            <span className="font-display text-sm tracking-widest uppercase text-gold-dim">
              What to Avoid
            </span>
          </div>
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-5">
            <div className="flex items-start gap-3">
              <X className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground leading-relaxed">
                {service.negativePromptTips}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Example Videos */}
      {examples.length > 0 && (
        <section className="space-y-4">
          <div className="art-deco-divider">
            <span className="font-display text-sm tracking-widest uppercase text-gold-dim">
              Example Videos
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Real videos created with {service.name} — see what's possible.
          </p>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {examples.map((example) => (
              <div key={example.id} className="space-y-2">
                <VideoEmbed
                  embedUrl={example.embedUrl}
                  platform={example.platform}
                  title={example.description}
                />
                <div className="space-y-1">
                  <p className="text-sm font-medium">{example.description}</p>
                  <p className="text-xs text-muted-foreground">by {example.creatorName}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Prompt Templates */}
      {servicePrompts.length > 0 && (
        <section className="space-y-4">
          <div className="art-deco-divider">
            <span className="font-display text-sm tracking-widest uppercase text-gold-dim">
              Prompt Templates for {service.name.split(" ")[0]}
            </span>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {servicePrompts.map((prompt) => (
              <PromptCard key={prompt.id} prompt={prompt} />
            ))}
          </div>
          <Link
            href="/prompts"
            className="inline-flex items-center gap-1 text-sm text-gold hover:text-gold/80"
          >
            Browse all prompts <ArrowRight className="w-3 h-3" />
          </Link>
        </section>
      )}

      {/* Related Comparisons */}
      {comparisons.length > 0 && (
        <section className="space-y-4">
          <div className="art-deco-divider">
            <span className="font-display text-sm tracking-widest uppercase text-gold-dim">
              Comparisons
            </span>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {comparisons.map((comp) => (
              <Link
                key={comp.slug}
                href={`/compare/${comp.slug}`}
                className="group rounded-lg border border-border/40 p-4 hover:border-gold-dim/40 transition-colors space-y-1"
              >
                <h3 className="font-display text-sm font-semibold group-hover:text-gold transition-colors line-clamp-1">
                  {comp.title}
                </h3>
                <p className="text-xs text-muted-foreground line-clamp-1">{comp.verdict}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Bottom CTA */}
      <div className="text-center space-y-4 py-8">
        <GatorMascot size="md" variant="framed" className="mx-auto" />
        <h2 className="font-display text-2xl font-bold">
          Ready to create with {service.name.split(" ")[0]}?
        </h2>
        <a
          href={service.affiliateUrl || service.website}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-md bg-gold px-6 py-3 text-base font-semibold text-background hover:bg-gold/90 transition-colors"
        >
          Get Started <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}

function KeyFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gold-dim/15 p-3 text-center">
      <div className="text-xs text-muted-foreground/60">{label}</div>
      <div className="text-sm font-semibold mt-0.5">{value}</div>
    </div>
  );
}

function PromptCard({ prompt }: { prompt: (typeof PROMPTS)[number] }) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async () => {
    await navigator.clipboard.writeText(prompt.prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [prompt.prompt]);

  return (
    <div className="rounded-lg border border-gold-dim/15 p-4 space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">{prompt.title}</h4>
        <button
          onClick={copy}
          className={`rounded-md p-1.5 border transition-all ${
            copied
              ? "border-green-500/40 text-green-400"
              : "border-gold-dim/20 text-muted-foreground hover:text-gold"
          }`}
        >
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
        </button>
      </div>
      <p className="text-xs text-muted-foreground line-clamp-3">{prompt.prompt}</p>
    </div>
  );
}

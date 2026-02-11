import { useState, useMemo } from "react";
import { VIDEO_SERVICES, CAPABILITY_FILTERS, TIER_LABELS, type VideoService } from "@/data/services";
import { ExternalLink, Check, X, Filter, ArrowUpDown } from "lucide-react";

type SortKey = "name" | "pricing" | "maxResolution" | "maxDuration";
type SortDir = "asc" | "desc";

export default function Directory() {
  const [tierFilter, setTierFilter] = useState<VideoService["tier"] | "all">("all");
  const [capFilter, setCapFilter] = useState<string | null>(null);
  const [apiOnly, setApiOnly] = useState(false);
  const [selfHostOnly, setSelfHostOnly] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");

  const filtered = useMemo(() => {
    let result = VIDEO_SERVICES;
    if (tierFilter !== "all") result = result.filter((s) => s.tier === tierFilter);
    if (capFilter) result = result.filter((s) => s.capabilities.includes(capFilter));
    if (apiOnly) result = result.filter((s) => s.apiAvailable);
    if (selfHostOnly) result = result.filter((s) => s.selfHostable);
    return [...result].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      const cmp = String(aVal).localeCompare(String(bVal));
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [tierFilter, capFilter, apiOnly, selfHostOnly, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const tiers: (VideoService["tier"] | "all")[] = ["all", "commercial", "open-source", "infrastructure"];

  return (
    <div className="container py-12 space-y-10">
      {/* Header */}
      <div className="space-y-3">
        <h1 className="font-display text-4xl md:text-5xl font-bold">
          <span className="gold-gradient-text">AI Video</span> Service Directory
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl">
          Compare {VIDEO_SERVICES.length} video generation services — commercial APIs, open-source models,
          and GPU infrastructure providers. All data updated for 2025.
        </p>
      </div>

      {/* Filters */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Filter className="w-4 h-4" />
          Filters
        </div>

        <div className="flex flex-wrap gap-2">
          {tiers.map((tier) => (
            <button
              key={tier}
              onClick={() => setTierFilter(tier)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium border transition-colors ${
                tierFilter === tier
                  ? "border-gold bg-gold/10 text-gold"
                  : "border-border text-muted-foreground hover:border-gold-dim/40"
              }`}
            >
              {tier === "all" ? "All Services" : TIER_LABELS[tier]}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {CAPABILITY_FILTERS.map((cap) => (
            <button
              key={cap}
              onClick={() => setCapFilter(capFilter === cap ? null : cap)}
              className={`rounded-full px-3 py-1 text-xs border transition-colors ${
                capFilter === cap
                  ? "border-gold bg-gold/10 text-gold"
                  : "border-border/60 text-muted-foreground hover:border-gold-dim/40"
              }`}
            >
              {cap}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={apiOnly}
              onChange={(e) => setApiOnly(e.target.checked)}
              className="rounded border-gold-dim/40 accent-gold"
            />
            <span className="text-muted-foreground">API available</span>
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={selfHostOnly}
              onChange={(e) => setSelfHostOnly(e.target.checked)}
              className="rounded border-gold-dim/40 accent-gold"
            />
            <span className="text-muted-foreground">Self-hostable</span>
          </label>

          <div className="ml-auto flex gap-2">
            <button
              onClick={() => setViewMode("cards")}
              className={`px-3 py-1 text-xs rounded border transition-colors ${
                viewMode === "cards" ? "border-gold text-gold" : "border-border text-muted-foreground"
              }`}
            >
              Cards
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`px-3 py-1 text-xs rounded border transition-colors ${
                viewMode === "table" ? "border-gold text-gold" : "border-border text-muted-foreground"
              }`}
            >
              Table
            </button>
          </div>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        Showing {filtered.length} of {VIDEO_SERVICES.length} services
      </p>

      {/* Card View */}
      {viewMode === "cards" && (
        <div className="space-y-12">
          {(["commercial", "open-source", "infrastructure"] as const)
            .map((tier) => {
              const tierServices = filtered.filter((s) => s.tier === tier);
              if (tierServices.length === 0) return null;
              return (
                <div key={tier} className="space-y-6">
                  <div className="art-deco-divider">
                    <span className="font-display text-sm tracking-widest uppercase text-gold-dim">
                      {TIER_LABELS[tier]}
                    </span>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {tierServices.map((service) => (
                      <ServiceCard key={service.id} service={service} />
                    ))}
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* Table View */}
      {viewMode === "table" && (
        <div className="overflow-x-auto rounded-lg border border-gold-dim/20">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gold-dim/20 bg-gold/5">
                <ThHeader label="Service" sortKey="name" current={sortKey} dir={sortDir} onSort={toggleSort} />
                <th className="text-left p-3 text-xs text-gold-dim font-semibold">Tier</th>
                <ThHeader label="Pricing" sortKey="pricing" current={sortKey} dir={sortDir} onSort={toggleSort} />
                <ThHeader label="Resolution" sortKey="maxResolution" current={sortKey} dir={sortDir} onSort={toggleSort} />
                <ThHeader label="Duration" sortKey="maxDuration" current={sortKey} dir={sortDir} onSort={toggleSort} />
                <th className="text-center p-3 text-xs text-gold-dim font-semibold">API</th>
                <th className="text-center p-3 text-xs text-gold-dim font-semibold">Self-Host</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className="border-b border-border/30 hover:bg-gold/5 transition-colors">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{s.icon}</span>
                      <div>
                        <div className="font-medium">{s.name}</div>
                        <div className="text-xs text-muted-foreground line-clamp-1">{s.tagline}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    <span className={`text-xs rounded-full px-2 py-0.5 border ${
                      s.tier === "commercial" ? "border-gold/30 text-gold" :
                      s.tier === "open-source" ? "border-green-500/30 text-green-400" :
                      "border-blue-500/30 text-blue-400"
                    }`}>
                      {s.tier}
                    </span>
                  </td>
                  <td className="p-3 text-xs text-muted-foreground max-w-[180px]">{s.pricing}</td>
                  <td className="p-3 text-xs">{s.maxResolution}</td>
                  <td className="p-3 text-xs">{s.maxDuration}</td>
                  <td className="p-3 text-center">
                    {s.apiAvailable
                      ? <Check className="w-4 h-4 text-green-400 mx-auto" />
                      : <X className="w-4 h-4 text-muted-foreground/30 mx-auto" />}
                  </td>
                  <td className="p-3 text-center">
                    {s.selfHostable
                      ? <Check className="w-4 h-4 text-green-400 mx-auto" />
                      : <X className="w-4 h-4 text-muted-foreground/30 mx-auto" />}
                  </td>
                  <td className="p-3">
                    <a
                      href={s.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gold hover:text-gold/80"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* SEO Content */}
      <section className="space-y-6 pt-12">
        <div className="art-deco-divider">
          <span className="font-display text-sm tracking-widest uppercase text-gold-dim">
            About This Directory
          </span>
        </div>
        <div className="prose prose-invert max-w-3xl mx-auto text-sm text-muted-foreground space-y-4">
          <p>
            VideoGator's AI Video Service Directory is the most comprehensive comparison of video generation
            tools available in 2025. We track commercial APIs like Runway Gen-3 Alpha, Kling AI, Pika 2.0,
            OpenAI Sora, and Google Veo 2, alongside open-source models including Wan 2.1, Hunyuan Video,
            CogVideoX, LTX-Video 2, and Mochi 1.
          </p>
          <p>
            For teams looking to self-host, we also cover GPU infrastructure providers like RunPod, Replicate,
            and fal.ai — with real pricing data and deployment guides. Whether you're a solo creator exploring
            free tiers or an enterprise team building a production pipeline, this directory helps you make
            informed decisions.
          </p>
        </div>
      </section>
    </div>
  );
}

function ServiceCard({ service }: { service: VideoService }) {
  return (
    <div className="art-deco-card rounded-lg p-6 space-y-4 hover-lift">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{service.icon}</span>
          <div>
            <h3 className="font-semibold">{service.name}</h3>
            <span className={`text-xs rounded-full px-2 py-0.5 border ${
              service.tier === "commercial" ? "border-gold/30 text-gold" :
              service.tier === "open-source" ? "border-green-500/30 text-green-400" :
              "border-blue-500/30 text-blue-400"
            }`}>
              {service.tier}
            </span>
          </div>
        </div>
        <a
          href={service.website}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-gold transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      <p className="text-sm text-muted-foreground">{service.tagline}</p>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-muted-foreground/60">Resolution</span>
          <div className="font-medium">{service.maxResolution}</div>
        </div>
        <div>
          <span className="text-muted-foreground/60">Duration</span>
          <div className="font-medium">{service.maxDuration}</div>
        </div>
        <div>
          <span className="text-muted-foreground/60">API</span>
          <div className="font-medium">{service.apiAvailable ? "Yes" : "No"}</div>
        </div>
        <div>
          <span className="text-muted-foreground/60">Self-host</span>
          <div className="font-medium">{service.selfHostable ? "Yes" : "No"}</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {service.capabilities.slice(0, 4).map((cap) => (
          <span
            key={cap}
            className="text-xs rounded-full border border-gold-dim/20 bg-gold/5 px-2 py-0.5 text-muted-foreground"
          >
            {cap}
          </span>
        ))}
        {service.capabilities.length > 4 && (
          <span className="text-xs text-muted-foreground/60">
            +{service.capabilities.length - 4}
          </span>
        )}
      </div>

      <div className="pt-2 border-t border-gold-dim/10">
        <p className="text-xs text-gold">{service.pricing}</p>
        {service.pricingDetail && (
          <p className="text-xs text-muted-foreground/60 mt-0.5">{service.pricingDetail}</p>
        )}
      </div>
    </div>
  );
}

function ThHeader({
  label,
  sortKey,
  current,
  dir,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  current: SortKey;
  dir: SortDir;
  onSort: (key: SortKey) => void;
}) {
  return (
    <th
      className="text-left p-3 text-xs text-gold-dim font-semibold cursor-pointer hover:text-gold transition-colors"
      onClick={() => onSort(sortKey)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <ArrowUpDown className={`w-3 h-3 ${current === sortKey ? "text-gold" : "opacity-30"}`} />
      </span>
    </th>
  );
}

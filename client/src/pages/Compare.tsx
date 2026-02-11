import { useRoute, Link } from "wouter";
import { COMPARISONS, getComparisonBySlug, getServiceData } from "@/data/comparisons";
import { getExamplesForService } from "@/data/examples";
import VideoEmbed from "@/components/VideoEmbed";
import GatorMascot from "@/components/GatorMascot";
import { ArrowRight, ArrowLeft, Check, X, ExternalLink } from "lucide-react";

export default function Compare() {
  const [, params] = useRoute("/compare/:slug");
  const slug = params?.slug;
  const comparison = slug ? getComparisonBySlug(slug) : undefined;

  if (!comparison) {
    return (
      <div className="container py-20 text-center space-y-4">
        <GatorMascot size="lg" variant="framed" />
        <h1 className="font-display text-2xl font-bold">Comparison not found</h1>
        <p className="text-muted-foreground">Try one of these:</p>
        <div className="flex flex-wrap justify-center gap-2 max-w-lg mx-auto">
          {COMPARISONS.map((c) => (
            <Link
              key={c.slug}
              href={`/compare/${c.slug}`}
              className="text-sm text-gold hover:text-gold/80 border border-gold-dim/20 rounded-full px-3 py-1"
            >
              {c.slug}
            </Link>
          ))}
        </div>
      </div>
    );
  }

  const services = comparison.serviceIds
    .map(getServiceData)
    .filter(Boolean) as NonNullable<ReturnType<typeof getServiceData>>[];

  return (
    <div className="container py-12 space-y-12">
      {/* Back */}
      <Link
        href="/directory"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-gold transition-colors"
      >
        <ArrowLeft className="w-3 h-3" />
        Back to Directory
      </Link>

      {/* Header */}
      <div className="space-y-4">
        <h1 className="font-display text-3xl md:text-4xl font-bold">
          {comparison.title}
        </h1>
        <p className="text-muted-foreground max-w-2xl">
          {comparison.metaDescription}
        </p>
        <div className="flex flex-wrap gap-2">
          {services.map((s) => (
            <Link
              key={s.id}
              href={`/service/${s.id}`}
              className="inline-flex items-center gap-2 rounded-full border border-gold-dim/20 bg-gold/5 px-3 py-1 text-sm hover:border-gold-dim/40 transition-colors"
            >
              <span>{s.icon}</span>
              {s.name}
            </Link>
          ))}
        </div>
      </div>

      {/* Verdict */}
      <section className="art-deco-card rounded-lg p-8 space-y-4">
        <div className="flex items-center gap-3">
          <GatorMascot size="sm" variant="framed" />
          <h2 className="font-display text-xl font-semibold text-gold">
            The Verdict
          </h2>
        </div>
        <p className="text-lg font-medium">{comparison.verdict}</p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {comparison.verdictDetail}
        </p>
      </section>

      {/* Feature Matrix */}
      <section className="space-y-4">
        <div className="art-deco-divider">
          <span className="font-display text-sm tracking-widest uppercase text-gold-dim">
            Feature Comparison
          </span>
        </div>
        <div className="overflow-x-auto rounded-lg border border-gold-dim/20">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gold-dim/20 bg-gold/5">
                <th className="text-left p-3 text-xs text-gold-dim font-semibold min-w-[140px]">
                  Feature
                </th>
                {services.map((s) => (
                  <th
                    key={s.id}
                    className="text-left p-3 text-xs text-gold-dim font-semibold min-w-[120px]"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{s.icon}</span>
                      {s.name.split(" ")[0]}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {comparison.featureMatrix.map((row, i) => (
                <tr
                  key={row.feature}
                  className={`border-b border-border/20 ${i % 2 === 0 ? "" : "bg-gold/[0.02]"}`}
                >
                  <td className="p-3 font-medium text-muted-foreground">{row.feature}</td>
                  {services.map((s) => (
                    <td key={s.id} className="p-3">
                      {row.values[s.id] || "—"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Per-Service Analysis */}
      <section className="space-y-6">
        <div className="art-deco-divider">
          <span className="font-display text-sm tracking-widest uppercase text-gold-dim">
            Detailed Analysis
          </span>
        </div>
        <div className={`grid gap-6 ${services.length <= 2 ? "md:grid-cols-2" : "md:grid-cols-2 lg:grid-cols-3"}`}>
          {comparison.serviceAnalysis.map((analysis) => {
            const s = getServiceData(analysis.serviceId);
            if (!s) return null;
            return (
              <div key={analysis.serviceId} className="art-deco-card rounded-lg p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{s.icon}</span>
                  <div>
                    <h3 className="font-display font-semibold">{s.name}</h3>
                    <p className="text-xs text-gold-dim">{s.pricing}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-green-400 uppercase">Pros</h4>
                  {analysis.pros.map((pro) => (
                    <div key={pro} className="flex items-start gap-2 text-sm">
                      <Check className="w-3 h-3 text-green-400 shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{pro}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-destructive uppercase">Cons</h4>
                  {analysis.cons.map((con) => (
                    <div key={con} className="flex items-start gap-2 text-sm">
                      <X className="w-3 h-3 text-destructive shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{con}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-gold-dim/10">
                  <h4 className="text-xs font-semibold text-gold-dim uppercase mb-1">Best When</h4>
                  <p className="text-sm text-muted-foreground">{analysis.bestWhen}</p>
                </div>

                <a
                  href={s.affiliateUrl || s.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full rounded-md border border-gold/40 bg-gold/10 px-4 py-2 text-sm font-medium text-gold hover:bg-gold/20 transition-colors"
                >
                  Try {s.name.split(" ")[0]} <ArrowRight className="w-3 h-3" />
                </a>
              </div>
            );
          })}
        </div>
      </section>

      {/* Example Videos from compared services */}
      {(() => {
        const allExamples = services.flatMap((s) =>
          getExamplesForService(s.id).slice(0, 2).map((e) => ({ ...e, service: s }))
        );
        if (allExamples.length === 0) return null;
        return (
          <section className="space-y-4">
            <div className="art-deco-divider">
              <span className="font-display text-sm tracking-widest uppercase text-gold-dim">
                Example Videos
              </span>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {allExamples.map((example) => (
                <div key={example.id} className="space-y-2">
                  <VideoEmbed
                    embedUrl={example.embedUrl}
                    platform={example.platform}
                    title={example.description}
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{example.service.icon}</span>
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {example.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      })()}

      {/* Other Comparisons */}
      <section className="space-y-4">
        <div className="art-deco-divider">
          <span className="font-display text-sm tracking-widest uppercase text-gold-dim">
            More Comparisons
          </span>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {COMPARISONS.filter((c) => c.slug !== slug).map((comp) => (
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

      {/* SEO structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: comparison.title,
            description: comparison.metaDescription,
            about: services.map((s) => ({
              "@type": "SoftwareApplication",
              name: s.name,
              url: s.website,
            })),
          }),
        }}
      />
    </div>
  );
}

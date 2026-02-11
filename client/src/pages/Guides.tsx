import { useState } from "react";
import { GUIDES, GUIDE_TAGS, type Guide } from "@/data/guides";
import { ChevronDown, ChevronUp, BookOpen } from "lucide-react";

export default function Guides() {
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = tagFilter
    ? GUIDES.filter((g) => g.tags.includes(tagFilter))
    : GUIDES;

  const toggle = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="container py-12 space-y-10">
      {/* Header */}
      <div className="space-y-3">
        <h1 className="font-display text-4xl md:text-5xl font-bold">
          <span className="gold-gradient-text">Guides</span> & How-To
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl">
          Everything you need to know about AI video generation — from writing your first prompt
          to self-hosting models on your own GPUs. Updated for 2025.
        </p>
      </div>

      {/* Tag Filters */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setTagFilter(null)}
          className={`rounded-full px-4 py-1.5 text-sm font-medium border transition-colors ${
            tagFilter === null
              ? "border-gold bg-gold/10 text-gold"
              : "border-border text-muted-foreground hover:border-gold-dim/40"
          }`}
        >
          All ({GUIDES.length})
        </button>
        {GUIDE_TAGS.map((tag) => {
          const count = GUIDES.filter((g) => g.tags.includes(tag)).length;
          if (count === 0) return null;
          return (
            <button
              key={tag}
              onClick={() => setTagFilter(tagFilter === tag ? null : tag)}
              className={`rounded-full px-3 py-1.5 text-sm border transition-colors ${
                tagFilter === tag
                  ? "border-gold bg-gold/10 text-gold"
                  : "border-border/60 text-muted-foreground hover:border-gold-dim/40"
              }`}
            >
              {tag} ({count})
            </button>
          );
        })}
      </div>

      {/* FAQ / Accordion */}
      <div className="space-y-3 max-w-4xl">
        {filtered.map((guide) => (
          <GuideAccordion
            key={guide.id}
            guide={guide}
            isExpanded={expandedId === guide.id}
            onToggle={() => toggle(guide.id)}
          />
        ))}
      </div>

      {/* SEO structured data rendered as hidden content for crawlers */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: GUIDES.map((g) => ({
              "@type": "Question",
              name: g.question,
              acceptedAnswer: {
                "@type": "Answer",
                text: g.content.slice(0, 500),
              },
            })),
          }),
        }}
      />
    </div>
  );
}

function GuideAccordion({
  guide,
  isExpanded,
  onToggle,
}: {
  guide: Guide;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className={`rounded-lg border transition-colors ${
      isExpanded ? "border-gold-dim/40 bg-gold/5" : "border-border/40 hover:border-gold-dim/20"
    }`}>
      <button
        onClick={onToggle}
        className="w-full text-left p-5 flex items-start justify-between gap-4"
      >
        <div className="space-y-1.5 flex-1">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-gold shrink-0" />
            <h2 className="font-display text-lg font-semibold">{guide.question}</h2>
          </div>
          <p className="text-sm text-muted-foreground">{guide.title}</p>
          <div className="flex gap-1.5 mt-1">
            {guide.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs rounded-full border border-gold-dim/20 px-2 py-0.5 text-muted-foreground/60"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
        {isExpanded
          ? <ChevronUp className="w-5 h-5 text-gold shrink-0 mt-1" />
          : <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0 mt-1" />
        }
      </button>

      {isExpanded && (
        <div className="px-5 pb-5 border-t border-gold-dim/10 pt-4">
          <div className="prose prose-invert prose-sm max-w-none text-muted-foreground whitespace-pre-line leading-relaxed">
            {guide.content}
          </div>
        </div>
      )}
    </div>
  );
}

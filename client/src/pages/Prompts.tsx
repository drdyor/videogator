import { useState, useCallback } from "react";
import { PROMPTS, STYLE_CATEGORIES, STYLE_LABELS, type StylePrompt } from "@/data/prompts";
import { Copy, Check, Palette } from "lucide-react";

export default function Prompts() {
  const [styleFilter, setStyleFilter] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filtered = styleFilter
    ? PROMPTS.filter((p) => p.style === styleFilter)
    : PROMPTS;

  const copyToClipboard = useCallback(async (prompt: StylePrompt) => {
    await navigator.clipboard.writeText(prompt.prompt);
    setCopiedId(prompt.id);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  return (
    <div className="container py-12 space-y-10">
      {/* Header */}
      <div className="space-y-3">
        <h1 className="font-display text-4xl md:text-5xl font-bold">
          <span className="gold-gradient-text">Prompt</span> Library
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl">
          {PROMPTS.length} curated video generation prompts organized by style.
          Copy any prompt and use it directly with your preferred AI video service.
        </p>
      </div>

      {/* Style Filters */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setStyleFilter(null)}
          className={`rounded-full px-4 py-1.5 text-sm font-medium border transition-colors ${
            styleFilter === null
              ? "border-gold bg-gold/10 text-gold"
              : "border-border text-muted-foreground hover:border-gold-dim/40"
          }`}
        >
          All Styles ({PROMPTS.length})
        </button>
        {STYLE_CATEGORIES.map((style) => {
          const count = PROMPTS.filter((p) => p.style === style).length;
          return (
            <button
              key={style}
              onClick={() => setStyleFilter(styleFilter === style ? null : style)}
              className={`rounded-full px-3 py-1.5 text-sm border transition-colors ${
                styleFilter === style
                  ? "border-gold bg-gold/10 text-gold"
                  : "border-border/60 text-muted-foreground hover:border-gold-dim/40"
              }`}
            >
              {STYLE_LABELS[style]} ({count})
            </button>
          );
        })}
      </div>

      {/* Prompt Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {filtered.map((prompt) => (
          <PromptCard
            key={prompt.id}
            prompt={prompt}
            isCopied={copiedId === prompt.id}
            onCopy={() => copyToClipboard(prompt)}
          />
        ))}
      </div>

      {/* Tips Section */}
      <section className="space-y-6 pt-8">
        <div className="art-deco-divider">
          <span className="font-display text-sm tracking-widest uppercase text-gold-dim">
            Tips
          </span>
        </div>
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="rounded-lg border border-gold-dim/20 p-6 space-y-3">
            <h3 className="font-display text-lg font-semibold">How to Use These Prompts</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <span className="text-gold shrink-0">1.</span>
                <span>Click the copy button on any prompt card to copy it to your clipboard.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-gold shrink-0">2.</span>
                <span>Paste into your video generation tool of choice (check the "Best For" tags).</span>
              </li>
              <li className="flex gap-2">
                <span className="text-gold shrink-0">3.</span>
                <span>Modify details to match your vision — swap subjects, adjust camera angles, change styles.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-gold shrink-0">4.</span>
                <span>Generate 3-5 variations and pick the best result. AI generation is stochastic.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}

function PromptCard({
  prompt,
  isCopied,
  onCopy,
}: {
  prompt: StylePrompt;
  isCopied: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="art-deco-card rounded-lg p-6 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-gold" />
            <h3 className="font-display font-semibold">{prompt.title}</h3>
          </div>
          <p className="text-xs text-muted-foreground/60">{prompt.description}</p>
        </div>
        <button
          onClick={onCopy}
          className={`shrink-0 rounded-md p-2 border transition-all ${
            isCopied
              ? "border-green-500/40 bg-green-500/10 text-green-400"
              : "border-gold-dim/20 text-muted-foreground hover:text-gold hover:border-gold-dim/40"
          }`}
          title="Copy prompt"
        >
          {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>

      <p className="text-sm text-foreground/80 bg-background/50 rounded-md p-3 border border-border/30 leading-relaxed">
        {prompt.prompt}
      </p>

      <div className="flex items-center justify-between">
        <span className="text-xs rounded-full border border-gold-dim/20 bg-gold/5 px-2 py-0.5 text-gold-dim">
          {STYLE_LABELS[prompt.style as keyof typeof STYLE_LABELS]}
        </span>
        <div className="flex gap-1.5">
          {prompt.bestFor.map((service) => (
            <span
              key={service}
              className="text-xs text-muted-foreground/60"
            >
              {service}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

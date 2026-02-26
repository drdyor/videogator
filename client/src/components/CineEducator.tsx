import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Film, ChevronDown, ChevronUp, GraduationCap } from "lucide-react";
import { getInsights, ALL_TAGS, type CineInsight } from "@/data/promptBuilder";

interface CineEducatorProps {
  selectedTags: string[];
}

export default function CineEducator({ selectedTags }: CineEducatorProps) {
  const [expandedInsights, setExpandedInsights] = useState<Set<number>>(new Set());
  const insights = useMemo(() => getInsights(selectedTags), [selectedTags]);

  const toggleExpand = (index: number) => {
    setExpandedInsights((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  if (insights.length === 0) {
    return (
      <Card className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-4 h-4 text-gold" />
          <span className="font-display text-sm font-semibold">Film School</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Select tag combinations to unlock cinematography lessons. Try pairing a camera angle with a lighting style.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center gap-2">
        <GraduationCap className="w-4 h-4 text-gold" />
        <span className="font-display text-sm font-semibold">Film School</span>
        <Badge variant="secondary" className="text-xs">
          {insights.length} {insights.length === 1 ? "lesson" : "lessons"}
        </Badge>
      </div>

      <div className="space-y-2">
        {insights.map((insight, i) => (
          <InsightCard
            key={i}
            insight={insight}
            expanded={expandedInsights.has(i)}
            onToggle={() => toggleExpand(i)}
          />
        ))}
      </div>
    </Card>
  );
}

function InsightCard({
  insight,
  expanded,
  onToggle,
}: {
  insight: CineInsight;
  expanded: boolean;
  onToggle: () => void;
}) {
  const comboTags = insight.combo
    .map((id) => ALL_TAGS[id])
    .filter(Boolean);

  return (
    <div className="rounded-lg border border-gold-dim/20 bg-gold/5 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Film className="w-3 h-3 text-gold" />
          <span className="text-sm font-semibold text-gold">{insight.title}</span>
        </div>
        <div className="flex items-center gap-1">
          {comboTags.map((tag) => (
            <Badge key={tag.id} variant="outline" className="text-[10px] px-1.5 py-0">
              {tag.label}
            </Badge>
          ))}
        </div>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed">
        {insight.explanation}
      </p>

      {insight.proTip && (
        <p className="text-xs text-gold-dim italic">
          Pro tip: {insight.proTip}
        </p>
      )}

      <button
        onClick={onToggle}
        className="flex items-center gap-1 text-[10px] text-gold/60 hover:text-gold transition-colors"
      >
        <BookOpen className="w-3 h-3" />
        <span>{expanded ? "Hide" : "Learn More"}</span>
        {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>

      {expanded && (
        <div className="rounded-md bg-background/50 p-3 space-y-2 text-xs text-muted-foreground border border-border/30">
          <div>
            <span className="font-semibold text-foreground">Psychology: </span>
            {comboTags.map((tag) => tag.psychology).filter(Boolean).join(" + ")}
          </div>
          {comboTags.some((tag) => tag.references && tag.references.length > 0) && (
            <div>
              <span className="font-semibold text-foreground">Film references: </span>
              {comboTags
                .flatMap((tag) => tag.references ?? [])
                .filter((v, i, a) => a.indexOf(v) === i)
                .join(", ")}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

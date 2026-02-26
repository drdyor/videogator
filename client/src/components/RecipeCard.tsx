import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ALL_TAGS, EMOTION_ARCS, type PresetRecipe } from "@/data/promptBuilder";

interface RecipeCardProps {
  recipe: PresetRecipe;
  onApply: (recipe: PresetRecipe) => void;
}

export default function RecipeCard({ recipe, onApply }: RecipeCardProps) {
  const emotion = EMOTION_ARCS.find((e) => e.id === recipe.emotion);
  const previewTags = recipe.tags
    .slice(0, 4)
    .map((id) => ALL_TAGS[id])
    .filter(Boolean);
  const remainingCount = Math.max(0, recipe.tags.length - 4);

  return (
    <Card
      className="p-3 cursor-pointer hover:border-gold-dim/40 transition-all space-y-2 group"
      onClick={() => onApply(recipe)}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold group-hover:text-gold transition-colors">
          {recipe.label}
        </span>
        {emotion && (
          <Badge variant="outline" className="border-gold/30 text-gold text-[10px] px-1.5 py-0 shrink-0">
            {emotion.emoji} {emotion.label}
          </Badge>
        )}
      </div>

      <p className="text-xs text-muted-foreground line-clamp-2">
        {recipe.description}
      </p>

      <div className="flex flex-wrap gap-1">
        {previewTags.map((tag) => (
          <Badge
            key={tag.id}
            variant="secondary"
            className="text-[10px] px-1.5 py-0"
          >
            {tag.label}
          </Badge>
        ))}
        {remainingCount > 0 && (
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 opacity-60">
            +{remainingCount}
          </Badge>
        )}
      </div>
    </Card>
  );
}

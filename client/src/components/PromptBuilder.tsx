import { useState, useCallback, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  X,
  Wand2,
  RotateCcw,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Pen,
  Sparkles,
  Film,
  BookOpen,
} from "lucide-react";
import {
  EMOTION_ARCS,
  SCENE_ARCHETYPES,
  TAG_CATEGORIES,
  CHARACTER_STRATEGIES,
  PRESET_RECIPES,
  ALL_TAGS,
  buildPrompt,
  getInsights,
  type EmotionArc,
  type SceneArchetype,
  type CharacterStrategy,
  type PromptTag,
  type PresetRecipe,
} from "@/data/promptBuilder";

interface PromptBuilderProps {
  value: string;
  onChange: (prompt: string) => void;
}

export default function PromptBuilder({ value, onChange }: PromptBuilderProps) {
  const [mode, setMode] = useState<"builder" | "custom">("builder");
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionArc | null>(null);
  const [selectedArchetype, setSelectedArchetype] = useState<SceneArchetype | null>(null);
  const [selectedVariation, setSelectedVariation] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedStrategy, setSelectedStrategy] = useState<CharacterStrategy | null>(null);
  const [showRecipes, setShowRecipes] = useState(false);
  const [showFilmSchool, setShowFilmSchool] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("emotion");

  // Filter archetypes by selected emotion
  const filteredArchetypes = useMemo(
    () =>
      selectedEmotion
        ? SCENE_ARCHETYPES.filter((a) => a.emotion === selectedEmotion.id)
        : SCENE_ARCHETYPES,
    [selectedEmotion]
  );

  // Get contextual insights
  const insights = useMemo(() => getInsights(selectedTags), [selectedTags]);

  // Build prompt from selections
  const assembledPrompt = useMemo(
    () =>
      buildPrompt(
        selectedTags,
        selectedEmotion ?? undefined,
        selectedArchetype ?? undefined,
        selectedVariation ?? undefined,
        selectedStrategy ?? undefined
      ),
    [selectedTags, selectedEmotion, selectedArchetype, selectedVariation, selectedStrategy]
  );

  // Sync assembled prompt to parent
  const applyPrompt = useCallback(() => {
    onChange(assembledPrompt);
  }, [assembledPrompt, onChange]);

  // Auto-apply on changes
  const updateAndApply = useCallback(
    (newTags: string[], emotion?: EmotionArc | null, archetype?: SceneArchetype | null, variation?: string | null, strategy?: CharacterStrategy | null) => {
      const prompt = buildPrompt(
        newTags,
        (emotion ?? selectedEmotion) ?? undefined,
        (archetype ?? selectedArchetype) ?? undefined,
        (variation ?? selectedVariation) ?? undefined,
        (strategy ?? selectedStrategy) ?? undefined
      );
      onChange(prompt);
    },
    [selectedEmotion, selectedArchetype, selectedVariation, selectedStrategy, onChange]
  );

  const toggleTag = useCallback(
    (tagId: string) => {
      setSelectedTags((prev) => {
        const next = prev.includes(tagId)
          ? prev.filter((t) => t !== tagId)
          : [...prev, tagId];
        updateAndApply(next);
        return next;
      });
    },
    [updateAndApply]
  );

  const selectEmotion = useCallback(
    (emotion: EmotionArc) => {
      setSelectedEmotion(emotion);
      setSelectedArchetype(null);
      setSelectedVariation(null);
      // Auto-suggest tags
      const newTags = [...new Set([...selectedTags, ...emotion.suggestedTags])];
      setSelectedTags(newTags);
      updateAndApply(newTags, emotion, null, null);
      setActiveTab("archetype");
    },
    [selectedTags, updateAndApply]
  );

  const selectArchetype = useCallback(
    (archetype: SceneArchetype) => {
      setSelectedArchetype(archetype);
      setSelectedVariation(null);
      updateAndApply(selectedTags, undefined, archetype, null);
      setActiveTab("camera");
    },
    [selectedTags, updateAndApply]
  );

  const selectVariation = useCallback(
    (variationId: string) => {
      setSelectedVariation(variationId);
      updateAndApply(selectedTags, undefined, undefined, variationId);
    },
    [selectedTags, updateAndApply]
  );

  const selectStrategy = useCallback(
    (strategy: CharacterStrategy) => {
      setSelectedStrategy((prev) => (prev?.id === strategy.id ? null : strategy));
      const newStrategy = selectedStrategy?.id === strategy.id ? null : strategy;
      updateAndApply(selectedTags, undefined, undefined, undefined, newStrategy);
    },
    [selectedTags, selectedStrategy, updateAndApply]
  );

  const applyRecipe = useCallback(
    (recipe: PresetRecipe) => {
      const emotion = EMOTION_ARCS.find((e) => e.id === recipe.emotion) ?? null;
      const archetype = SCENE_ARCHETYPES.find((a) => a.id === recipe.archetype) ?? null;
      const strategy = CHARACTER_STRATEGIES.find((s) => s.id === recipe.characterStrategy) ?? null;
      setSelectedEmotion(emotion);
      setSelectedArchetype(archetype);
      setSelectedVariation(null);
      setSelectedTags(recipe.tags);
      setSelectedStrategy(strategy);
      onChange(recipe.promptOverride ?? buildPrompt(recipe.tags, emotion ?? undefined, archetype ?? undefined, undefined, strategy ?? undefined));
      setShowRecipes(false);
    },
    [onChange]
  );

  const reset = useCallback(() => {
    setSelectedEmotion(null);
    setSelectedArchetype(null);
    setSelectedVariation(null);
    setSelectedTags([]);
    setSelectedStrategy(null);
    setActiveTab("emotion");
    onChange("");
  }, [onChange]);

  const copyPrompt = useCallback(() => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [value]);

  if (mode === "custom") {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">Prompt</span>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-gold"
            onClick={() => setMode("builder")}
          >
            <Wand2 className="w-3 h-3 mr-1" />
            Prompt Builder
          </Button>
        </div>
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Describe your video scene..."
          rows={4}
          className="resize-none"
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wand2 className="w-4 h-4 text-gold" />
          <span className="font-display text-sm font-semibold">Prompt Builder</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs"
            onClick={() => setShowRecipes(!showRecipes)}
          >
            <Sparkles className="w-3 h-3 mr-1" />
            Presets
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs"
            onClick={() => setMode("custom")}
          >
            <Pen className="w-3 h-3 mr-1" />
            Custom
          </Button>
          <Button variant="ghost" size="sm" className="text-xs" onClick={reset}>
            <RotateCcw className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Preset Recipes */}
      {showRecipes && (
        <div className="rounded-lg border border-gold-dim/20 bg-card/50 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gold-dim uppercase tracking-wider">
              Quick Recipes
            </span>
            <Button variant="ghost" size="sm" onClick={() => setShowRecipes(false)}>
              <X className="w-3 h-3" />
            </Button>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {PRESET_RECIPES.map((recipe) => (
              <button
                key={recipe.id}
                onClick={() => applyRecipe(recipe)}
                className="text-left rounded-md border border-border/40 p-3 hover:border-gold-dim/40 transition-colors space-y-1"
              >
                <span className="text-sm font-semibold">{recipe.label}</span>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {recipe.description}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Selected Tags Bar */}
      {(selectedTags.length > 0 || selectedEmotion || selectedArchetype) && (
        <div className="flex flex-wrap gap-1.5">
          {selectedEmotion && (
            <Badge
              variant="outline"
              className="border-gold/40 bg-gold/10 text-gold cursor-pointer"
              onClick={() => {
                setSelectedEmotion(null);
                updateAndApply(selectedTags, null);
              }}
            >
              {selectedEmotion.emoji} {selectedEmotion.label}
              <X className="w-3 h-3 ml-1" />
            </Badge>
          )}
          {selectedArchetype && (
            <Badge
              variant="outline"
              className="border-gold/40 bg-gold/10 text-gold cursor-pointer"
              onClick={() => {
                setSelectedArchetype(null);
                setSelectedVariation(null);
                updateAndApply(selectedTags, undefined, null, null);
              }}
            >
              {selectedArchetype.label}
              <X className="w-3 h-3 ml-1" />
            </Badge>
          )}
          {selectedTags.map((tagId) => {
            const tag = ALL_TAGS[tagId];
            if (!tag) return null;
            return (
              <Badge
                key={tagId}
                variant="outline"
                className="cursor-pointer hover:border-destructive/40"
                onClick={() => toggleTag(tagId)}
              >
                {tag.label}
                <X className="w-3 h-3 ml-1" />
              </Badge>
            );
          })}
          {selectedStrategy && (
            <Badge
              variant="outline"
              className="border-amber-500/40 text-amber-500 cursor-pointer"
              onClick={() => {
                setSelectedStrategy(null);
                updateAndApply(selectedTags, undefined, undefined, undefined, null);
              }}
            >
              {selectedStrategy.label}
              <X className="w-3 h-3 ml-1" />
            </Badge>
          )}
        </div>
      )}

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full flex overflow-x-auto">
          <TabsTrigger value="emotion" className="flex-1 text-xs">
            Emotion
          </TabsTrigger>
          <TabsTrigger value="archetype" className="flex-1 text-xs">
            Scene
          </TabsTrigger>
          {TAG_CATEGORIES.slice(0, 4).map((cat) => (
            <TabsTrigger key={cat.id} value={cat.id} className="flex-1 text-xs">
              {cat.label}
            </TabsTrigger>
          ))}
          <TabsTrigger value="more" className="flex-1 text-xs">
            More
          </TabsTrigger>
        </TabsList>

        {/* Emotion Tab */}
        <TabsContent value="emotion" className="mt-3">
          <div className="grid gap-2 grid-cols-2 sm:grid-cols-4">
            {EMOTION_ARCS.map((emotion) => (
              <button
                key={emotion.id}
                onClick={() => selectEmotion(emotion)}
                className={`rounded-lg border p-3 text-left transition-all space-y-1 ${
                  selectedEmotion?.id === emotion.id
                    ? "border-gold bg-gold/10"
                    : "border-border/40 hover:border-gold-dim/40"
                }`}
              >
                <div className="text-2xl">{emotion.emoji}</div>
                <div className="text-sm font-semibold">{emotion.label}</div>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {emotion.description}
                </p>
              </button>
            ))}
          </div>
        </TabsContent>

        {/* Archetype Tab */}
        <TabsContent value="archetype" className="mt-3 space-y-3">
          <div className="grid gap-2 grid-cols-2">
            {filteredArchetypes.map((arch) => (
              <button
                key={arch.id}
                onClick={() => selectArchetype(arch)}
                className={`rounded-lg border p-3 text-left transition-all space-y-1 ${
                  selectedArchetype?.id === arch.id
                    ? "border-gold bg-gold/10"
                    : "border-border/40 hover:border-gold-dim/40"
                }`}
              >
                <div className="text-sm font-semibold">{arch.label}</div>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {arch.description}
                </p>
              </button>
            ))}
          </div>

          {/* Style Variations */}
          {selectedArchetype && (
            <div className="space-y-2">
              <span className="text-xs font-semibold text-gold-dim uppercase tracking-wider">
                Style Variation
              </span>
              <div className="flex flex-wrap gap-2">
                {selectedArchetype.styleVariations.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => selectVariation(v.id)}
                    className={`rounded-md border px-3 py-1.5 text-xs transition-all ${
                      selectedVariation === v.id
                        ? "border-gold bg-gold/10 text-gold"
                        : "border-border/40 hover:border-gold-dim/40"
                    }`}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* Technical Tag Tabs */}
        {TAG_CATEGORIES.slice(0, 4).map((category) => (
          <TabsContent key={category.id} value={category.id} className="mt-3">
            <TagGrid
              tags={category.tags}
              selectedTags={selectedTags}
              onToggle={toggleTag}
            />
          </TabsContent>
        ))}

        {/* More Tab (remaining categories + character strategy) */}
        <TabsContent value="more" className="mt-3 space-y-4">
          {TAG_CATEGORIES.slice(4).map((category) => (
            <div key={category.id} className="space-y-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {category.icon} {category.label}
              </span>
              <TagGrid
                tags={category.tags}
                selectedTags={selectedTags}
                onToggle={toggleTag}
              />
            </div>
          ))}

          {/* Character Strategy */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Character Strategy
            </span>
            <p className="text-xs text-muted-foreground">
              Open-source models can't maintain character consistency between shots.
              Choose how to handle faces.
            </p>
            <div className="grid gap-2 grid-cols-2 sm:grid-cols-3">
              {CHARACTER_STRATEGIES.map((strategy) => (
                <button
                  key={strategy.id}
                  onClick={() => selectStrategy(strategy)}
                  className={`rounded-md border p-2 text-left transition-all ${
                    selectedStrategy?.id === strategy.id
                      ? "border-amber-500 bg-amber-500/10"
                      : "border-border/40 hover:border-gold-dim/40"
                  }`}
                >
                  <div className="text-xs font-semibold">{strategy.label}</div>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                    {strategy.description}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Film School Panel */}
      {insights.length > 0 && (
        <div className="space-y-2">
          <button
            onClick={() => setShowFilmSchool(!showFilmSchool)}
            className="flex items-center gap-2 text-xs text-gold hover:text-gold/80 transition-colors"
          >
            <BookOpen className="w-3 h-3" />
            <span className="font-semibold">Why This Works</span>
            {showFilmSchool ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
          </button>
          {showFilmSchool && (
            <div className="space-y-2">
              {insights.map((insight, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-gold-dim/20 bg-gold/5 p-3 space-y-1.5"
                >
                  <div className="flex items-center gap-2">
                    <Film className="w-3 h-3 text-gold" />
                    <span className="text-sm font-semibold text-gold">
                      {insight.title}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {insight.explanation}
                  </p>
                  {insight.proTip && (
                    <p className="text-xs text-gold-dim italic">
                      Pro tip: {insight.proTip}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Generated Prompt Preview */}
      {value && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Generated Prompt
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs"
              onClick={copyPrompt}
            >
              {copied ? (
                <Check className="w-3 h-3 mr-1 text-emerald-500" />
              ) : (
                <Copy className="w-3 h-3 mr-1" />
              )}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={3}
            className="resize-none text-xs"
          />
        </div>
      )}
    </div>
  );
}

// ─── Tag Grid Sub-Component ───────────────────────────────────────────────────

function TagGrid({
  tags,
  selectedTags,
  onToggle,
}: {
  tags: PromptTag[];
  selectedTags: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => {
        const isSelected = selectedTags.includes(tag.id);
        return (
          <Tooltip key={tag.id}>
            <TooltipTrigger asChild>
              <button
                onClick={() => onToggle(tag.id)}
                className={`rounded-md border px-3 py-1.5 text-xs transition-all ${
                  isSelected
                    ? "border-gold bg-gold/10 text-gold font-medium"
                    : "border-border/40 text-muted-foreground hover:border-gold-dim/40 hover:text-foreground"
                }`}
              >
                {tag.label}
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              <div className="space-y-1">
                <p className="text-xs font-semibold">{tag.label}</p>
                <p className="text-xs">{tag.description}</p>
                {tag.psychology && (
                  <p className="text-xs text-muted-foreground italic">
                    {tag.psychology}
                  </p>
                )}
                {tag.references && tag.references.length > 0 && (
                  <p className="text-xs text-gold-dim">
                    Used in: {tag.references.join(", ")}
                  </p>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}

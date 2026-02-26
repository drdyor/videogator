import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import type { EmotionArc } from "@/data/promptBuilder";

const STORAGE_KEY = "videogator-custom-arcs";

const EMOTION_OPTIONS = [
  "Anticipation", "Yearning", "Curiosity", "Nostalgia", "Discomfort",
  "Build-up", "Potential", "Intrigue", "Hope", "Dread",
  "Recognition", "Realization", "Acceptance", "Release", "Activation",
  "Investigation", "Impact", "Overwhelm", "Terror", "Elation",
  "Connection", "Peace", "Unleashed", "Loss", "Deeper mystery",
];

const EMOJI_OPTIONS = [
  { value: "\u{1F3AC}", label: "Clapper" },
  { value: "\u{1F525}", label: "Fire" },
  { value: "\u{2728}", label: "Sparkles" },
  { value: "\u{1F30A}", label: "Wave" },
  { value: "\u{1F319}", label: "Moon" },
  { value: "\u{26A1}", label: "Lightning" },
  { value: "\u{1F48E}", label: "Gem" },
  { value: "\u{1F3AD}", label: "Masks" },
];

interface PhaseData {
  emotion: string;
  visual: string;
}

const EMPTY_PHASE: PhaseData = { emotion: "", visual: "" };

export function loadCustomArcs(): EmotionArc[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveCustomArcs(arcs: EmotionArc[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(arcs));
}

interface EmotionArcBuilderProps {
  onArcCreated: (arc: EmotionArc) => void;
}

export default function EmotionArcBuilder({ onArcCreated }: EmotionArcBuilderProps) {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  const [emoji, setEmoji] = useState("\u{1F3AC}");
  const [phases, setPhases] = useState<[PhaseData, PhaseData, PhaseData]>([
    { ...EMPTY_PHASE },
    { ...EMPTY_PHASE },
    { ...EMPTY_PHASE },
  ]);

  const phaseNames = ["Beginning", "Middle", "End"] as const;

  const updatePhase = (index: number, field: keyof PhaseData, value: string) => {
    setPhases((prev) => {
      const next = [...prev] as [PhaseData, PhaseData, PhaseData];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const isValid =
    label.trim() &&
    description.trim() &&
    phases.every((p) => p.emotion && p.visual.trim());

  const handleCreate = () => {
    if (!isValid) return;

    const arc: EmotionArc = {
      id: `custom_${Date.now()}`,
      label: label.trim(),
      emoji,
      description: description.trim(),
      progression: phases.map((p, i) => ({
        phase: phaseNames[i],
        emotion: p.emotion,
        visual: p.visual.trim(),
      })),
      suggestedTags: [],
      promptPrefix: `${description.trim()}, emotional progression from ${phases[0].emotion.toLowerCase()} through ${phases[1].emotion.toLowerCase()} to ${phases[2].emotion.toLowerCase()}`,
    };

    const existing = loadCustomArcs();
    saveCustomArcs([...existing, arc]);
    onArcCreated(arc);

    // Reset form
    setLabel("");
    setDescription("");
    setEmoji("\u{1F3AC}");
    setPhases([{ ...EMPTY_PHASE }, { ...EMPTY_PHASE }, { ...EMPTY_PHASE }]);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="rounded-lg border border-dashed border-gold-dim/30 p-3 text-left transition-all hover:border-gold-dim/60 space-y-1">
          <div className="text-2xl">
            <Plus className="w-6 h-6 text-gold-dim/50" />
          </div>
          <div className="text-sm font-semibold text-gold-dim/70">Custom Arc</div>
          <p className="text-xs text-muted-foreground">Create your own</p>
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Custom Emotion Arc</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Name & Emoji */}
          <div className="grid grid-cols-[1fr_auto] gap-3">
            <div>
              <Label className="text-xs">Name</Label>
              <Input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g. Rising Fury"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Icon</Label>
              <Select value={emoji} onValueChange={setEmoji}>
                <SelectTrigger className="mt-1 w-[72px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EMOJI_OPTIONS.map((e) => (
                    <SelectItem key={e.value} value={e.value}>
                      {e.value} {e.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Description */}
          <div>
            <Label className="text-xs">Description</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short mood description..."
              className="mt-1"
            />
          </div>

          {/* Phases */}
          <div className="space-y-3">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Emotional Progression
            </Label>
            {phaseNames.map((phaseName, i) => (
              <div key={phaseName} className="rounded-md border p-3 space-y-2">
                <span className="text-xs font-semibold">{phaseName}</span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-[10px] text-muted-foreground">Emotion</Label>
                    <Select
                      value={phases[i].emotion}
                      onValueChange={(v) => updatePhase(i, "emotion", v)}
                    >
                      <SelectTrigger className="mt-0.5 h-8 text-xs">
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        {EMOTION_OPTIONS.map((e) => (
                          <SelectItem key={e} value={e} className="text-xs">
                            {e}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-[10px] text-muted-foreground">Visual</Label>
                    <Input
                      value={phases[i].visual}
                      onChange={(e) => updatePhase(i, "visual", e.target.value)}
                      placeholder="What happens visually..."
                      className="mt-0.5 h-8 text-xs"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Button onClick={handleCreate} disabled={!isValid} className="w-full">
            Create Emotion Arc
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface CustomArcListProps {
  arcs: EmotionArc[];
  selectedId: string | null;
  onSelect: (arc: EmotionArc) => void;
  onDelete: (arcId: string) => void;
}

export function CustomArcList({ arcs, selectedId, onSelect, onDelete }: CustomArcListProps) {
  if (arcs.length === 0) return null;

  return (
    <div className="space-y-2">
      <span className="text-xs font-semibold text-gold-dim uppercase tracking-wider">
        My Arcs
      </span>
      <div className="grid gap-2 grid-cols-2 sm:grid-cols-4">
        {arcs.map((arc) => (
          <div key={arc.id} className="relative group">
            <button
              onClick={() => onSelect(arc)}
              className={`w-full rounded-lg border p-3 text-left transition-all space-y-1 ${
                selectedId === arc.id
                  ? "border-gold bg-gold/10"
                  : "border-border/40 hover:border-gold-dim/40"
              }`}
            >
              <div className="text-2xl">{arc.emoji}</div>
              <div className="text-sm font-semibold">{arc.label}</div>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {arc.description}
              </p>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(arc.id);
              }}
              className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-destructive/10"
            >
              <Trash2 className="w-3 h-3 text-destructive" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Plus, Play, Trash2, Settings2, Server, CheckCircle2, XCircle, Info, Eye, Film, Lightbulb, Camera, Aperture, Clapperboard, Zap, Gauge, Save, Sparkles } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import GeneratingAnimation from "@/components/GeneratingAnimation";
import PromptBuilder from "@/components/PromptBuilder";
import GatorMascot from "@/components/GatorMascot";

type VideoModel = "hunyuan-video" | "mochi" | "cogvideo" | "modelscope" | "stable-video-diffusion" | "wan-2.2" | "wan-2.2-5b" | "ltx-2";

// Model profiles optimized for 4090 (24GB VRAM)
const MODEL_PROFILES: Record<string, { vram: number; quality: number; speed: string; frames: number; resolution: string; label: string; desc: string }> = {
  "wan-2.2": { vram: 18, quality: 10, speed: "slow", frames: 81, resolution: "832x480", label: "Wan 2.2 (14B)", desc: "Top quality, cinematic" },
  "wan-2.2-5b": { vram: 10, quality: 8, speed: "medium", frames: 81, resolution: "832x480", label: "Wan 2.2 (5B)", desc: "Great quality + I2V" },
  "ltx-2": { vram: 6, quality: 7, speed: "fast", frames: 97, resolution: "768x512", label: "LTX-Video", desc: "Fast + audio sync" },
  "hunyuan-video": { vram: 20, quality: 9, speed: "slow", frames: 65, resolution: "848x480", label: "HunyuanVideo", desc: "High quality" },
  "mochi": { vram: 16, quality: 9, speed: "slow", frames: 65, resolution: "848x480", label: "Mochi 1", desc: "Photorealism" },
  "cogvideo": { vram: 8, quality: 7, speed: "fast", frames: 49, resolution: "720x480", label: "CogVideoX-5B", desc: "Efficient 6s clips" },
  "modelscope": { vram: 4, quality: 5, speed: "fastest", frames: 16, resolution: "256x256", label: "ModelScope", desc: "Fast preview" },
  "stable-video-diffusion": { vram: 8, quality: 8, speed: "fast", frames: 25, resolution: "1024x576", label: "SVD (I2V)", desc: "Image animation" },
};

const GATOR_PRESETS = [
  { 
    id: "laboratory", 
    name: "Gator's Lab", 
    desc: "Art Deco glassware, vintage science",
    lens: "50mm",
    lighting: "high-key",
    movement: "static",
    dof: 2.8,
    why: "Normal lens shows the lab equipment accurately. High key lighting represents scientific clarity and discovery.",
    filmRef: "Classic scientific documentaries (1950s)"
  },
  { 
    id: "noir-alley", 
    name: "Noir Alley", 
    desc: "Rainy street, neon signs",
    lens: "85mm",
    lighting: "low-key",
    movement: "static",
    dof: 1.4,
    why: "Telephoto compresses distance. Low key creates mystery - only Gator's eyes visible in shadow.",
    filmRef: "The Godfather (1972), Blade Runner (1982)"
  },
  { 
    id: "sunset-beach", 
    name: "Sunset Beach", 
    desc: "Golden hour, ocean",
    lens: "35mm",
    lighting: "high-key",
    movement: "dolly-out",
    dof: 8,
    why: "Wide angle captures the landscape. Dolly out reveals the beautiful sunset context.",
    filmRef: "From Here to Eternity (1953)"
  },
  { 
    id: "cyberpunk", 
    name: "Cyberpunk City", 
    desc: "Futuristic, neon holograms",
    lens: "14mm",
    lighting: "chiaroscuro",
    movement: "tracking",
    dof: 2.0,
    why: "Wide angle creates dynamic distorted reflections in neon. Chiaroscuro for dramatic contrast.",
    filmRef: "Blade Runner (1982), The Matrix (1999)"
  },
  { 
    id: "wild-west", 
    name: "Wild West", 
    desc: "Desert, dusty, cactus",
    lens: "135mm",
    lighting: "rembrandt",
    movement: "dolly-in",
    dof: 4.0,
    why: "Telephoto isolates Gator against the vast desert. Rembrandt lighting adds western drama.",
    filmRef: "The Good, The Bad and The Ugly (1966)"
  },
  { 
    id: "space", 
    name: "Space Station", 
    desc: "Astronaut, stars",
    lens: "24mm",
    lighting: "low-key",
    movement: "static",
    dof: 1.8,
    why: "Wide but not extreme. Low key simulates harsh space lighting. Stars in focus = deep focus technique.",
    filmRef: "2001: A Space Odyssey (1968)"
  },
];

// Video Gator's technical reference data
const GATOR_LENSES = [
  { value: "14mm", label: "14mm Wide", desc: "Barrel distortion, everything close", icon: "🔭" },
  { value: "35mm", label: "35mm Standard", desc: "Natural perspective, slight wideness", icon: "📷" },
  { value: "50mm", label: "50mm Normal", desc: "Human eye equivalent, no distortion", icon: "👁️" },
  { value: "85mm", label: "85mm Portrait", desc: "Flattering compression, creamy bokeh", icon: "🎭" },
  { value: "135mm", label: "135mm Telephoto", desc: "Heavy compression, isolated subject", icon: "🔍" },
];

const GATOR_LIGHTING = [
  { value: "low-key", label: "Low Key", desc: "High contrast, dramatic shadows", ratio: "8:1", icon: "🌑" },
  { value: "high-key", label: "High Key", desc: "Bright, even lighting, cheerful", ratio: "2:1", icon: "☀️" },
  { value: "chiaroscuro", label: "Chiaroscuro", desc: "Bold contrast, single light source", ratio: "10:1", icon: "🎬" },
  { value: "rembrandt", label: "Rembrandt", desc: "Triangle cheek shadow, classic", ratio: "4:1", icon: "🎨" },
];

const GATOR_MOVEMENT = [
  { value: "static", label: "Static", desc: "No camera movement", icon: "⏸️" },
  { value: "dolly-in", label: "Dolly Push-In", desc: "Moving closer, building tension", icon: "➡️" },
  { value: "dolly-out", label: "Dolly Pull-Out", desc: "Moving away, revealing context", icon: "⬅️" },
  { value: "pan", label: "Pan", desc: "Horizontal sweep", icon: "↔️" },
  { value: "tilt", label: "Tilt", desc: "Vertical sweep", icon: "↕️" },
  { value: "tracking", label: "Tracking Shot", desc: "Following subject movement", icon: "🎯" },
];

type Operation =
  | { id: string; type: "edit"; action: "trim"; params: { start: number; end: number } }
  | { id: string; type: "generate"; params: {
      prompt: string;
      negativePrompt: string;
      model: VideoModel;
      width: number;
      height: number;
      numFrames: number;
      numInferenceSteps: number;
      guidanceScale: number;
      seed?: number;
      fps: number;
    }};

const VIDEO_MODELS: { value: VideoModel; label: string; description: string }[] = [
  { value: "wan-2.2", label: "Wan 2.2 (14B)", description: "Top quality, 832x480, 81 frames, ~16-20GB VRAM" },
  { value: "wan-2.2-5b", label: "Wan 2.2 (5B)", description: "Great quality + I2V, 832x480, 81 frames, ~10GB VRAM" },
  { value: "ltx-2", label: "LTX-Video", description: "Fast + audio sync, 768x512, 97 frames, ~16GB VRAM" },
  { value: "hunyuan-video", label: "HunyuanVideo", description: "High quality, 848x480, 65 frames, ~20GB VRAM" },
  { value: "mochi", label: "Mochi 1", description: "Photorealism, 848x480, 65 frames, ~16GB VRAM" },
  { value: "cogvideo", label: "CogVideoX-5B", description: "Efficient 6s clips, 720x480, 49 frames, ~8GB VRAM" },
  { value: "modelscope", label: "ModelScope", description: "Fast preview, 256x256, 16 frames, ~4GB VRAM" },
  { value: "stable-video-diffusion", label: "SVD (Image-to-Video)", description: "Image animation, 1024x576, 25 frames" },
];

const MODEL_DEFAULTS: Record<VideoModel, { width: number; height: number; numFrames: number }> = {
  "hunyuan-video": { width: 848, height: 480, numFrames: 65 },
  "mochi": { width: 848, height: 480, numFrames: 65 },
  "cogvideo": { width: 720, height: 480, numFrames: 49 },
  "modelscope": { width: 256, height: 256, numFrames: 16 },
  "stable-video-diffusion": { width: 1024, height: 576, numFrames: 25 },
  "wan-2.2": { width: 832, height: 480, numFrames: 81 },
  "wan-2.2-5b": { width: 832, height: 480, numFrames: 81 },
  "ltx-2": { width: 768, height: 512, numFrames: 97 },
};

function createId() {
  return Math.random().toString(36).slice(2, 10);
}

export default function VideoFoundry() {
  const { isAuthenticated } = useAuth();
  const [inputUrl, setInputUrl] = useState("");
  const [jobId, setJobId] = useState<string | null>(null);
  const [savedJobs, setSavedJobs] = useState<string[]>([]);
  const [operations, setOperations] = useState<Operation[]>([]);
  
  // Video Gator's current setup (for visual reference)
  const [gatorLens, setGatorLens] = useState("85mm");
  const [gatorLighting, setGatorLighting] = useState("low-key");
  const [gatorMovement, setGatorMovement] = useState("static");
  const [gatorDof, setGatorDof] = useState(1.4);
  const [showGatorPanel, setShowGatorPanel] = useState(true);
  const [selectedPreset, setSelectedPreset] = useState<typeof GATOR_PRESETS[0] | null>(null);
  const [showTeachingMode, setShowTeachingMode] = useState(true);
  
  // Saved prompts (The Formulary)
  const [savedPrompts, setSavedPrompts] = useState<{id: string; name: string; prompt: string; model: string}[]>([
    { id: "1", name: "Cinematic Intro", prompt: "A majestic establishing shot", model: "wan-2.2" },
    { id: "2", name: "Action Sequence", prompt: "Dynamic action shot", model: "hunyuan-video" },
    { id: "3", name: "Moody Portrait", prompt: "Intimate close-up", model: "ltx-2" },
  ]);

  const createJobMutation = trpc.video.create.useMutation();
  const generateMutation = trpc.video.generate.useMutation();
  const statusQuery = trpc.video.status.useQuery(
    { jobId: jobId ?? "" },
    { enabled: Boolean(jobId), refetchInterval: 3000 }
  );
  
  // Check video server health
  const serverHealthQuery = trpc.video.serverHealth.useQuery(undefined, {
    refetchInterval: 30000, // Check every 30 seconds
  });

  const serverAvailable = serverHealthQuery.data?.available ?? false;
  const serverDevice = (serverHealthQuery.data as any)?.device ?? "unknown";
  const serverGpu = (serverHealthQuery.data as any)?.gpu_available ? "GPU" : "CPU";

  // Can run if we have operations (input URL optional for text-to-video)
  const canRun = operations.length > 0;

  const outputUrl = useMemo(() => {
    const data: any = statusQuery.data;
    if (!data) return "";
    if (data.outputUrl) return data.outputUrl;
    if (data.stepResults) {
      try {
        const parsed = typeof data.stepResults === "string" ? JSON.parse(data.stepResults) : data.stepResults;
        return parsed?.[parsed.length - 1] ?? "";
      } catch {
        return "";
      }
    }
    return "";
  }, [statusQuery.data]);

  const addTrim = () => {
    setOperations(prev => [
      ...prev,
      { id: createId(), type: "edit", action: "trim", params: { start: 0, end: 5 } },
    ]);
  };

  const addGenerate = () => {
    const defaultModel: VideoModel = "hunyuan-video";
    const defaults = MODEL_DEFAULTS[defaultModel];
    setOperations(prev => [
      ...prev,
      {
        id: createId(),
        type: "generate",
        params: {
          prompt: "",
          negativePrompt: "",
          model: defaultModel,
          width: defaults.width,
          height: defaults.height,
          numFrames: defaults.numFrames,
          numInferenceSteps: 30,
          guidanceScale: 7.0,
          fps: 24,
        },
      },
    ]);
  };

  const updateOperation = (id: string, update: Partial<Operation>) => {
    setOperations(prev =>
      prev.map(op => (op.id === id ? ({ ...op, ...update } as Operation) : op))
    );
  };

  const updateParams = (id: string, params: Record<string, any>) => {
    setOperations(prev =>
      prev.map(op => (op.id === id ? ({ ...op, params: { ...op.params, ...params } } as Operation) : op))
    );
  };

  const removeOperation = (id: string) => {
    setOperations(prev => prev.filter(op => op.id !== id));
  };

  const handleRun = async () => {
    if (!canRun) return;
    
    // If we have a single generate operation and server is available, use direct generation
    if (operations.length === 1 && operations[0].type === "generate" && serverAvailable) {
      const op = operations[0];
      try {
        const result = await generateMutation.mutateAsync({
          prompt: op.params.prompt,
          negativePrompt: op.params.negativePrompt,
          model: op.params.model,
          width: op.params.width,
          height: op.params.height,
          numFrames: op.params.numFrames,
          numInferenceSteps: op.params.numInferenceSteps,
          guidanceScale: op.params.guidanceScale,
          seed: op.params.seed,
          fps: op.params.fps,
        });
        setJobId(result.jobId);
        addSavedJob(result.jobId);
      } catch (error) {
        console.error("Direct generation failed, falling back to queue:", error);
        // Fall back to queue
        const payload = [{ type: "generate", params: op.params }];
        const result = await createJobMutation.mutateAsync({
          inputUrl: inputUrl.trim() || undefined,
          operations: payload,
        });
        setJobId(result.jobId);
        addSavedJob(result.jobId);
      }
      return;
    }
    
    // Use queue for multiple operations or when server is not available
    const payload = operations.map(op => {
      if (op.type === "edit") {
        return { type: "edit", action: op.action, params: op.params };
      }
      return { type: "generate", params: op.params };
    });

    const result = await createJobMutation.mutateAsync({
      inputUrl: inputUrl.trim() || undefined,
      operations: payload,
    });
    setJobId(result.jobId);
    addSavedJob(result.jobId);
  };

  // Persist and load saved job IDs to/from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem("vg_saved_jobs");
      if (raw) setSavedJobs(JSON.parse(raw));
    } catch (e) {
      console.warn("Failed to load saved jobs", e);
    }
  }, []);

  const addSavedJob = (id: string) => {
    setSavedJobs(prev => {
      if (prev.includes(id)) return prev;
      const next = [id, ...prev].slice(0, 50);
      try { localStorage.setItem("vg_saved_jobs", JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const removeSavedJob = (id: string) => {
    setSavedJobs(prev => {
      const next = prev.filter(x => x !== id);
      try { localStorage.setItem("vg_saved_jobs", JSON.stringify(next)); } catch {}
      return next;
    });
  };

  if (!isAuthenticated) {
    return (
      <Card className="p-12 text-center">
        <p className="text-muted-foreground mb-4">Please log in to access Video Foundry</p>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-4xl font-display font-bold gold-gradient-text">Video Foundry</h1>
          <p className="text-gold-dim">
            Generate videos with local GPU acceleration. Select a model, write a prompt, and click <span className="text-gold font-semibold">Run Pipeline</span> to create your video.
          </p>
        </div>
        
        {/* Server Status */}
        <Card className="art-deco-card p-3 flex items-center gap-3">
          <Gauge className="w-5 h-5 text-gold" />
          <div className="text-sm">
            <div className="font-medium">RTX 4090</div>
            {serverAvailable ? (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span className="text-green-400">Available</span>
                <Badge variant="secondary" className="text-xs bg-gold/10 text-gold">
                  24GB
                </Badge>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-destructive">
                <XCircle className="w-4 h-4" />
                <span>Offline</span>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Video Gator Studio Reference */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gator Preview Canvas */}
        <div className="lg:col-span-2">
          <Card className="art-deco-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clapperboard className="w-5 h-5 text-gold" />
                <h3 className="font-display font-semibold">Video Gator Studio</h3>
                <span className="text-xs bg-gold/20 text-gold px-2 py-0.5 rounded border border-gold/30">
                  FREE
                </span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowGatorPanel(!showGatorPanel)}
                className="text-gold-dim"
              >
                {showGatorPanel ? "Hide" : "Show"} Controls
              </Button>
            </div>
            
            {/* Gator Visualization */}
            <div className="relative aspect-video bg-gradient-to-br from-burgundy/30 via-background to-burgundy/20 rounded-lg overflow-hidden border border-gold-dim/20">
              {/* Art Deco Sunburst Background */}
              <div className="absolute inset-0 opacity-20">
                <svg viewBox="0 0 400 300" className="w-full h-full">
                  <defs>
                    <radialGradient id="sunburst" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="var(--gold)" />
                      <stop offset="100%" stopColor="transparent" />
                    </radialGradient>
                  </defs>
                  <circle cx="200" cy="150" r="180" fill="url(#sunburst)" />
                  {[...Array(12)].map((_, i) => (
                    <line 
                      key={i} 
                      x1="200" y1="150" 
                      x2={200 + 200 * Math.cos(i * 30 * Math.PI / 180)} 
                      y2={150 + 200 * Math.sin(i * 30 * Math.PI / 180)} 
                      stroke="var(--gold-dim)" 
                      strokeWidth="1" 
                      opacity="0.3"
                    />
                  ))}
                </svg>
              </div>
              
              {/* Video Gator Mascot */}
              <div className="absolute inset-0 flex items-center justify-center">
                <GatorMascot size="lg" variant="framed" />
              </div>
              
              {/* Technical Overlay */}
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                <div className="flex gap-2">
                  <Badge className="bg-burgundy/80 text-foreground border-gold-dim/30">
                    📐 {gatorLens}
                  </Badge>
                  <Badge className="bg-burgundy/80 text-foreground border-gold-dim/30">
                    💡 {gatorLighting}
                  </Badge>
                  <Badge className="bg-burgundy/80 text-foreground border-gold-dim/30">
                    🎬 {gatorMovement}
                  </Badge>
                </div>
                <Badge className="bg-gold/20 text-gold border-gold">
                  f/{gatorDof}
                </Badge>
              </div>
            </div>
            
            {/* Gator's Current Reading */}
            <div className="mt-4 p-4 bg-gold/5 border border-gold-dim/20 rounded-lg">
              <div className="flex items-start gap-3">
                <Eye className="w-5 h-5 text-gold mt-0.5" />
                <div>
                  <h4 className="font-display text-sm font-semibold text-gold">Gator's Technical Reading</h4>
                  <p className="text-sm text-gold-dim mt-1">
                    At {gatorLens}, Video Gator appears {gatorLens === "14mm" ? "comically close with distorted snout" : gatorLens === "85mm" ? "perfectly proportioned with creamy background blur" : "with natural perspective"}. 
                    The {gatorLighting} lighting creates {gatorLighting === "low-key" ? "dramatic shadows—moral ambiguity" : gatorLighting === "high-key" ? "bright, even coverage—optimistic tone" : "bold contrast pattern"}. 
                    {gatorMovement === "static" ? "Static frame creates tension through stillness." : gatorMovement === "dolly-in" ? "Dolly push builds suspense—forced perspective." : "Camera movement reveals " + gatorMovement + "."}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
        
        {/* Technical Control Panel */}
        <div className="space-y-4">
          {/* Lens Selection */}
          <Card className="art-deco-card p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-gold" />
                <h4 className="font-display text-sm font-semibold">Lens (Focal Length)</h4>
              </div>
              {showTeachingMode && (
                <Badge variant="outline" className="text-xs text-gold-dim border-gold-dim/30">
                  🎓 Learning
                </Badge>
              )}
            </div>
            {showTeachingMode && (
              <p className="text-xs text-gold-dim mb-3 pb-3 border-b border-gold-dim/20">
                <span className="text-gold font-medium">Focal length</span> determines angle of view and compression. 
                Wide = more scene, Tele = isolated subject.
              </p>
            )}
            <div className="grid grid-cols-2 gap-2">
              {GATOR_LENSES.map((lens) => (
                <button
                  key={lens.value}
                  onClick={() => setGatorLens(lens.value)}
                  className={`p-2 rounded-lg border text-left transition-all ${
                    gatorLens === lens.value 
                      ? "border-gold bg-gold/10 text-gold" 
                      : "border-gold-dim/20 text-gold-dim hover:border-gold-dim/50"
                  }`}
                >
                  <div className="text-xs font-medium">{lens.value}</div>
                  <div className="text-xs opacity-70">{lens.desc}</div>
                </button>
              ))}
            </div>
          </Card>
          
          {/* Lighting Selection */}
          <Card className="art-deco-card p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-gold" />
                <h4 className="font-display text-sm font-semibold">Lighting Style</h4>
              </div>
              {showTeachingMode && (
                <Badge variant="outline" className="text-xs text-gold-dim border-gold-dim/30">
                  🎓 Learning
                </Badge>
              )}
            </div>
            {showTeachingMode && (
              <p className="text-xs text-gold-dim mb-3 pb-3 border-b border-gold-dim/20">
                <span className="text-gold font-medium">Lighting ratio</span> = key light ÷ fill light. 
                High ratio = dramatic shadows (mystery). Low ratio = even lighting (optimistic).
              </p>
            )}
            <div className="grid grid-cols-2 gap-2">
              {GATOR_LIGHTING.map((light) => (
                <button
                  key={light.value}
                  onClick={() => setGatorLighting(light.value)}
                  className={`p-2 rounded-lg border text-left transition-all ${
                    gatorLighting === light.value 
                      ? "border-gold bg-gold/10 text-gold" 
                      : "border-gold-dim/20 text-gold-dim hover:border-gold-dim/50"
                  }`}
                >
                  <div className="text-xs font-medium">{light.icon} {light.value}</div>
                  <div className="text-xs opacity-70">{light.desc}</div>
                </button>
              ))}
            </div>
          </Card>
          
          {/* Movement Selection */}
          <Card className="art-deco-card p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Film className="w-4 h-4 text-gold" />
                <h4 className="font-display text-sm font-semibold">Camera Movement</h4>
              </div>
              {showTeachingMode && (
                <Badge variant="outline" className="text-xs text-gold-dim border-gold-dim/30">
                  🎓 Learning
                </Badge>
              )}
            </div>
            {showTeachingMode && (
              <p className="text-xs text-gold-dim mb-3 pb-3 border-b border-gold-dim/20">
                <span className="text-gold font-medium">Camera movement</span> controls pacing and tension. 
                Static = stillness (danger). Dolly in = building suspense. Pan = following action.
              </p>
            )}
            <div className="grid grid-cols-3 gap-2">
              {GATOR_MOVEMENT.map((move) => (
                <button
                  key={move.value}
                  onClick={() => setGatorMovement(move.value)}
                  className={`p-2 rounded-lg border text-center transition-all ${
                    gatorMovement === move.value 
                      ? "border-gold bg-gold/10 text-gold" 
                      : "border-gold-dim/20 text-gold-dim hover:border-gold-dim/50"
                  }`}
                >
                  <div className="text-lg mb-1">{move.icon}</div>
                  <div className="text-xs">{move.label}</div>
                </button>
              ))}
            </div>
          </Card>
          
          {/* Depth of Field */}
          <Card className="art-deco-card p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Aperture className="w-4 h-4 text-gold" />
                <h4 className="font-display text-sm font-semibold">Aperture (f-stop)</h4>
              </div>
              {showTeachingMode && (
                <Badge variant="outline" className="text-xs text-gold-dim border-gold-dim/30">
                  🎓 Learning
                </Badge>
              )}
            </div>
            {showTeachingMode && (
              <p className="text-xs text-gold-dim mb-3 pb-3 border-b border-gold-dim/20">
                <span className="text-gold font-medium">Lower f-stop</span> = wider aperture = more blur (bokeh). 
                Higher f-stop = sharper image throughout. f/1.4 = isolate subject. f/16 = everything sharp.
              </p>
            )}
            <Slider
              value={[gatorDof]}
              onValueChange={([value]) => setGatorDof(value)}
              min={1.4}
              max={16}
              step={0.1}
              className="mb-2"
            />
            <div className="flex justify-between text-xs text-gold-dim">
              <span>f/1.4 (Shallow)</span>
              <span className="text-gold font-medium">f/{gatorDof.toFixed(1)}</span>
              <span>f/16 (Deep)</span>
            </div>
          </Card>
        </div>
      </div>

      {/* Gator Presets (Image Scenes) */}
      <Card className="art-deco-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-gold" />
            <h3 className="font-display font-semibold">Gator's World - Scene Presets</h3>
            <span className="text-xs bg-gold/20 text-gold px-2 py-0.5 rounded border border-gold/30">FREE</span>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setShowTeachingMode(!showTeachingMode)}
            className={showTeachingMode ? "text-gold" : "text-gold-dim"}
          >
            {showTeachingMode ? "🎓 Teaching Mode: ON" : "🎓 Teaching Mode: OFF"}
          </Button>
        </div>
        <p className="text-sm text-gold-dim mb-4">Choose a preset scene for your Gator. Click to see the technical breakdown.</p>
        
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-4">
          {GATOR_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => {
                setSelectedPreset(preset);
                setGatorLens(preset.lens);
                setGatorLighting(preset.lighting);
                setGatorMovement(preset.movement);
                setGatorDof(preset.dof);
              }}
              className={`aspect-square rounded-lg border transition-all group ${
                selectedPreset?.id === preset.id 
                  ? "border-gold bg-gold/20" 
                  : "border-gold-dim/30 hover:border-gold bg-gold/5"
              }`}
            >
              <div className="text-2xl mb-1">
                {preset.id === "laboratory" && "🧪"}
                {preset.id === "noir-alley" && "🌃"}
                {preset.id === "sunset-beach" && "🌅"}
                {preset.id === "cyberpunk" && "🌃"}
                {preset.id === "wild-west" && "🏜️"}
                {preset.id === "space" && "🚀"}
              </div>
              <div className="text-xs text-gold group-hover:text-gold/70">{preset.name}</div>
            </button>
          ))}
        </div>

        {/* Educational Content - Shows when teaching mode is on */}
        {showTeachingMode && selectedPreset && (
          <div className="p-4 bg-burgundy/20 border border-gold-dim/30 rounded-lg">
            <h4 className="font-display font-semibold text-gold mb-2">📚 Technical Breakdown: {selectedPreset.name}</h4>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
              <div className="text-center p-2 bg-background/50 rounded">
                <div className="text-xs text-gold-dim">Lens</div>
                <div className="font-medium text-gold">{selectedPreset.lens}</div>
              </div>
              <div className="text-center p-2 bg-background/50 rounded">
                <div className="text-xs text-gold-dim">Lighting</div>
                <div className="font-medium text-gold">{selectedPreset.lighting}</div>
              </div>
              <div className="text-center p-2 bg-background/50 rounded">
                <div className="text-xs text-gold-dim">Movement</div>
                <div className="font-medium text-gold">{selectedPreset.movement}</div>
              </div>
              <div className="text-center p-2 bg-background/50 rounded">
                <div className="text-xs text-gold-dim">Aperture</div>
                <div className="font-medium text-gold">f/{selectedPreset.dof}</div>
              </div>
            </div>
            
            <div className="mb-2">
              <div className="text-xs text-gold-dim mb-1">💡 Why this works:</div>
              <div className="text-sm text-gold/80">{selectedPreset.why}</div>
            </div>
            
            <div>
              <div className="text-xs text-gold-dim mb-1">🎬 Film Reference:</div>
              <div className="text-sm text-gold/80">{selectedPreset.filmRef}</div>
            </div>
          </div>
        )}
      </Card>

      {/* Saved Prompts - The Formulary */}
      <Card className="art-deco-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Save className="w-5 h-5 text-gold" />
            <h3 className="font-display font-semibold">The Formulary - Saved Prompts</h3>
          </div>
          <Button size="sm" className="bg-gold text-background hover:bg-gold/90">
            + Save Current
          </Button>
        </div>
        <div className="space-y-2">
          {savedPrompts.map((prompt) => (
            <div 
              key={prompt.id}
              className="flex items-center justify-between p-3 rounded-lg border border-gold-dim/20 hover:border-gold-dim/50 bg-gold/5 transition-all cursor-pointer group"
            >
              <div className="flex-1">
                <div className="text-sm font-medium text-gold">{prompt.name}</div>
                <div className="text-xs text-gold-dim truncate">{prompt.prompt}</div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs bg-gold/10 text-gold">
                  {MODEL_PROFILES[prompt.model]?.label || prompt.model}
                </Badge>
                <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100 text-gold">
                  Apply
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Quick Model Presets for 4090 */}
      <Card className="art-deco-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-5 h-5 text-gold" />
          <h3 className="font-display font-semibold">Quick Presets - Optimized for Your 4090</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button className="p-4 rounded-lg border border-gold-dim/30 hover:border-gold bg-gold/5 transition-all text-left group">
            <div className="text-lg mb-1">⚡</div>
            <div className="font-medium text-gold">Fast Preview</div>
            <div className="text-xs text-gold-dim">ModelScope • 4GB</div>
            <div className="text-xs text-gold-dim mt-1">~16 frames • 256×256</div>
          </button>
          <button className="p-4 rounded-lg border border-gold-dim/30 hover:border-gold bg-gold/5 transition-all text-left group">
            <div className="text-lg mb-1">🎬</div>
            <div className="font-medium text-gold">Cinematic</div>
            <div className="text-xs text-gold-dim">Wan 2.2 • 18GB</div>
            <div className="text-xs text-gold-dim mt-1">~81 frames • 832×480</div>
          </button>
          <button className="p-4 rounded-lg border border-gold-dim/30 hover:border-gold bg-gold/5 transition-all text-left group">
            <div className="text-lg mb-1">🔄</div>
            <div className="font-medium text-gold">Motion Loop</div>
            <div className="text-xs text-gold-dim">LTX-Video • 6GB</div>
            <div className="text-xs text-gold-dim mt-1">~97 frames • 768×512</div>
          </button>
          <button className="p-4 rounded-lg border border-gold-dim/30 hover:border-gold bg-gold/5 transition-all text-left group">
            <div className="text-lg mb-1">💎</div>
            <div className="font-medium text-gold">High Quality</div>
            <div className="text-xs text-gold-dim">HunyuanVideo • 20GB</div>
            <div className="text-xs text-gold-dim mt-1">~65 frames • 848×480</div>
          </button>
        </div>
      </Card>

      {/* How to Use */}
      <Card className="art-deco-card p-4 bg-gold/5 border-gold/20">
        <div className="flex items-start gap-3">
          <div className="text-2xl">💡</div>
          <div>
            <h3 className="font-display font-semibold text-gold">How to Generate a Video</h3>
            <ol className="text-sm text-gold-dim mt-2 space-y-1 list-decimal list-inside">
              <li>Click <span className="text-gold font-medium">"Add Generate"</span> below to create a generation step</li>
              <li>Select your AI model (HunyuanVideo, Wan, LTX-Video, etc.)</li>
              <li>Write a descriptive prompt for your video</li>
              <li>Click <span className="text-gold font-medium">"Run Pipeline"</span> to start generating</li>
            </ol>
          </div>
        </div>
      </Card>

      <Card className="art-deco-card p-6 space-y-4">
        <div>
          <div className="flex items-center gap-2">
            <label htmlFor="input-video-url" className="text-sm font-medium">
              Start Image (optional)
            </label>
            <span className="text-xs bg-gold/20 text-gold px-2 py-0.5 rounded border border-gold/30">
              🔒 Pro
            </span>
          </div>
          <p className="text-xs text-gold-dim mt-1 mb-2">
            Use a custom image. Default: Video Gator (free)
          </p>
          <Input
            id="input-video-url"
            name="inputVideoUrl"
            placeholder="🔒 Pro feature: Enter custom image URL"
            value={inputUrl}
            onChange={event => setInputUrl(event.target.value)}
            disabled
            className="mt-2 opacity-50"
          />
          <p className="text-xs text-gold-dim mt-1">
            💡 <span className="text-gold">Free default:</span> Leave empty to use Video Gator as your subject
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="border-gold-dim/40 text-gold hover:bg-gold/10" onClick={addTrim}>
            <Plus className="w-4 h-4 mr-2" />
            Add Trim
          </Button>
          <Button className="bg-gold text-background hover:bg-gold/90" onClick={addGenerate}>
            <Plus className="w-4 h-4 mr-2" />
            Add Generate
          </Button>
        </div>

        <div className="space-y-3">
          {operations.length === 0 ? (
            <div className="text-center py-12 text-gold-dim border-2 border-dashed border-gold-dim/20 rounded-lg">
              <p className="text-lg mb-2">No operations yet</p>
              <p className="text-sm">Click <span className="text-gold font-medium">"Add Generate"</span> above to start creating your video</p>
            </div>
          ) : (
            operations.map((op, index) => (
              <Card key={op.id} className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-semibold">
                    Step {index + 1}: {op.type === "edit" ? "Trim" : "Generate"}
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => removeOperation(op.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                {op.type === "edit" && (
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <label htmlFor={`trim-start-${op.id}`} className="text-xs text-muted-foreground">Start (sec)</label>
                      <Input
                        id={`trim-start-${op.id}`}
                        name={`trimStart-${op.id}`}
                        type="number"
                        value={op.params.start}
                        onChange={event =>
                          updateParams(op.id, { start: Number(event.target.value) })
                        }
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label htmlFor={`trim-end-${op.id}`} className="text-xs text-muted-foreground">End (sec)</label>
                      <Input
                        id={`trim-end-${op.id}`}
                        name={`trimEnd-${op.id}`}
                        type="number"
                        value={op.params.end}
                        onChange={event =>
                          updateParams(op.id, { end: Number(event.target.value) })
                        }
                        className="mt-1"
                      />
                    </div>
                  </div>
                )}

                {op.type === "generate" && (
                  <div className="grid gap-4">
                    {/* Model Selection */}
                    <div>
                      <Label htmlFor={`generate-model-${op.id}`} className="text-xs text-gold-dim">Model</Label>
                      <Select
                        value={op.params.model}
                        onValueChange={(value: VideoModel) => {
                          const defaults = MODEL_DEFAULTS[value];
                          const profile = MODEL_PROFILES[value];
                          updateParams(op.id, { 
                            model: value,
                            width: defaults.width,
                            height: defaults.height,
                            numFrames: defaults.numFrames,
                          });
                        }}
                      >
                        <SelectTrigger id={`generate-model-${op.id}`} className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {VIDEO_MODELS.map(m => {
                            const profile = MODEL_PROFILES[m.value];
                            return (
                              <SelectItem key={m.value} value={m.value}>
                                <div className="flex items-center justify-between w-full">
                                  <div>
                                    <div className="font-medium">{m.label}</div>
                                    <div className="text-xs text-muted-foreground">{m.description}</div>
                                  </div>
                                  {profile && (
                                    <Badge variant="secondary" className={`ml-2 text-xs ${profile.vram <= 8 ? 'bg-green-500/20 text-green-400' : profile.vram <= 16 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                                      {profile.vram}GB VRAM
                                    </Badge>
                                  )}
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Prompt Builder */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-xs text-gold-dim">Prompt</Label>
                        <span className="text-xs bg-gold/10 text-gold px-2 py-0.5 rounded">
                          🎓 Learn Cinema
                        </span>
                      </div>
                      <p className="text-xs text-gold-dim mb-2">
                        🎓 These presets teach cinematic techniques. Select tags to learn film language - the AI may not follow perfectly, but you'll learn the vocabulary of cinema!
                      </p>
                      <PromptBuilder
                      value={op.params.prompt}
                      onChange={(prompt) => updateParams(op.id, { prompt })}
                    />

                    {/* Negative Prompt */}
                    <div>
                      <Label htmlFor={`negative-prompt-${op.id}`} className="text-xs text-muted-foreground">Negative Prompt</Label>
                      <Input
                        id={`negative-prompt-${op.id}`}
                        name={`negativePrompt-${op.id}`}
                        value={op.params.negativePrompt}
                        onChange={event =>
                          updateParams(op.id, { negativePrompt: event.target.value })
                        }
                        className="mt-1"
                        placeholder="blurry, low quality..."
                      />
                    </div>

                    {/* Resolution */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor={`width-${op.id}`} className="text-xs text-muted-foreground">Width</Label>
                        <Input
                          id={`width-${op.id}`}
                          name={`width-${op.id}`}
                          type="number"
                          value={op.params.width}
                          onChange={event =>
                            updateParams(op.id, { width: Number(event.target.value) })
                          }
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`height-${op.id}`} className="text-xs text-muted-foreground">Height</Label>
                        <Input
                          id={`height-${op.id}`}
                          name={`height-${op.id}`}
                          type="number"
                          value={op.params.height}
                          onChange={event =>
                            updateParams(op.id, { height: Number(event.target.value) })
                          }
                          className="mt-1"
                        />
                      </div>
                    </div>

                    {/* Advanced Settings */}
                    <details className="group">
                      <summary className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                        <Settings2 className="w-4 h-4" />
                        Advanced Settings
                      </summary>
                      <div className="mt-3 space-y-4 pl-6">
                        {/* Frames */}
                        <div>
                          <Label className="text-xs text-muted-foreground">
                            Frames: {op.params.numFrames}
                          </Label>
                          <Slider
                            value={[op.params.numFrames]}
                            onValueChange={([value]) =>
                              updateParams(op.id, { numFrames: value })
                            }
                            min={9}
                            max={129}
                            step={4}
                            className="mt-1"
                          />
                        </div>

                        {/* Inference Steps */}
                        <div>
                          <Label className="text-xs text-muted-foreground">
                            Inference Steps: {op.params.numInferenceSteps}
                          </Label>
                          <Slider
                            value={[op.params.numInferenceSteps]}
                            onValueChange={([value]) =>
                              updateParams(op.id, { numInferenceSteps: value })
                            }
                            min={10}
                            max={100}
                            step={5}
                            className="mt-1"
                          />
                        </div>

                        {/* Guidance Scale */}
                        <div>
                          <Label className="text-xs text-muted-foreground">
                            Guidance Scale: {op.params.guidanceScale}
                          </Label>
                          <Slider
                            value={[op.params.guidanceScale]}
                            onValueChange={([value]) =>
                              updateParams(op.id, { guidanceScale: value })
                            }
                            min={1}
                            max={20}
                            step={0.5}
                            className="mt-1"
                          />
                        </div>

                        {/* FPS */}
                        <div>
                          <Label className="text-xs text-muted-foreground">
                            FPS: {op.params.fps}
                          </Label>
                          <Slider
                            value={[op.params.fps]}
                            onValueChange={([value]) =>
                              updateParams(op.id, { fps: value })
                            }
                            min={8}
                            max={60}
                            step={1}
                            className="mt-1"
                          />
                        </div>

                        {/* Seed */}
                        <div>
                          <Label htmlFor={`seed-${op.id}`} className="text-xs text-muted-foreground">Seed (optional)</Label>
                          <Input
                            id={`seed-${op.id}`}
                            name={`seed-${op.id}`}
                            type="number"
                            value={op.params.seed ?? ""}
                            onChange={event =>
                              updateParams(op.id, { 
                                seed: event.target.value ? Number(event.target.value) : undefined 
                              })
                            }
                            placeholder="Random"
                            className="mt-1"
                          />
                        </div>
                      </div>
                    </details>
                  </div>
                )}
              </Card>
            ))
          )}
        </div>

        <div className="flex items-center gap-3">
          <Button 
            onClick={handleRun} 
            disabled={!canRun || createJobMutation.isPending}
            className="bg-gold text-background hover:bg-gold/90 px-8"
            size="lg"
          >
            {createJobMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Run Pipeline
              </>
            )}
          </Button>
          {!canRun && (
            <span className="text-sm text-gold-dim">
              Add a Generate step to enable video creation
            </span>
          )}
          {jobId && (
            <span className="text-sm text-gold-dim">Job: {jobId}</span>
          )}
        </div>
      </Card>

      {/* Saved Jobs */}
      {savedJobs.length > 0 && (
        <Card className="art-deco-card p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="font-semibold">Saved Jobs</div>
            <div className="text-sm text-gold-dim">{savedJobs.length} saved</div>
          </div>
          <div className="flex flex-col gap-2">
            {savedJobs.map(id => (
              <div key={id} className="flex items-center justify-between">
                <div className="text-sm text-gold-dim truncate">{id}</div>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => setJobId(id)}>
                    <Eye className="w-4 h-4 mr-2" /> View
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => removeSavedJob(id)}>
                    <Trash2 className="w-4 h-4 mr-2" /> Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Show animation when Processing */}
      {jobId && (statusQuery.data as any)?.status === "processing" && (
        <GeneratingAnimation
          prompt={operations.find(op => op.type === "generate")?.params.prompt}
          progress={50}
          estimatedTime={60}
        />
      )}

      {jobId && (
        <Card className="p-6 space-y-3">
          <div className="flex items-center justify-between">
            <div className="font-semibold">Job Status</div>
            {statusQuery.isFetching && (
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            )}
          </div>
          <div className="text-sm text-muted-foreground">
            Status: {(statusQuery.data as any)?.status ?? "queued"}
          </div>
          { (statusQuery.data as any)?.error_suggestion && (
            <div className="mt-2 p-3 bg-destructive/5 rounded border border-destructive/10">
              <div className="text-sm font-medium text-destructive">Suggestion to avoid OOM</div>
              <div className="text-xs text-muted-foreground mt-1">
                Recommended max frames: {(statusQuery.data as any)?.error_suggestion.recommended_max_frames}
                {" — "}
                Experimental max frames: {(statusQuery.data as any)?.error_suggestion.experimental_max_frames}
              </div>
            </div>
          )}
          {outputUrl && (
            <div className="space-y-2">
              <div className="text-sm font-medium">Latest Output</div>
              <video src={outputUrl} controls className="w-full rounded-lg" />
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

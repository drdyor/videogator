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
import { Loader2, Plus, Play, Trash2, Settings2, Server, CheckCircle2, XCircle, Info, Eye, Film, Lightbulb, Camera, Aperture, Clapperboard } from "lucide-react";
import { useMemo, useState, useEffect, useRef } from "react";
import GeneratingAnimation from "@/components/GeneratingAnimation";
import PromptBuilder from "@/components/PromptBuilder";
import GatorMascot from "@/components/GatorMascot";
import { Textarea } from "@/components/ui/textarea";

type VideoModel = "hunyuan-video" | "mochi" | "cogvideo" | "modelscope" | "stable-video-diffusion" | "wan-2.2" | "wan-2.2-5b" | "ltx-2" | "humo" | "kling-2.5" | "luma-ray-flash-2" | "minimax-video-01";

// Job status from video server
interface JobStatus {
  jobId: string;
  status: string;
  progress: number;
  outputUrl?: string;
  error?: string;
  errorSuggestion?: string;
}

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
  const [operations, setOperations] = useState<Operation[]>([]);
  
  // Story Mode state
  const [storyMode, setStoryMode] = useState(false);
  const [storyInput, setStoryInput] = useState("");
  const [storyModel, setStoryModel] = useState<VideoModel>("wan-2.2");
  const [storyReferenceImageUrl, setStoryReferenceImageUrl] = useState("");
  const [storyAudioUrl, setStoryAudioUrl] = useState("");
  const [scenes, setScenes] = useState<string[]>([]);
  const [generatedClips, setGeneratedClips] = useState<{scene: string; url: string; jobId: string}[]>([]);
  const [isGeneratingStory, setIsGeneratingStory] = useState(false);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(-1);
  const [storyError, setStoryError] = useState<string | null>(null);
  
  // Stitch state
  const [stitchJobId, setStitchJobId] = useState<string | null>(null);
  const [stitchStatus, setStitchStatus] = useState<string | null>(null);
  const [stitchedVideoUrl, setStitchedVideoUrl] = useState<string | null>(null);
  const [isStitching, setIsStitching] = useState(false);
  
  // Video Gator's current setup (for visual reference)
  const [gatorLens, setGatorLens] = useState("85mm");
  const [gatorLighting, setGatorLighting] = useState("low-key");
  const [gatorMovement, setGatorMovement] = useState("static");
  const [gatorDof, setGatorDof] = useState(1.4);
  const [showGatorPanel, setShowGatorPanel] = useState(true);

  const createJobMutation = trpc.video.create.useMutation();
  const generateMutation = trpc.video.generate.useMutation({
    onSuccess: (data) => {
      setJobId(data.jobId);
    },
    onError: (error) => {
      setStoryError(`Generation failed: ${error.message}`);
      setIsGeneratingStory(false);
    },
  });

  // Keep a stable ref to the mutation so the story useEffect doesn't need it as a dep
  const generateMutationRef = useRef(generateMutation);
  useEffect(() => { generateMutationRef.current = generateMutation; });

  // Track which job IDs have already been processed to prevent duplicate clips
  // when the effect re-runs while statusQuery still shows the previous job as completed
  const processedJobsRef = useRef<Set<string>>(new Set());

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
    const data: JobStatus = statusQuery.data;
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
          fps: 8,
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

  // Story Mode functions
  const parseStoryToScenes = (story: string): string[] => {
    // Simple parsing: split by periods, newlines, or numbered markers
    // In production, this could call an LLM for smarter parsing
    const rawScenes = story
      .split(/[\.\n]+/)
      .map(s => s.trim())
      .filter(s => s.length > 10); // Filter out very short fragments
    
    if (rawScenes.length < 2) {
      // Try splitting by common connectors if no clear sentences
      const fallback = story
        .split(/,(?=\w+\s+(?:then|and|after|before|following|next|finally))/i)
        .map(s => s.trim())
        .filter(s => s.length > 10);
      return fallback.length >= 2 ? fallback : rawScenes;
    }
    return rawScenes;
  };

  const startStoryGeneration = async () => {
    if (!storyInput.trim() || !serverAvailable) return;
    
    const parsedScenes = parseStoryToScenes(storyInput);
    if (parsedScenes.length < 2) {
      setStoryError("Please enter a longer story with at least 2 scenes (separated by periods or new lines)");
      return;
    }
    
    processedJobsRef.current = new Set();
    setScenes(parsedScenes);
    setGeneratedClips([]);
    setIsGeneratingStory(true);
    setStoryError(null);
    setCurrentSceneIndex(0);
    
    // Per-model param defaults
    const cloudModels: VideoModel[] = ["humo", "kling-2.5", "luma-ray-flash-2", "minimax-video-01"];
    const isCloud = cloudModels.includes(storyModel);
    const baseParams = isCloud
      ? { width: 1280, height: 720, numFrames: 49, numInferenceSteps: 50, guidanceScale: 5.0, fps: 25 }
      : { width: 832, height: 480, numFrames: 81, numInferenceSteps: 30, guidanceScale: 7.0, fps: 8 };

    // Generate first scene
    try {
      const result = await generateMutation.mutateAsync({
        prompt: parsedScenes[0],
        negativePrompt: "",
        model: storyModel,
        ...baseParams,
        ...(isCloud && storyReferenceImageUrl ? { imageUrl: storyReferenceImageUrl } : {}),
        ...(storyModel === "humo" && storyAudioUrl ? { audioUrl: storyAudioUrl } : {}),
      });
      setJobId(result.jobId);
    } catch (error) {
      setStoryError(`Generation failed: ${error instanceof Error ? error.message : "Unknown error"}`);
      setIsGeneratingStory(false);
    }
  };

  // Handle stitch button click
  const handleStitch = async () => {
    if (generatedClips.length < 2) {
      setStoryError("Need at least 2 clips to stitch");
      return;
    }
    
    const stitchWorkerUrl = import.meta.env.VITE_STITCH_WORKER_URL;
    const stitchWorkerKey = import.meta.env.VITE_STITCH_WORKER_KEY;
    
    if (!stitchWorkerUrl || !stitchWorkerKey) {
      setStoryError("Stitch worker not configured. Please set VITE_STITCH_WORKER_URL and VITE_STITCH_WORKER_KEY.");
      return;
    }
    
    setIsStitching(true);
    setStoryError(null);
    
    try {
      const clipUrls = generatedClips.map(c => c.url);
      
      const response = await fetch(`${stitchWorkerUrl}/stitch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": stitchWorkerKey,
        },
        body: JSON.stringify({
          clips: clipUrls,
          transition: "fade",
          fade_duration: 0.5,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Stitch failed: ${response.statusText}`);
      }
      
      const result = await response.json();
      setStitchJobId(result.job_id);
      setStitchStatus(result.status);
      
      // Poll for completion
      pollStitchStatus(result.job_id, stitchWorkerUrl, stitchWorkerKey);
    } catch (error) {
      setStoryError(`Stitch failed: ${error instanceof Error ? error.message : "Unknown error"}`);
      setIsStitching(false);
    }
  };

  // Poll stitch job status
  const pollStitchStatus = async (jobId: string, baseUrl: string, apiKey: string) => {
    const maxAttempts = 60;
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      await new Promise(r => setTimeout(r, 2000));
      
      try {
        const response = await fetch(`${baseUrl}/status/${jobId}`, {
          headers: { "x-api-key": apiKey },
        });
        
        if (!response.ok) continue;
        
        const status = await response.json();
        setStitchStatus(status.status);
        
        if (status.status === "done" && status.output_url) {
          setStitchedVideoUrl(`${baseUrl}${status.output_url}`);
          setIsStitching(false);
          return;
        } else if (status.status === "error") {
          setStoryError(`Stitch failed: ${status.error || "Unknown error"}`);
          setIsStitching(false);
          return;
        }
      } catch (e) {
        // Continue polling on error
      }
      
      attempts++;
    }
    
    setStoryError("Stitch timed out");
    setIsStitching(false);
  };

  // Watch for job completion and advance to next scene.
  // NOTE: generateMutation is intentionally kept out of deps via generateMutationRef
  // to prevent this effect from re-triggering after mutate() is called, which would
  // cause duplicate clips to be added while statusQuery still shows the old job as completed.
  useEffect(() => {
    if (!isGeneratingStory || currentSceneIndex < 0 || !jobId || !statusQuery.data) return;

    const status = statusQuery.data as JobStatus;

    if (status.status === "completed" && status.outputUrl) {
      // Guard: each completed job should only be processed once
      if (processedJobsRef.current.has(jobId)) return;
      processedJobsRef.current.add(jobId);

      setGeneratedClips(prev => [...prev, { scene: scenes[currentSceneIndex], url: status.outputUrl!, jobId }]);

      if (currentSceneIndex < scenes.length - 1) {
        const nextIndex = currentSceneIndex + 1;
        setCurrentSceneIndex(nextIndex);

        const isCloud = (["humo", "kling-2.5", "luma-ray-flash-2", "minimax-video-01"] as VideoModel[]).includes(storyModel);
        const nextParams = isCloud
          ? { width: 1280, height: 720, numFrames: 49, numInferenceSteps: 50, guidanceScale: 5.0, fps: 25 }
          : { width: 832, height: 480, numFrames: 81, numInferenceSteps: 30, guidanceScale: 7.0, fps: 8 };

        generateMutationRef.current.mutate({
          prompt: scenes[nextIndex],
          negativePrompt: "",
          model: storyModel,
          ...nextParams,
          ...(isCloud && storyReferenceImageUrl ? { imageUrl: storyReferenceImageUrl } : {}),
          ...(storyModel === "humo" && storyAudioUrl ? { audioUrl: storyAudioUrl } : {}),
        });
      } else {
        // All scenes generated - ready for stitching
        setIsGeneratingStory(false);
        setCurrentSceneIndex(-1);
      }
    } else if (status.status === "failed") {
      setStoryError(`Scene ${currentSceneIndex + 1} failed: ${(status as any).error ?? "Unknown error"}`);
      setIsGeneratingStory(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusQuery.data, isGeneratingStory, currentSceneIndex, jobId, scenes, storyModel]);

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
      } catch (error) {
        console.error("Direct generation failed, falling back to queue:", error);
        // Fall back to queue
        const payload = [{ type: "generate", params: op.params }];
        const result = await createJobMutation.mutateAsync({
          inputUrl: inputUrl.trim() || undefined,
          operations: payload,
        });
        setJobId(result.jobId);
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
          <Server className="w-5 h-5 text-gold" />
          <div className="text-sm">
            <div className="font-medium">Video Server</div>
            {serverHealthQuery.isLoading ? (
              <div className="text-gold-dim">Checking...</div>
            ) : serverAvailable ? (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>Online</span>
                <Badge variant="secondary" className="text-xs bg-gold/10 text-gold">
                  {serverDevice === "cuda" ? `${serverGpu}` : "CPU"}
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
                <h3 className="font-display font-semibold">Video Gator's Studio</h3>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowGatorPanel(!showGatorPanel)}
                className="text-gold-dim"
              >
                {showGatorPanel ? "Hide" : "Show"} Gator Panel
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
            <div className="flex items-center gap-2 mb-3">
              <Camera className="w-4 h-4 text-gold" />
              <h4 className="font-display text-sm font-semibold">Lens (Focal Length)</h4>
            </div>
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
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-4 h-4 text-gold" />
              <h4 className="font-display text-sm font-semibold">Lighting Style</h4>
            </div>
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
            <div className="flex items-center gap-2 mb-3">
              <Film className="w-4 h-4 text-gold" />
              <h4 className="font-display text-sm font-semibold">Camera Movement</h4>
            </div>
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
            <div className="flex items-center gap-2 mb-3">
              <Aperture className="w-4 h-4 text-gold" />
              <h4 className="font-display text-sm font-semibold">Aperture (f-stop)</h4>
            </div>
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

      {/* Story Mode */}
      <Card className="art-deco-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Film className="w-5 h-5 text-gold" />
            <h3 className="font-display font-semibold text-gold">Story Mode</h3>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            className="border-gold-dim/40 text-gold"
            onClick={() => {
              setStoryMode(!storyMode);
              if (storyMode) {
                setStoryInput("");
                setScenes([]);
                setGeneratedClips([]);
                setStoryError(null);
              }
            }}
          >
            {storyMode ? "Switch to Pipeline" : "Try Story Mode"}
          </Button>
        </div>
        
        {storyMode ? (
          <div className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground">Your Story / Script</Label>
              <Textarea
                placeholder="A dragon flies over a medieval castle. The dragon lands in a meadow. It breathes fire into the sky."
                value={storyInput}
                onChange={(e) => setStoryInput(e.target.value)}
                className="mt-2 min-h-[120px]"
                disabled={isGeneratingStory}
              />
              <p className="text-xs text-gold-dim mt-2">
                Enter a narrative with multiple scenes separated by periods or new lines.
              </p>
            </div>

            {/* Model selector */}
            <div>
              <Label className="text-xs text-muted-foreground">Video Model</Label>
              <Select 
                value={storyModel} 
                onValueChange={(value) => setStoryModel(value as VideoModel)}
                disabled={isGeneratingStory}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="wan-2.2">Wan 2.2 (Fast, 8GB local)</SelectItem>
                  <SelectItem value="wan-2.2-5b">Wan 2.2 5B (Better quality, 14GB local)</SelectItem>
                  <SelectItem value="hunyuan-video">Hunyuan Video (Great quality, 12GB local)</SelectItem>
                  <SelectItem value="mochi">Mochi (Anime style, 8GB local)</SelectItem>
                  <SelectItem value="ltx-2">LTX 2 (Latest, 8GB local)</SelectItem>
                  <SelectItem value="humo">HuMo — ByteDance ☁ (Human-centric, lip-sync)</SelectItem>
                  <SelectItem value="kling-2.5">Kling 2.5 Turbo ☁ (Cinematic, fast)</SelectItem>
                  <SelectItem value="luma-ray-flash-2">Luma Ray Flash 2 ☁ (Camera control)</SelectItem>
                  <SelectItem value="minimax-video-01">MiniMax Video 01 ☁ (Strong motion)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Cloud model inputs (HuMo / Kling / Luma / MiniMax) */}
            {(["humo", "kling-2.5", "luma-ray-flash-2", "minimax-video-01"] as VideoModel[]).includes(storyModel) && (
              <div className="space-y-3 p-3 bg-gold/5 border border-gold/20 rounded-lg">
                <p className="text-xs text-gold font-medium">
                  ☁ Runs on Replicate cloud — requires <code className="bg-gold/10 px-1 rounded">REPLICATE_API_TOKEN</code> in your .env
                </p>
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Reference / Start Frame Image URL{storyModel === "humo" ? " (locks character appearance)" : " (optional)"}
                  </Label>
                  <Input
                    placeholder="https://example.com/image.jpg"
                    value={storyReferenceImageUrl}
                    onChange={(e) => setStoryReferenceImageUrl(e.target.value)}
                    className="mt-1"
                    disabled={isGeneratingStory}
                  />
                </div>
                {storyModel === "humo" && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Audio URL (optional — enables lip-sync, MP3/WAV)</Label>
                    <Input
                      placeholder="https://example.com/audio.mp3"
                      value={storyAudioUrl}
                      onChange={(e) => setStoryAudioUrl(e.target.value)}
                      className="mt-1"
                      disabled={isGeneratingStory}
                    />
                  </div>
                )}
              </div>
            )}

            {storyError && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                {storyError}
              </div>
            )}

            {scenes.length > 0 && !isGeneratingStory && generatedClips.length === 0 && (
              <div className="p-3 bg-gold/10 border border-gold/30 rounded-lg">
                <p className="text-sm text-gold font-medium mb-2">Parsed {scenes.length} scenes:</p>
                <ul className="text-sm text-gold-dim space-y-1">
                  {scenes.map((scene, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-gold">{i + 1}.</span>
                      <span>{scene}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {isGeneratingStory && (
              <GeneratingAnimation 
                prompt={`Generating scene ${currentSceneIndex + 1} of ${scenes.length}`}
              />
            )}

            {generatedClips.length > 0 && !isGeneratingStory && (
              <div className="space-y-3">
                <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <p className="text-sm text-green-400 font-medium">
                    ✓ All {generatedClips.length} scenes generated!
                  </p>
                  <p className="text-xs text-gold-dim mt-1">
                    Click "Stitch Together" to combine them into one video.
                  </p>
                </div>
                
                <div className="grid gap-2">
                  {generatedClips.map((clip, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 bg-background rounded">
                      <span className="text-gold font-medium text-sm">{i + 1}.</span>
                      <span className="text-sm text-gold-dim flex-1 truncate">{clip.scene}</span>
                      <a 
                        href={clip.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-gold hover:underline"
                      >
                        View Clip
                      </a>
                    </div>
                  ))}
                </div>

                <Button 
                  className="w-full bg-gold text-background hover:bg-gold/90"
                  onClick={handleStitch}
                  disabled={isStitching}
                >
                  {isStitching ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Stitching...
                    </>
                  ) : (
                    <>
                      <Film className="w-4 h-4 mr-2" />
                      Stitch Together
                    </>
                  )}
                </Button>
                
                {/* Show stitched video result */}
                {stitchedVideoUrl && (
                  <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                    <p className="text-sm text-green-400 font-medium mb-2">
                      ✓ Video stitched successfully!
                    </p>
                    <a 
                      href={stitchedVideoUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-gold hover:underline flex items-center gap-2"
                    >
                      <Film className="w-4 h-4" />
                      View Final Video
                    </a>
                  </div>
                )}
                
                {/* Show stitch status while processing */}
                {isStitching && stitchStatus && (
                  <div className="p-3 bg-gold/10 border border-gold/30 rounded-lg">
                    <p className="text-sm text-gold font-medium">
                      Status: {stitchStatus}
                    </p>
                  </div>
                )}
              </div>
            )}

            {!isGeneratingStory && generatedClips.length === 0 && (
              <Button 
                className="w-full bg-gold text-background hover:bg-gold/90"
                onClick={startStoryGeneration}
                disabled={!serverAvailable || storyInput.trim().length < 20}
              >
                <Play className="w-4 h-4 mr-2" />
                {serverAvailable ? "Generate Story" : "Video Server Offline"}
              </Button>
            )}
          </div>
        ) : (
          <p className="text-sm text-gold-dim">
            Enter a narrative script and let AI break it into scenes, generate each clip, and auto-stitch them together.
          </p>
        )}
      </Card>

      <Card className="art-deco-card p-6 space-y-4">
        <div>
          <label htmlFor="input-video-url" className="text-sm font-medium">Input Video URL (optional for text-to-video)</label>
          <Input
            id="input-video-url"
            name="inputVideoUrl"
            placeholder="https://example.com/video.mp4 - leave empty for text-to-video"
            value={inputUrl}
            onChange={event => setInputUrl(event.target.value)}
            className="mt-2"
          />
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
                      <Label htmlFor={`generate-model-${op.id}`} className="text-xs text-muted-foreground">Model</Label>
                      <Select
                        value={op.params.model}
                        onValueChange={(value: VideoModel) => {
                          const defaults = MODEL_DEFAULTS[value];
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
                          {VIDEO_MODELS.map(m => (
                            <SelectItem key={m.value} value={m.value}>
                              <div>
                                <div className="font-medium">{m.label}</div>
                                <div className="text-xs text-muted-foreground">{m.description}</div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Prompt Builder */}
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

      {/* Show animation when Processing */}
      {jobId && (statusQuery.data as JobStatus)?.status === "processing" && (
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
            Status: {(statusQuery.data as JobStatus)?.status ?? "queued"}
          </div>
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

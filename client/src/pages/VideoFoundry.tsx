import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Play, Trash2, Settings2, Server, CheckCircle2, XCircle } from "lucide-react";
import { useMemo, useState } from "react";
import GeneratingAnimation from "@/components/GeneratingAnimation";
import PromptBuilder from "@/components/PromptBuilder";

type VideoModel = "hunyuan-video" | "mochi" | "cogvideo" | "modelscope" | "stable-video-diffusion" | "wan-2.2" | "wan-2.2-5b" | "ltx-2";

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
          <Button onClick={handleRun} disabled={!canRun || createJobMutation.isPending}>
            {createJobMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Queuing...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Run Pipeline
              </>
            )}
          </Button>
          {jobId && (
            <span className="text-sm text-muted-foreground">Job: {jobId}</span>
          )}
        </div>
      </Card>

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

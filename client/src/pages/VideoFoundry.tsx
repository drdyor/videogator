import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, Play, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

type Operation =
  | { id: string; type: "edit"; action: "trim"; params: { start: number; end: number } }
  | { id: string; type: "generate"; params: { prompt: string; negativePrompt: string } };

function createId() {
  return Math.random().toString(36).slice(2, 10);
}

export default function VideoFoundry() {
  const { isAuthenticated } = useAuth();
  const [inputUrl, setInputUrl] = useState("");
  const [jobId, setJobId] = useState<string | null>(null);
  const [operations, setOperations] = useState<Operation[]>([]);

  const createJobMutation = trpc.video.create.useMutation();
  const statusQuery = trpc.video.status.useQuery(
    { jobId: jobId ?? "" },
    { enabled: Boolean(jobId), refetchInterval: 3000 }
  );

  const canRun = inputUrl.trim().length > 0 && operations.length > 0;

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
    setOperations(prev => [
      ...prev,
      {
        id: createId(),
        type: "generate",
        params: { prompt: "", negativePrompt: "" },
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
    const payload = operations.map(op => {
      if (op.type === "edit") {
        return { type: "edit", action: op.action, params: op.params };
      }
      return { type: "generate", params: op.params };
    });

    const result = await createJobMutation.mutateAsync({
      inputUrl: inputUrl.trim(),
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
      <div className="space-y-2">
        <h1 className="text-4xl font-bold">Video Foundry</h1>
        <p className="text-muted-foreground">
          Build a pipeline: trim → generate → output. This is wired to the BullMQ engine.
        </p>
      </div>

      <Card className="p-6 space-y-4">
        <div>
          <label className="text-sm font-medium">Input Video URL</label>
          <Input
            placeholder="https://example.com/video.mp4"
            value={inputUrl}
            onChange={event => setInputUrl(event.target.value)}
            className="mt-2"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={addTrim}>
            <Plus className="w-4 h-4 mr-2" />
            Add Trim
          </Button>
          <Button variant="outline" onClick={addGenerate}>
            <Plus className="w-4 h-4 mr-2" />
            Add Generate
          </Button>
        </div>

        <div className="space-y-3">
          {operations.length === 0 ? (
            <div className="text-sm text-muted-foreground">No operations yet.</div>
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
                      <label className="text-xs text-muted-foreground">Start (sec)</label>
                      <Input
                        type="number"
                        value={op.params.start}
                        onChange={event =>
                          updateParams(op.id, { start: Number(event.target.value) })
                        }
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">End (sec)</label>
                      <Input
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
                  <div className="grid gap-3">
                    <div>
                      <label className="text-xs text-muted-foreground">Prompt</label>
                      <Input
                        value={op.params.prompt}
                        onChange={event =>
                          updateParams(op.id, { prompt: event.target.value })
                        }
                        className="mt-1"
                        placeholder="A cinematic product demo..."
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Negative Prompt</label>
                      <Input
                        value={op.params.negativePrompt}
                        onChange={event =>
                          updateParams(op.id, { negativePrompt: event.target.value })
                        }
                        className="mt-1"
                        placeholder="blurry, low quality..."
                      />
                    </div>
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

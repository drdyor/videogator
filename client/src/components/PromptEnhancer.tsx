import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, Undo2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface PromptEnhancerProps {
  prompt: string;
  onEnhanced: (enhancedPrompt: string) => void;
}

export default function PromptEnhancer({ prompt, onEnhanced }: PromptEnhancerProps) {
  const [originalPrompt, setOriginalPrompt] = useState<string | null>(null);
  const enhanceMutation = trpc.video.enhancePrompt.useMutation();

  const handleEnhance = async () => {
    if (!prompt.trim()) return;

    setOriginalPrompt(prompt);
    try {
      const result = await enhanceMutation.mutateAsync({ prompt });
      onEnhanced(result.enhanced);
    } catch {
      setOriginalPrompt(null);
    }
  };

  const handleUndo = () => {
    if (originalPrompt !== null) {
      onEnhanced(originalPrompt);
      setOriginalPrompt(null);
    }
  };

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        className="text-xs"
        onClick={handleEnhance}
        disabled={!prompt.trim() || enhanceMutation.isPending}
        title="Enhance prompt with AI"
      >
        {enhanceMutation.isPending ? (
          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
        ) : (
          <Sparkles className="w-3 h-3 mr-1" />
        )}
        {enhanceMutation.isPending ? "Enhancing..." : "Enhance"}
      </Button>
      {originalPrompt !== null && !enhanceMutation.isPending && (
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-muted-foreground"
          onClick={handleUndo}
          title="Restore original prompt"
        >
          <Undo2 className="w-3 h-3 mr-1" />
          Undo
        </Button>
      )}
      {enhanceMutation.isError && (
        <span className="text-xs text-destructive">
          {enhanceMutation.error.message.includes("503")
            ? "Ollama not running"
            : "Enhancement failed"}
        </span>
      )}
    </div>
  );
}

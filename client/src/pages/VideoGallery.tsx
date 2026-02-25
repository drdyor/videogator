import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, 
  Trash2, 
  Download, 
  Share2, 
  Search, 
  Video as VideoIcon,
  Calendar,
  Clock,
  Film,
  Eye,
  Globe,
  Lock,
} from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

const MODEL_LABELS: Record<string, string> = {
  "hunyuan-video": "HunyuanVideo",
  "mochi": "Mochi",
  "cogvideo": "CogVideoX",
  "modelscope": "ModelScope",
  "stable-video-diffusion": "SVD",
};

export default function VideoGallery() {
  const { isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  
  const videosQuery = trpc.videos.list.useQuery({});
  const deleteMutation = trpc.videos.delete.useMutation({
    onSuccess: () => {
      videosQuery.refetch();
    },
  });
  const updateMutation = trpc.videos.update.useMutation({
    onSuccess: () => {
      videosQuery.refetch();
    },
  });

  if (!isAuthenticated) {
    return (
      <Card className="p-12 text-center">
        <p className="text-muted-foreground mb-4">Please log in to view your videos</p>
      </Card>
    );
  }

  const videos = videosQuery.data?.videos ?? [];
  const total = videosQuery.data?.total ?? 0;

  // Filter videos by search query
  const filteredVideos = videos.filter((video: any) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      video.prompt?.toLowerCase().includes(query) ||
      video.model?.toLowerCase().includes(query)
    );
  });

  const handleDelete = async (videoId: number) => {
    if (confirm("Are you sure you want to delete this video?")) {
      await deleteMutation.mutateAsync({ id: videoId });
    }
  };

  const handleTogglePublic = async (videoId: number, isPublic: boolean) => {
    await updateMutation.mutateAsync({ id: videoId, isPublic: !isPublic });
  };

  const handleDownload = (videoUrl: string, prompt: string) => {
    const link = document.createElement("a");
    link.href = videoUrl;
    link.download = `video-${prompt.slice(0, 30).replace(/\s+/g, "-")}.mp4`;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = async (videoId: number) => {
    const url = `${window.location.origin}/video/${videoId}`;
    await navigator.clipboard.writeText(url);
    alert("Link copied to clipboard!");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Video Gallery</h1>
          <p className="text-muted-foreground">
            {total} video{total !== 1 ? "s" : ""} generated
          </p>
        </div>
        <Link href="/foundry">
          <Button>
            <VideoIcon className="w-4 h-4 mr-2" />
            Generate New
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by prompt or model..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Loading State */}
      {videosQuery.isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Empty State */}
      {!videosQuery.isLoading && filteredVideos.length === 0 && (
        <Card className="p-12 text-center">
          <VideoIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No videos yet</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery
              ? "No videos match your search"
              : "Generate your first video to get started"}
          </p>
          <Link href="/foundry">
            <Button>Start Generating</Button>
          </Link>
        </Card>
      )}

      {/* Video Grid */}
      {!videosQuery.isLoading && filteredVideos.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredVideos.map((video: any) => (
            <Card key={video.id} className="overflow-hidden group">
              {/* Video Preview */}
              <div className="relative aspect-video bg-muted">
                <video
                  src={video.videoUrl}
                  className="w-full h-full object-cover"
                  controls
                  preload="metadata"
                />
                {/* Model Badge */}
                <Badge className="absolute top-2 left-2" variant="secondary">
                  {MODEL_LABELS[video.model] || video.model}
                </Badge>
                {/* Public/Private Badge */}
                <Badge 
                  className="absolute top-2 right-2" 
                  variant={video.isPublic ? "default" : "outline"}
                >
                  {video.isPublic ? (
                    <Globe className="w-3 h-3 mr-1" />
                  ) : (
                    <Lock className="w-3 h-3 mr-1" />
                  )}
                  {video.isPublic ? "Public" : "Private"}
                </Badge>
              </div>

              {/* Video Info */}
              <div className="p-4 space-y-3">
                {/* Prompt */}
                <p className="text-sm line-clamp-2">
                  {video.prompt || "No prompt"}
                </p>

                {/* Metadata */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  {video.width && video.height && (
                    <span className="flex items-center gap-1">
                      <Film className="w-3 h-3" />
                      {video.width}x{video.height}
                    </span>
                  )}
                  {video.numFrames && (
                    <span className="flex items-center gap-1">
                      <VideoIcon className="w-3 h-3" />
                      {video.numFrames} frames
                    </span>
                  )}
                  {video.createdAt && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(video.createdAt).toLocaleDateString()}
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownload(video.videoUrl, video.prompt)}
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Download
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleShare(video.id)}
                  >
                    <Share2 className="w-4 h-4 mr-1" />
                    Share
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleTogglePublic(video.id, video.isPublic)}
                  >
                    {video.isPublic ? (
                      <Lock className="w-4 h-4" />
                    ) : (
                      <Globe className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="ml-auto text-destructive hover:text-destructive"
                    onClick={() => handleDelete(video.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

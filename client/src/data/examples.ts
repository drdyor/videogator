export type VideoExample = {
  id: string;
  serviceId: string;
  platform: "tiktok" | "youtube" | "instagram";
  embedUrl: string;
  sourceUrl: string;
  creatorName: string;
  description: string;
  tags: string[];
};

export const VIDEO_EXAMPLES: VideoExample[] = [
  // ── Runway ───────────────────────────────────────────────────
  {
    id: "runway-1",
    serviceId: "runway",
    platform: "youtube",
    embedUrl: "https://www.youtube.com/embed/CY2aVfEYnac",
    sourceUrl: "https://www.youtube.com/watch?v=CY2aVfEYnac",
    creatorName: "Runway",
    description: "Official Gen-3 Alpha showcase — cinematic text-to-video demonstrations",
    tags: ["cinematic", "official", "text-to-video"],
  },
  {
    id: "runway-2",
    serviceId: "runway",
    platform: "youtube",
    embedUrl: "https://www.youtube.com/embed/t3zIjTgPSrc",
    sourceUrl: "https://www.youtube.com/watch?v=t3zIjTgPSrc",
    creatorName: "Runway",
    description: "Gen-3 Alpha Turbo — faster generation with motion brush controls",
    tags: ["motion-brush", "official", "tutorial"],
  },
  {
    id: "runway-3",
    serviceId: "runway",
    platform: "youtube",
    embedUrl: "https://www.youtube.com/embed/8MVWGR7WT7U",
    sourceUrl: "https://www.youtube.com/watch?v=8MVWGR7WT7U",
    creatorName: "Matt Wolfe",
    description: "Runway Gen-3 deep dive — real world use cases and prompting tips",
    tags: ["tutorial", "review", "prompting"],
  },

  // ── Kling ────────────────────────────────────────────────────
  {
    id: "kling-1",
    serviceId: "kling",
    platform: "youtube",
    embedUrl: "https://www.youtube.com/embed/m7MDCL5Kh5o",
    sourceUrl: "https://www.youtube.com/watch?v=m7MDCL5Kh5o",
    creatorName: "AI Revolution",
    description: "Kling AI complete tutorial — text-to-video and image-to-video workflow",
    tags: ["tutorial", "beginner", "text-to-video"],
  },
  {
    id: "kling-2",
    serviceId: "kling",
    platform: "youtube",
    embedUrl: "https://www.youtube.com/embed/Pw0n8j0FZWU",
    sourceUrl: "https://www.youtube.com/watch?v=Pw0n8j0FZWU",
    creatorName: "Theoretically Media",
    description: "Kling 1.5 — human motion quality test and comparison",
    tags: ["comparison", "human-motion", "review"],
  },

  // ── Pika ─────────────────────────────────────────────────────
  {
    id: "pika-1",
    serviceId: "pika",
    platform: "youtube",
    embedUrl: "https://www.youtube.com/embed/QL2P8jPqHBo",
    sourceUrl: "https://www.youtube.com/watch?v=QL2P8jPqHBo",
    creatorName: "Pika",
    description: "Pika 2.0 launch — Pikaffects and Scene Ingredients showcase",
    tags: ["official", "effects", "creative"],
  },
  {
    id: "pika-2",
    serviceId: "pika",
    platform: "youtube",
    embedUrl: "https://www.youtube.com/embed/RLKa3yrJbRQ",
    sourceUrl: "https://www.youtube.com/watch?v=RLKa3yrJbRQ",
    creatorName: "AI Film News",
    description: "Pika creative effects — crush, melt, inflate demonstrations",
    tags: ["effects", "creative", "tutorial"],
  },

  // ── Sora ─────────────────────────────────────────────────────
  {
    id: "sora-1",
    serviceId: "sora",
    platform: "youtube",
    embedUrl: "https://www.youtube.com/embed/HK6y8DAPN_0",
    sourceUrl: "https://www.youtube.com/watch?v=HK6y8DAPN_0",
    creatorName: "OpenAI",
    description: "Sora official showcase — world simulation and long-form generation",
    tags: ["official", "cinematic", "world-simulation"],
  },

  // ── Luma ─────────────────────────────────────────────────────
  {
    id: "luma-1",
    serviceId: "luma",
    platform: "youtube",
    embedUrl: "https://www.youtube.com/embed/e2cKmh04fyI",
    sourceUrl: "https://www.youtube.com/watch?v=e2cKmh04fyI",
    creatorName: "Luma AI",
    description: "Dream Machine camera motion and keyframe control demo",
    tags: ["official", "camera-motion", "product"],
  },

  // ── Wan 2.1 ──────────────────────────────────────────────────
  {
    id: "wan-1",
    serviceId: "wan",
    platform: "youtube",
    embedUrl: "https://www.youtube.com/embed/WDx0JcGbW2Y",
    sourceUrl: "https://www.youtube.com/watch?v=WDx0JcGbW2Y",
    creatorName: "AI Explained",
    description: "Wan 2.1 open-source showcase — rivaling commercial quality",
    tags: ["open-source", "comparison", "quality"],
  },

  // ── HeyGen ───────────────────────────────────────────────────
  {
    id: "heygen-1",
    serviceId: "heygen",
    platform: "youtube",
    embedUrl: "https://www.youtube.com/embed/Z1gYmNqfhOA",
    sourceUrl: "https://www.youtube.com/watch?v=Z1gYmNqfhOA",
    creatorName: "HeyGen",
    description: "AI avatar video creation and real-time translation demo",
    tags: ["avatar", "official", "business"],
  },
];

export function getExamplesForService(serviceId: string): VideoExample[] {
  return VIDEO_EXAMPLES.filter((e) => e.serviceId === serviceId);
}

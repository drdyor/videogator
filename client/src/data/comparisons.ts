import { VIDEO_SERVICES, type VideoService } from "./services";

export type ServicePros = {
  serviceId: string;
  pros: string[];
  cons: string[];
  bestWhen: string;
};

export type FeatureRow = {
  feature: string;
  values: Record<string, string>;
};

export type Comparison = {
  slug: string;
  title: string;
  metaDescription: string;
  serviceIds: string[];
  verdict: string;
  verdictDetail: string;
  serviceAnalysis: ServicePros[];
  featureMatrix: FeatureRow[];
};

export const COMPARISONS: Comparison[] = [
  {
    slug: "runway-vs-pika",
    title: "Runway Gen-3 vs Pika 2.0: Which AI Video Generator Should You Use?",
    metaDescription: "Detailed comparison of Runway Gen-3 Alpha and Pika 2.0 for AI video generation. Pricing, quality, features, and real examples compared.",
    serviceIds: ["runway", "pika"],
    verdict: "Runway for professional quality and control; Pika for creative effects and budget-friendly experimentation.",
    verdictDetail: "Runway Gen-3 Alpha is the clear choice for professionals who need precise camera controls, motion brush, and consistent quality across projects. Pika 2.0 shines when you want creative effects (Pikaffects like crush, melt, inflate) and stylized content. Pika's free tier is more generous for casual experimentation.",
    serviceAnalysis: [
      {
        serviceId: "runway",
        pros: [
          "Superior motion brush for selective animation",
          "Best camera controls (dolly, orbit, pan)",
          "Most consistent quality across generations",
          "Strong API for production pipelines",
          "Professional-grade output quality",
        ],
        cons: [
          "Most expensive option ($12-76/mo)",
          "Max 10 seconds per generation",
          "Free tier is very limited",
          "Steeper learning curve",
        ],
        bestWhen: "You need professional-quality video for film, advertising, or music videos and can invest in a subscription.",
      },
      {
        serviceId: "pika",
        pros: [
          "Unique Pikaffects (crush, melt, inflate, explode)",
          "Scene Ingredients for controlled composition",
          "Built-in sound effects generation",
          "More generous free tier (150 credits/mo)",
          "Fun and accessible for beginners",
        ],
        cons: [
          "Less photorealistic than Runway",
          "Camera control less precise",
          "Shorter output clips",
          "Quality can be inconsistent",
        ],
        bestWhen: "You're making creative/experimental content for social media and want unique effects that stand out.",
      },
    ],
    featureMatrix: [
      { feature: "Max Resolution", values: { runway: "1080p", pika: "1080p" } },
      { feature: "Max Duration", values: { runway: "10s", pika: "10s" } },
      { feature: "API Access", values: { runway: "Yes", pika: "Yes" } },
      { feature: "Free Tier", values: { runway: "Very limited", pika: "150 credits/mo" } },
      { feature: "Text-to-Video", values: { runway: "Excellent", pika: "Good" } },
      { feature: "Image-to-Video", values: { runway: "Excellent", pika: "Good" } },
      { feature: "Motion Brush", values: { runway: "Best in class", pika: "No" } },
      { feature: "Special Effects", values: { runway: "Style transfer", pika: "Pikaffects (crush, melt, etc.)" } },
      { feature: "Camera Controls", values: { runway: "Advanced (dolly, orbit, pan)", pika: "Basic" } },
      { feature: "Sound Generation", values: { runway: "No", pika: "Yes" } },
      { feature: "Lip Sync", values: { runway: "Yes", pika: "Yes" } },
      { feature: "Starting Price", values: { runway: "$12/mo", pika: "$8/mo" } },
    ],
  },
  {
    slug: "runway-vs-kling",
    title: "Runway Gen-3 vs Kling AI: Professional Quality vs Free Generation",
    metaDescription: "Compare Runway Gen-3 Alpha and Kling AI for video generation. Free tier comparison, quality benchmarks, and pricing breakdown.",
    serviceIds: ["runway", "kling"],
    verdict: "Runway for production quality and editing tools; Kling for generous free access and natural human motion.",
    verdictDetail: "If you're budget-conscious or doing social media content, Kling's 66 free credits per day is unbeatable. For professional work where quality and control matter, Runway is worth the premium. Kling has surprisingly good human motion but Runway's motion brush and camera controls are in a league of their own.",
    serviceAnalysis: [
      {
        serviceId: "runway",
        pros: [
          "Industry-leading motion brush",
          "Precise camera control presets",
          "Most consistent output quality",
          "Professional editing workflow integration",
          "Strong API documentation",
        ],
        cons: [
          "Expensive for casual use",
          "Limited free generation",
          "10s max per clip",
        ],
        bestWhen: "You're creating content for clients, ads, or film projects where quality justifies cost.",
      },
      {
        serviceId: "kling",
        pros: [
          "66 free credits per day — most generous free tier",
          "Natural human motion rendering",
          "Multiple camera preset options",
          "Video extension capability",
          "Good value paid plans ($5.99-53.99/mo)",
        ],
        cons: [
          "Complex scenes can have artifacts",
          "Less precise camera control than Runway",
          "Quality less consistent across styles",
          "Newer, less established ecosystem",
        ],
        bestWhen: "You want to experiment extensively without paying, or need lots of clips for social media.",
      },
    ],
    featureMatrix: [
      { feature: "Max Resolution", values: { runway: "1080p", kling: "1080p" } },
      { feature: "Max Duration", values: { runway: "10s", kling: "10s" } },
      { feature: "Free Credits", values: { runway: "~5 credits", kling: "66 credits/day" } },
      { feature: "API Access", values: { runway: "Yes", kling: "Yes" } },
      { feature: "Motion Brush", values: { runway: "Best in class", kling: "Basic" } },
      { feature: "Camera Controls", values: { runway: "Advanced", kling: "Presets" } },
      { feature: "Human Motion", values: { runway: "Good", kling: "Excellent" } },
      { feature: "Video Extension", values: { runway: "No", kling: "Yes" } },
      { feature: "Lip Sync", values: { runway: "Yes", kling: "Yes" } },
      { feature: "Starting Price", values: { runway: "$12/mo", kling: "$5.99/mo" } },
    ],
  },
  {
    slug: "text-to-video-services",
    title: "Best Text-to-Video AI Generators (2025): Complete Comparison",
    metaDescription: "Compare all major AI text-to-video generators: Runway, Kling, Pika, Sora, Luma, Veo, and more. Pricing, quality, and feature breakdown.",
    serviceIds: ["runway", "kling", "pika", "sora", "luma", "minimax", "veo"],
    verdict: "No single best tool — choose based on your budget, use case, and volume needs.",
    verdictDetail: "For professionals: Runway. For budget creators: Kling. For creative effects: Pika. For longest clips: Sora. For camera orbits: Luma. For 4K: Veo 2. For free human motion: MiniMax/Hailuo. The best approach is often to use 2-3 services for different needs.",
    serviceAnalysis: [
      {
        serviceId: "runway",
        pros: ["Best overall quality", "Motion brush", "Camera controls", "Strong API"],
        cons: ["Most expensive", "Limited free tier"],
        bestWhen: "Professional production where quality justifies cost.",
      },
      {
        serviceId: "kling",
        pros: ["Best free tier (66 credits/day)", "Good human motion", "Affordable paid plans"],
        cons: ["Less consistent", "Complex scenes struggle"],
        bestWhen: "Volume content creation on a budget.",
      },
      {
        serviceId: "pika",
        pros: ["Unique effects (Pikaffects)", "Sound generation", "Creative focus"],
        cons: ["Less photorealistic", "Shorter outputs"],
        bestWhen: "Creative/experimental social media content.",
      },
      {
        serviceId: "sora",
        pros: ["Longest clips (20s)", "World simulation", "Storyboard feature"],
        cons: ["No API", "Requires ChatGPT subscription", "No fine control"],
        bestWhen: "You need longer clips and already have ChatGPT Pro.",
      },
      {
        serviceId: "luma",
        pros: ["Best camera orbits", "Keyframe control", "Loop generation"],
        cons: ["Only 5s max", "Smaller community"],
        bestWhen: "Product visualization and smooth camera movements.",
      },
      {
        serviceId: "minimax",
        pros: ["10 free videos/day", "Natural motion", "Director mode"],
        cons: ["6s max", "Fewer controls"],
        bestWhen: "Quick free generation with natural human movement.",
      },
      {
        serviceId: "veo",
        pros: ["4K output", "Cinematic quality", "Google Cloud integration"],
        cons: ["Pay-per-use only", "More expensive", "Enterprise-focused"],
        bestWhen: "Enterprise use cases requiring 4K output.",
      },
    ],
    featureMatrix: [
      { feature: "Max Resolution", values: { runway: "1080p", kling: "1080p", pika: "1080p", sora: "1080p", luma: "1080p", minimax: "1080p", veo: "4K" } },
      { feature: "Max Duration", values: { runway: "10s", kling: "10s", pika: "10s", sora: "20s", luma: "5s", minimax: "6s", veo: "8s" } },
      { feature: "Free Tier", values: { runway: "Minimal", kling: "66/day", pika: "150/mo", sora: "No (needs Plus)", luma: "30/mo", minimax: "10/day", veo: "No" } },
      { feature: "API", values: { runway: "Yes", kling: "Yes", pika: "Yes", sora: "No", luma: "Yes", minimax: "Yes", veo: "Yes" } },
      { feature: "Starting Price", values: { runway: "$12/mo", kling: "$5.99/mo", pika: "$8/mo", sora: "$20/mo", luma: "$23.99/mo", minimax: "$9.99/mo", veo: "Pay-per-use" } },
    ],
  },
  {
    slug: "open-source-video-models",
    title: "Best Open Source AI Video Models (2025): Wan, Hunyuan, CogVideoX, LTX, Mochi",
    metaDescription: "Compare open source video generation models. Wan 2.1, Hunyuan Video, CogVideoX, LTX-Video 2, and Mochi 1 compared by quality, speed, and GPU requirements.",
    serviceIds: ["wan", "hunyuan", "cogvideox", "ltx", "mochi"],
    verdict: "Wan 2.1 for best quality; LTX-Video 2 for fastest generation; CogVideoX for reliability.",
    verdictDetail: "Wan 2.1 produces the best output quality and is our top recommendation for most self-hosting use cases. LTX-Video 2 is remarkable for real-time generation — 5-second clips in 2 seconds on an RTX 4090. CogVideoX is the most reliable and well-documented. Hunyuan has strong technical architecture. Mochi excels at natural motion but requires 4x A100s.",
    serviceAnalysis: [
      {
        serviceId: "wan",
        pros: ["Best quality among open-source", "14B parameters", "Apache 2.0 license", "Best text rendering"],
        cons: ["Requires 24GB+ VRAM", "Slower generation"],
        bestWhen: "You want commercial-quality output from a self-hosted model.",
      },
      {
        serviceId: "ltx",
        pros: ["Fastest generation (2 sec for 5s clip)", "Runs on consumer GPU (RTX 4090)", "LoRA support"],
        cons: ["Lower resolution (768p)", "Smaller model = less detail"],
        bestWhen: "Real-time applications or prototyping where speed matters more than max quality.",
      },
      {
        serviceId: "cogvideox",
        pros: ["Most reliable/stable", "Good documentation", "Lower VRAM (16GB+)", "Expert transformer"],
        cons: ["Not the highest quality", "Smaller community than Wan"],
        bestWhen: "Production deployments where reliability is critical.",
      },
      {
        serviceId: "hunyuan",
        pros: ["13B parameters", "Dual-stream architecture", "Strong coherence"],
        cons: ["40GB+ VRAM recommended", "Less community tooling"],
        bestWhen: "Research or when temporal coherence is the priority.",
      },
      {
        serviceId: "mochi",
        pros: ["Most natural motion quality", "Apache 2.0 license"],
        cons: ["Requires 4x A100 GPUs", "Lower resolution (848x480)", "Heavy compute"],
        bestWhen: "Motion quality is your #1 priority and you have serious GPU resources.",
      },
    ],
    featureMatrix: [
      { feature: "Parameters", values: { wan: "14B", hunyuan: "13B", cogvideox: "5B", ltx: "~2B", mochi: "~10B" } },
      { feature: "Max Resolution", values: { wan: "720p", hunyuan: "720p", cogvideox: "720p", ltx: "768p", mochi: "848x480" } },
      { feature: "Generation Speed", values: { wan: "~60s/clip", hunyuan: "~90s/clip", cogvideox: "~45s/clip", ltx: "~2s/clip", mochi: "~120s/clip" } },
      { feature: "Min VRAM", values: { wan: "24GB", hunyuan: "40GB", cogvideox: "16GB", ltx: "24GB", mochi: "4x 80GB" } },
      { feature: "License", values: { wan: "Apache 2.0", hunyuan: "Tencent", cogvideox: "Apache 2.0", ltx: "Apache 2.0", mochi: "Apache 2.0" } },
      { feature: "LoRA Support", values: { wan: "Community", hunyuan: "Limited", cogvideox: "Community", ltx: "Official", mochi: "No" } },
      { feature: "ComfyUI", values: { wan: "Yes", hunyuan: "Yes", cogvideox: "Yes", ltx: "Yes", mochi: "Community" } },
    ],
  },
  {
    slug: "self-host-vs-api",
    title: "Self-Hosting vs API: AI Video Generation Cost Breakdown (2025)",
    metaDescription: "Should you self-host AI video models or use commercial APIs? Complete cost analysis of RunPod, Replicate, fal.ai vs Runway, Kling, Pika.",
    serviceIds: ["runway", "kling", "runpod", "replicate", "fal"],
    verdict: "API for under 100 videos/month; self-host for 500+ videos/month; Replicate/fal.ai as middle ground.",
    verdictDetail: "At low volumes (<100/month), commercial APIs are simpler and cheaper when you factor in setup time. At 500+ videos/month, self-hosting on RunPod with Wan 2.1 can be 10-20x cheaper. The middle ground — hosted inference via Replicate or fal.ai — gives you API simplicity with near-self-host pricing. Start with APIs, migrate to self-hosting as you scale.",
    serviceAnalysis: [
      {
        serviceId: "runway",
        pros: ["No setup required", "Highest quality", "Built-in editing tools", "Reliable uptime"],
        cons: ["$0.05/sec adds up fast", "Vendor lock-in", "No model customization"],
        bestWhen: "Low volume (<100 videos/mo) where quality matters most.",
      },
      {
        serviceId: "runpod",
        pros: ["10-20x cheaper at scale", "Full control", "Any model", "Persistent storage"],
        cons: ["Setup time (hours)", "You manage infrastructure", "GPU availability varies"],
        bestWhen: "500+ videos/month, custom pipelines, or fine-tuned models.",
      },
      {
        serviceId: "replicate",
        pros: ["Simple API", "No GPU management", "Wide model selection", "Pay per prediction"],
        cons: ["Cold starts (30-60s)", "Less control", "Can get expensive at scale"],
        bestWhen: "100-500 videos/month, API-first development, prototyping.",
      },
      {
        serviceId: "fal",
        pros: ["Fastest cold starts", "Queue system", "Great JS SDK", "Cheapest hosted inference"],
        cons: ["Smaller model selection", "Newer platform", "Less documentation"],
        bestWhen: "Real-time web apps, JavaScript developers, cost-sensitive hosted inference.",
      },
      {
        serviceId: "kling",
        pros: ["Free 66 credits/day", "No setup", "Good quality"],
        cons: ["Daily limits", "Less control", "No custom models"],
        bestWhen: "Free experimentation or low-volume social media content.",
      },
    ],
    featureMatrix: [
      { feature: "Cost per 5s clip", values: { runway: "~$0.25", kling: "Free-$0.10", runpod: "~$0.01-0.03", replicate: "~$0.03-0.08", fal: "~$0.01-0.05" } },
      { feature: "1000 clips cost", values: { runway: "~$250", kling: "~$100", runpod: "~$13-30", replicate: "~$30-80", fal: "~$10-50" } },
      { feature: "Setup Time", values: { runway: "0 min", kling: "0 min", runpod: "1-4 hours", replicate: "5 min", fal: "5 min" } },
      { feature: "Custom Models", values: { runway: "No", kling: "No", runpod: "Yes", replicate: "Yes", fal: "Yes" } },
      { feature: "Fine-tuning", values: { runway: "No", kling: "No", runpod: "Yes", replicate: "Yes (some)", fal: "Limited" } },
      { feature: "Uptime SLA", values: { runway: "99.9%", kling: "Best effort", runpod: "You manage", replicate: "99.9%", fal: "99.9%" } },
    ],
  },
];

export function getComparisonBySlug(slug: string): Comparison | undefined {
  return COMPARISONS.find((c) => c.slug === slug);
}

export function getComparisonsForService(serviceId: string): Comparison[] {
  return COMPARISONS.filter((c) => c.serviceIds.includes(serviceId));
}

export function getServiceData(serviceId: string): VideoService | undefined {
  return VIDEO_SERVICES.find((s) => s.id === serviceId);
}

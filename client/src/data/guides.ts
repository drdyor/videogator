export type Guide = {
  id: string;
  title: string;
  question: string;
  tags: string[];
  content: string;
};

export const GUIDES: Guide[] = [
  {
    id: "text-to-video-basics",
    title: "How to Generate AI Video from Text",
    question: "How do I create a video from a text prompt?",
    tags: ["beginner", "text-to-video"],
    content: `Most AI video generators follow the same basic workflow:

**1. Write a descriptive prompt.** Be specific about subject, action, camera movement, lighting, and style. Example: "A golden retriever running through autumn leaves in a park, slow motion, cinematic shallow depth of field, warm afternoon light."

**2. Choose your settings.** Select aspect ratio (16:9 for landscape, 9:16 for vertical/TikTok, 1:1 for square), duration (typically 4-10 seconds), and resolution.

**3. Generate and iterate.** Most services produce results in 30 seconds to 3 minutes. Generate multiple variations and refine your prompt based on results.

**Top services for text-to-video:** Runway Gen-3 Alpha (best motion control), Kling AI (best free tier), Pika 2.0 (best special effects), Sora (longest duration).`,
  },
  {
    id: "image-to-video",
    title: "How to Animate a Still Image with AI",
    question: "How can I turn a photo or illustration into a video?",
    tags: ["beginner", "image-to-video"],
    content: `Image-to-video is often more controllable than text-to-video because you start with a defined visual.

**Best practices:**
- Use high-resolution source images (at least 1024px on the longest side)
- Provide a motion prompt describing what should move: "Camera slowly zooms in while leaves flutter in the breeze"
- Keep motion subtle for realistic results — AI handles gentle movements better than extreme action
- For product shots, use a clean background

**Service comparison for image-to-video:**
- **Runway Gen-3 Alpha** — Best motion brush for selective animation
- **Kling AI** — Natural human motion from portraits
- **Luma Dream Machine** — Best camera orbit animations
- **LTX-Video 2** — Fastest generation (2 seconds)`,
  },
  {
    id: "prompt-engineering",
    title: "Video Generation Prompt Engineering Guide",
    question: "How do I write better prompts for AI video?",
    tags: ["intermediate", "prompts"],
    content: `Great video prompts follow a structure: **Subject + Action + Camera + Style + Lighting**.

**The anatomy of a strong prompt:**

\`\`\`
[Subject]: A woman in a red dress
[Action]: walking through a rainy Tokyo street at night
[Camera]: tracking shot, dolly forward, low angle
[Style]: cinematic, blade runner aesthetic, neon reflections
[Lighting]: neon signs reflecting in puddles, atmospheric fog
\`\`\`

**Camera motion keywords that work:**
- Dolly in/out, truck left/right, pedestal up/down
- Crane shot, bird's eye view, worm's eye view
- Handheld, steadicam, static tripod
- Whip pan, rack focus, pull focus

**Style modifiers:**
- Film stocks: "shot on 35mm film", "Kodak Portra 400", "IMAX"
- Directors: "in the style of Wes Anderson", "Kubrick one-point perspective"
- Eras: "1920s silent film", "80s VHS aesthetic", "Y2K"

**Common mistakes:**
- Too many subjects/actions (keep it to one clear action per clip)
- Conflicting style directions
- Overly long prompts (most models cap at ~500 tokens)`,
  },
  {
    id: "self-hosting",
    title: "How to Self-Host Video Generation Models",
    question: "How do I run AI video models on my own GPU?",
    tags: ["advanced", "self-hosting", "infrastructure"],
    content: `Self-hosting gives you unlimited generations at GPU cost only. Here's the stack:

**Hardware requirements:**
- **Minimum:** RTX 4090 (24GB VRAM) — runs LTX-Video 2, smaller CogVideoX
- **Recommended:** A100 40GB — runs Wan 2.1, Hunyuan Video
- **Production:** 2-4x A100 80GB — runs all models at full quality

**Quick start with RunPod:**
1. Create an account at runpod.io
2. Deploy a GPU pod with the "RunPod PyTorch 2.x" template
3. Install ComfyUI: \`git clone https://github.com/comfyanonymous/ComfyUI\`
4. Download model weights to \`ComfyUI/models/\`
5. Access the UI via the pod's HTTP port

**Quick start with Replicate:**
1. Pick a model from replicate.com (e.g., "wan-2.1")
2. Run via API: \`replicate.run("model-id", input={prompt: "..."})\`
3. No GPU management needed — pay per prediction

**Cost comparison (1000 five-second clips):**
| Method | Cost |
|--------|------|
| Runway Gen-3 Alpha | ~$250 |
| RunPod A100 (self-host) | ~$13 |
| Replicate (hosted) | ~$32 |
| fal.ai (hosted) | ~$10-50 |

**Recommended models for self-hosting:**
- **LTX-Video 2** — Fastest, runs on consumer GPUs
- **Wan 2.1** — Best quality/cost ratio
- **CogVideoX** — Most stable/reliable`,
  },
  {
    id: "runway-vs-kling-vs-pika",
    title: "Runway vs Kling vs Pika: Which Should You Choose?",
    question: "What's the best AI video generator in 2025?",
    tags: ["comparison", "beginner"],
    content: `The "big three" commercial video generators each have distinct strengths:

**Runway Gen-3 Alpha** — Best for professionals
- Pros: Motion brush, camera controls, consistent quality, strong API
- Cons: Most expensive, shorter max duration (10s)
- Best for: Film production, advertising, music videos
- Price: ~$0.05/second

**Kling AI** — Best value
- Pros: Generous free tier (66 credits/day), good human motion, 1080p
- Cons: Can struggle with complex scenes, occasional artifacts
- Best for: Social media content, experimentation, budget-conscious creators
- Price: Free to $53.99/mo

**Pika 2.0** — Most creative
- Pros: Unique Pikaffects (crush, melt, inflate), Scene Ingredients, fun effects
- Cons: Shorter outputs, less photorealistic
- Best for: Creative/artistic content, social media, experimental work
- Price: Free to $58/mo

**Quick decision guide:**
- Need professional quality + API? → **Runway**
- Want the most free generations? → **Kling**
- Making creative/experimental content? → **Pika**
- Need avatars/talking heads? → **HeyGen**
- Want to self-host? → **Wan 2.1 or LTX-Video 2**`,
  },
  {
    id: "video-for-social-media",
    title: "AI Video for Social Media: Complete Guide",
    question: "How do I make AI videos for TikTok, Instagram, and YouTube?",
    tags: ["beginner", "social-media"],
    content: `Each platform has specific requirements for AI-generated video:

**TikTok / Instagram Reels (9:16 vertical)**
- Duration: 15-60 seconds (generate multiple 5-10s clips and edit together)
- Style: Fast-paced, eye-catching, trend-aligned
- Best tools: Kling AI (free), Pika (effects), HeyGen (talking head)
- Tip: Add trending audio in CapCut after generation

**YouTube Shorts (9:16 vertical)**
- Duration: Up to 60 seconds
- Higher quality expectations than TikTok
- Best tools: Runway (quality), Luma (cinematic)

**YouTube Long-form (16:9 landscape)**
- Use AI clips as B-roll, not entire videos
- Generate 5-10 second establishing shots or transitions
- Best tools: Runway (consistency), Veo 2 (4K for premium)

**Workflow tip:** Generate in 16:9 and crop to 9:16 for vertical platforms — this gives you more visual real estate and flexibility.`,
  },
  {
    id: "open-source-models",
    title: "Best Open Source Video Generation Models (2025)",
    question: "What are the best free AI video models I can run myself?",
    tags: ["open-source", "intermediate"],
    content: `Open-source video generation has exploded. Here are the top models:

**Wan 2.1 (Alibaba)** — Best overall
- Parameters: 14B (also available in 1.3B lite version)
- License: Apache 2.0 (fully commercial)
- Quality: Rivals Kling/Pika for many use cases
- VRAM: 24GB+ recommended
- Highlight: Best text rendering in video

**Hunyuan Video (Tencent)** — Most technically advanced
- Parameters: 13B
- Dual-stream transformer architecture
- Quality: Excellent coherence and motion
- VRAM: 40GB+ recommended

**CogVideoX (Zhipu AI)** — Most reliable
- Expert transformer with 3D VAE
- Strong temporal coherence
- Good community support
- VRAM: 16GB+ for smaller variants

**LTX-Video 2 (Lightricks)** — Fastest
- Generates 5s video in ~2 seconds on RTX 4090
- Apache 2.0 license
- LoRA fine-tuning support
- Best for: Real-time applications, prototyping

**Mochi 1 (Genmo)** — Best motion quality
- Natural, fluid motion
- Apache 2.0 license
- Requires 4x A100 for full quality
- Best for: When motion naturalness is priority

All models work with ComfyUI for a visual workflow interface.`,
  },
  {
    id: "infrastructure-guide",
    title: "GPU Infrastructure for AI Video: RunPod, Replicate & fal.ai",
    question: "What's the cheapest way to run AI video models?",
    tags: ["infrastructure", "advanced"],
    content: `Three main approaches to GPU infrastructure for video generation:

**RunPod** — Best for self-hosting
- On-demand GPUs: $0.39/hr (RTX 4090) to $1.64/hr (A100 80GB)
- Serverless: Pay per second of actual compute
- Full control: SSH access, custom Docker images
- Best for: Production workloads, custom pipelines
- Tip: Use "Community Cloud" for 30-50% savings on non-critical work

**Replicate** — Easiest to start
- Simple API: \`replicate.run("model-name", {prompt: "..."})\`
- No GPU management
- Pay per prediction (~$0.032/sec on A40)
- Best for: Quick prototyping, API-first applications
- Tip: "Cold starts" take 30-60s; use always-on for production

**fal.ai** — Fastest inference
- Sub-second cold starts
- Queue-based system for reliability
- JavaScript/Python SDKs
- Best for: Real-time applications, web integrations
- Tip: Their queue system handles bursts well

**Cost optimization tips:**
1. Use spot/interruptible instances for batch processing (50% cheaper)
2. Cache model weights on persistent storage (avoid re-downloading)
3. Batch requests to keep GPUs warm
4. Use quantized models (4-bit) when quality permits — 2-3x cheaper
5. Start with Replicate/fal.ai for prototyping, move to RunPod for production`,
  },
  {
    id: "video-editing-with-ai",
    title: "How to Edit AI-Generated Videos",
    question: "How do I improve and edit AI-generated video clips?",
    tags: ["intermediate", "editing"],
    content: `Raw AI-generated clips usually need post-production. Here's the workflow:

**Step 1: Generate multiple takes**
Run your prompt 3-5 times. AI generation is stochastic — you'll get different results each time. Pick the best starting point.

**Step 2: Upscale if needed**
- Topaz Video AI: Best quality upscaler ($299 one-time)
- VideoGator's built-in upscale (GPU-backed)
- Open-source: Real-ESRGAN for frames

**Step 3: Color grade**
AI videos often have flat or inconsistent color. Apply a LUT or manual grade in:
- DaVinci Resolve (free)
- CapCut (free, mobile-friendly)

**Step 4: Edit together**
Combine multiple AI clips into a sequence:
- Match motion direction between cuts
- Use 0.5-1s crossfades between AI clips to hide seams
- Add real footage as anchoring shots

**Step 5: Add audio**
- Music: Epidemic Sound, Artlist, or AI music (Suno, Udio)
- Sound effects: Pika 2.0 generates SFX with video
- Voiceover: ElevenLabs, HeyGen

**Pro tip:** The best AI videos combine 3-5 short clips with real footage, music, and sound design. Pure AI output rarely works as a final product.`,
  },
  {
    id: "fine-tuning-models",
    title: "How to Fine-Tune Video Generation Models",
    question: "Can I train AI video models on my own footage?",
    tags: ["advanced", "fine-tuning"],
    content: `Fine-tuning lets you teach a video model your specific style or subject. Current options:

**LoRA fine-tuning (recommended)**
LoRAs are lightweight adapters that modify model behavior without retraining the whole model.

- **LTX-Video 2**: Best LoRA support, trains in 1-2 hours on single A100
- **Wan 2.1**: LoRA support via ComfyUI
- **CogVideoX**: Community LoRA training scripts

**What you need:**
- 20-100 video clips of your target style/subject (3-10 seconds each)
- A100 GPU (40GB+ VRAM) for 1-4 hours
- Training framework: ai-toolkit, kohya-ss, or model-specific scripts

**Use cases:**
- Brand consistency: Train on your visual style
- Character consistency: Same character across clips
- Product visualization: Train on product footage
- Art style: Anime, watercolor, specific director's style

**Current limitations:**
- Video LoRAs are less mature than image LoRAs
- Quality varies significantly between models
- Requires technical knowledge (Python, GPU setup)
- Results are model-specific (can't transfer between models)

**Cost:** ~$5-15 for a single LoRA training run on RunPod.`,
  },
  {
    id: "commercial-use",
    title: "Can I Use AI-Generated Videos Commercially?",
    question: "Are AI-generated videos legal to use for business?",
    tags: ["beginner", "legal"],
    content: `The commercial use landscape in 2025:

**Commercial-friendly services:**
- **Runway**: Commercial use on all paid plans
- **Kling AI**: Commercial use on paid plans
- **Pika**: Commercial use on paid plans
- **HeyGen**: Commercial use included
- **Sora**: Commercial use on Plus/Pro plans

**Open-source models (Apache 2.0):**
- Wan 2.1, LTX-Video 2, Mochi 1, CogVideoX: All permit commercial use
- You own the outputs, no royalties

**Key considerations:**
1. **Don't generate recognizable people** without consent — deepfake laws apply in many jurisdictions
2. **Don't replicate copyrighted characters** — "Mickey Mouse walking" = legal risk
3. **Disclose AI use** where required — some platforms/industries require disclosure
4. **Check your specific plan** — free tiers sometimes restrict commercial use

**Safe use patterns:**
- Abstract/artistic content
- Product visualization
- B-roll and establishing shots
- Training/educational material
- Social media content (with disclosure)

**Risky use patterns:**
- Photorealistic people (consent issues)
- News/documentary without disclosure
- Reproducing copyrighted styles too precisely`,
  },
];

export const GUIDE_TAGS = [
  "beginner",
  "intermediate",
  "advanced",
  "text-to-video",
  "image-to-video",
  "prompts",
  "self-hosting",
  "infrastructure",
  "open-source",
  "comparison",
  "social-media",
  "editing",
  "fine-tuning",
  "legal",
] as const;

import { Link } from "wouter";
import { ArrowRight, Monitor, Server, Cpu, Zap, Film, BookOpen } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Server,
    title: "Set Up Your GPU Server",
    description: "Run the video server on a machine with an NVIDIA GPU (8–24 GB VRAM).",
    details: [
      "Clone the repo on your GPU machine:",
      "git clone https://github.com/drdyor/videogator.git",
      "cd videogator/video-server",
      "Windows: start.bat | Linux/Mac: ./start.sh",
      "Wait for \"Starting server on http://0.0.0.0:8001\"",
    ],
  },
  {
    number: "02",
    icon: Monitor,
    title: "Configure the App",
    description: "Point VideoGator at your GPU server by adding to your .env file:",
    details: [
      "VIDEO_SERVER_URL=http://YOUR-GPU-IP:8001",
      "DEFAULT_VIDEO_MODEL=modelscope",
      "Then run: pnpm dev",
    ],
  },
  {
    number: "03",
    icon: Film,
    title: "Generate Videos",
    description: "Go to the Foundry, write a prompt, pick a model, and hit Generate.",
    details: [
      "Navigate to /foundry in the dashboard",
      "Write a text prompt describing your video",
      "Choose a model and adjust settings",
      "Click Generate and wait for your video",
    ],
  },
];

const models = [
  {
    name: "ModelScope",
    vram: "8 GB",
    resolution: "256x256",
    frames: "16",
    speed: "Fast",
    best: "Quick tests & prototyping",
    recommended: true,
  },
  {
    name: "CogVideoX",
    vram: "12 GB",
    resolution: "720x480",
    frames: "49",
    speed: "Medium",
    best: "Good quality, image-to-video support",
  },
  {
    name: "Stable Video Diffusion",
    vram: "8 GB",
    resolution: "1024x576",
    frames: "25",
    speed: "Medium",
    best: "Image-to-video only",
  },
  {
    name: "HunyuanVideo",
    vram: "16–24 GB",
    resolution: "848x480",
    frames: "65",
    speed: "Slow",
    best: "Highest quality text-to-video",
  },
  {
    name: "Mochi",
    vram: "16–24 GB",
    resolution: "848x480",
    frames: "65",
    speed: "Slow",
    best: "High quality, smooth motion",
  },
];

export default function GetStarted() {
  return (
    <div className="space-y-0">
      {/* Hero */}
      <section className="relative overflow-hidden py-16 md:py-20">
        <div className="absolute inset-0 bg-gradient-to-b from-burgundy/20 via-background to-background" />
        <div className="container relative z-10 text-center space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-gold-dim/30 bg-gold/5 px-4 py-1.5 text-xs text-gold">
            <BookOpen className="w-3 h-3" />
            Setup guide — get generating in under 10 minutes
          </div>

          <h1 className="font-display text-4xl md:text-5xl font-bold leading-tight">
            <span className="gold-gradient-text">Getting Started</span>
          </h1>

          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Generate AI videos locally using your own GPU. No cloud costs, no rate limits,
            full control over your creative pipeline.
          </p>
        </div>
      </section>

      {/* Requirements */}
      <section className="container py-12">
        <div className="text-center mb-8">
          <div className="art-deco-divider mb-4">
            <span className="font-display text-sm tracking-widest uppercase text-gold-dim">
              Requirements
            </span>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3 max-w-4xl mx-auto">
          <div className="art-deco-card rounded-lg p-6 space-y-2">
            <Cpu className="w-6 h-6 text-gold" />
            <h3 className="font-display text-lg font-semibold">NVIDIA GPU</h3>
            <p className="text-sm text-muted-foreground">
              8 GB VRAM minimum (ModelScope). 24 GB recommended for HunyuanVideo/Mochi.
              RTX 3060, 3090, 4070, 4090 all work.
            </p>
          </div>
          <div className="art-deco-card rounded-lg p-6 space-y-2">
            <Server className="w-6 h-6 text-gold" />
            <h3 className="font-display text-lg font-semibold">Python 3.10+</h3>
            <p className="text-sm text-muted-foreground">
              The video server runs on Python with PyTorch and CUDA.
              The start script installs everything automatically.
            </p>
          </div>
          <div className="art-deco-card rounded-lg p-6 space-y-2">
            <Monitor className="w-6 h-6 text-gold" />
            <h3 className="font-display text-lg font-semibold">Network Access</h3>
            <p className="text-sm text-muted-foreground">
              Your GPU machine and this app need to be on the same network.
              The server runs on port 8001.
            </p>
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="container py-12">
        <div className="text-center mb-8">
          <div className="art-deco-divider mb-4">
            <span className="font-display text-sm tracking-widest uppercase text-gold-dim">
              Setup
            </span>
          </div>
          <h2 className="font-display text-3xl font-bold">
            Three Steps to Video Generation
          </h2>
        </div>

        <div className="max-w-3xl mx-auto space-y-6">
          {steps.map((step) => (
            <div key={step.number} className="art-deco-card rounded-lg p-6 space-y-4">
              <div className="flex items-start gap-4">
                <div className="font-display text-3xl font-bold text-gold/30 shrink-0">
                  {step.number}
                </div>
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <step.icon className="w-5 h-5 text-gold" />
                    <h3 className="font-display text-xl font-semibold">{step.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                  <div className="bg-background/50 rounded-md p-4 space-y-1 font-mono text-sm">
                    {step.details.map((line, i) => (
                      <div key={i} className={line.startsWith("git") || line.startsWith("cd") || line.startsWith("VIDEO") || line.startsWith("DEFAULT") || line.startsWith("Then") || line.startsWith("Windows")
                        ? "text-gold/80 pl-2"
                        : "text-muted-foreground"
                      }>
                        {(line.startsWith("git") || line.startsWith("cd") || line.startsWith("VIDEO") || line.startsWith("DEFAULT") || line.startsWith("Windows") || line.startsWith("Then") || line.startsWith("Wait"))
                          ? `$ ${line}`
                          : line
                        }
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Models */}
      <section className="container py-12">
        <div className="text-center mb-8">
          <div className="art-deco-divider mb-4">
            <span className="font-display text-sm tracking-widest uppercase text-gold-dim">
              Models
            </span>
          </div>
          <h2 className="font-display text-3xl font-bold mb-2">
            Available Models
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            5 AI video models to choose from. Start with ModelScope for quick tests,
            then graduate to HunyuanVideo for production quality.
          </p>
        </div>

        <div className="max-w-4xl mx-auto overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gold-dim/20">
                <th className="text-left py-3 px-4 font-display font-semibold text-gold">Model</th>
                <th className="text-left py-3 px-4 font-display font-semibold text-gold">VRAM</th>
                <th className="text-left py-3 px-4 font-display font-semibold text-gold">Resolution</th>
                <th className="text-left py-3 px-4 font-display font-semibold text-gold">Frames</th>
                <th className="text-left py-3 px-4 font-display font-semibold text-gold">Speed</th>
                <th className="text-left py-3 px-4 font-display font-semibold text-gold">Best For</th>
              </tr>
            </thead>
            <tbody>
              {models.map((model) => (
                <tr key={model.name} className="border-b border-border/30 hover:bg-gold/5 transition-colors">
                  <td className="py-3 px-4 font-medium">
                    {model.name}
                    {model.recommended && (
                      <span className="ml-2 text-xs rounded-full bg-gold/10 border border-gold-dim/30 px-2 py-0.5 text-gold">
                        Start here
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">{model.vram}</td>
                  <td className="py-3 px-4 text-muted-foreground">{model.resolution}</td>
                  <td className="py-3 px-4 text-muted-foreground">{model.frames}</td>
                  <td className="py-3 px-4 text-muted-foreground">{model.speed}</td>
                  <td className="py-3 px-4 text-muted-foreground">{model.best}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Tips */}
      <section className="container py-12">
        <div className="text-center mb-8">
          <div className="art-deco-divider mb-4">
            <span className="font-display text-sm tracking-widest uppercase text-gold-dim">
              Tips
            </span>
          </div>
          <h2 className="font-display text-3xl font-bold">
            Pro Tips
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2 max-w-4xl mx-auto">
          <div className="rounded-lg border border-border/60 p-5 space-y-2">
            <h3 className="font-display font-semibold text-gold">VRAM Management</h3>
            <p className="text-sm text-muted-foreground">
              Only one model loads at a time. If you're also running Ollama or other GPU tasks,
              close them first or use a lighter model like ModelScope (8 GB).
            </p>
          </div>
          <div className="rounded-lg border border-border/60 p-5 space-y-2">
            <h3 className="font-display font-semibold text-gold">First Run is Slow</h3>
            <p className="text-sm text-muted-foreground">
              Models download on first use (2–15 GB per model). After that, they're cached
              locally and load much faster.
            </p>
          </div>
          <div className="rounded-lg border border-border/60 p-5 space-y-2">
            <h3 className="font-display font-semibold text-gold">Prompt Tips</h3>
            <p className="text-sm text-muted-foreground">
              Be descriptive: "A golden retriever running through a sunlit meadow, slow motion,
              cinematic lighting" works better than "dog running".
            </p>
          </div>
          <div className="rounded-lg border border-border/60 p-5 space-y-2">
            <h3 className="font-display font-semibold text-gold">Health Check</h3>
            <p className="text-sm text-muted-foreground">
              The Foundry page shows a server status indicator. Green means your GPU server
              is connected and ready. Red means it's unreachable.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container py-12">
        <div className="text-center space-y-4">
          <h2 className="font-display text-2xl font-bold">Ready to generate?</h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-md bg-gold px-6 py-3 text-base font-semibold text-background hover:bg-gold/90 transition-colors"
            >
              Go to Foundry
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export type StylePrompt = {
  id: string;
  title: string;
  prompt: string;
  style: string;
  bestFor: string[];
  description: string;
};

export const STYLE_CATEGORIES = [
  "cinematic",
  "anime",
  "documentary",
  "product",
  "abstract",
  "retro",
  "nature",
  "sci-fi",
] as const;

export const STYLE_LABELS: Record<(typeof STYLE_CATEGORIES)[number], string> = {
  cinematic: "Cinematic",
  anime: "Anime & Animation",
  documentary: "Documentary",
  product: "Product & Commercial",
  abstract: "Abstract & Artistic",
  retro: "Retro & Vintage",
  nature: "Nature & Landscape",
  "sci-fi": "Sci-Fi & Fantasy",
};

export const PROMPTS: StylePrompt[] = [
  // ── Cinematic ────────────────────────────────────────────────
  {
    id: "cin-1",
    title: "Noir Detective",
    prompt: "A detective in a fedora walks down a rain-soaked alley at night, neon signs reflecting in puddles, smoke curling from a cigarette, dolly forward tracking shot, film noir lighting with strong shadows, shot on 35mm Kodak Double-X black and white film, 1940s aesthetic",
    style: "cinematic",
    bestFor: ["Runway", "Kling", "Sora"],
    description: "Classic film noir atmosphere with dramatic lighting and period-accurate details.",
  },
  {
    id: "cin-2",
    title: "Epic Establishing Shot",
    prompt: "Aerial drone shot sweeping over a vast mountain range at golden hour, clouds flowing through valleys, snow-capped peaks catching warm light, slow cinematic camera movement, IMAX quality, extreme wide shot, Hans Zimmer atmosphere",
    style: "cinematic",
    bestFor: ["Runway", "Veo 2", "Sora"],
    description: "Breathtaking landscape opener for films and trailers.",
  },
  {
    id: "cin-3",
    title: "Wes Anderson Interior",
    prompt: "Symmetrical shot of a pastel pink hotel lobby with geometric patterns, a bellhop standing perfectly centered, warm tungsten lighting, static camera, Wes Anderson composition, 35mm anamorphic lens, Grand Budapest Hotel aesthetic",
    style: "cinematic",
    bestFor: ["Runway", "Kling", "Pika"],
    description: "Perfectly symmetrical composition with distinctive color palette.",
  },
  {
    id: "cin-4",
    title: "Car Chase Tracking",
    prompt: "Low angle tracking shot following a vintage muscle car speeding through city streets at dusk, sparks flying from the road, motion blur on background, anamorphic lens flares, Michael Mann heat-style cinematography, dynamic camera movement",
    style: "cinematic",
    bestFor: ["Runway", "Kling", "Sora"],
    description: "High-energy automotive sequence with professional camera work.",
  },

  // ── Anime & Animation ───────────────────────────────────────
  {
    id: "ani-1",
    title: "Studio Ghibli Countryside",
    prompt: "A young girl riding a bicycle through rolling green hills dotted with wildflowers, puffy white clouds in a bright blue sky, gentle breeze moving the grass, Studio Ghibli animation style, hand-painted watercolor backgrounds, Hayao Miyazaki aesthetic",
    style: "anime",
    bestFor: ["Kling", "Pika", "Wan 2.1"],
    description: "Whimsical Ghibli-inspired scene with soft colors and gentle motion.",
  },
  {
    id: "ani-2",
    title: "Cyberpunk Anime Action",
    prompt: "An anime character with neon-blue cybernetic arm dashing across rooftops in a futuristic Tokyo, rain and holographic advertisements everywhere, dynamic action pose, speed lines, Akira and Ghost in the Shell style, cel-shaded animation",
    style: "anime",
    bestFor: ["Kling", "Pika", "Wan 2.1"],
    description: "High-energy cyberpunk action with classic anime aesthetics.",
  },
  {
    id: "ani-3",
    title: "Lofi Study Room",
    prompt: "Cozy anime-style room with a character sitting at a desk by a window, rain falling outside, warm lamp light, cat sleeping on the desk, steam rising from a coffee cup, gentle looping animation, lofi aesthetic, soft color palette",
    style: "anime",
    bestFor: ["Pika", "Kling", "LTX-Video"],
    description: "Calming lofi atmosphere perfect for background videos.",
  },

  // ── Documentary ─────────────────────────────────────────────
  {
    id: "doc-1",
    title: "Nature Macro",
    prompt: "Extreme macro close-up of morning dew drops on a spider web, each droplet refracting the sunrise, a tiny insect walking along a silk strand, shallow depth of field, BBC Earth Planet cinematography, natural lighting",
    style: "documentary",
    bestFor: ["Runway", "Veo 2", "Luma"],
    description: "BBC Earth-quality macro nature footage.",
  },
  {
    id: "doc-2",
    title: "Time-Lapse City",
    prompt: "Hyperlapse of a modern city skyline from day to night, clouds racing overhead, lights turning on in buildings, car headlight trails on highways, seamless transition from golden hour to blue hour to night, 4K quality",
    style: "documentary",
    bestFor: ["Veo 2", "Runway", "Sora"],
    description: "Dynamic urban time-lapse showing the rhythm of city life.",
  },
  {
    id: "doc-3",
    title: "Underwater World",
    prompt: "A sea turtle gliding gracefully through crystal clear tropical water, sunlight rays penetrating from above, colorful coral reef below, small fish schooling in the background, slow motion, National Geographic underwater photography",
    style: "documentary",
    bestFor: ["Runway", "Sora", "Veo 2"],
    description: "Serene underwater footage with natural lighting.",
  },

  // ── Product & Commercial ────────────────────────────────────
  {
    id: "prod-1",
    title: "Luxury Watch Reveal",
    prompt: "A luxury watch slowly rotating on a dark surface, dramatic side lighting creating sharp reflections on the metal bracelet, shallow depth of field, subtle sparkle on the crystal, black background with gradient, studio product photography style",
    style: "product",
    bestFor: ["Runway", "Luma", "Kling"],
    description: "Premium product reveal with dramatic lighting.",
  },
  {
    id: "prod-2",
    title: "Food Splash",
    prompt: "Fresh strawberries splashing into creamy milk in super slow motion, 1000fps effect, droplets frozen mid-air, clean white background, dramatic lighting from above, commercial food photography, appetizing and vibrant colors",
    style: "product",
    bestFor: ["Runway", "Pika", "Kling"],
    description: "Eye-catching food commercial with high-speed photography feel.",
  },
  {
    id: "prod-3",
    title: "Sneaker Launch",
    prompt: "A futuristic sneaker floating and rotating in a void with particles and light trails orbiting around it, holographic material catching colorful light, minimalist dark background, Nike commercial style, product hero shot",
    style: "product",
    bestFor: ["Runway", "Pika", "Luma"],
    description: "High-energy product launch video for footwear or tech.",
  },

  // ── Abstract & Artistic ─────────────────────────────────────
  {
    id: "abs-1",
    title: "Liquid Gold",
    prompt: "Abstract fluid simulation of liquid gold and deep black ink swirling and merging in slow motion, metallic reflections, organic flowing forms, high contrast, macro lens, satisfying fluid dynamics, ASMR visual",
    style: "abstract",
    bestFor: ["Pika", "Runway", "Wan 2.1"],
    description: "Mesmerizing fluid art with metallic tones.",
  },
  {
    id: "abs-2",
    title: "Fractal Bloom",
    prompt: "A Mandelbrot fractal zooming infinitely inward, morphing from organic flower-like shapes to geometric crystal structures, shifting color palette from deep purple to electric cyan, hypnotic seamless loop",
    style: "abstract",
    bestFor: ["Pika", "Wan 2.1", "LTX-Video"],
    description: "Infinite fractal zoom with organic-to-geometric transition.",
  },
  {
    id: "abs-3",
    title: "Paper Cut Animation",
    prompt: "Intricate paper cut art coming to life, layers of white paper with shadows creating depth, flowers blooming and butterflies emerging, stop-motion feel, warm directional lighting creating dramatic shadows, minimal color palette",
    style: "abstract",
    bestFor: ["Pika", "Kling", "Runway"],
    description: "Delicate paper craft aesthetic with dimensional lighting.",
  },

  // ── Retro & Vintage ─────────────────────────────────────────
  {
    id: "ret-1",
    title: "VHS Nostalgia",
    prompt: "A family gathering at a backyard barbecue in the 1990s, VHS camcorder footage with tracking lines and scan artifacts, warm oversaturated colors, date stamp in the corner, authentic home video aesthetic, slight camera shake",
    style: "retro",
    bestFor: ["Kling", "Pika", "Wan 2.1"],
    description: "Authentic 90s home video look with VHS artifacts.",
  },
  {
    id: "ret-2",
    title: "Silent Film Era",
    prompt: "A mustached gentleman in a top hat doing a comedic double-take on a busy 1920s street, black and white with film grain and light scratches, slightly sped up movement, vignette, title card style, Charlie Chaplin era aesthetic",
    style: "retro",
    bestFor: ["Runway", "Kling", "Wan 2.1"],
    description: "Authentic 1920s silent film comedy aesthetic.",
  },
  {
    id: "ret-3",
    title: "Art Deco Cinema",
    prompt: "An elegant 1930s movie theater marquee with art deco geometric patterns in gold and cream, lights chasing around the border, a glamorous woman in a fur stole walking past, warm golden lighting, Gatsby era aesthetic, Alphonse Mucha influence",
    style: "retro",
    bestFor: ["Runway", "Sora", "Kling"],
    description: "Golden age Hollywood glamour with art deco details.",
  },

  // ── Nature & Landscape ──────────────────────────────────────
  {
    id: "nat-1",
    title: "Northern Lights",
    prompt: "The aurora borealis dancing across a clear Arctic sky, green and purple curtains of light reflecting in a perfectly still fjord below, snow-covered mountains, time-lapse movement, 8K clarity, breathtaking natural wonder",
    style: "nature",
    bestFor: ["Veo 2", "Runway", "Sora"],
    description: "Spectacular aurora display over pristine arctic landscape.",
  },
  {
    id: "nat-2",
    title: "Cherry Blossom Drift",
    prompt: "Pink cherry blossom petals falling gently in a Japanese garden, stone path leading to a wooden bridge over a koi pond, soft morning mist, golden hour side light, slow motion, peaceful zen atmosphere, spring in Kyoto",
    style: "nature",
    bestFor: ["Runway", "Kling", "Luma"],
    description: "Serene Japanese garden in peak cherry blossom season.",
  },

  // ── Sci-Fi & Fantasy ────────────────────────────────────────
  {
    id: "sf-1",
    title: "Space Station Window",
    prompt: "POV from inside a space station looking out a large observation window, Earth slowly rotating below with city lights visible on the night side, interior has soft ambient lighting and floating objects, astronaut floats past, Interstellar atmosphere",
    style: "sci-fi",
    bestFor: ["Sora", "Runway", "Veo 2"],
    description: "Awe-inspiring view from orbit with realistic zero gravity.",
  },
  {
    id: "sf-2",
    title: "Dragon Flight",
    prompt: "A massive dragon with iridescent scales soaring through clouds at sunset, wings beating powerfully, rider holding on, camera tracking alongside, volumetric clouds lit by golden light, epic fantasy atmosphere, Game of Thrones quality",
    style: "sci-fi",
    bestFor: ["Runway", "Sora", "Kling"],
    description: "Epic fantasy dragon sequence with cinematic scale.",
  },
  {
    id: "sf-3",
    title: "Neon Cybercity",
    prompt: "Flying through a densely packed cyberpunk megacity at night, neon holographic advertisements in Japanese and Chinese, flying vehicles, rain, dense atmosphere, first-person drone shot weaving between buildings, Blade Runner 2049 aesthetic",
    style: "sci-fi",
    bestFor: ["Runway", "Kling", "Sora"],
    description: "Immersive cyberpunk cityscape flythrough.",
  },
];

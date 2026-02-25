// ─── Types ────────────────────────────────────────────────────────────────────

export interface PromptTag {
  id: string;
  label: string;
  description: string;
  psychology?: string;
  references?: string[];
  promptText: string; // what gets injected into the final prompt
}

export interface EmotionArc {
  id: string;
  label: string;
  emoji: string;
  description: string;
  progression: { phase: string; emotion: string; visual: string }[];
  suggestedTags: string[]; // tag IDs to auto-suggest
  promptPrefix: string;
}

export interface SceneArchetype {
  id: string;
  label: string;
  emotion: string; // parent emotion ID
  description: string;
  styleVariations: { id: string; label: string; promptText: string }[];
  promptBase: string;
}

export interface CharacterStrategy {
  id: string;
  label: string;
  description: string;
  promptText: string;
}

export interface PresetRecipe {
  id: string;
  label: string;
  description: string;
  tags: string[];
  emotion?: string;
  archetype?: string;
  characterStrategy?: string;
  promptOverride?: string; // full prompt instead of tag assembly
}

export type TagCategory =
  | "camera"
  | "angle"
  | "lens"
  | "lighting"
  | "color"
  | "shot"
  | "motion"
  | "atmosphere";

// ─── Emotion Arcs ─────────────────────────────────────────────────────────────

export const EMOTION_ARCS: EmotionArc[] = [
  {
    id: "tense",
    label: "Tense",
    emoji: "\u{1F624}",
    description: "Held breath, something about to snap",
    progression: [
      { phase: "Start", emotion: "Unease", visual: "Normal but something off" },
      { phase: "Middle", emotion: "Recognition", visual: "Freeze, head turn" },
      { phase: "End", emotion: "Impact", visual: "The snap, the hit, the reveal" },
    ],
    suggestedTags: ["telephoto", "low_key", "shallow_dof", "push_in"],
    promptPrefix: "building tension, anticipation, the moment before impact",
  },
  {
    id: "longing",
    label: "Longing",
    emoji: "\u{1F60D}",
    description: "Aching for something just out of reach",
    progression: [
      { phase: "Start", emotion: "Yearning", visual: "Distance, separation" },
      { phase: "Middle", emotion: "Hope", visual: "Movement toward" },
      { phase: "End", emotion: "Connection or loss", visual: "Touch or turning away" },
    ],
    suggestedTags: ["golden_hour", "telephoto", "shallow_dof", "handheld"],
    promptPrefix: "emotional longing, bittersweet atmosphere, aching beauty",
  },
  {
    id: "awe",
    label: "Awe",
    emoji: "\u{1F929}",
    description: "Overwhelming scale and wonder",
    progression: [
      { phase: "Start", emotion: "Curiosity", visual: "Approaching, small details" },
      { phase: "Middle", emotion: "Realization", visual: "Scale becomes apparent" },
      { phase: "End", emotion: "Overwhelm", visual: "Vast reveal" },
    ],
    suggestedTags: ["wide_angle", "crane", "god_rays", "deep_focus"],
    promptPrefix: "awe-inspiring scale, breathtaking vista, overwhelming beauty",
  },
  {
    id: "melancholy",
    label: "Melancholy",
    emoji: "\u{1F622}",
    description: "Beautiful sadness, things ending",
    progression: [
      { phase: "Start", emotion: "Nostalgia", visual: "Familiar place, empty" },
      { phase: "Middle", emotion: "Acceptance", visual: "Letting go gesture" },
      { phase: "End", emotion: "Peace", visual: "Walking away, fade" },
    ],
    suggestedTags: ["blue_hour", "static", "desaturated", "wide_shot"],
    promptPrefix: "melancholic atmosphere, beautiful sadness, quiet emotional weight",
  },
  {
    id: "unease",
    label: "Unease",
    emoji: "\u{1F630}",
    description: "Something is deeply wrong",
    progression: [
      { phase: "Start", emotion: "Discomfort", visual: "Off-kilter framing" },
      { phase: "Middle", emotion: "Dread", visual: "Shadow movement, wrong detail" },
      { phase: "End", emotion: "Terror", visual: "The thing revealed" },
    ],
    suggestedTags: ["dutch", "low_key", "wide_angle", "static"],
    promptPrefix: "unsettling atmosphere, creeping dread, psychological horror",
  },
  {
    id: "joy",
    label: "Joy",
    emoji: "\u{1F602}",
    description: "Celebration, breakthrough, elation",
    progression: [
      { phase: "Start", emotion: "Build-up", visual: "Anticipation, waiting" },
      { phase: "Middle", emotion: "Release", visual: "The moment hits" },
      { phase: "End", emotion: "Elation", visual: "Pure expression" },
    ],
    suggestedTags: ["golden_hour", "handheld", "wide_angle", "high_key"],
    promptPrefix: "joyful energy, celebration, emotional release, uplifting atmosphere",
  },
  {
    id: "power",
    label: "Power",
    emoji: "\u{1F4AA}",
    description: "Dominance, strength, transformation",
    progression: [
      { phase: "Start", emotion: "Potential", visual: "Calm before the storm" },
      { phase: "Middle", emotion: "Activation", visual: "Energy building" },
      { phase: "End", emotion: "Unleashed", visual: "Full power displayed" },
    ],
    suggestedTags: ["low_angle", "telephoto", "rim_light", "push_in"],
    promptPrefix: "powerful presence, commanding authority, raw strength",
  },
  {
    id: "mystery",
    label: "Mystery",
    emoji: "\u{1F52E}",
    description: "Questions without answers, hidden truths",
    progression: [
      { phase: "Start", emotion: "Intrigue", visual: "Partial view, obscured" },
      { phase: "Middle", emotion: "Investigation", visual: "Revealing details" },
      { phase: "End", emotion: "Deeper mystery", visual: "More questions than answers" },
    ],
    suggestedTags: ["anamorphic", "split_light", "fog", "rack_focus"],
    promptPrefix: "mysterious atmosphere, hidden details, enigmatic presence",
  },
];

// ─── Scene Archetypes ─────────────────────────────────────────────────────────

export const SCENE_ARCHETYPES: SceneArchetype[] = [
  {
    id: "standoff",
    label: "The Standoff",
    emotion: "tense",
    description: "Two forces frozen before violence erupts",
    styleVariations: [
      { id: "eastern", label: "Eastern Dojo", promptText: "traditional dojo, wooden floors, afternoon light through paper screens, martial arts stance" },
      { id: "western", label: "Western Dusty", promptText: "dusty frontier town, high noon sun, tumbleweed, leather holsters, squinting eyes" },
      { id: "cyberpunk", label: "Neon Alley", promptText: "rain-soaked neon alley, holographic reflections, steam rising from vents, cyberpunk atmosphere" },
      { id: "medieval", label: "Castle Grounds", promptText: "stone courtyard, torch-lit, medieval armor, banners fluttering, mud underfoot" },
    ],
    promptBase: "two figures facing each other, motionless, extreme tension, the moment before action erupts",
  },
  {
    id: "chase",
    label: "The Chase",
    emotion: "tense",
    description: "Hunter and hunted through a maze",
    styleVariations: [
      { id: "urban", label: "Urban Parkour", promptText: "rooftop jumping, fire escapes, urban landscape, breathless pursuit" },
      { id: "forest", label: "Dark Forest", promptText: "dense trees, moonlight through canopy, branches snapping, fog between trunks" },
      { id: "market", label: "Crowded Market", promptText: "bustling market stalls, knocking over goods, weaving through crowds, colorful chaos" },
    ],
    promptBase: "desperate chase sequence, hunter and prey, urgency in every step",
  },
  {
    id: "discovery",
    label: "The Discovery",
    emotion: "awe",
    description: "Finding something that changes everything",
    styleVariations: [
      { id: "ancient", label: "Ancient Chamber", promptText: "torch-lit ruins, dust particles in light beams, ancient symbols glowing on walls" },
      { id: "cosmic", label: "Cosmic Scale", promptText: "planet edge, star field, nebula colors, incomprehensible scale, astronaut perspective" },
      { id: "nature", label: "Hidden Paradise", promptText: "waterfall revealing hidden valley, sunbeams through mist, untouched paradise, lush green" },
      { id: "portal", label: "Portal Opening", promptText: "hands hovering over glowing symbol, light erupting, particles suspended, dimensional rift" },
    ],
    promptBase: "moment of revelation, wonder dawning, eyes widening at the impossible",
  },
  {
    id: "farewell",
    label: "The Last Goodbye",
    emotion: "melancholy",
    description: "Parting that may be permanent",
    styleVariations: [
      { id: "station", label: "Train Station", promptText: "steam platform, train departing, hand pressed against window, growing distance" },
      { id: "rain", label: "Rainy Street", promptText: "rain-streaked street, umbrella, walking in opposite directions, puddle reflections" },
      { id: "shore", label: "Shore at Dawn", promptText: "waves lapping, dawn breaking, figure walking into distance, footprints in sand" },
    ],
    promptBase: "emotional farewell, the weight of goodbye, beautiful and painful parting",
  },
  {
    id: "arrival",
    label: "The Arrival",
    emotion: "power",
    description: "Someone or something appears with authority",
    styleVariations: [
      { id: "hero", label: "Hero Landing", promptText: "dramatic landing pose, dust cloud settling, rising slowly, silhouetted against light" },
      { id: "ship", label: "Ship Approaching", promptText: "massive vessel emerging from clouds, shadow falling over landscape, overwhelming scale" },
      { id: "figure", label: "Doorway Entrance", promptText: "figure standing in bright doorway, interior dark, backlit, face in shadow" },
    ],
    promptBase: "dramatic entrance, commanding presence, all eyes turn",
  },
  {
    id: "transformation",
    label: "The Transformation",
    emotion: "awe",
    description: "Something becoming something else entirely",
    styleVariations: [
      { id: "metamorphosis", label: "Metamorphosis", promptText: "body changing form, ethereal light emanating, particles swirling, physical transformation" },
      { id: "season", label: "Season Change", promptText: "timelapse of leaves changing, snow melting to flowers, nature transforming" },
      { id: "city", label: "City Evolution", promptText: "buildings rising and falling, day to night cycles, decades in seconds" },
    ],
    promptBase: "transformation in progress, change made visible, before becoming after",
  },
  {
    id: "touch",
    label: "The Touch",
    emotion: "longing",
    description: "The moment of first contact",
    styleVariations: [
      { id: "hands", label: "Reaching Hands", promptText: "two hands reaching across gap, fingers almost touching, anticipation of contact" },
      { id: "rain_kiss", label: "Rain Kiss", promptText: "rain pouring, faces inches apart, water droplets on skin, warm breath visible" },
      { id: "reunion", label: "Running Reunion", promptText: "running toward each other, crowds parting, emotional embrace, tears of joy" },
    ],
    promptBase: "intimate moment of connection, closing the distance, emotional contact",
  },
  {
    id: "haunting",
    label: "The Haunting",
    emotion: "unease",
    description: "Something watching from the shadows",
    styleVariations: [
      { id: "mirror", label: "Mirror Wrong", promptText: "reflection moves differently, mirror shows different scene, uncanny valley" },
      { id: "hallway", label: "Long Hallway", promptText: "endless hallway, flickering lights, distant figure standing still, institutional horror" },
      { id: "window", label: "Window Watcher", promptText: "face barely visible in dark window, interior lights revealing shape, voyeuristic dread" },
    ],
    promptBase: "something wrong in the frame, presence felt but not fully seen, creeping horror",
  },
];

// ─── Camera Tags ──────────────────────────────────────────────────────────────

export const CAMERA_TAGS: PromptTag[] = [
  // Movement
  {
    id: "push_in",
    label: "Dolly Push-In",
    description: "Camera physically moves closer to subject",
    psychology: "Growing realization, intimacy increasing, tension building",
    references: ["Jaws (Brody on beach)", "The Godfather (Michael\u2019s transformation)"],
    promptText: "slow dolly push-in toward subject, gradually tightening frame",
  },
  {
    id: "pull_back",
    label: "Pull-Back Reveal",
    description: "Camera retreats to reveal context",
    psychology: "The bigger picture, scale revealed, isolation exposed",
    references: ["The Shawshank Redemption (rain scene)", "Contact (opening zoom-out)"],
    promptText: "camera pulling back to reveal wider context, expanding frame",
  },
  {
    id: "tracking",
    label: "Tracking Shot",
    description: "Camera moves parallel alongside subject",
    psychology: "Journey, progress, companionship with character",
    references: ["Goodfellas (Copacabana)", "Oldboy (hallway fight)"],
    promptText: "side tracking shot following subject movement, parallel camera",
  },
  {
    id: "orbit",
    label: "Orbit",
    description: "Camera circles around subject",
    psychology: "Examination, trapped, the world spinning",
    references: ["The Matrix (bullet time)", "Bad Boys"],
    promptText: "camera orbiting around subject, 360 rotation, dynamic perspective",
  },
  {
    id: "crane",
    label: "Crane / Jib",
    description: "Camera rises or descends vertically",
    psychology: "Ascension, revelation, god-like perspective shift",
    references: ["Touch of Evil (opening)", "Atonement (beach)"],
    promptText: "crane shot rising above scene, vertical camera movement, sweeping overview",
  },
  {
    id: "drone",
    label: "Drone / Aerial",
    description: "High overhead flying camera",
    psychology: "Scale, freedom, surveillance, epic scope",
    references: ["Planet Earth", "Skyfall (opening chase)"],
    promptText: "aerial drone shot, bird\u2019s eye view, sweeping landscape from above",
  },
  {
    id: "handheld",
    label: "Handheld",
    description: "Natural micro-movements, human feel",
    psychology: "Realism, urgency, intimacy, documentary feel",
    references: ["Saving Private Ryan (Omaha Beach)", "The Bourne Identity"],
    promptText: "handheld camera, natural micro-movements, documentary realism, organic feel",
  },
  {
    id: "steadicam",
    label: "Steadicam",
    description: "Smooth floating movement through space",
    psychology: "Dreamy, ghostly, following without effort",
    references: ["The Shining (Danny\u2019s tricycle)", "Goodfellas"],
    promptText: "steadicam smooth floating movement, gliding through space",
  },
  {
    id: "static",
    label: "Locked Off / Static",
    description: "Camera fixed, no movement",
    psychology: "Observational, trapped, deliberate, reality unfolding",
    references: ["No Country for Old Men", "Wes Anderson (symmetry)"],
    promptText: "locked off static camera, fixed composition, observational framing",
  },
  {
    id: "whip_pan",
    label: "Whip Pan",
    description: "Fast horizontal blur transition",
    psychology: "Chaos, sudden shift, comedic timing",
    references: ["Edgar Wright films", "Boogie Nights"],
    promptText: "whip pan transition, fast horizontal camera movement, motion blur",
  },
  {
    id: "vertigo_zoom",
    label: "Dolly Zoom",
    description: "Background shifts while subject stays same size",
    psychology: "Disorientation, realization, world changing around you",
    references: ["Vertigo", "Jaws", "Goodfellas"],
    promptText: "dolly zoom vertigo effect, background stretching while subject stays fixed",
  },
  {
    id: "rack_focus",
    label: "Rack Focus",
    description: "Focus shifts between foreground and background",
    psychology: "Attention redirect, connection between two elements, revelation",
    references: ["Every thriller ever", "Children of Men"],
    promptText: "rack focus shifting between foreground and background, attention pulling",
  },
];

// ─── Angle Tags ───────────────────────────────────────────────────────────────

export const ANGLE_TAGS: PromptTag[] = [
  {
    id: "low_angle",
    label: "Low Angle",
    description: "Camera below subject looking up",
    psychology: "Power, heroism, dominance, threat",
    references: ["The Dark Knight (Joker)", "Citizen Kane", "Breaking Bad"],
    promptText: "low angle shot looking up at subject, powerful imposing framing",
  },
  {
    id: "high_angle",
    label: "High Angle",
    description: "Camera above subject looking down",
    psychology: "Vulnerability, powerlessness, trapped",
    references: ["Psycho (shower)", "Requiem for a Dream"],
    promptText: "high angle shot looking down, subject diminished, vulnerable positioning",
  },
  {
    id: "eye_level",
    label: "Eye Level",
    description: "Camera at subject\u2019s eye height",
    psychology: "Equality, neutrality, direct connection with viewer",
    references: ["Most dialogue scenes", "Ozu films"],
    promptText: "eye level shot, neutral framing, direct connection",
  },
  {
    id: "dutch",
    label: "Dutch Angle",
    description: "Tilted horizon line",
    psychology: "Disorientation, madness, transition between worlds",
    references: ["The Third Man", "Batman (1989)", "Inception"],
    promptText: "dutch angle, tilted horizon, disorienting composition, unsettling",
  },
  {
    id: "worms_eye",
    label: "Worm\u2019s Eye",
    description: "Camera on ground pointing straight up",
    psychology: "Extreme scale, monumental, alien perspective",
    references: ["Blade Runner 2049 (statues)", "Lord of the Rings"],
    promptText: "extreme low worm\u2019s eye view, looking straight up from ground level",
  },
  {
    id: "birds_eye",
    label: "Bird\u2019s Eye",
    description: "Directly overhead looking straight down",
    psychology: "God perspective, pattern recognition, detachment",
    references: ["Wes Anderson (overhead tableaus)", "Breaking Bad"],
    promptText: "bird\u2019s eye overhead view, looking straight down, top-down perspective",
  },
];

// ─── Lens Tags ────────────────────────────────────────────────────────────────

export const LENS_TAGS: PromptTag[] = [
  {
    id: "wide_angle",
    label: "Wide (24mm)",
    description: "Broad field of view, slight edge distortion",
    psychology: "Scope, environment, slight unease from distortion",
    references: ["The Shining (hallways)", "Lawrence of Arabia"],
    promptText: "24mm wide angle lens, expansive view, environmental context, deep focus",
  },
  {
    id: "standard",
    label: "Standard (50mm)",
    description: "Closest to human eye perception",
    psychology: "Natural, truthful, intimate without distortion",
    references: ["Most Kubrick films", "The Master"],
    promptText: "50mm standard lens, natural perspective, true-to-life rendering",
  },
  {
    id: "telephoto",
    label: "Telephoto (85mm+)",
    description: "Compresses space, isolates subject",
    psychology: "Voyeurism, isolation, flattened world, intimacy from afar",
    references: ["Sergio Leone close-ups", "Heat (coffee scene)"],
    promptText: "85mm telephoto lens, compressed perspective, shallow depth of field, subject isolated",
  },
  {
    id: "anamorphic",
    label: "Anamorphic",
    description: "Oval bokeh, horizontal lens flares",
    psychology: "Epic cinema, premium quality, nostalgia for film",
    references: ["Blade Runner 2049", "La La Land", "Mad Max: Fury Road"],
    promptText: "anamorphic lens, horizontal lens flares, oval bokeh, cinematic widescreen",
  },
  {
    id: "macro",
    label: "Macro",
    description: "Extreme close-up of tiny details",
    psychology: "Fascination, hidden worlds, obsessive focus",
    references: ["Planet Earth (insects)", "Ant-Man"],
    promptText: "macro lens extreme close-up, tiny details magnified, razor-thin focus plane",
  },
  {
    id: "tilt_shift",
    label: "Tilt-Shift",
    description: "Selective focus making scenes look miniature",
    psychology: "Playful, god-like, toybox world",
    references: ["The Social Network (regatta)", "time-lapse cityscapes"],
    promptText: "tilt-shift miniature effect, selective focus band, toybox perspective",
  },
  {
    id: "shallow_dof",
    label: "Shallow DOF",
    description: "Subject sharp, background creamy blur",
    psychology: "Focus, isolation, romantic separation from world",
    references: ["Portrait photography", "Wong Kar-wai films"],
    promptText: "shallow depth of field, creamy bokeh background, subject sharply isolated",
  },
  {
    id: "deep_focus",
    label: "Deep Focus",
    description: "Everything sharp from near to far",
    psychology: "Control, clarity, nothing hidden, democratic framing",
    references: ["Citizen Kane", "Spielberg wide shots"],
    promptText: "deep focus, everything sharp from foreground to background, clear composition",
  },
];

// ─── Lighting Tags ────────────────────────────────────────────────────────────

export const LIGHTING_TAGS: PromptTag[] = [
  {
    id: "rembrandt",
    label: "Rembrandt",
    description: "Triangle of light on cheek, dramatic portraiture",
    psychology: "Intelligence, contemplation, classic drama",
    references: ["The Godfather", "Lincoln"],
    promptText: "Rembrandt lighting, dramatic side light, triangular highlight on cheek",
  },
  {
    id: "split_light",
    label: "Split Light",
    description: "Half face lit, half in shadow",
    psychology: "Duality, secrets, moral ambiguity, noir",
    references: ["The Godfather (opening)", "Sin City", "Blade Runner"],
    promptText: "split lighting, half face illuminated half in shadow, film noir contrast",
  },
  {
    id: "butterfly",
    label: "Butterfly",
    description: "Light from above creating shadow under nose",
    psychology: "Glamour, old Hollywood, beauty emphasis",
    references: ["Classic Hollywood portraits", "Marlene Dietrich"],
    promptText: "butterfly lighting from above, glamorous shadows, old Hollywood portraiture",
  },
  {
    id: "rim_light",
    label: "Rim / Backlight",
    description: "Light from behind creating glowing edge",
    psychology: "Heroic halo, separation from background, ethereal",
    references: ["Aliens", "The Dark Knight", "Every hero shot"],
    promptText: "rim lighting, backlit with glowing edge outline, heroic halo effect",
  },
  {
    id: "golden_hour",
    label: "Golden Hour",
    description: "Warm, soft light an hour before sunset",
    psychology: "Nostalgia, warmth, fleeting beauty, romance",
    references: ["Terrence Malick films", "The Revenant"],
    promptText: "golden hour warm lighting, soft amber tones, long shadows, magic hour glow",
  },
  {
    id: "blue_hour",
    label: "Blue Hour",
    description: "Cool twilight just after sunset",
    psychology: "Transition, endings, urban melancholy, reflection",
    references: ["Collateral", "Moonlight", "Lost in Translation"],
    promptText: "blue hour twilight, cool ambient tones, city lights balancing with sky",
  },
  {
    id: "neon",
    label: "Neon Noir",
    description: "Colorful neon sources, high contrast shadows",
    psychology: "Cyberpunk, danger, nightlife, otherworldly",
    references: ["Drive", "Blade Runner", "John Wick"],
    promptText: "neon lighting, colorful neon signs reflecting on wet surfaces, cyberpunk noir",
  },
  {
    id: "god_rays",
    label: "God Rays / Volumetric",
    description: "Visible light beams through atmosphere",
    psychology: "Divine, epic, discovery, spiritual revelation",
    references: ["Indiana Jones (temple scenes)", "Alien", "any cathedral"],
    promptText: "volumetric god rays, visible light beams through dust or fog, atmospheric lighting",
  },
  {
    id: "high_key",
    label: "High Key",
    description: "Bright, minimal shadows, clean look",
    psychology: "Optimism, safety, clinical, futuristic",
    references: ["Apple commercials", "Her", "Ex Machina"],
    promptText: "high key lighting, bright even illumination, minimal shadows, clean aesthetic",
  },
  {
    id: "low_key",
    label: "Low Key",
    description: "Dark with dramatic pockets of light",
    psychology: "Mystery, danger, intimacy, dramatic weight",
    references: ["Se7en", "Zodiac", "most horror films"],
    promptText: "low key lighting, predominantly dark with dramatic pools of light, heavy shadows",
  },
  {
    id: "practical",
    label: "Practical Lights",
    description: "Light from visible sources in the scene (lamps, candles, screens)",
    psychology: "Realism, intimacy, believability",
    references: ["Roger Deakins\u2019 work", "Moonlight", "1917"],
    promptText: "practical lighting from visible sources, realistic light motivation, candles or lamps in frame",
  },
  {
    id: "silhouette",
    label: "Silhouette",
    description: "Subject as dark shape against bright background",
    psychology: "Mystery, universality, iconic shape, anonymity",
    references: ["James Bond opening credits", "The Lion King"],
    promptText: "silhouetted figure against bright background, dark shape, rim outline only",
  },
];

// ─── Color Grade Tags ─────────────────────────────────────────────────────────

export const COLOR_TAGS: PromptTag[] = [
  {
    id: "teal_orange",
    label: "Teal & Orange",
    description: "Complementary contrast, blockbuster standard",
    promptText: "teal and orange color grading, complementary color contrast, blockbuster look",
  },
  {
    id: "bleach_bypass",
    label: "Bleach Bypass",
    description: "Harsh, desaturated, silver-retained look",
    references: ["Saving Private Ryan", "Minority Report"],
    promptText: "bleach bypass look, desaturated harsh contrast, silver retention",
  },
  {
    id: "desaturated",
    label: "Desaturated",
    description: "Muted colors, drained of vibrancy",
    promptText: "desaturated muted color palette, drained vibrancy, somber tones",
  },
  {
    id: "high_contrast",
    label: "High Contrast",
    description: "Deep blacks, bright whites, punchy",
    promptText: "high contrast, deep blacks, bright highlights, punchy dramatic look",
  },
  {
    id: "pastel",
    label: "Pastel / Soft",
    description: "Lifted shadows, gentle pastel tones",
    references: ["Wes Anderson", "Sofia Coppola"],
    promptText: "soft pastel color grading, lifted shadows, gentle muted tones",
  },
  {
    id: "monochrome",
    label: "Black & White",
    description: "Stripped to luminance only",
    references: ["Schindler\u2019s List", "Roma", "Sin City"],
    promptText: "black and white, monochrome, dramatic grayscale, film noir contrast",
  },
  {
    id: "film_grain",
    label: "Film Grain",
    description: "Organic texture of analog film",
    promptText: "visible film grain texture, analog film aesthetic, organic imperfections",
  },
  {
    id: "warm_vintage",
    label: "Warm Vintage",
    description: "Amber highlights, faded look, 70s vibe",
    references: ["Once Upon a Time in Hollywood", "Boogie Nights"],
    promptText: "warm vintage color grading, amber highlights, faded retro tones, 70s film stock",
  },
  {
    id: "cold_steel",
    label: "Cold Steel",
    description: "Blue-grey clinical tones",
    references: ["The Matrix", "Fincher films"],
    promptText: "cold steel blue-grey color grading, clinical sterile tones, metallic atmosphere",
  },
];

// ─── Shot Type Tags ───────────────────────────────────────────────────────────

export const SHOT_TAGS: PromptTag[] = [
  {
    id: "ecu",
    label: "Extreme Close-Up",
    description: "Just eyes, hands, or a single detail",
    psychology: "Intensity, obsession, emotional extremity",
    promptText: "extreme close-up, single detail filling frame, intimate macro view",
  },
  {
    id: "close_up",
    label: "Close-Up",
    description: "Head and shoulders, face fills frame",
    psychology: "Emotion, connection, we see everything they feel",
    promptText: "close-up shot, face filling frame, emotional detail visible",
  },
  {
    id: "medium",
    label: "Medium Shot",
    description: "Waist up, body language visible",
    psychology: "Conversation, comfortable distance, natural",
    promptText: "medium shot, waist up, body language visible, conversational framing",
  },
  {
    id: "full_shot",
    label: "Full Shot",
    description: "Entire body head to toe",
    psychology: "Action, physicality, character in space",
    promptText: "full body shot, head to toe, character in complete view",
  },
  {
    id: "wide_shot",
    label: "Wide / Establishing",
    description: "Environment dominates, subject small",
    psychology: "Context, scale, loneliness, setting the scene",
    promptText: "wide establishing shot, environment dominating frame, small figure in landscape",
  },
  {
    id: "extreme_wide",
    label: "Extreme Wide",
    description: "Vast landscape, subject may be invisible",
    psychology: "Insignificance, epic scale, nature\u2019s power",
    promptText: "extreme wide shot, vast landscape, epic scale, subject tiny in environment",
  },
  {
    id: "over_shoulder",
    label: "Over-the-Shoulder",
    description: "Looking past one subject at another",
    psychology: "Connection between characters, perspective, POV suggestion",
    promptText: "over-the-shoulder shot, foreground shoulder blur, looking at other subject",
  },
  {
    id: "pov",
    label: "POV / First Person",
    description: "Camera is the character\u2019s eyes",
    psychology: "Immersion, vulnerability, you are there",
    promptText: "first person POV shot, subjective camera, seeing through character\u2019s eyes",
  },
];

// ─── Atmosphere Enhancers ─────────────────────────────────────────────────────

export const ATMOSPHERE_TAGS: PromptTag[] = [
  { id: "fog", label: "Fog / Mist", description: "Diffused visibility, mystery", promptText: "thick fog, mist diffusing light, obscured background, mysterious atmosphere" },
  { id: "rain", label: "Rain", description: "Reflections, emotion, renewal", promptText: "heavy rain, wet reflections on every surface, droplets catching light" },
  { id: "snow", label: "Snow", description: "Silence, purity, isolation", promptText: "falling snow, white blanket, muffled silence, cold breath visible" },
  { id: "dust", label: "Dust Particles", description: "Visible motes in light beams", promptText: "dust particles floating in light beams, visible motes, atmospheric texture" },
  { id: "storm", label: "Approaching Storm", description: "Dark clouds, wind picking up", promptText: "dark storm clouds approaching, wind increasing, ominous atmospheric tension" },
  { id: "smoke", label: "Smoke / Haze", description: "Atmospheric depth, danger", promptText: "smoke and haze filling scene, atmospheric depth layers, diffused lighting" },
  { id: "fire", label: "Fire / Flames", description: "Warmth, destruction, passion", promptText: "fire and flames casting warm flickering light, shadows dancing, intense glow" },
  { id: "underwater", label: "Underwater", description: "Distortion, weightlessness, otherworldly", promptText: "underwater scene, light refracting through water, bubbles, weightless movement" },
  { id: "reflection", label: "Reflections", description: "Puddles, mirrors, glass, duality", promptText: "reflections in water puddles, mirror surfaces, glass creating doubled imagery" },
  { id: "lens_flare", label: "Lens Flare", description: "Light hitting lens directly, cinematic artifact", promptText: "lens flare from light source, cinematic light artifact, JJ Abrams style" },
];

// ─── Character Strategies (for consistency workarounds) ───────────────────────

export const CHARACTER_STRATEGIES: CharacterStrategy[] = [
  {
    id: "silhouette_char",
    label: "Silhouette Only",
    description: "No face details \u2014 identity through shape and posture",
    promptText: "silhouetted figure, no facial features visible, identity conveyed through body shape and posture only",
  },
  {
    id: "back_to_camera",
    label: "Back to Camera",
    description: "Mystery and universality \u2014 any viewer can be this person",
    promptText: "figure seen from behind, back to camera, no face visible, universal character",
  },
  {
    id: "reflection_char",
    label: "Reflection",
    description: "Distorted in water or glass \u2014 hides inconsistencies",
    promptText: "face reflected in water or glass surface, distorted and fragmented reflection",
  },
  {
    id: "extreme_detail",
    label: "Eyes / Hands Only",
    description: "Extreme close-up of one feature, not full face",
    promptText: "extreme close-up on eyes only or hands only, no full face visible, intimate detail",
  },
  {
    id: "wide_figure",
    label: "Distant Figure",
    description: "Too far to see face \u2014 shape in landscape",
    promptText: "distant figure in wide landscape, too far for facial details, lone shape against vast environment",
  },
  {
    id: "masked",
    label: "Masked / Helmeted",
    description: "Face covered by design \u2014 natural story reason",
    promptText: "masked or helmeted figure, face covered, identity concealed by design",
  },
];

// ─── Preset Recipes ───────────────────────────────────────────────────────────

export const PRESET_RECIPES: PresetRecipe[] = [
  {
    id: "hero_entrance",
    label: "The Hero\u2019s Entrance",
    description: "Low angle, golden hour, slow push-in \u2014 the moment a legend arrives",
    tags: ["low_angle", "golden_hour", "push_in", "wide_angle", "shallow_dof", "rim_light"],
    emotion: "power",
    archetype: "arrival",
    characterStrategy: "silhouette_char",
    promptOverride: "Low angle heroic shot, golden hour warm backlighting, slow dolly push-in, wide angle lens capturing epic scale, silhouetted figure against bright sky, rim lighting creating glowing outline, dust particles in air, shallow depth of field, cinematic 24fps, dramatic entrance",
  },
  {
    id: "villain_reveal",
    label: "The Villain Reveal",
    description: "Dutch angle, split light, anamorphic \u2014 pure menace",
    tags: ["dutch", "split_light", "anamorphic", "static", "low_key", "cold_steel"],
    emotion: "unease",
    characterStrategy: "extreme_detail",
    promptOverride: "Dutch angle tilted composition, split lighting illuminating half of face in sharp contrast, anamorphic lens with horizontal flares, static locked camera, low key dramatic shadows, cold steel blue-grey tones, menacing atmosphere, cinematic tension, villain introduction",
  },
  {
    id: "ghost_in_hall",
    label: "The Ghost",
    description: "Static, wide angle, low key \u2014 something at the end of the corridor",
    tags: ["static", "wide_angle", "low_key", "fog", "desaturated"],
    emotion: "unease",
    archetype: "haunting",
    characterStrategy: "silhouette_char",
    promptOverride: "Static camera, wide angle lens showing long hallway, fog drifting at ankle level, low key lighting with flickering fluorescent, desaturated muted colors, distant silhouetted figure standing motionless at far end, creeping dread, horror atmosphere, cinematic",
  },
  {
    id: "first_kiss",
    label: "The First Kiss",
    description: "Eye level, golden hour, handheld \u2014 natural, warm, alive",
    tags: ["eye_level", "golden_hour", "handheld", "telephoto", "shallow_dof", "warm_vintage"],
    emotion: "longing",
    archetype: "touch",
    promptOverride: "Eye level intimate shot, golden hour soft warm backlighting, gentle handheld movement, 85mm telephoto lens creating beautiful bokeh, shallow depth of field isolating couple, warm vintage color grading, faces inches apart, tender emotional moment, cinematic romance",
  },
  {
    id: "cosmic_reveal",
    label: "The Cosmic Reveal",
    description: "Crane up, wide angle, god rays \u2014 jaw drops",
    tags: ["crane", "wide_angle", "god_rays", "deep_focus", "teal_orange"],
    emotion: "awe",
    archetype: "discovery",
    characterStrategy: "wide_figure",
    promptOverride: "Crane shot rising to reveal vast landscape, wide angle lens capturing impossible scale, volumetric god rays piercing through clouds, deep focus everything sharp, teal and orange color grading, tiny figure dwarfed by environment, breathtaking vista, epic cinematic awe",
  },
  {
    id: "rain_farewell",
    label: "The Rain Farewell",
    description: "Blue hour, tracking shot, reflections \u2014 beautiful sadness",
    tags: ["tracking", "blue_hour", "telephoto", "rain", "reflection", "desaturated"],
    emotion: "melancholy",
    archetype: "farewell",
    promptOverride: "Side tracking shot following figure walking away in rain, blue hour twilight, telephoto compression flattening city behind them, rain-soaked streets with neon reflections, desaturated melancholic color grading, umbrella or no umbrella, beautiful sadness, cinematic farewell",
  },
  {
    id: "fight_standoff",
    label: "The Dojo Standoff",
    description: "Telephoto, static, Rembrandt light \u2014 the breath before the strike",
    tags: ["static", "telephoto", "rembrandt", "shallow_dof", "dust", "warm_vintage"],
    emotion: "tense",
    archetype: "standoff",
    promptOverride: "Static locked camera, telephoto compression bringing two fighters close in frame, Rembrandt lighting with dramatic shadows, shallow depth of field, dust particles floating in shaft of afternoon light, traditional dojo setting, warm vintage tones, extreme tension before combat, cinematic martial arts",
  },
  {
    id: "neon_night",
    label: "The Neon Night",
    description: "Anamorphic, neon noir, reflections \u2014 cyberpunk mood",
    tags: ["anamorphic", "neon", "rain", "reflection", "handheld", "high_contrast"],
    emotion: "mystery",
    characterStrategy: "back_to_camera",
    promptOverride: "Anamorphic lens with horizontal neon flares, cyberpunk night scene, rain-soaked streets reflecting colorful neon signs, figure from behind walking into neon-lit alley, handheld camera movement, high contrast shadows, mysterious urban atmosphere, cinematic noir",
  },
  {
    id: "nature_timelapse",
    label: "The Living Earth",
    description: "Wide, deep focus, golden hour \u2014 nature breathing",
    tags: ["wide_shot", "deep_focus", "golden_hour", "crane"],
    emotion: "awe",
    promptOverride: "Wide establishing shot of breathtaking natural landscape, deep focus everything sharp, golden hour light painting mountains and valleys, gentle crane movement rising, clouds moving, nature alive and breathing, epic scale, David Attenborough atmosphere, cinematic 24fps",
  },
  {
    id: "product_hero",
    label: "Product Hero Shot",
    description: "Macro, high key, orbit \u2014 luxury reveal",
    tags: ["macro", "high_key", "orbit", "shallow_dof"],
    promptOverride: "Macro detail shot of luxury product surface, high key clean lighting, camera slowly orbiting to reveal form, shallow depth of field, reflective surfaces catching light, premium product photography, studio quality, cinematic commercial",
  },
];

// ─── All Tags Map (for quick lookup) ──────────────────────────────────────────

export const ALL_TAGS: Record<string, PromptTag> = {};
[
  ...CAMERA_TAGS,
  ...ANGLE_TAGS,
  ...LENS_TAGS,
  ...LIGHTING_TAGS,
  ...COLOR_TAGS,
  ...SHOT_TAGS,
  ...ATMOSPHERE_TAGS,
].forEach((tag) => {
  ALL_TAGS[tag.id] = tag;
});

// ─── Tag Category Groups (for UI tabs) ───────────────────────────────────────

export const TAG_CATEGORIES: { id: TagCategory; label: string; icon: string; tags: PromptTag[] }[] = [
  { id: "camera", label: "Camera", icon: "\u{1F3A5}", tags: CAMERA_TAGS },
  { id: "angle", label: "Angle", icon: "\u{1F4D0}", tags: ANGLE_TAGS },
  { id: "lens", label: "Lens", icon: "\u{1F50D}", tags: LENS_TAGS },
  { id: "lighting", label: "Lighting", icon: "\u{1F4A1}", tags: LIGHTING_TAGS },
  { id: "color", label: "Color", icon: "\u{1F3A8}", tags: COLOR_TAGS },
  { id: "shot", label: "Shot Type", icon: "\u{1F4F7}", tags: SHOT_TAGS },
  { id: "atmosphere", label: "Atmosphere", icon: "\u{1F32B}\u{FE0F}", tags: ATMOSPHERE_TAGS },
];

// ─── Prompt Assembly ──────────────────────────────────────────────────────────

export function buildPrompt(
  selectedTags: string[],
  emotion?: EmotionArc,
  archetype?: SceneArchetype,
  styleVariation?: string,
  characterStrategy?: CharacterStrategy
): string {
  const parts: string[] = [];

  // Emotion prefix
  if (emotion) {
    parts.push(emotion.promptPrefix);
  }

  // Archetype base
  if (archetype) {
    parts.push(archetype.promptBase);
    if (styleVariation) {
      const variation = archetype.styleVariations.find((v) => v.id === styleVariation);
      if (variation) parts.push(variation.promptText);
    }
  }

  // Technical tags in priority order: shot type → angle → camera → lens → lighting → color → atmosphere
  const orderedCategories: PromptTag[][] = [
    SHOT_TAGS,
    ANGLE_TAGS,
    CAMERA_TAGS,
    LENS_TAGS,
    LIGHTING_TAGS,
    COLOR_TAGS,
    ATMOSPHERE_TAGS,
  ];

  for (const category of orderedCategories) {
    for (const tag of category) {
      if (selectedTags.includes(tag.id)) {
        parts.push(tag.promptText);
      }
    }
  }

  // Character strategy
  if (characterStrategy) {
    parts.push(characterStrategy.promptText);
  }

  // Always append cinematic quality
  parts.push("cinematic, 24fps, high detail");

  return parts.join(", ");
}

// ─── Contextual Education ("Why This Works") ──────────────────────────────────

export interface CineInsight {
  combo: string[]; // tag IDs that trigger this insight
  title: string;
  explanation: string;
  proTip?: string;
}

export const CINE_INSIGHTS: CineInsight[] = [
  {
    combo: ["low_angle", "rim_light"],
    title: "The Hero Combo",
    explanation: "Low angle makes the subject tower over the viewer while rim lighting creates a halo effect. Together they create an almost religious sense of power and importance. This is the default \u201Chero shot\u201D in virtually every superhero film.",
    proTip: "Add golden hour for warmth (heroic) or cold steel for anti-hero edge.",
  },
  {
    combo: ["dutch", "low_key"],
    title: "Psychological Tension",
    explanation: "Tilting the horizon makes the viewer\u2019s brain work harder to process the image. Combined with low-key shadows, the world feels both literally and figuratively off-balance. The viewer senses danger before anything happens.",
    proTip: "Keep the subject\u2019s eyes in the brightest part of the frame to anchor attention.",
  },
  {
    combo: ["telephoto", "shallow_dof"],
    title: "Isolation Effect",
    explanation: "Telephoto compression flattens the world while shallow depth of field blurs everything except the subject. The character becomes the only sharp thing in a mushy, compressed world\u2014visually alone even in a crowd.",
    proTip: "This combination is devastating for breakup and loneliness scenes.",
  },
  {
    combo: ["wide_angle", "deep_focus"],
    title: "Democratic Frame",
    explanation: "Wide angle gives environmental context while deep focus lets every detail compete for attention. Nothing is hidden, nothing is favored. The viewer\u2019s eye wanders freely. Used when environment is as important as character.",
    proTip: "Orson Welles used this obsessively in Citizen Kane to show power relationships through staging.",
  },
  {
    combo: ["handheld", "golden_hour"],
    title: "Stolen Moment",
    explanation: "Handheld\u2019s natural movement feels documentary, unplanned, real. Golden hour adds fleeting beauty. Together they create the feeling of a perfect moment captured accidentally\u2014like a memory you can\u2019t quite hold onto.",
    proTip: "This is the rom-com and indie film sweet spot.",
  },
  {
    combo: ["static", "wide_angle", "low_key"],
    title: "The Trap",
    explanation: "A static camera refuses to look away. Wide angle shows the full environment (the cage). Low-key lighting hides what\u2019s in the shadows. The viewer is locked into watching, unable to escape or look elsewhere.",
    proTip: "Hold the static shot longer than feels comfortable. The tension builds automatically.",
  },
  {
    combo: ["push_in", "split_light"],
    title: "The Confrontation",
    explanation: "Pushing in slowly forces uncomfortable intimacy\u2014we\u2019re getting closer whether we want to or not. Split lighting keeps half the face hidden, suggesting the person has something to conceal. Together: interrogation energy.",
    proTip: "The slower the push-in, the more intense. Real-time, no cuts.",
  },
  {
    combo: ["crane", "god_rays"],
    title: "Divine Reveal",
    explanation: "Rising camera creates a sense of ascension while volumetric light beams suggest divinity or discovery. This combo is why every trailer shows the hero looking up as the camera cranes skyward through beams of light.",
    proTip: "Start low and tight, end high and wide for maximum impact.",
  },
  {
    combo: ["anamorphic", "neon", "rain"],
    title: "Cyberpunk Cinema",
    explanation: "Anamorphic\u2019s horizontal flares catch neon lights beautifully. Rain multiplies every light source with reflections. Together you get the iconic Blade Runner / John Wick look\u2014a wet, colorful, dangerous night world.",
    proTip: "Keep the camera at a slight upward angle to catch more neon reflections in puddles.",
  },
  {
    combo: ["macro", "shallow_dof"],
    title: "Hidden World",
    explanation: "Macro reveals details invisible to the naked eye while shallow DOF makes the razor-thin focus feel precious. Whatever is in focus becomes the most important thing in the universe for that moment.",
    proTip: "Great for hands, eyes, textures, small objects\u2014anything that rewards close attention.",
  },
];

export function getInsights(selectedTags: string[]): CineInsight[] {
  return CINE_INSIGHTS.filter((insight) =>
    insight.combo.every((tag) => selectedTags.includes(tag))
  );
}

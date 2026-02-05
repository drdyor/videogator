export const COOKIE_NAME = "app_session_id";
export const ONE_YEAR_MS = 1000 * 60 * 60 * 24 * 365;
export const AXIOS_TIMEOUT_MS = 30_000;
export const UNAUTHED_ERR_MSG = 'Please login (10001)';
export const NOT_ADMIN_ERR_MSG = 'You do not have required permission (10002)';

export const DEFAULT_GPU_HOURLY_CENTS = 22;

export const FEATURE_FLAG_KEYS = [
  "feat:generate:hunyuan",
  "feat:generate:ltx",
  "feat:edit:trim",
  "feat:edit:split",
  "feat:edit:merge",
  "feat:edit:upscale",
  "feat:pharma",
  "infra:gpu:primary",
  "infra:byok",
] as const;

export const DEFAULT_FEATURE_FLAGS: Record<(typeof FEATURE_FLAG_KEYS)[number], { enabled: boolean; description: string }> = {
  "feat:generate:hunyuan": {
    enabled: true,
    description: "Primary text-to-video generation (Hunyuan).",
  },
  "feat:generate:ltx": {
    enabled: true,
    description: "Fallback text-to-video generation (LTX).",
  },
  "feat:edit:trim": {
    enabled: true,
    description: "Trim video segments (CPU).",
  },
  "feat:edit:split": {
    enabled: true,
    description: "Split video into segments (CPU).",
  },
  "feat:edit:merge": {
    enabled: true,
    description: "Merge multiple videos (CPU).",
  },
  "feat:edit:upscale": {
    enabled: true,
    description: "Upscale video resolution (GPU).",
  },
  "feat:pharma": {
    enabled: true,
    description: "Molecular rendering pipeline (pharma).",
  },
  "infra:gpu:primary": {
    enabled: true,
    description: "Primary GPU worker availability.",
  },
  "infra:byok": {
    enabled: false,
    description: "Bring-your-own-key fallback mode.",
  },
};

export const PRICING_RULE_KEYS = [
  "trim",
  "split",
  "merge",
  "generate",
  "upscale",
] as const;

export const DEFAULT_PRICING_RULES: Record<(typeof PRICING_RULE_KEYS)[number], { costCents: number; priceCents: number }> = {
  trim: { costCents: 0, priceCents: 0 },
  split: { costCents: 1, priceCents: 5 },
  merge: { costCents: 0, priceCents: 0 },
  generate: { costCents: 5, priceCents: 25 },
  upscale: { costCents: 8, priceCents: 40 },
};

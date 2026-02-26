# VideoGator System Status & Roadmap

## Current Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────────┐
│   Frontend   │────▶│  Node Server │────▶│  Video Server    │
│  React/Vite  │     │  Express+tRPC│     │  Python/FastAPI   │
│  :3000       │     │  :3000       │     │  :8001 (GPU box)  │
└──────────────┘     └──────┬───────┘     └──────────────────┘
                            │
                    ┌───────┼───────┐
                    ▼       ▼       ▼
              ┌─────────┐ ┌─────┐ ┌─────────┐
              │Supabase │ │Redis│ │R2 Storage│
              │Postgres │ │Queue│ │(videos)  │
              │  + Auth │ │     │ │          │
              └─────────┘ └─────┘ └─────────┘
```

---

## What's Working

| Component | Status | Notes |
|-----------|--------|-------|
| Frontend (React/Vite) | WORKING | Builds and runs at localhost:3000 |
| Node server (tRPC) | WORKING | All routes registered, DB connects |
| Supabase Auth | WORKING | Login/logout, session cookies |
| Database (Postgres) | WORKING | Schema migrated, all tables exist |
| /foundry route | WORKING | Page renders, in sidebar nav |
| /gallery route | WORKING | Page renders |
| PromptBuilder | WORKING | All tags, emotions, recipes render |
| CineEducator | WORKING | Extracted, standalone component |
| RecipeCards | WORKING | Rich cards with previews |
| EmotionArcBuilder | WORKING | Custom arcs save to localStorage |
| PromptEnhancer UI | WORKING | Button renders, undo works |
| Build (pnpm build) | WORKING | No TypeScript errors |
| Video Server | OFFLINE | Python server not running (need GPU box) |
| Redis / BullMQ | NOT CONFIGURED | REDIS_URL not set in .env |
| R2 Storage | NOT CONFIGURED | No R2 credentials |
| Prompt Enhancement | BLOCKED | Needs video server + Ollama running |
| Video Generation | BLOCKED | Needs video server running |

---

## What Each Service Needs

### 1. Supabase (Auth + Database)
**Status: CONNECTED**
- URL: `kuhtptmgqhthsrrswgmy.supabase.co`
- DB connects, auth works
- Note: `.env.local` has a DIFFERENT Supabase project (`mrfxkamfjbdqtnneifbk`) - this is the Vercel project. Local dev uses the `.env` project.

### 2. Video Server (Python/FastAPI)
**Status: OFFLINE**
- Configured to reach `http://192.168.0.43:8001`
- This is a separate machine on your LAN with a GPU
- Needs: Python 3.10+, CUDA GPU, torch, diffusers, model weights
- Supports 9 models: Wan 2.2 (14B/5B), LTX-2, HunyuanVideo, Mochi, CogVideoX, ModelScope, AnimateDiff, SVD

### 3. Redis (Job Queue)
**Status: NOT CONFIGURED**
- `REDIS_URL` is not set in `.env`
- Needed for: multi-step pipelines, background job processing
- Not needed for: single direct generation (bypasses queue)
- Direct generation works WITHOUT Redis if video server is online

### 4. R2 Storage (Cloudflare)
**Status: NOT CONFIGURED**
- No R2 credentials in `.env`
- Needed for: persistent video storage, gallery playback
- Without it: videos only exist temporarily on the video server's /tmp

### 5. Ollama (Prompt Enhancement)
**Status: NOT TESTED**
- Runs on the GPU machine alongside video server
- Needs: `ollama serve` running, a model pulled (e.g. `ollama pull qwen2.5:7b`)
- The `/enhance-prompt` endpoint on video server proxies to Ollama

---

## Feature Completion

### Implemented (this session)
- [x] Wan 2.2 (14B) model integration
- [x] Wan 2.2 (5B) model integration
- [x] LTX-2 model integration
- [x] CineEducator standalone component
- [x] RecipeCard component
- [x] Custom Emotion Arc Builder (localStorage persistence)
- [x] AI Prompt Enhancement (frontend + backend + video server endpoint)
- [x] VRAM estimates in model descriptions

### Already Working (before this session)
- [x] PromptBuilder with 8 emotions, 9 archetypes, 54+ tags
- [x] Video Foundry page with model selection
- [x] Direct generation endpoint (bypasses queue)
- [x] Server health check polling
- [x] Job status tracking
- [x] Auth system (Supabase)
- [x] Admin panel with feature flags

### Not Yet Built
- [ ] MMAudio integration (add sound to videos)
- [ ] LoRA support for custom styles
- [ ] Video gallery with filtering/search
- [ ] Public video sharing
- [ ] Video trimming (UI exists, backend incomplete)
- [ ] Multi-model queuing
- [ ] Cost tracking / billing integration

---

## Environment Variables Status

| Variable | Set? | Source |
|----------|------|--------|
| `DATABASE_URL` | YES | `.env` - Supabase Postgres |
| `VITE_SUPABASE_URL` | YES | `.env` |
| `VITE_SUPABASE_ANON_KEY` | YES | `.env` |
| `JWT_SECRET` | YES | `.env` (default - change for prod) |
| `VIDEO_SERVER_URL` | YES | `.env` = `http://192.168.0.43:8001` |
| `DEFAULT_VIDEO_MODEL` | YES | `.env` = `modelscope` |
| `REDIS_URL` | NO | Need Redis running |
| `R2_ENDPOINT` | NO | Need Cloudflare R2 account |
| `R2_ACCESS_KEY_ID` | NO | Need Cloudflare R2 account |
| `R2_SECRET_ACCESS_KEY` | NO | Need Cloudflare R2 account |
| `R2_BUCKET` | NO | Need Cloudflare R2 account |
| `R2_PUBLIC_URL` | NO | Need Cloudflare R2 account |
| `DISCORD_WEBHOOK_URL` | NO | Optional |
| `OLLAMA_URL` | NO | Defaults to localhost:11434 on GPU box |

---

## Test Results

```
Tests:  7 passed, 4 failed (all failures = DATABASE_URL not available in test env)
Build:  PASSES (no TypeScript errors)
Dev:    Server starts at localhost:3000
```

The 4 test failures are pre-existing - tests that need DB access fail because vitest doesn't load `.env`. This is a test infrastructure issue, not a code issue.

---

## Deployment

### Local Development
```bash
pnpm dev          # Start frontend + API server at :3000
pnpm worker       # Start BullMQ worker (needs REDIS_URL)
```

### Video Server (GPU Machine)
```bash
cd video-server
pip install -r requirements.txt
python main.py    # Starts at :8001
```

### Production (Vercel)
```bash
vercel --prod     # Deploys frontend + serverless API
```
Note: Vercel deployment only covers the web app. Video server must run separately on GPU hardware.

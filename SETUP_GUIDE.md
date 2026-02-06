# VideoGator Setup Guide

Video aggregation platform with pharmaceutical mechanism of action (MOA) video generation.

## Architecture

```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│  Video Foundry  │─────▶│  BullMQ Worker   │─────▶│  Runway/Pika    │
│   (Frontend)    │      │   (Video Jobs)   │      │   APIs (BYOK)   │
└─────────────────┘      └──────────────────┘      └─────────────────┘
         │                                                   │
         │                                                   ▼
         ▼                                          ┌─────────────────┐
┌─────────────────┐                                │  R2 Storage     │
│  Pharma Page    │                                │  (Zero Egress)  │
│   (Frontend)    │                                └─────────────────┘
└─────────────────┘
         │
         ▼
┌─────────────────┐      ┌──────────────────┐
│  FastAPI Server │─────▶│  Blender Render  │
│   (RunPod GPU)  │      │  + MolecularNodes│
└─────────────────┘      └──────────────────┘
```

## Project Status

✅ **Committed:**
- Full-stack video aggregator (tRPC + React + Express)
- Multi-provider video generation support
- Database schema with Drizzle ORM
- BullMQ job queue system
- Blender rendering server for pharma MOA videos
- RunPod deployment configuration

## Quick Start

### 1. Install Dependencies

```bash
cd video-aggregator-uvgo/video-aggregator-uvgo
pnpm install
```

### 2. Set Up Environment Variables

Create `.env` file:

```bash
# Database
DATABASE_URL=mysql://user:pass@localhost:3306/videogator

# Redis (for BullMQ)
REDIS_URL=redis://localhost:6379

# R2 Storage (Cloudflare)
R2_ENDPOINT=https://your-account.r2.cloudflarestorage.com
R2_ACCESS_KEY=your_access_key
R2_SECRET_KEY=your_secret_key
R2_PUBLIC_URL=https://pub-your-hash.r2.dev
R2_BUCKET_NAME=uvgo-videos

# Blender Server (RunPod endpoint after deployment)
BLENDER_SERVER_URL=http://localhost:8000  # or your RunPod URL

# Encryption for BYOK
ENCRYPTION_KEY=your-32-character-secret-key-here
```

### 3. Run Database Migrations

```bash
pnpm db:push
```

### 4. Start Development Server

```bash
# Terminal 1: Main app
pnpm dev

# Terminal 2: Worker (for video jobs)
pnpm worker
```

### 5. Deploy Blender Server to RunPod

```bash
cd blender-server

# Test locally first (requires Blender installed)
python3 test_local.py 4HJO test_render

# Build and deploy to RunPod
./deploy.sh

# Follow instructions to create RunPod template and deploy
```

## Features

### Video Foundry
- Multi-provider video generation (Runway, Pika, Luma)
- BYOK (Bring Your Own Key) architecture
- Job queue with status tracking
- R2 storage integration

### Pharma MOA Videos
- PDB structure visualization
- Molecular animation rendering
- GPU-accelerated with Cycles
- Custom colors and animation types
- Webhook notifications

### Admin Panel
- Feature flag management
- Pricing rule configuration
- Job metrics and monitoring
- Alert system

## Pharma Video Generation Flow

1. **User selects template** (ligand_binding, antibody_conjugate, etc.)
2. **Configure parameters** (PDB ID, colors, duration)
3. **Submit to Blender server** on RunPod
4. **Server fetches PDB** structure and renders animation
5. **Upload to R2** storage
6. **Webhook notifies** main app
7. **Video appears** in project library

## Testing Blender Locally

```bash
cd blender-server

# Test with real PDB structure
python3 test_local.py 4HJO my_protein

# Test with different structures
python3 test_local.py 1UBQ ubiquitin
python3 test_local.py 6M0J covid_spike

# Output: /tmp/my_protein.mp4
```

## RunPod Deployment Steps

1. **Build Docker image:**
   ```bash
   cd blender-server
   docker build -t your-dockerhub/blender-pharma:latest .
   docker push your-dockerhub/blender-pharma:latest
   ```

2. **Create RunPod template:**
   - Image: `your-dockerhub/blender-pharma:latest`
   - Port: `8000`
   - GPU: RTX 3090 or better
   - Environment variables: R2 credentials

3. **Deploy pod and get endpoint URL**

4. **Update `.env`:**
   ```bash
   BLENDER_SERVER_URL=https://your-pod-id-8000.proxy.runpod.net
   ```

## Cost Optimization

- **RunPod Spot Instances:** 70% cheaper than on-demand
- **R2 Storage:** Zero egress fees vs AWS S3
- **BYOK for video APIs:** Users pay for their own API usage
- **Adjustable render quality:** 32-128 samples for preview, 256+ for final

## Next Steps

1. ✅ Set up Cloudflare R2 bucket
2. ✅ Deploy Blender server to RunPod
3. Add BYOK API key management UI
4. Create pharma template library
5. Add more animation types (ligand docking, protein folding)
6. Implement video preview system

## Useful Commands

```bash
# Development
pnpm dev              # Start dev server
pnpm worker           # Start video worker
pnpm db:push          # Run migrations
pnpm check            # Type check
pnpm format           # Format code

# Testing
pnpm test             # Run tests

# Production
pnpm build            # Build for production
pnpm start            # Start production server
```

## Documentation

- [Implementation Plan](Building and Managing Video Aggregator Repository Steps/Implementation Plan: Transforming Video Aggregator from Mock to Functional.md)
- [Blender Server README](blender-server/README.md)
- [Agent Notes](AGENT_NOTES.md)
- [Audit Report](AUDIT.md)
- [Runbook](RUNBOOK.md)

## Repository Structure

```
video-aggregator-uvgo/
├── client/              # React frontend
│   ├── src/
│   │   ├── pages/       # Main pages
│   │   │   ├── Pharma.tsx
│   │   │   ├── VideoFoundry.tsx
│   │   │   └── Projects.tsx
│   │   └── components/  # Reusable components
├── server/              # Express + tRPC backend
│   ├── _core/           # Core utilities
│   ├── routers.ts       # API routes
│   ├── db.ts            # Database queries
│   └── worker/          # BullMQ workers
├── drizzle/             # Database schema & migrations
├── blender-server/      # Pharma MOA rendering
│   ├── main.py          # FastAPI server
│   ├── scripts/         # Blender Python scripts
│   ├── Dockerfile       # RunPod deployment
│   └── test_local.py    # Local testing
└── shared/              # Shared types
```

## Support

For issues or questions, check:
- [RUNBOOK.md](RUNBOOK.md) for operational procedures
- [AUDIT.md](AUDIT.md) for code review notes
- [TODO.md](todo.md) for planned features

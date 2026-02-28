# VideoGator Stitch Worker

FastAPI service that runs on your **4090x machine** and stitches together AI-generated video clips for VideoGator.

---

## Architecture

```
Vercel (VideoGator)
    │
    │  POST /stitch  { clips: [...urls] }
    ▼
4090x Machine (this worker)
    │
    ├── Downloads clips
    ├── Normalizes to same res/fps/codec
    ├── Stitches with ffmpeg
    └── Returns download URL
```

---

## Setup on your 4090x machine

### 1. Install system ffmpeg
```bash
# Ubuntu/Debian
sudo apt install ffmpeg

# macOS
brew install ffmpeg
```

### 2. Install Python deps
```bash
pip install -r requirements.txt
```

### 3. Set your API key
```bash
export WORKER_API_KEY="your-secret-key-here"
```

### 4. Run the worker
```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```

For production / auto-restart:
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 2
```

---

## Expose to Vercel

Since the worker runs on your local machine, you need a tunnel so Vercel can reach it.

### Option A — Cloudflare Tunnel (recommended, free, persistent URL)
```bash
# Install cloudflared: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/
cloudflared tunnel --url http://localhost:8000
```
You'll get a permanent `https://xxx.trycloudflare.com` URL.

### Option B — ngrok (quick test)
```bash
ngrok http 8000
```

---

## Vercel env vars
Add these to your VideoGator project on Vercel:
```
STITCH_WORKER_URL=https://your-tunnel-url.trycloudflare.com
STITCH_WORKER_KEY=your-secret-key-here
```

---

## API

### `POST /stitch`
```json
{
  "clips": [
    "https://your-storage.com/clip1.mp4",
    "https://your-storage.com/clip2.mp4",
    "https://your-storage.com/clip3.mp4"
  ],
  "transition": "fade",       // "none" | "fade"
  "fade_duration": 0.5,       // seconds
  "output_format": "mp4"
}
```
Returns `{ job_id, status: "queued" }` immediately.

### `GET /status/{job_id}`
Returns `{ status, output_url, duration }`.
Status flow: `queued → downloading → normalizing → stitching → done`

### `GET /download/{job_id}`
Streams the final MP4.

### `DELETE /job/{job_id}`
Cleans up output from disk.

---

## Notes

- All clips are normalized to **1920×1080, 30fps, H.264** before stitching — this handles inconsistencies from different text-to-video generation runs
- Fade transitions use ffmpeg's `xfade` filter — smooth crossfades between clips
- Jobs are in-memory — restart = job history lost. Swap `jobs: dict` for Redis if you want persistence
- Output files persist on disk until you `DELETE /job/{job_id}` — set up a cron to purge old ones

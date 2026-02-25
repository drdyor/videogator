## Runbook (Human Setup)

### 1) Install dependencies
```bash
pnpm install
```

If you see `Ignored build scripts` warnings, run:
```bash
pnpm approve-builds
```
and allow `esbuild` + `@tailwindcss/oxide`.

### 2) Configure environment variables
Create a `.env` file at project root.

Required for basic auth + DB:
```
DATABASE_URL=your-mysql-connection-string
OAUTH_SERVER_URL=https://your-oauth-server
JWT_SECRET=your-secret
OWNER_OPEN_ID=your-manus-owner-openid
VITE_APP_ID=your-manus-app-id
```

Queue + worker:
```
REDIS_URL=redis://localhost:6379
FFMPEG_SERVER_URL=http://your-ffmpeg-host:8000
COMFYUI_URL=http://your-comfyui-host:8188
MASTER_SECRET=your-32-char-secret
```

**Local Video Generation (GPU):**
```
VIDEO_SERVER_URL=http://your-gpu-machine:8001
DEFAULT_VIDEO_MODEL=hunyuan-video
```

Storage for generated videos:
```
R2_ENDPOINT=https://<account>.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=uvgo-videos
R2_PUBLIC_URL=https://pub-<hash>.r2.dev
```

Optional (alerts):
```
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
TELEGRAM_BOT_TOKEN=...
TELEGRAM_CHAT_ID=...
```

Optional (storage/generation - later pipeline):
```
R2_ENDPOINT=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_PUBLIC_URL=
```

### 3) Run DB migrations
Apply SQL migrations in order:
```bash
drizzle/0000_watery_wildside.sql
drizzle/0001_giant_prodigy.sql
drizzle/0002_admin_controls.sql
drizzle/0003_job_engine.sql
```

### 4) Start the dev server
```bash
pnpm dev
```
Server should be at: `http://localhost:3000`

### 4b) Start the worker (job engine)
```bash
pnpm worker
```

### 4c) Start the local video server (on GPU machine)
**Windows:**
```cmd
cd video-server
start.bat
```

**Linux/macOS:**
```bash
cd video-server
chmod +x start.sh
./start.sh
```

The video server runs on port 8001 by default.

### 5) Admin access
Only users with `role = admin` can access `/admin`.
To grant admin:
- Set `OWNER_OPEN_ID` to your Manus account openId.
- Or update the user’s `role` in the DB.

### 6) Verify Night Watch alerts
Open `/admin` → click **Send Test Alert**.
Check Discord/Telegram for delivery.

### 7) Known warnings if env/DB missing
- Missing `OAUTH_SERVER_URL` prints a warning on boot.
- No `DATABASE_URL` means DB calls will no-op and admin defaults won’t persist.


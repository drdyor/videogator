# Human TODO List

Things only you can do (signups, passwords, hardware setup).

---

## PRIORITY 1: Start the Video Server on TaylorsPC

The server code is at `C:\openclaw` on your Windows GPU machine but it never actually started.
The "Starting server" message was just an `echo` in the batch file - `python main.py` either
didn't run or crashed silently.

### Step-by-step on TaylorsPC (PowerShell):

```powershell
# 1. Check if the video-server folder exists
dir C:\openclaw\video-server\main.py

# 2. If it doesn't exist, copy it from this repo's video-server/ folder to TaylorsPC
#    Or git pull the latest code on that machine

# 3. Install dependencies (one-time)
cd C:\openclaw\video-server
pip install -r requirements.txt

# 4. Also install httpx (needed for prompt enhancement)
pip install httpx

# 5. Start the server
python main.py

# You should see output like:
#   Using device: cuda
#   GPU: NVIDIA GeForce RTX ...
#   VRAM: XX.XX GB
#   INFO:     Uvicorn running on http://0.0.0.0:8001
```

### Verify it's running:

```powershell
# In a SECOND PowerShell window (the first is running the server):
# PowerShell uses different syntax than bash for curl:
Invoke-WebRequest -Uri http://localhost:8001/health | Select-Object -ExpandProperty Content
```

Should return something like: `{"status":"healthy","device":"cuda","gpu_available":true,"vram_gb":24.0}`

### Then check your IP:

```powershell
ipconfig
# Look for your LAN IPv4 address (e.g. 192.168.0.43 or 192.168.1.xxx)
```

Update `.env` on your Mac if the IP changed:
```
VIDEO_SERVER_URL=http://<taylorspc-ip>:8001
```

### Common problems:
- **"torch not found"**: Run `pip install torch torchvision --index-url https://download.pytorch.org/whl/cu121`
- **"CUDA not available"**: Install NVIDIA CUDA toolkit from https://developer.nvidia.com/cuda-downloads
- **Port blocked**: Windows Firewall may block 8001. Run: `netsh advfirewall firewall add rule name="VideoServer" dir=in action=allow protocol=tcp localport=8001`
- **main.py not found**: The video-server code needs to be on TaylorsPC. Copy the `video-server/` folder from this repo.

---

## PRIORITY 2: Deploy Latest Code to Vercel

You're viewing `videogator.vercel.app` which has OLD code. The 5 new features only exist locally.

```bash
# On your Mac, from the videogator folder:
vercel --prod
```

OR push to git and let Vercel auto-deploy if connected.

**Important:** The PromptBuilder (with all 5 features) only appears AFTER you click "Add Generate". This is by design - you build a prompt as part of creating a generation step.

---

## PRIORITY 3: Redis (Optional)

Direct generation works WITHOUT Redis. Only needed for multi-step pipelines.

- [ ] Install Redis locally: `brew install redis && brew services start redis`
- [ ] Add to `.env`: `REDIS_URL=redis://localhost:6379`

---

## PRIORITY 4: AI Prompt Enhancement (Ollama)

On TaylorsPC (same machine as video server):

- [ ] Download Ollama for Windows: https://ollama.ai/download
- [ ] Open a new PowerShell and run: `ollama pull qwen2.5:7b`
- [ ] Ollama runs automatically as a service on Windows after install
- [ ] The video server's `/enhance-prompt` endpoint will connect to it automatically

---

## PRIORITY 5: Video Storage (Cloudflare R2)

Without this, generated videos only live temporarily on TaylorsPC's temp folder.

- [ ] Sign up for Cloudflare (free tier): https://dash.cloudflare.com
- [ ] Enable R2 in dashboard
- [ ] Create bucket `videogator-videos`
- [ ] Create R2 API token
- [ ] Add credentials to `.env`

---

## PRIORITY 6: Production Security

- [ ] Change `JWT_SECRET` to a real random string (not the default)
- [ ] The `.env.local` file has Vercel tokens that may have expired - regenerate if needed

---

## Quick Test (after video server is running)

1. Run `pnpm dev` on your Mac
2. Open http://localhost:3000/foundry
3. Server status card should show "Online" with GPU badge
4. Click **"Add Generate"** <- THIS is where all 5 features appear
5. You'll see: model dropdown, PromptBuilder, presets, emotions, tags
6. Select emotion "Tense" -> auto-populates tags -> Film School appears
7. Click "Presets" -> RecipeCards with emotion badges
8. In Emotion tab -> dashed "+" card to create custom arcs
9. Type a prompt, click "Enhance" sparkle button (needs Ollama)
10. Click "Run Pipeline" to generate a video

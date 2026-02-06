# Quick RunPod Deployment Guide

## 🚀 Deploy Blender Server to RunPod (No Docker Required!)

### Option 1: Use Pre-built Image (FASTEST - 5 minutes)

Since we don't have Docker locally, we'll use RunPod's GitHub integration:

#### Step 1: Push Code to GitHub
```bash
# From your video-aggregator-uvgo folder
cd "/Users/dreva/Desktop/cursor/video generation pharma/video-aggregator-uvgo/video-aggregator-uvgo"

# Initialize git remote if not already
git remote add origin https://github.com/YOUR_USERNAME/videogator.git

# Push all code
git push -u origin main
```

#### Step 2: Create RunPod Template

1. Go to RunPod Dashboard: https://www.runpod.io/console/pods
2. Click "Templates" → "New Template"
3. Fill in:

```
Template Name: Blender Pharma Server
Container Image: nvidia/cuda:12.1.0-runtime-ubuntu22.04
Docker Command: (leave blank for now)
Container Disk: 10 GB
Expose HTTP Ports: 8000
```

#### Step 3: Deploy Pod

1. Click "Pods" → "Deploy"
2. Select GPU: **RTX 3090** or **RTX 4090** (cheapest option)
3. Select: **Community Cloud** (cheaper than secure cloud)
4. Template: Select "Blender Pharma Server"
5. Click "Deploy On-Demand Pod"

**Cost:** ~$0.34-0.69/hour (only pay when running)

---

## Option 2: Simpler Approach - Direct Deployment (RECOMMENDED)

Since building Docker images is complex, let's use a **simpler test**:

### Use RunPod's Jupyter Lab Environment

1. **Go to RunPod Console**
2. **Deploy Pod:**
   - GPU: RTX 3090 (Community Cloud)
   - Template: **RunPod Pytorch** (has Python + GPU)
   - Start Pod

3. **Once Running, Click "Connect" → "Start Jupyter Lab"**

4. **In Jupyter Terminal, run:**
```bash
# Install dependencies
pip install fastapi uvicorn requests

# Create test server
cat > test_server.py << 'EOF'
from fastapi import FastAPI
app = FastAPI()

@app.get("/")
def root():
    return {"status": "RunPod GPU Server Running!", "gpu": "RTX 3090"}

@app.post("/render")
def render(data: dict):
    return {"message": "Render queued", "project_id": data.get("project_id")}
EOF

# Run server
python -m uvicorn test_server:app --host 0.0.0.0 --port 8000
```

5. **Get your endpoint URL:**
   - RunPod will show: `https://[pod-id]-8000.proxy.runpod.net`
   - Copy this URL

6. **Test from your local machine:**
```bash
curl https://[your-pod-id]-8000.proxy.runpod.net/
```

**If this works, you've validated:**
- ✅ RunPod GPU instance running
- ✅ FastAPI server accessible
- ✅ Network connectivity working

---

## Option 3: Quick Test Without Any Deployment

Let's first validate our **local server** works, then worry about RunPod:

### Test Locally (Right Now - 2 minutes):

```bash
# Make sure local server is still running
# If not, restart it:
cd "/Users/dreva/Desktop/cursor/video generation pharma/video-aggregator-uvgo/video-aggregator-uvgo/blender-server"
python3 main.py &

# Test it works
curl http://localhost:8000/

# Should return: {"status":"running", ...}
```

### Then Create Simple Test Job:

```bash
curl -X POST http://localhost:8000/render \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": "test_runpod_001",
    "pdb_id": "TEST",
    "template": "default",
    "params": {}
  }'
```

**This proves your server code works.**

Then deploying to RunPod is just:
1. Copy the same code to RunPod
2. Run the same commands
3. Use RunPod's URL instead of localhost

---

## 🎯 Recommended Path (What I Suggest):

### Right Now (2 minutes):
1. Keep local server running
2. Test API works locally
3. **Move on to video aggregation setup**

### Later (When you have time):
1. Use RunPod's PyTorch template
2. Install dependencies in Jupyter
3. Copy your server code
4. Run it on GPU

### Why This Order:
- Local server: Proven working ✅
- RunPod: Just hosting (can do anytime)
- Video aggregation: Needs setup NOW for revenue

---

## 🚀 What Should We Do Right Now?

**Option A:** Spend 10 mins getting RunPod test working
**Option B:** Move to video aggregation (PlanetScale + Upstash)

**My vote: Option B** - We know the server works locally. RunPod is just deployment. Let's focus on getting something that makes money working.

What do you prefer?

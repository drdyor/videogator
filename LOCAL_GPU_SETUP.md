# Local GPU Video Generation Setup Guide

This guide covers setting up local video generation with GPU acceleration on your network, integrating with Ollama and other video models.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          Your Network                                    │
│                                                                          │
│  ┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐  │
│  │  Windows PC     │     │  Mac (This App)  │     │  Linux Server   │  │
│  │  OpenCLAW       │     │  VideoGator      │     │  (Optional)     │  │
│  │  Ollama + GPU   │     │  Frontend        │     │  Video Server   │  │
│  └────────┬────────┘     └────────┬─────────┘     └────────┬────────┘  │
│           │                       │                        │            │
│           └───────────────────────┼────────────────────────┘            │
│                                   │                                      │
│                          ┌────────▼─────────┐                           │
│                          │  Video Server    │                           │
│                          │  (GPU Enabled)   │                           │
│                          │  Port: 8001      │                           │
│                          └──────────────────┘                           │
└─────────────────────────────────────────────────────────────────────────┘
```

## Prerequisites

### Hardware Requirements

| Model | Minimum GPU | Recommended GPU | VRAM |
|-------|-------------|-----------------|------|
| HunyuanVideo | RTX 3090 | RTX 4090 | 16-24 GB |
| Mochi | RTX 3090 | RTX 4090 | 16-24 GB |
| CogVideoX-5b | RTX 3080 | RTX 4080 | 12-16 GB |
| ModelScope | RTX 2080 | RTX 3080 | 8-12 GB |
| Stable Video Diffusion | RTX 2080 | RTX 3080 | 8-12 GB |

### Software Requirements

- Python 3.10+
- CUDA 12.1+ (for NVIDIA GPUs)
- Docker (optional, for containerized deployment)

## Quick Start

### Option 1: Run Directly on GPU Machine

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

The server will be available at `http://localhost:8001`

### Option 2: Docker Deployment

```bash
# Build the Docker image
docker build -t video-server .

# Run with GPU support
docker run --gpus all -p 8001:8001 video-server
```

### Option 3: RunPod Deployment

For cloud GPU deployment, use RunPod:

```bash
# Build and push to Docker Hub
docker build -t your-username/video-server:latest .
docker push your-username/video-server:latest

# Create RunPod template with:
# - Image: your-username/video-server:latest
# - GPU: RTX 3090 or better
# - Port: 8001
# - Volume: /tmp/video-output for persistence
```

## Configuration

### Environment Variables

Create a `.env` file in the video-server directory:

```bash
# Output directory for generated videos
OUTPUT_DIR=/tmp/video-output

# CUDA device (use specific GPU)
CUDA_VISIBLE_DEVICES=0

# Model cache directory (optional)
HF_HOME=/models/huggingface
```

### VideoGator Integration

Add to your main VideoGator `.env`:

```bash
# Local video server URL
VIDEO_SERVER_URL=http://localhost:8001

# Or for network machine
VIDEO_SERVER_URL=http://192.168.1.100:8001

# Or for RunPod
VIDEO_SERVER_URL=https://your-pod-8001.proxy.runpod.net

# Default video model
DEFAULT_VIDEO_MODEL=hunyuan-video
```

## API Usage

### Generate Video

```bash
curl -X POST http://localhost:8001/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A majestic eagle soaring over mountains at sunset",
    "model": "hunyuan-video",
    "width": 848,
    "height": 480,
    "num_frames": 65,
    "num_inference_steps": 30,
    "guidance_scale": 7.0,
    "fps": 24
  }'
```

### Check Status

```bash
curl http://localhost:8001/status/{job_id}
```

### Download Video

```bash
curl http://localhost:8001/output/{filename} -o video.mp4
```

### Ollama-Compatible Endpoint

```bash
curl -X POST http://localhost:8001/ollama/generate \
  -H "Content-Type: application/json" \
  -d '{
    "model": "hunyuan-video",
    "prompt": "A serene lake at dawn"
  }'
```

## Model-Specific Usage

### HunyuanVideo (Best Quality)

```json
{
  "prompt": "Cinematic shot of a futuristic city",
  "model": "hunyuan-video",
  "width": 848,
  "height": 480,
  "num_frames": 65,
  "num_inference_steps": 50,
  "guidance_scale": 9.0
}
```

### Mochi (Alternative High Quality)

```json
{
  "prompt": "A beautiful woman walking through a flower garden",
  "model": "mochi",
  "width": 848,
  "height": 480,
  "num_frames": 65,
  "num_inference_steps": 40
}
```

### CogVideoX (Balanced)

```json
{
  "prompt": "A product showcase with dramatic lighting",
  "model": "cogvideo",
  "width": 720,
  "height": 480,
  "num_frames": 49,
  "num_inference_steps": 30
}
```

### ModelScope (Fast/Testing)

```json
{
  "prompt": "A cat playing piano",
  "model": "modelscope",
  "width": 256,
  "height": 256,
  "num_frames": 16,
  "num_inference_steps": 15
}
```

### Stable Video Diffusion (Image-to-Video)

```json
{
  "prompt": "Camera slowly zooms in",
  "model": "stable-video-diffusion",
  "image_url": "https://example.com/image.jpg",
  "num_frames": 25,
  "num_inference_steps": 25
}
```

## Integration with Ollama

If you have Ollama running on your network, you can use it alongside the video server:

### Ollama for LLM, Video Server for Generation

```bash
# Use Ollama for prompt enhancement
OLLAMA_HOST=192.168.1.50:11434 ollama run llama3.2

# Enhanced prompt workflow:
# 1. Send basic prompt to Ollama
# 2. Ollama enhances the prompt
# 3. Send enhanced prompt to video server
```

### Example Integration Script

```python
import requests

# Ollama for prompt enhancement
ollama_url = "http://192.168.1.50:11434/api/generate"
video_url = "http://192.168.1.100:8001/generate"

# Enhance prompt with Ollama
enhance_response = requests.post(ollama_url, json={
    "model": "llama3.2",
    "prompt": "Enhance this video prompt for cinematic quality: 'a dog running'"
})
enhanced_prompt = enhance_response.json()["response"]

# Generate video with enhanced prompt
video_response = requests.post(video_url, json={
    "prompt": enhanced_prompt,
    "model": "hunyuan-video"
})
print(video_response.json())
```

## Performance Optimization

### Memory Management

1. **Enable CPU Offloading** (automatic):
   ```python
   pipeline.enable_model_cpu_offload()
   ```

2. **Enable Attention Slicing**:
   ```python
   pipeline.enable_attention_slicing()
   ```

3. **Use Float16**:
   ```python
   pipeline = pipeline.to(torch.float16)
   ```

### Speed vs Quality Trade-offs

| Setting | Fast | Balanced | Quality |
|---------|------|----------|---------|
| num_inference_steps | 15 | 30 | 50+ |
| width x height | 256x256 | 512x288 | 848x480 |
| num_frames | 16 | 32 | 65+ |
| guidance_scale | 5.0 | 7.0 | 9.0+ |

### Batch Processing

For multiple videos, use the queue system:

```bash
# Start multiple jobs
for prompt in "cat" "dog" "bird"; do
  curl -X POST http://localhost:8001/generate \
    -H "Content-Type: application/json" \
    -d "{\"prompt\": \"$prompt playing\", \"model\": \"modelscope\"}"
done
```

## Troubleshooting

### CUDA Out of Memory

```bash
# Check GPU memory
nvidia-smi

# Solutions:
# 1. Reduce resolution
# 2. Reduce frame count
# 3. Use smaller model (ModelScope)
# 4. Enable CPU offloading
```

### Slow Generation

1. Verify CUDA is being used:
   ```bash
   curl http://localhost:8001/health
   # Should show "device": "cuda"
   ```

2. Monitor GPU utilization:
   ```bash
   watch -n 1 nvidia-smi
   ```

3. Close other GPU applications

### Model Download Issues

Models download automatically on first use. For pre-download:

```bash
python -c "from diffusers import HunyuanVideoPipeline; HunyuanVideoPipeline.from_pretrained('tencent/HunyuanVideo')"
```

### Network Access

If running on a network machine:

```bash
# Allow external access
uvicorn main:app --host 0.0.0.0 --port 8001

# Or in Docker
docker run --gpus all -p 8001:8001 video-server
```

## Monitoring

### Health Check

```bash
curl http://localhost:8001/health
```

Response:
```json
{
  "status": "healthy",
  "device": "cuda",
  "gpu_available": true,
  "vram_gb": 24.0
}
```

### Job Status

```bash
curl http://localhost:8001/status/{job_id}
```

## Security Considerations

1. **Network Exposure**: Don't expose the video server directly to the internet
2. **Authentication**: Add API key authentication for production
3. **Rate Limiting**: Implement rate limiting for public access
4. **Input Validation**: The server validates all inputs

### Adding API Key Authentication

```python
# In main.py, add:
from fastapi import Header, HTTPException

API_KEY = os.getenv("API_KEY")

@app.middleware("http")
async def verify_api_key(request, call_next):
    if API_KEY and request.url.path.startswith("/generate"):
        api_key = request.headers.get("X-API-Key")
        if api_key != API_KEY:
            raise HTTPException(status_code=401, detail="Invalid API key")
    return await call_next(request)
```

## Cost Comparison

| Option | Cost/Hour | Quality | Speed |
|--------|-----------|---------|-------|
| Local GPU (RTX 3090) | $0 (owned) | High | Fast |
| RunPod Spot (RTX 3090) | ~$0.20/hr | High | Fast |
| RunPod On-Demand | ~$0.40/hr | High | Fast |
| Cloud APIs (Runway) | ~$0.05/video | Varies | Fast |

## Next Steps

1. ✅ Set up video server on GPU machine
2. ✅ Configure VideoGator to use local server
3. Test with different models
4. Optimize for your use case
5. Set up monitoring and alerts

## Support

For issues:
- Check the [video-server README](video-server/README.md)
- Review the [RUNBOOK.md](RUNBOOK.md)
- Check GPU memory with `nvidia-smi`
- Review logs for errors

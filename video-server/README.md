# Local Video Generation Server

High-performance video generation server with GPU acceleration. Supports multiple state-of-the-art video models.

## Supported Models

| Model | Type | Resolution | Frames | Image-to-Video |
|-------|------|------------|--------|----------------|
| **HunyuanVideo** | Text-to-Video | 848x480 | 65 | ❌ |
| **Mochi** | Text-to-Video | 848x480 | 65 | ❌ |
| **CogVideoX** | Text-to-Video | 720x480 | 49 | ✅ |
| **ModelScope** | Text-to-Video | 256x256 | 16 | ❌ |
| **Stable Video Diffusion** | Image-to-Video | 1024x576 | 25 | ✅ |

## Quick Start

### Option 1: Run Locally (Recommended for Development)

**Linux/macOS:**
```bash
cd video-server
chmod +x start.sh
./start.sh
```

**Windows:**
```cmd
cd video-server
start.bat
```

### Option 2: Docker with GPU

```bash
# Build the image
docker build -t video-server .

# Run with GPU support
docker run --gpus all -p 8001:8001 -v /tmp/video-output:/tmp/video-output video-server
```

### Option 3: Docker Compose

```yaml
version: '3.8'
services:
  video-server:
    build: ./video-server
    ports:
      - "8001:8001"
    volumes:
      - ./output:/tmp/video-output
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
```

## API Endpoints

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

### Generate Video

```bash
curl -X POST http://localhost:8001/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A majestic eagle soaring over snow-capped mountains at sunset",
    "model": "hunyuan-video",
    "width": 848,
    "height": 480,
    "num_frames": 65,
    "num_inference_steps": 30,
    "guidance_scale": 7.0,
    "fps": 24
  }'
```

Response:
```json
{
  "job_id": "abc12345",
  "status": "queued",
  "message": "Video generation started with hunyuan-video"
}
```

### Check Job Status

```bash
curl http://localhost:8001/status/abc12345
```

Response:
```json
{
  "job_id": "abc12345",
  "status": "completed",
  "progress": 1.0,
  "output_url": "/output/abc12345.mp4"
}
```

### Download Video

```bash
curl http://localhost:8001/output/abc12345.mp4 -o video.mp4
```

### Ollama-Compatible Endpoint

Works with Ollama API format:

```bash
curl -X POST http://localhost:8001/ollama/generate \
  -H "Content-Type: application/json" \
  -d '{
    "model": "hunyuan-video",
    "prompt": "A serene lake at dawn with mist rising"
  }'
```

### List Available Models

```bash
curl http://localhost:8001/models
```

## Image-to-Video Generation

For models that support image-to-video (CogVideoX, Stable Video Diffusion):

```bash
curl -X POST http://localhost:8001/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A peaceful forest scene",
    "model": "stable-video-diffusion",
    "image_url": "https://example.com/image.jpg",
    "num_frames": 25,
    "num_inference_steps": 25
  }'
```

Or with base64:

```bash
curl -X POST http://localhost:8001/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Camera slowly zooms in",
    "model": "stable-video-diffusion",
    "image_base64": "<base64-encoded-image>",
    "num_frames": 25
  }'
```

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `OUTPUT_DIR` | `/tmp/video-output` | Directory for generated videos |
| `CUDA_VISIBLE_DEVICES` | `0` | GPU device ID(s) to use |

### GPU Requirements

| Model | Minimum VRAM | Recommended VRAM |
|-------|--------------|------------------|
| HunyuanVideo | 16 GB | 24 GB |
| Mochi | 16 GB | 24 GB |
| CogVideoX-5b | 12 GB | 16 GB |
| ModelScope | 8 GB | 12 GB |
| Stable Video Diffusion | 8 GB | 12 GB |

## Integration with VideoGator

Add to your `.env`:

```bash
# Local video server
VIDEO_SERVER_URL=http://localhost:8001

# Or if running on a network machine
VIDEO_SERVER_URL=http://192.168.1.100:8001
```

The video worker will automatically use the local server when configured.

## Performance Tips

1. **Use CPU Offloading**: Models automatically enable CPU offloading for limited VRAM
2. **Reduce Resolution**: Lower width/height for faster generation
3. **Fewer Frames**: Reduce `num_frames` for shorter videos
4. **Lower Steps**: Reduce `num_inference_steps` (trades quality for speed)

### Example Fast Generation

```json
{
  "prompt": "Quick test video",
  "model": "modelscope",
  "width": 256,
  "height": 256,
  "num_frames": 16,
  "num_inference_steps": 15
}
```

### Example High Quality

```json
{
  "prompt": "Cinematic masterpiece, 8k quality",
  "model": "hunyuan-video",
  "width": 848,
  "height": 480,
  "num_frames": 65,
  "num_inference_steps": 50,
  "guidance_scale": 9.0
}
```

## Troubleshooting

### CUDA Out of Memory

1. Enable CPU offloading (automatic)
2. Reduce resolution or frame count
3. Use a smaller model (ModelScope)

### Slow Generation

1. Ensure CUDA is being used: check `/health` endpoint
2. Close other GPU applications
3. Use `nvidia-smi` to monitor GPU utilization

### Model Download Issues

Models are downloaded on first use. Ensure:
- Stable internet connection
- Sufficient disk space (models are 5-20 GB each)
- Hugging Face access (some models require acceptance of terms)

## Model Downloads

First run will download models automatically:

```bash
# Pre-download a specific model
python -c "from diffusers import HunyuanVideoPipeline; HunyuanVideoPipeline.from_pretrained('tencent/HunyuanVideo')"
```

## License

This server is MIT licensed. Individual models have their own licenses:
- HunyuanVideo: Apache 2.0
- Mochi: Apache 2.0
- CogVideoX: Apache 2.0
- ModelScope: Apache 2.0
- Stable Video Diffusion: Stability AI License

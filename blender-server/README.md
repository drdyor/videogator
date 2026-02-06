# Blender Rendering Server for Pharma MOA Videos

GPU-accelerated molecular visualization server designed to run on RunPod.

## Features

- **No Template Files Required** - Dynamically creates scenes from scratch
- **MolecularNodes Integration** - Fetch and render PDB structures (optional)
- **Fallback Rendering** - Works without MolecularNodes using stylized geometry
- **GPU Rendering** - CUDA-accelerated Cycles rendering
- **Multiple Animation Types** - Rotation, orbit, custom keyframes
- **Webhook Notifications** - Async job completion callbacks
- **R2 Storage** - Zero-egress cost video delivery
- **RunPod Optimized** - Docker container with all dependencies

## Quick Start

### Local Testing (with Blender installed)

```bash
# Install Python dependencies
pip install -r requirements.txt

# Set environment variables
export R2_ENDPOINT=https://your-account.r2.cloudflarestorage.com
export R2_ACCESS_KEY=your_access_key
export R2_SECRET_KEY=your_secret_key
export R2_PUBLIC_URL=https://pub-your-hash.r2.dev
export R2_BUCKET_NAME=uvgo-videos

# Run the server
python main.py
```

### Deploy to RunPod

1. **Build and push Docker image:**

```bash
docker build -t your-dockerhub/blender-pharma-server:latest .
docker push your-dockerhub/blender-pharma-server:latest
```

2. **Create RunPod Template:**
   - Go to RunPod.io → Templates
   - Use image: `your-dockerhub/blender-pharma-server:latest`
   - Expose port: `8000`
   - Add environment variables (R2 credentials)
   - Select GPU: RTX 3090 or better

3. **Deploy Pod:**
   - Select your template
   - Choose GPU tier (Secure Cloud or Community)
   - Start pod and get endpoint URL

## API Usage

### Queue a Render Job

```bash
curl -X POST "https://your-runpod-url/render" \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": "proj_123",
    "pdb_id": "4HJO",
    "template": "ligand_binding",
    "params": {
      "primary_color": "#3B82F6",
      "duration": 5,
      "animation_type": "rotation",
      "samples": 128,
      "width": 1920,
      "height": 1080
    },
    "webhook_url": "https://your-app.com/api/webhooks/pharma"
  }'
```

### Check Job Status

```bash
curl "https://your-runpod-url/status/proj_123"
```

## Supported Templates

- `ligand_binding` - Small molecule binding to protein
- `antibody_conjugate` - Antibody-drug conjugates
- `cell_signaling` - Receptor activation pathways
- `membrane_protein` - Transmembrane protein dynamics
- `enzyme_mechanism` - Catalytic mechanism visualization

## Parameters

- `primary_color` - Hex color for protein (default: #3B82F6)
- `background_color` - Hex background color (default: #FFFFFF)
- `duration` - Animation length in seconds (default: 5)
- `animation_type` - `rotation` or `orbit` (default: rotation)
- `camera_speed` - Orbit speed multiplier (default: 1.0)
- `samples` - Render samples for quality (default: 128)
- `width` - Video width (default: 1920)
- `height` - Video height (default: 1080)

## Cost Optimization

- **RunPod Spot Instances** - 70% cheaper than on-demand
- **Render Samples** - Use 64-128 samples for preview, 256+ for final
- **Resolution** - 1080p for web, 4K for presentations
- **R2 Storage** - Zero egress fees vs AWS S3

## MolecularNodes Setup

Download MolecularNodes addon:
```bash
git clone https://github.com/BradyAJohnston/MolecularNodes.git
cp -r MolecularNodes/molecularnodes blender-server/addons/
```

Rebuild Docker image after adding addon.

## Environment Variables

```bash
R2_ENDPOINT=https://your-account.r2.cloudflarestorage.com
R2_ACCESS_KEY=your_r2_access_key
R2_SECRET_KEY=your_r2_secret_key
R2_PUBLIC_URL=https://pub-your-hash.r2.dev
R2_BUCKET_NAME=uvgo-videos
```

## Troubleshooting

**Blender not rendering:**
- Check GPU is available: `nvidia-smi`
- Verify Blender version: `blender --version`
- Test render locally first

**MolecularNodes errors:**
- Ensure addon is in `/app/addons/molecularnodes/`
- Check PDB ID is valid (4 characters)
- Test PDB download manually

**Slow rendering:**
- Reduce samples (64 for preview)
- Lower resolution (720p)
- Use spot instances during off-peak

## Development

Run tests locally:
```bash
# Test API health
curl http://localhost:8000/

# Test render with fallback cube (no MolecularNodes)
curl -X POST "http://localhost:8000/render" \
  -H "Content-Type: application/json" \
  -d '{"project_id": "test_001", "pdb_id": "TEST", "template": "default", "params": {}}'
```

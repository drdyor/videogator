#!/bin/bash
# Deploy Blender server to RunPod

set -e

echo "🚀 Deploying Blender Pharma Server to RunPod"

# Configuration
DOCKER_IMAGE="your-dockerhub-username/blender-pharma-server"
VERSION=${1:-latest}

# Build Docker image
echo "📦 Building Docker image..."
docker build -t $DOCKER_IMAGE:$VERSION .

# Tag as latest
docker tag $DOCKER_IMAGE:$VERSION $DOCKER_IMAGE:latest

# Push to Docker Hub
echo "⬆️  Pushing to Docker Hub..."
docker push $DOCKER_IMAGE:$VERSION
docker push $DOCKER_IMAGE:latest

echo "✅ Build complete: $DOCKER_IMAGE:$VERSION"
echo ""
echo "Next steps:"
echo "1. Go to RunPod.io → Templates"
echo "2. Create new template with image: $DOCKER_IMAGE:latest"
echo "3. Expose port: 8000"
echo "4. Add environment variables:"
echo "   - R2_ENDPOINT"
echo "   - R2_ACCESS_KEY"
echo "   - R2_SECRET_KEY"
echo "   - R2_PUBLIC_URL"
echo "   - R2_BUCKET_NAME"
echo "5. Deploy pod and copy the endpoint URL"
echo "6. Update your .env with: BLENDER_SERVER_URL=<runpod-endpoint>"

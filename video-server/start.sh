#!/bin/bash
# Start script for Local Video Generation Server

set -e

echo "🎬 Local Video Generation Server"
echo "================================="

# Check for NVIDIA GPU
if command -v nvidia-smi &> /dev/null; then
    echo "✅ NVIDIA GPU detected:"
    nvidia-smi --query-gpu=name,memory.total --format=csv,noheader
else
    echo "⚠️  No NVIDIA GPU detected, will use CPU (slower)"
fi

# Check for Python
if ! command -v python &> /dev/null; then
    echo "❌ Python not found. Please install Python 3.10+"
    exit 1
fi

# Create virtual environment if not exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies
echo "📦 Installing dependencies..."
pip install --upgrade pip

# Install PyTorch with CUDA support if GPU available
if command -v nvidia-smi &> /dev/null; then
    echo "🔥 Installing PyTorch with CUDA support..."
    pip install torch torchvision --index-url https://download.pytorch.org/whl/cu121
else
    echo "📦 Installing PyTorch (CPU version)..."
    pip install torch torchvision
fi

# Install other requirements
pip install -r requirements.txt

# Create output directory
mkdir -p /tmp/video-output

# Start the server
echo "🚀 Starting server on http://0.0.0.0:8001"
python main.py

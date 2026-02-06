# Dockerfile for Blender Rendering Server on RunPod
# Supports GPU rendering with CUDA

FROM nvidia/cuda:12.1.0-runtime-ubuntu22.04

# Install system dependencies
RUN apt-get update && apt-get install -y \
    wget \
    xz-utils \
    python3 \
    python3-pip \
    libxi6 \
    libxxf86vm1 \
    libxfixes3 \
    libxrender1 \
    libgl1 \
    libglu1-mesa \
    libsm6 \
    && rm -rf /var/lib/apt/lists/*

# Install Blender 4.0
RUN wget -q https://download.blender.org/release/Blender4.0/blender-4.0.2-linux-x64.tar.xz \
    && tar -xf blender-4.0.2-linux-x64.tar.xz \
    && mv blender-4.0.2-linux-x64 /opt/blender \
    && ln -s /opt/blender/blender /usr/local/bin/blender \
    && rm blender-4.0.2-linux-x64.tar.xz

# Set up working directory
WORKDIR /app

# Copy requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip3 install --no-cache-dir -r requirements.txt

# Create necessary directories
RUN mkdir -p /app/scripts \
    /app/templates \
    /app/addons \
    /output \
    /tmp/pdb

# Copy application files
COPY main.py .
COPY scripts/ ./scripts/
COPY templates/ ./templates/

# Install MolecularNodes addon (if available)
# Note: You'll need to download this separately from:
# https://github.com/BradyAJohnston/MolecularNodes
# COPY addons/molecularnodes/ ./addons/molecularnodes/

# Expose FastAPI port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python3 -c "import requests; requests.get('http://localhost:8000/')"

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV BLENDER_PATH=/usr/local/bin/blender

# Run the FastAPI server
CMD ["python3", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

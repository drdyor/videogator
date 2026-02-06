"""
FastAPI Blender Rendering Server for Pharma MOA Videos
Designed to run on RunPod with GPU support
"""
from fastapi import FastAPI, BackgroundTasks, HTTPException
from pydantic import BaseModel
import subprocess
import json
import os
import boto3
from botocore.config import Config
import requests
from typing import Optional, Dict, Any
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Blender Pharma Rendering Server")

# Initialize S3/R2 client
s3 = boto3.client('s3', 
    endpoint_url=os.getenv('R2_ENDPOINT'),
    aws_access_key_id=os.getenv('R2_ACCESS_KEY'),
    aws_secret_access_key=os.getenv('R2_SECRET_KEY'),
    config=Config(signature_version='s3v4')
)

class PharmaRenderJob(BaseModel):
    project_id: str
    pdb_id: str
    template: str  # ligand_binding, antibody_conjugate, cell_signaling, etc.
    params: Dict[str, Any] = {}  # colors, camera_speed, duration, etc.
    webhook_url: Optional[str] = None

class RenderStatus(BaseModel):
    project_id: str
    status: str  # queued, rendering, completed, failed
    progress: Optional[float] = None
    error: Optional[str] = None
    output_url: Optional[str] = None

# In-memory job tracking (use Redis for production)
jobs: Dict[str, RenderStatus] = {}

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "running",
        "service": "Blender Pharma Rendering Server",
        "blender_version": subprocess.run(
            ["blender", "--version"], 
            capture_output=True, 
            text=True
        ).stdout.split('\n')[0] if subprocess.run(
            ["which", "blender"], 
            capture_output=True
        ).returncode == 0 else "not installed"
    }

@app.post("/render", response_model=RenderStatus)
async def queue_render(job: PharmaRenderJob, background_tasks: BackgroundTasks):
    """
    Queue a pharma MOA rendering job
    """
    logger.info(f"Received render job: {job.project_id} for PDB: {job.pdb_id}")
    
    # Validate PDB ID format
    if not job.pdb_id or len(job.pdb_id) != 4:
        raise HTTPException(status_code=400, detail="Invalid PDB ID format")
    
    # Create job config
    config_path = f"/tmp/{job.project_id}.json"
    output_path = f"/output/{job.project_id}.mp4"
    
    # Ensure output directory exists
    os.makedirs("/output", exist_ok=True)
    
    # Write job configuration
    with open(config_path, 'w') as f:
        json.dump(job.dict(), f, indent=2)
    
    # Initialize job status
    jobs[job.project_id] = RenderStatus(
        project_id=job.project_id,
        status="queued",
        progress=0.0
    )
    
    # Queue rendering task
    background_tasks.add_task(
        execute_render, 
        job.project_id, 
        config_path, 
        output_path,
        job.webhook_url
    )
    
    return jobs[job.project_id]

@app.get("/status/{project_id}", response_model=RenderStatus)
async def get_status(project_id: str):
    """
    Get rendering job status
    """
    if project_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    return jobs[project_id]

async def execute_render(
    project_id: str, 
    config_path: str, 
    output_path: str,
    webhook_url: Optional[str] = None
):
    """
    Execute Blender rendering with MolecularNodes
    """
    try:
        logger.info(f"Starting render for project {project_id}")
        jobs[project_id].status = "rendering"
        jobs[project_id].progress = 0.1
        
        # Blender command (no template needed - script creates scene from scratch)
        blender_script = "/app/scripts/molecular_render.py"
        
        cmd = [
            "blender",
            "-b",  # background mode (no template file)
            "--python", blender_script,
            "--",
            config_path,
            output_path
        ]
        
        logger.info(f"Executing: {' '.join(cmd)}")
        
        # Run Blender
        result = subprocess.run(
            cmd, 
            capture_output=True, 
            text=True,
            timeout=600  # 10 minute timeout
        )
        
        if result.returncode != 0:
            logger.error(f"Blender failed: {result.stderr}")
            jobs[project_id].status = "failed"
            jobs[project_id].error = f"Rendering failed: {result.stderr[-500:]}"
            return
        
        # Check if output exists
        if not os.path.exists(output_path):
            logger.error(f"Output file not created: {output_path}")
            jobs[project_id].status = "failed"
            jobs[project_id].error = "Output file was not generated"
            return
        
        jobs[project_id].progress = 0.8
        
        # Upload to R2
        logger.info(f"Uploading to R2: pharma/{project_id}.mp4")
        s3_key = f"pharma/{project_id}.mp4"
        
        s3.upload_file(
            output_path,
            os.getenv('R2_BUCKET_NAME', 'uvgo-videos'),
            s3_key,
            ExtraArgs={'ContentType': 'video/mp4'}
        )
        
        # Generate public URL
        output_url = f"{os.getenv('R2_PUBLIC_URL')}/{s3_key}"
        
        jobs[project_id].status = "completed"
        jobs[project_id].progress = 1.0
        jobs[project_id].output_url = output_url
        
        logger.info(f"Render completed: {output_url}")
        
        # Notify webhook if provided
        if webhook_url:
            try:
                requests.post(webhook_url, json={
                    "projectId": project_id,
                    "status": "completed",
                    "url": output_url
                }, timeout=10)
            except Exception as e:
                logger.error(f"Webhook notification failed: {e}")
        
        # Cleanup
        os.remove(config_path)
        os.remove(output_path)
        
    except subprocess.TimeoutExpired:
        logger.error(f"Render timeout for project {project_id}")
        jobs[project_id].status = "failed"
        jobs[project_id].error = "Rendering timed out after 10 minutes"
    except Exception as e:
        logger.error(f"Render failed: {str(e)}")
        jobs[project_id].status = "failed"
        jobs[project_id].error = str(e)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

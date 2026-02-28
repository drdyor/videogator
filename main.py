"""
VideoGator Stitch Worker
FastAPI service that runs on your 4090x machine.
Receives video URLs/paths, downloads them, stitches via ffmpeg, returns a URL.
Call this from your Vercel VideoGator app via STITCH_WORKER_URL env var.
"""

import os
import uuid
import asyncio
import aiohttp
import aiofiles
import ffmpeg
from pathlib import Path
from typing import Optional
from fastapi import FastAPI, HTTPException, BackgroundTasks, Header
from fastapi.responses import FileResponse
from pydantic import BaseModel, HttpUrl

app = FastAPI(title="VideoGator Stitch Worker", version="1.0.0")

# --- Config ---
TEMP_DIR = Path("./tmp")
OUTPUT_DIR = Path("./output")
TEMP_DIR.mkdir(exist_ok=True)
OUTPUT_DIR.mkdir(exist_ok=True)

# Simple API key auth — set WORKER_API_KEY env var on your machine
# and STITCH_WORKER_KEY on Vercel
WORKER_API_KEY = os.getenv("WORKER_API_KEY", "change-me-in-production")


# --- Models ---

class StitchRequest(BaseModel):
    clips: list[str]          # List of video URLs (from your text-to-video output)
    transition: str = "none"  # "none" | "fade" | "xfade"
    fade_duration: float = 0.5
    output_format: str = "mp4"
    job_id: Optional[str] = None  # Optional — worker will generate one if not provided

class StitchResponse(BaseModel):
    job_id: str
    status: str
    output_url: Optional[str] = None
    duration: Optional[float] = None
    error: Optional[str] = None


# --- Auth ---

def verify_key(x_api_key: str = Header(...)):
    if x_api_key != WORKER_API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")
    return x_api_key


# --- Helpers ---

async def download_clip(session: aiohttp.ClientSession, url: str, dest: Path) -> Path:
    """Download a single clip from URL to local temp path."""
    async with session.get(url) as resp:
        resp.raise_for_status()
        async with aiofiles.open(dest, "wb") as f:
            async for chunk in resp.content.iter_chunked(1024 * 256):
                await f.write(chunk)
    return dest


async def download_all_clips(urls: list[str], job_dir: Path) -> list[Path]:
    """Download all clip URLs concurrently."""
    async with aiohttp.ClientSession() as session:
        tasks = []
        for i, url in enumerate(urls):
            ext = url.split("?")[0].rsplit(".", 1)[-1] or "mp4"
            dest = job_dir / f"clip_{i:04d}.{ext}"
            tasks.append(download_clip(session, url, dest))
        return await asyncio.gather(*tasks)


def probe_clip(path: Path) -> dict:
    """Get video metadata via ffprobe."""
    try:
        return ffmpeg.probe(str(path))
    except ffmpeg.Error as e:
        raise RuntimeError(f"Failed to probe {path.name}: {e.stderr.decode()}")


def normalize_clip(input_path: Path, output_path: Path, width=1920, height=1080, fps=30):
    """
    Normalize a clip to a consistent resolution/fps/codec.
    Critical when stitching clips from different generation runs.
    """
    (
        ffmpeg
        .input(str(input_path))
        .filter("scale", w=width, h=height, force_original_aspect_ratio="decrease")
        .filter("pad", w=width, h=height, x="(ow-iw)/2", y="(oh-ih)/2")
        .filter("fps", fps=fps)
        .output(
            str(output_path),
            vcodec="libx264",
            acodec="aac",
            audio_bitrate="192k",
            video_bitrate="8000k",
            pix_fmt="yuv420p",
            preset="fast",
            movflags="+faststart",
        )
        .overwrite_output()
        .run(quiet=True)
    )


def concat_simple(clip_paths: list[Path], output_path: Path):
    """
    Simple concat using ffmpeg concat demuxer (fastest, no re-encode if formats match).
    Requires all clips to be normalized first.
    """
    concat_file = output_path.parent / "concat_list.txt"
    with open(concat_file, "w") as f:
        for p in clip_paths:
            f.write(f"file '{p.resolve()}'\n")

    (
        ffmpeg
        .input(str(concat_file), format="concat", safe=0)
        .output(str(output_path), c="copy")
        .overwrite_output()
        .run(quiet=True)
    )


def concat_with_fade(clip_paths: list[Path], output_path: Path, fade_dur: float = 0.5):
    """
    Concat clips with crossfade transitions using xfade filter.
    Re-encodes but produces smooth joins between AI-generated clips.
    """
    if len(clip_paths) == 1:
        # Just copy the single clip
        ffmpeg.input(str(clip_paths[0])).output(str(output_path), c="copy").overwrite_output().run(quiet=True)
        return

    # Probe all clips to get their durations
    durations = []
    for p in clip_paths:
        info = ffmpeg.probe(str(p))
        dur = float(info["format"]["duration"])
        durations.append(dur)

    # Build xfade filter chain
    inputs = [ffmpeg.input(str(p)) for p in clip_paths]
    
    # Start with first two clips
    offset = durations[0] - fade_dur
    stream = ffmpeg.filter([inputs[0], inputs[1]], "xfade", transition="fade", duration=fade_dur, offset=max(0, offset))
    
    # Chain remaining clips
    for i in range(2, len(inputs)):
        offset += durations[i - 1] - fade_dur
        stream = ffmpeg.filter([stream, inputs[i]], "xfade", transition="fade", duration=fade_dur, offset=max(0, offset))

    (
        stream
        .output(str(output_path), vcodec="libx264", pix_fmt="yuv420p", preset="fast", movflags="+faststart")
        .overwrite_output()
        .run(quiet=True)
    )


def get_video_duration(path: Path) -> float:
    info = ffmpeg.probe(str(path))
    return float(info["format"]["duration"])


# --- Job State (simple in-memory; swap for Redis in prod) ---
jobs: dict[str, StitchResponse] = {}


async def run_stitch_job(job_id: str, request: StitchRequest):
    """Background task that does the actual work."""
    job_dir = TEMP_DIR / job_id
    job_dir.mkdir(exist_ok=True)

    try:
        jobs[job_id].status = "downloading"

        # 1. Download all clips
        raw_paths = await download_all_clips(request.clips, job_dir)

        jobs[job_id].status = "normalizing"

        # 2. Normalize to consistent format (important for AI-generated clips)
        normalized_paths = []
        for i, raw in enumerate(raw_paths):
            norm_path = job_dir / f"norm_{i:04d}.mp4"
            normalize_clip(raw, norm_path)
            normalized_paths.append(norm_path)

        jobs[job_id].status = "stitching"

        # 3. Concatenate
        output_path = OUTPUT_DIR / f"{job_id}.{request.output_format}"

        if request.transition == "fade":
            concat_with_fade(normalized_paths, output_path, request.fade_duration)
        else:
            concat_simple(normalized_paths, output_path)

        # 4. Get final duration
        duration = get_video_duration(output_path)

        jobs[job_id].status = "done"
        jobs[job_id].output_url = f"/download/{job_id}"
        jobs[job_id].duration = round(duration, 2)

    except Exception as e:
        jobs[job_id].status = "error"
        jobs[job_id].error = str(e)
    finally:
        # Clean up temp files
        import shutil
        shutil.rmtree(job_dir, ignore_errors=True)


# --- Routes ---

@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/stitch", response_model=StitchResponse)
async def stitch(
    request: StitchRequest,
    background_tasks: BackgroundTasks,
    x_api_key: str = Header(...),
):
    verify_key(x_api_key)

    if len(request.clips) < 2:
        raise HTTPException(status_code=400, detail="Need at least 2 clips to stitch")
    if len(request.clips) > 50:
        raise HTTPException(status_code=400, detail="Max 50 clips per job")

    job_id = request.job_id or str(uuid.uuid4())
    response = StitchResponse(job_id=job_id, status="queued")
    jobs[job_id] = response

    background_tasks.add_task(run_stitch_job, job_id, request)

    return response


@app.get("/status/{job_id}", response_model=StitchResponse)
async def status(job_id: str, x_api_key: str = Header(...)):
    verify_key(x_api_key)
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    return jobs[job_id]


@app.get("/download/{job_id}")
async def download(job_id: str, x_api_key: str = Header(...)):
    verify_key(x_api_key)
    output_path = OUTPUT_DIR / f"{job_id}.mp4"
    if not output_path.exists():
        raise HTTPException(status_code=404, detail="Output not ready or not found")
    return FileResponse(str(output_path), media_type="video/mp4", filename=f"{job_id}.mp4")


@app.delete("/job/{job_id}")
async def delete_job(job_id: str, x_api_key: str = Header(...)):
    verify_key(x_api_key)
    output_path = OUTPUT_DIR / f"{job_id}.mp4"
    output_path.unlink(missing_ok=True)
    jobs.pop(job_id, None)
    return {"deleted": job_id}

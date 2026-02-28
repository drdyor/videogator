"""
Local Video Generation Server
Supports: Ollama (LLM), HunyuanVideo, Mochi, CogVideo, ModelScope, AnimateDiff
"""

import os
import json
import asyncio
import logging
import tempfile
import time
from pathlib import Path
from typing import Optional, Dict, Any, List
from dataclasses import dataclass
from enum import Enum

import torch
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel, Field

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Local Video Generation Server", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add CORS headers to all responses
@app.middleware("http")
async def add_cors_headers(request, call_next):
    response = await call_next(request)
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "*"
    return response

# Configuration — use a platform-appropriate default temp dir on Windows
if os.name == "nt":
    # Windows: use TEMP or TMP environment variable
    _temp_dir = os.getenv("TEMP") or os.getenv("TMP") or str(Path.home() / "AppData" / "Local" / "Temp")
    _default_output = str(Path(_temp_dir) / "video-output")
else:
    # Unix: use /tmp
    _default_output = "/tmp/video-output"

OUTPUT_DIR = Path(os.getenv("OUTPUT_DIR", _default_output))
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
logger.info(f"Output directory: {OUTPUT_DIR}")

# Check for GPU
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
logger.info(f"Using device: {DEVICE}")
if DEVICE == "cuda":
    logger.info(f"GPU: {torch.cuda.get_device_name(0)}")
    logger.info(f"VRAM: {torch.cuda.get_device_properties(0).total_memory / 1e9:.2f} GB")


class VideoModel(str, Enum):
    # ── Local models (run on your GPU) ──────────────────────────────────────
    HUNYUAN_VIDEO = "hunyuan-video"
    MOCHI = "mochi"
    COGVIDEO = "cogvideo"
    MODELSCOPE = "modelscope"
    ANIMATEDIFF = "animatediff"
    SVS = "stable-video-diffusion"
    WAN_22 = "wan-2.2"
    WAN_22_5B = "wan-2.2-5b"
    LTX_2 = "ltx-2"
    # ── Replicate cloud models ───────────────────────────────────────────────
    HUMO = "humo"
    KLING_25 = "kling-2.5"
    LUMA_RAY = "luma-ray-flash-2"
    MINIMAX = "minimax-video-01"


class GenerateRequest(BaseModel):
    prompt: str = Field(..., description="Text prompt for video generation")
    negative_prompt: str = Field(default="", description="Negative prompt")
    model: VideoModel = Field(default=VideoModel.HUNYUAN_VIDEO, description="Video model to use")
    width: int = Field(default=848, ge=256, le=1920)
    height: int = Field(default=480, ge=256, le=1080)
    num_frames: int = Field(default=65, ge=9, le=257)
    num_inference_steps: int = Field(default=30, ge=1, le=100)
    guidance_scale: float = Field(default=7.0, ge=1.0, le=20.0)
    seed: Optional[int] = Field(default=None, description="Random seed for reproducibility")
    fps: int = Field(default=24, ge=1, le=60)
    
    # Image-to-video specific
    image_url: Optional[str] = Field(default=None, description="Input image URL for image-to-video")
    image_base64: Optional[str] = Field(default=None, description="Input image base64 for image-to-video")

    # HuMo-specific (Replicate cloud model)
    audio_url: Optional[str] = Field(default=None, description="Input audio URL for HuMo lip-sync")
    audio_guidance_scale: float = Field(default=5.5, ge=2.0, le=15.0, description="Audio guidance scale (HuMo only)")


class GenerateResponse(BaseModel):
    job_id: str
    status: str
    message: str


class StatusResponse(BaseModel):
    job_id: str
    status: str
    progress: float
    output_url: Optional[str] = None
    error: Optional[str] = None
    error_suggestion: Optional[Dict[str, Any]] = None


# Job storage (in production, use Redis or database)
jobs: Dict[str, Dict[str, Any]] = {}


@dataclass
class ModelConfig:
    name: str
    repo_id: str
    default_width: int
    default_height: int
    default_frames: int
    supports_image_to_video: bool
    # Heuristics for VRAM estimation (GB)
    base_vram_gb: float = 6.0
    per_frame_vram_gb: float = 0.03


MODEL_CONFIGS = {
    VideoModel.HUNYUAN_VIDEO: ModelConfig(
        name="HunyuanVideo",
        repo_id="hunyuanvideo-community/HunyuanVideo",  # community mirror has correct diffusers layout
        default_width=848,
        default_height=480,
        default_frames=65,
        supports_image_to_video=False,
        base_vram_gb=12.0,
        per_frame_vram_gb=0.08,
    ),
    VideoModel.MOCHI: ModelConfig(
        name="Mochi",
        repo_id="genmo/mochi-1-preview",
        default_width=848,
        default_height=480,
        default_frames=65,
        supports_image_to_video=False,
        base_vram_gb=12.0,
        per_frame_vram_gb=0.08,
    ),
    VideoModel.COGVIDEO: ModelConfig(
        name="CogVideoX",
        repo_id="THUDM/CogVideoX-5b",
        default_width=720,
        default_height=480,
        default_frames=49,
        supports_image_to_video=True,
        base_vram_gb=8.0,
        per_frame_vram_gb=0.06,
    ),
    VideoModel.MODELSCOPE: ModelConfig(
        name="ModelScope",
        repo_id="damo-vilab/text-to-video-ms-1.7b",
        default_width=256,
        default_height=256,
        default_frames=16,
        supports_image_to_video=False,
        base_vram_gb=4.0,
        per_frame_vram_gb=0.02,
    ),
    VideoModel.ANIMATEDIFF: ModelConfig(
        name="AnimateDiff",
        repo_id="guoyww/animatediff",
        default_width=512,
        default_height=512,
        default_frames=16,
        supports_image_to_video=False,
        base_vram_gb=6.0,
        per_frame_vram_gb=0.03,
    ),
    VideoModel.SVS: ModelConfig(
        name="Stable Video Diffusion",
        repo_id="stabilityai/stable-video-diffusion-img2vid-xt",
        default_width=1024,
        default_height=576,
        default_frames=25,
        supports_image_to_video=True,
        base_vram_gb=6.0,
        per_frame_vram_gb=0.03,
    ),
    VideoModel.WAN_22: ModelConfig(
        name="Wan 2.2 (14B)",
        repo_id="Wan-AI/Wan2.2-T2V-14B",
        default_width=832,
        default_height=480,
        default_frames=81,
        supports_image_to_video=False,
        base_vram_gb=14.0,
        per_frame_vram_gb=0.12,
    ),
    VideoModel.WAN_22_5B: ModelConfig(
        name="Wan 2.2 (5B)",
        repo_id="Wan-AI/Wan2.2-T2V-5B",
        default_width=832,
        default_height=480,
        default_frames=81,
        supports_image_to_video=True,
        base_vram_gb=14.0,
        per_frame_vram_gb=0.12,
    ),
    VideoModel.LTX_2: ModelConfig(
        name="LTX-Video",
        repo_id="Lightricks/LTX-Video-0.9.7",
        default_width=768,
        default_height=512,
        default_frames=97,
        supports_image_to_video=False,
        base_vram_gb=10.0,
        per_frame_vram_gb=0.05,
    ),
    VideoModel.HUMO: ModelConfig(
        name="HuMo — ByteDance (Replicate ☁)",
        repo_id="zsxkib/humo",
        default_width=1280,
        default_height=720,
        default_frames=49,
        supports_image_to_video=True,
        base_vram_gb=0.0,
        per_frame_vram_gb=0.0,
    ),
    VideoModel.KLING_25: ModelConfig(
        name="Kling 2.5 Turbo (Replicate ☁)",
        repo_id="klingai/kling-2.5-turbo",
        default_width=1280,
        default_height=720,
        default_frames=0,   # Kling uses duration_seconds instead of frames
        supports_image_to_video=True,
        base_vram_gb=0.0,
        per_frame_vram_gb=0.0,
    ),
    VideoModel.LUMA_RAY: ModelConfig(
        name="Luma Ray Flash 2 (Replicate ☁)",
        repo_id="luma/ray-flash-2",
        default_width=1360,
        default_height=752,
        default_frames=0,
        supports_image_to_video=True,
        base_vram_gb=0.0,
        per_frame_vram_gb=0.0,
    ),
    VideoModel.MINIMAX: ModelConfig(
        name="MiniMax Video 01 (Replicate ☁)",
        repo_id="minimax/video-01",
        default_width=1280,
        default_height=720,
        default_frames=0,
        supports_image_to_video=True,
        base_vram_gb=0.0,
        per_frame_vram_gb=0.0,
    ),
}


class VideoGenerator:
    """Base class for video generation"""
    
    def __init__(self, model: VideoModel):
        self.model = model
        self.config = MODEL_CONFIGS[model]
        self.pipeline = None
    
    def load_model(self):
        """Load the model into memory"""
        raise NotImplementedError
    
    def generate(self, request: GenerateRequest, output_path: Path) -> Path:
        """Generate video and return path"""
        raise NotImplementedError


class HunyuanVideoGenerator(VideoGenerator):
    """HunyuanVideo generator"""
    
    def load_model(self):
        if self.pipeline is not None:
            return
        
        try:
            from diffusers import HunyuanVideoPipeline, HunyuanVideoTransformer3DModel
            from diffusers.utils import export_to_video
            
            logger.info(f"Loading {self.config.name} model...")
            
            # Load with float16 for memory efficiency
            dtype = torch.float16 if DEVICE == "cuda" else torch.float32
            
            self.pipeline = HunyuanVideoPipeline.from_pretrained(
                self.config.repo_id,
                torch_dtype=dtype,
            )
            self.pipeline.to(DEVICE)
            self.pipeline.enable_model_cpu_offload()  # For limited VRAM
            
            logger.info(f"{self.config.name} loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load {self.config.name}: {e}")
            raise
    
    def generate(self, request: GenerateRequest, output_path: Path) -> Path:
        from diffusers.utils import export_to_video
        
        self.load_model()
        
        generator = torch.Generator(device=DEVICE)
        if request.seed is not None:
            generator.manual_seed(request.seed)
        
        logger.info(f"Generating video with prompt: {request.prompt[:100]}...")
        
        result = self.pipeline(
            prompt=request.prompt,
            negative_prompt=request.negative_prompt,
            height=request.height,
            width=request.width,
            num_frames=request.num_frames,
            num_inference_steps=request.num_inference_steps,
            guidance_scale=request.guidance_scale,
            generator=generator,
        )
        
        video_path = output_path.with_suffix(".mp4")
        export_to_video(result.frames[0], str(video_path), fps=request.fps)
        
        return video_path


class MochiGenerator(VideoGenerator):
    """Mochi video generator"""
    
    def load_model(self):
        if self.pipeline is not None:
            return
        
        try:
            from diffusers import MochiPipeline
            
            logger.info(f"Loading {self.config.name} model...")
            
            dtype = torch.float16 if DEVICE == "cuda" else torch.float32
            
            self.pipeline = MochiPipeline.from_pretrained(
                self.config.repo_id,
                torch_dtype=dtype,
            )
            self.pipeline.to(DEVICE)
            
            # Enable memory optimizations
            self.pipeline.enable_model_cpu_offload()
            
            logger.info(f"{self.config.name} loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load {self.config.name}: {e}")
            raise
    
    def generate(self, request: GenerateRequest, output_path: Path) -> Path:
        from diffusers.utils import export_to_video
        
        self.load_model()
        
        generator = torch.Generator(device=DEVICE)
        if request.seed is not None:
            generator.manual_seed(request.seed)
        
        logger.info(f"Generating video with Mochi: {request.prompt[:100]}...")
        
        result = self.pipeline(
            prompt=request.prompt,
            negative_prompt=request.negative_prompt,
            height=request.height,
            width=request.width,
            num_frames=request.num_frames,
            num_inference_steps=request.num_inference_steps,
            guidance_scale=request.guidance_scale,
            generator=generator,
        )
        
        video_path = output_path.with_suffix(".mp4")
        export_to_video(result.frames[0], str(video_path), fps=request.fps)
        
        return video_path


class CogVideoGenerator(VideoGenerator):
    """CogVideoX generator"""
    
    def load_model(self):
        if self.pipeline is not None:
            return
        
        try:
            from diffusers import CogVideoXPipeline
            
            logger.info(f"Loading {self.config.name} model...")
            
            dtype = torch.float16 if DEVICE == "cuda" else torch.float32
            
            self.pipeline = CogVideoXPipeline.from_pretrained(
                self.config.repo_id,
                torch_dtype=dtype,
            )
            self.pipeline.to(DEVICE)
            self.pipeline.enable_model_cpu_offload()
            
            logger.info(f"{self.config.name} loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load {self.config.name}: {e}")
            raise
    
    def generate(self, request: GenerateRequest, output_path: Path) -> Path:
        from diffusers.utils import export_to_video
        
        self.load_model()
        
        generator = torch.Generator(device=DEVICE)
        if request.seed is not None:
            generator.manual_seed(request.seed)
        
        logger.info(f"Generating video with CogVideoX: {request.prompt[:100]}...")
        
        result = self.pipeline(
            prompt=request.prompt,
            negative_prompt=request.negative_prompt,
            height=request.height,
            width=request.width,
            num_frames=request.num_frames,
            num_inference_steps=request.num_inference_steps,
            guidance_scale=request.guidance_scale,
            generator=generator,
        )
        
        video_path = output_path.with_suffix(".mp4")
        export_to_video(result.frames[0], str(video_path), fps=request.fps)
        
        return video_path


class ModelScopeGenerator(VideoGenerator):
    """ModelScope text-to-video generator"""
    
    def load_model(self):
        if self.pipeline is not None:
            return
        
        try:
            from diffusers import DiffusionPipeline
            
            logger.info(f"Loading {self.config.name} model...")
            
            dtype = torch.float16 if DEVICE == "cuda" else torch.float32
            
            self.pipeline = DiffusionPipeline.from_pretrained(
                self.config.repo_id,
                torch_dtype=dtype,
            )
            self.pipeline.to(DEVICE)
            
            logger.info(f"{self.config.name} loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load {self.config.name}: {e}")
            raise
    
    def generate(self, request: GenerateRequest, output_path: Path) -> Path:
        from diffusers.utils import export_to_video
        
        self.load_model()
        
        generator = torch.Generator(device=DEVICE)
        if request.seed is not None:
            generator.manual_seed(request.seed)
        
        logger.info(f"Generating video with ModelScope: {request.prompt[:100]}...")
        
        result = self.pipeline(
            prompt=request.prompt,
            negative_prompt=request.negative_prompt,
            height=request.height,
            width=request.width,
            num_frames=request.num_frames,
            num_inference_steps=request.num_inference_steps,
            guidance_scale=request.guidance_scale,
            generator=generator,
        )
        
        video_path = output_path.with_suffix(".mp4")
        export_to_video(result.frames[0], str(video_path), fps=request.fps)
        
        return video_path


class StableVideoDiffusionGenerator(VideoGenerator):
    """Stable Video Diffusion image-to-video generator"""
    
    def load_model(self):
        if self.pipeline is not None:
            return
        
        try:
            from diffusers import StableVideoDiffusionPipeline
            
            logger.info(f"Loading {self.config.name} model...")
            
            dtype = torch.float16 if DEVICE == "cuda" else torch.float32
            
            self.pipeline = StableVideoDiffusionPipeline.from_pretrained(
                self.config.repo_id,
                torch_dtype=dtype,
            )
            self.pipeline.to(DEVICE)
            
            logger.info(f"{self.config.name} loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load {self.config.name}: {e}")
            raise
    
    def generate(self, request: GenerateRequest, output_path: Path) -> Path:
        import base64
        import io
        from PIL import Image
        from diffusers.utils import export_to_video, load_image
        
        self.load_model()
        
        # Load input image
        if request.image_url:
            image = load_image(request.image_url)
        elif request.image_base64:
            image_data = base64.b64decode(request.image_base64)
            image = Image.open(io.BytesIO(image_data))
        else:
            raise ValueError("Stable Video Diffusion requires an input image")
        
        # Resize to supported dimensions
        image = image.resize((request.width, request.height))
        
        generator = torch.Generator(device=DEVICE)
        if request.seed is not None:
            generator.manual_seed(request.seed)
        
        logger.info(f"Generating video with SVD from image...")
        
        frames = self.pipeline(
            image,
            num_frames=request.num_frames,
            num_inference_steps=request.num_inference_steps,
            generator=generator,
        ).frames[0]
        
        video_path = output_path.with_suffix(".mp4")
        export_to_video(frames, str(video_path), fps=request.fps)
        
        return video_path


class Wan22Generator(VideoGenerator):
    """Wan 2.2 text-to-video generator (14B params)"""

    def load_model(self):
        if self.pipeline is not None:
            return

        try:
            from diffusers import WanPipeline

            logger.info(f"Loading {self.config.name} model...")

            dtype = torch.float16 if DEVICE == "cuda" else torch.float32

            self.pipeline = WanPipeline.from_pretrained(
                self.config.repo_id,
                torch_dtype=dtype,
            )
            self.pipeline.enable_model_cpu_offload()

            logger.info(f"{self.config.name} loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load {self.config.name}: {e}")
            raise

    def generate(self, request: GenerateRequest, output_path: Path) -> Path:
        from diffusers.utils import export_to_video

        self.load_model()

        generator = torch.Generator(device=DEVICE)
        if request.seed is not None:
            generator.manual_seed(request.seed)

        logger.info(f"Generating video with Wan 2.2: {request.prompt[:100]}...")

        result = self.pipeline(
            prompt=request.prompt,
            negative_prompt=request.negative_prompt,
            height=request.height,
            width=request.width,
            num_frames=request.num_frames,
            num_inference_steps=request.num_inference_steps,
            guidance_scale=request.guidance_scale,
            generator=generator,
        )

        video_path = output_path.with_suffix(".mp4")
        export_to_video(result.frames[0], str(video_path), fps=request.fps)

        return video_path


class LTX2Generator(VideoGenerator):
    """LTX-Video generator"""

    def load_model(self):
        if self.pipeline is not None:
            return

        try:
            from diffusers import LTXPipeline

            logger.info(f"Loading {self.config.name} model...")

            dtype = torch.float16 if DEVICE == "cuda" else torch.float32

            self.pipeline = LTXPipeline.from_pretrained(
                self.config.repo_id,
                torch_dtype=dtype,
            )
            self.pipeline.enable_model_cpu_offload()

            logger.info(f"{self.config.name} loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load {self.config.name}: {e}")
            raise

    def generate(self, request: GenerateRequest, output_path: Path) -> Path:
        from diffusers.utils import export_to_video

        self.load_model()

        generator = torch.Generator(device=DEVICE)
        if request.seed is not None:
            generator.manual_seed(request.seed)

        logger.info(f"Generating video with LTX-Video: {request.prompt[:100]}...")

        result = self.pipeline(
            prompt=request.prompt,
            negative_prompt=request.negative_prompt,
            height=request.height,
            width=request.width,
            num_frames=request.num_frames,
            num_inference_steps=request.num_inference_steps,
            guidance_scale=request.guidance_scale,
            generator=generator,
        )

        video_path = output_path.with_suffix(".mp4")
        export_to_video(result.frames[0], str(video_path), fps=request.fps)

        return video_path


# ── Replicate cloud models ────────────────────────────────────────────────────

REPLICATE_CLOUD_MODELS = {VideoModel.HUMO, VideoModel.KLING_25, VideoModel.LUMA_RAY, VideoModel.MINIMAX}


def _build_replicate_input(model: VideoModel, request: GenerateRequest) -> Dict[str, Any]:
    """Build the input payload for each Replicate model from a GenerateRequest."""
    prompt = request.prompt
    neg = request.negative_prompt or "blurry, low quality, distorted"
    seed = request.seed

    if model == VideoModel.HUMO:
        data: Dict[str, Any] = {
            "prompt": prompt,
            "negative_prompt": neg,
            "num_frames": min(request.num_frames, 97),
            "num_inference_steps": request.num_inference_steps,
            "guidance_scale": request.guidance_scale,
            "audio_guidance_scale": request.audio_guidance_scale,
        }
        if seed is not None:
            data["seed"] = seed
        if request.image_url:
            data["reference_image"] = request.image_url
        if request.audio_url:
            data["audio"] = request.audio_url
        return data

    if model == VideoModel.KLING_25:
        data = {
            "prompt": prompt,
            "negative_prompt": neg,
            "duration": 5,          # seconds (Kling uses duration, not frames)
            "aspect_ratio": "16:9",
            "cfg_scale": request.guidance_scale,
        }
        if seed is not None:
            data["seed"] = seed
        if request.image_url:
            data["start_image"] = request.image_url
        return data

    if model == VideoModel.LUMA_RAY:
        data = {
            "prompt": prompt,
            "duration": "5s",
            "resolution": "720p",
            "aspect_ratio": "16:9",
        }
        if seed is not None:
            data["seed"] = seed
        if request.image_url:
            data["keyframes"] = {"frame0": {"type": "image", "url": request.image_url}}
        return data

    if model == VideoModel.MINIMAX:
        data = {
            "prompt": prompt,
        }
        if request.image_url:
            data["first_frame_image"] = request.image_url
        return data

    raise ValueError(f"No Replicate input builder for {model}")


async def generate_via_replicate(job_id: str, request: GenerateRequest, output_path: Path) -> Path:
    """Generic Replicate cloud generation — handles HuMo, Kling, Luma, MiniMax."""
    import httpx

    api_token = os.getenv("REPLICATE_API_TOKEN", "")
    if not api_token:
        raise ValueError(
            "REPLICATE_API_TOKEN is not set. "
            "Get yours at https://replicate.com/account/api-tokens and add it to .env"
        )

    model_cfg = MODEL_CONFIGS[request.model]
    repo_id = model_cfg.repo_id
    input_data = _build_replicate_input(request.model, request)

    auth_headers = {"Authorization": f"Bearer {api_token}", "Content-Type": "application/json"}

    async with httpx.AsyncClient(timeout=30.0) as client:
        logger.info(f"Creating Replicate prediction [{repo_id}] for job {job_id}")
        resp = await client.post(
            f"https://api.replicate.com/v1/models/{repo_id}/predictions",
            headers=auth_headers,
            json={"input": input_data},
        )
        if resp.status_code not in (200, 201):
            raise RuntimeError(f"Replicate API error {resp.status_code}: {resp.text}")

        prediction = resp.json()
        prediction_id = prediction["id"]
        logger.info(f"Prediction {prediction_id} created for job {job_id}")
        jobs[job_id]["replicate_prediction_id"] = prediction_id

        poll_url = f"https://api.replicate.com/v1/predictions/{prediction_id}"
        poll_headers = {"Authorization": f"Bearer {api_token}"}

        while True:
            await asyncio.sleep(5)
            poll_resp = await client.get(poll_url, headers=poll_headers)
            poll_resp.raise_for_status()
            data = poll_resp.json()
            status = data.get("status")
            logger.info(f"Replicate {prediction_id}: {status}")

            if status == "starting":
                jobs[job_id]["progress"] = 0.1
            elif status == "processing":
                jobs[job_id]["progress"] = min(0.9, jobs[job_id].get("progress", 0.1) + 0.04)
            elif status == "succeeded":
                output = data.get("output")
                # Some models return a list, some a string
                output_url = output[0] if isinstance(output, list) else output
                if not output_url:
                    raise RuntimeError(f"{model_cfg.name} returned no output URL")
                logger.info(f"Downloading output from {output_url}")
                video_path = output_path.with_suffix(".mp4")
                dl = await client.get(output_url, follow_redirects=True, timeout=120.0)
                dl.raise_for_status()
                video_path.write_bytes(dl.content)
                return video_path
            elif status in ("failed", "canceled"):
                error = data.get("error") or f"prediction {status}"
                raise RuntimeError(f"{model_cfg.name} {status}: {error}")


# Generator factory
def get_generator(model: VideoModel) -> VideoGenerator:
    generators = {
        VideoModel.HUNYUAN_VIDEO: HunyuanVideoGenerator,
        VideoModel.MOCHI: MochiGenerator,
        VideoModel.COGVIDEO: CogVideoGenerator,
        VideoModel.MODELSCOPE: ModelScopeGenerator,
        VideoModel.SVS: StableVideoDiffusionGenerator,
        VideoModel.WAN_22: Wan22Generator,
        VideoModel.WAN_22_5B: Wan22Generator,
        VideoModel.LTX_2: LTX2Generator,
    }
    
    generator_class = generators.get(model)
    if generator_class is None:
        raise ValueError(f"Unsupported model: {model}")
    
    return generator_class(model)


async def generate_video_task(job_id: str, request: GenerateRequest):
    """Background task for video generation"""
    try:
        jobs[job_id]["status"] = "processing"
        jobs[job_id]["progress"] = 0.0

        output_path = OUTPUT_DIR / f"{job_id}"

        # Replicate cloud models — handle before local generator path
        if request.model in REPLICATE_CLOUD_MODELS:
            video_path = await generate_via_replicate(job_id, request, output_path)
            jobs[job_id]["status"] = "completed"
            jobs[job_id]["progress"] = 1.0
            jobs[job_id]["output_url"] = f"/output/{video_path.name}"
            logger.info(f"Job {job_id} ({request.model.value}) completed via Replicate: {video_path}")
            return

        # Free any VRAM left over from previous jobs before loading model
        if torch.cuda.is_available():
            torch.cuda.empty_cache()

        generator = get_generator(request.model)

        # Run generation in thread pool
        loop = asyncio.get_event_loop()
        # Primary generation attempt
        video_path = await loop.run_in_executor(
            None,
            lambda: generator.generate(request, output_path)
        )

        jobs[job_id]["status"] = "completed"
        jobs[job_id]["progress"] = 1.0
        jobs[job_id]["output_url"] = f"/output/{video_path.name}"

        logger.info(f"Job {job_id} completed: {video_path}")
        # Release VRAM after generation so the next job starts with a clean GPU state
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
        
    except Exception as e:
        logger.error(f"Job {job_id} failed: {e}")
        # If OOM/CUDA error, try a single automatic fallback (reduced frames / resolution)
        err_str = str(e).lower()
        if "out of memory" in err_str or "cuda error" in err_str or "oom" in err_str:
            try:
                suggestion = estimate_suggestion_for_request(request)
            except Exception:
                suggestion = None

            # Record suggestion for UI
            if suggestion:
                jobs[job_id]["error_suggestion"] = suggestion

            # Only attempt one automatic retry to avoid long loops
            try:
                # Derive fallback parameters
                if suggestion and isinstance(suggestion, dict):
                    fallback_frames = suggestion.get("recommended_frames") or suggestion.get("safe_frames") or suggestion.get("max_frames_safe")
                else:
                    fallback_frames = None

                # Fallback strategy: prefer suggested frames; otherwise halve frames and reduce resolution by 25%
                if not fallback_frames:
                    fallback_frames = max(9, request.num_frames // 2)

                # Reduce resolution moderately
                new_width = max(256, int(request.width * 0.75))
                new_height = max(256, int(request.height * 0.75))

                # If fallback would not change anything, skip
                if fallback_frames >= request.num_frames and new_width >= request.width and new_height >= request.height:
                    raise e

                logger.info(f"Attempting OOM fallback for job {job_id}: frames={fallback_frames}, {new_width}x{new_height}")

                # Build a new GenerateRequest for retry
                retry_payload = request.dict()
                retry_payload["num_frames"] = int(fallback_frames)
                retry_payload["width"] = int(new_width)
                retry_payload["height"] = int(new_height)
                retry_request = GenerateRequest(**retry_payload)

                # Run retry in executor
                video_path = await loop.run_in_executor(
                    None,
                    lambda: generator.generate(retry_request, output_path)
                )

                # If retry succeeds, mark completed and attach suggestion explaining retry
                jobs[job_id]["status"] = "completed"
                jobs[job_id]["progress"] = 1.0
                jobs[job_id]["output_url"] = f"/output/{video_path.name}"
                jobs[job_id]["error_suggestion"] = jobs[job_id].get("error_suggestion") or {"note": "Automatically retried with reduced frames/resolution"}
                logger.info(f"Job {job_id} completed after OOM fallback: {video_path}")
                return
            except Exception as e2:
                logger.error(f"OOM fallback for job {job_id} also failed: {e2}")
                jobs[job_id]["status"] = "failed"
                jobs[job_id]["error"] = f"{e} | fallback error: {e2}"
                # Keep any suggestion set above
                if torch.cuda.is_available():
                    torch.cuda.empty_cache()
                return

        # Non-OOM or fallback path: record failure
        jobs[job_id]["status"] = "failed"
        jobs[job_id]["error"] = str(e)
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
        try:
            suggestion = estimate_suggestion_for_request(request)
            jobs[job_id]["error_suggestion"] = suggestion
        except Exception:
            pass


@app.get("/")
async def root():
    return {
        "message": "Local Video Generation Server",
        "device": DEVICE,
        "gpu": torch.cuda.get_device_name(0) if DEVICE == "cuda" else None,
        "models": [m.value for m in VideoModel],
    }


@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "device": DEVICE,
        "gpu_available": torch.cuda.is_available(),
        "vram_gb": torch.cuda.get_device_properties(0).total_memory / 1e9 if DEVICE == "cuda" else 0,
    }


@app.post("/generate", response_model=GenerateResponse)
async def generate(request: GenerateRequest, background_tasks: BackgroundTasks):
    """Start video generation job"""
    # Check for required Python packages before accepting the job
    missing = check_dependencies() if 'check_dependencies' in globals() else []
    if missing:
        raise HTTPException(status_code=503, detail={
            "error": "Missing Python dependencies",
            "missing": missing,
            "install": f"pip install {' '.join(missing)}",
        })
    import uuid
    
    job_id = str(uuid.uuid4())[:8]
    jobs[job_id] = {
        "status": "queued",
        "progress": 0.0,
        "request": request.dict(),
        "created_at": time.time(),
    }
    
    background_tasks.add_task(generate_video_task, job_id, request)
    
    return GenerateResponse(
        job_id=job_id,
        status="queued",
        message=f"Video generation started with {request.model.value}",
    )


@app.get("/status/{job_id}", response_model=StatusResponse)
async def get_status(job_id: str):
    """Get job status"""
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job = jobs[job_id]
    return StatusResponse(
        job_id=job_id,
        status=job["status"],
        progress=job["progress"],
        output_url=job.get("output_url"),
        error=job.get("error"),
        error_suggestion=job.get("error_suggestion"),
    )


@app.get("/output/{filename}")
async def get_output(filename: str):
    """Download generated video"""
    file_path = OUTPUT_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    response = FileResponse(
        file_path,
        media_type="video/mp4",
        filename=filename,
    )
    response.headers["Access-Control-Allow-Origin"] = "*"
    return response


@app.get("/models")
async def list_models():
    """List available models and their configurations"""
    return {
        model.value: {
            "name": config.name,
            "repo_id": config.repo_id,
            "default_width": config.default_width,
            "default_height": config.default_height,
            "default_frames": config.default_frames,
            "supports_image_to_video": config.supports_image_to_video,
            "base_vram_gb": config.base_vram_gb,
            "per_frame_vram_gb": config.per_frame_vram_gb,
        }
        for model, config in MODEL_CONFIGS.items()
    }


@app.post("/ollama/generate")
async def ollama_generate(request: dict):
    """
    Ollama-compatible endpoint for video generation.
    Works with Ollama API format for easy integration.
    """
    model = request.get("model", "hunyuan-video")
    prompt = request.get("prompt", "")
    
    # Map Ollama model names to our models
    model_mapping = {
        "hunyuan": VideoModel.HUNYUAN_VIDEO,
        "hunyuan-video": VideoModel.HUNYUAN_VIDEO,
        "mochi": VideoModel.MOCHI,
        "cogvideo": VideoModel.COGVIDEO,
        "cogvideox": VideoModel.COGVIDEO,
        "modelscope": VideoModel.MODELSCOPE,
        "svd": VideoModel.SVS,
        "stable-video": VideoModel.SVS,
        "wan": VideoModel.WAN_22,
        "wan-2.2": VideoModel.WAN_22,
        "wan2.2": VideoModel.WAN_22,
        "wan-5b": VideoModel.WAN_22_5B,
        "wan-2.2-5b": VideoModel.WAN_22_5B,
        "ltx": VideoModel.LTX_2,
        "ltx-2": VideoModel.LTX_2,
        "ltx-video": VideoModel.LTX_2,
    }
    
    video_model = model_mapping.get(model.lower(), VideoModel.HUNYUAN_VIDEO)
    
    generate_request = GenerateRequest(
        prompt=prompt,
        model=video_model,
        **{k: v for k, v in request.items() if k in GenerateRequest.__fields__},
    )
    
    import uuid
    job_id = str(uuid.uuid4())[:8]
    jobs[job_id] = {
        "status": "queued",
        "progress": 0.0,
        "request": generate_request.dict(),
        "created_at": time.time(),
    }
    
    # Run synchronously for Ollama compatibility
    try:
        output_path = OUTPUT_DIR / f"{job_id}"
        generator = get_generator(video_model)
        video_path = generator.generate(generate_request, output_path)
        
        jobs[job_id]["status"] = "completed"
        jobs[job_id]["progress"] = 1.0
        jobs[job_id]["output_url"] = f"/output/{video_path.name}"
        
        return {
            "model": model,
            "created_at": int(time.time()),
            "response": f"Video generated successfully",
            "output_url": f"/output/{video_path.name}",
            "job_id": job_id,
        }
    except Exception as e:
        jobs[job_id]["status"] = "failed"
        jobs[job_id]["error"] = str(e)
        # Attach suggestion when OOM-like errors occur
        if "out of memory" in str(e).lower() or "cuda error" in str(e).lower():
            try:
                jobs[job_id]["error_suggestion"] = estimate_suggestion_for_request(generate_request)
            except Exception:
                pass
    raise HTTPException(status_code=500, detail=str(e))


class EstimateRequest(BaseModel):
    vram_gb: float = Field(..., description="Available GPU VRAM in GB")
    model: Optional[VideoModel] = Field(default=VideoModel.HUNYUAN_VIDEO)


class EstimateResponse(BaseModel):
    model: str
    vram_gb: float
    recommended_max_frames: int
    experimental_max_frames: int
    base_vram_gb: float
    per_frame_vram_gb: float


def estimate_for_model(vram_gb: float, model: VideoModel):
    cfg = MODEL_CONFIGS[model]
    available = max(0.0, vram_gb - cfg.base_vram_gb)
    if cfg.per_frame_vram_gb <= 0:
        conservative = 1
    else:
        conservative = max(1, int(available // cfg.per_frame_vram_gb))

    # Experimental assumes we can squeeze a bit of baseline
    experimental_available = max(0.0, vram_gb - cfg.base_vram_gb * 0.8)
    experimental = max(1, int(experimental_available // cfg.per_frame_vram_gb))

    return {
        "model": model.value,
        "vram_gb": vram_gb,
        "recommended_max_frames": conservative,
        "experimental_max_frames": experimental,
        "base_vram_gb": cfg.base_vram_gb,
        "per_frame_vram_gb": cfg.per_frame_vram_gb,
    }


def estimate_suggestion_for_request(req: GenerateRequest):
    try:
        model = req.model
    except Exception:
        model = VideoModel.HUNYUAN_VIDEO
    try:
        import torch as _torch
        if _torch.cuda.is_available():
            vram = _torch.cuda.get_device_properties(0).total_memory / 1e9
        else:
            vram = 0.0
    except Exception:
        vram = 0.0

    return estimate_for_model(vram, model)


def check_dependencies() -> List[str]:
    """Return a list of missing Python packages required for generation."""
    required = ["diffusers", "torch", "transformers", "accelerate"]
    missing: List[str] = []
    for pkg in required:
        try:
            __import__(pkg)
        except Exception:
            missing.append(pkg)
    return missing


@app.get("/diagnose")
async def diagnose():
    """Return missing Python package diagnostics and an install suggestion."""
    missing = check_dependencies()
    return {
        "missing": missing,
        "install_cmd": None if not missing else f"pip install {' '.join(missing)}",
    }


@app.post("/estimate", response_model=EstimateResponse)
async def estimate(request: EstimateRequest):
    """Estimate recommended frames given available VRAM and model."""
    model = request.model or VideoModel.HUNYUAN_VIDEO
    return estimate_for_model(request.vram_gb, model)


class EnhancePromptRequest(BaseModel):
    prompt: str = Field(..., description="User's rough prompt to enhance")
    model: str = Field(default="qwen2.5:7b", description="Ollama LLM model name")


ENHANCE_SYSTEM_PROMPT = """You are a cinematic video prompt engineer. The user will give you a brief video description. Expand it into a rich, detailed cinematic video generation prompt.

Include specific details about:
- Camera movement and angle (e.g. slow dolly push-in, low angle, crane shot)
- Lens choice (e.g. anamorphic, 85mm telephoto, wide angle)
- Lighting (e.g. golden hour, Rembrandt lighting, neon noir)
- Color grading (e.g. teal and orange, desaturated, warm vintage)
- Atmosphere (e.g. fog, rain, dust particles)
- Composition and framing
- Mood and emotional tone

Output ONLY the enhanced prompt text. No explanations, no markdown, no labels. Just the prompt."""


@app.post("/enhance-prompt")
async def enhance_prompt(request: EnhancePromptRequest):
    """
    Enhance a user's rough prompt using a local LLM via Ollama.
    """
    import httpx

    ollama_url = os.getenv("OLLAMA_URL", "http://localhost:11434")

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{ollama_url}/api/generate",
                json={
                    "model": request.model,
                    "prompt": request.prompt,
                    "system": ENHANCE_SYSTEM_PROMPT,
                    "stream": False,
                },
            )

            if response.status_code != 200:
                raise HTTPException(
                    status_code=502,
                    detail=f"Ollama returned status {response.status_code}",
                )

            data = response.json()
            enhanced = data.get("response", "").strip()

            if not enhanced:
                raise HTTPException(
                    status_code=502,
                    detail="Ollama returned empty response",
                )

            return {
                "original": request.prompt,
                "enhanced": enhanced,
                "model": request.model,
            }

    except httpx.ConnectError:
        # Ollama not available — return a lightweight heuristic enhancement so UI still works offline
        logger.warning("Ollama not available, returning local enhancement fallback")
        enhanced = (
            request.prompt.strip()
            + " — cinematic, detailed scene with camera movement, specific lens, dramatic lighting, atmospheric particles, warm color grading, and clear composition."
        )
        return {
            "original": request.prompt,
            "enhanced": enhanced,
            "model": request.model,
        }
    except httpx.TimeoutException:
        raise HTTPException(
            status_code=504,
            detail="Ollama request timed out",
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)

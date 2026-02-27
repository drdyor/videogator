from huggingface_hub import snapshot_download
from pathlib import Path
import traceback

repos = [
    "tencent/HunyuanVideo",
    "genmo/mochi-1-preview",
    "THUDM/CogVideoX-5b",
    "damo-vilab/text-to-video-ms-1.7b",
    "guoyww/animatediff",
    "stabilityai/stable-video-diffusion-img2vid-xt",
    "Wan-AI/Wan2.2-T2V-14B",
    "Wan-AI/Wan2.2-T2V-5B",
    "Lightricks/LTX-Video-0.9.7",
]

log_path = Path("download-models.log")
with log_path.open("a", encoding="utf-8") as log:
    log.write("\n=== Bulk model download start ===\n")

success = []
failed = []

for repo in repos:
    try:
        print(f"\\n=== Downloading: {repo} ===")
        p = snapshot_download(repo_id=repo)
        print(f"OK: {repo} -> {p}")
        success.append((repo, p))
        with log_path.open("a", encoding="utf-8") as log:
            log.write(f"OK|{repo}|{p}\\n")
    except Exception as e:
        msg = f"FAIL: {repo} -> {e}"
        print(msg)
        failed.append((repo, str(e)))
        with log_path.open("a", encoding="utf-8") as log:
            log.write(f"FAIL|{repo}|{e}\\n")

print("\\n=== SUMMARY ===")
print("SUCCESS:", len(success))
for r, p in success:
    print(" -", r)
print("FAILED:", len(failed))
for r, err in failed:
    print(" -", r, "=>", err)

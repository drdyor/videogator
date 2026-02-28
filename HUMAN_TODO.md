```markdown
# Human TODO List (updated 2026-02-28)

Things only you can do (signups, passwords, hardware setup).

---

## PRIORITY 1: Start the Video Server (local GPU machine)

The server lives in the repo at `video-server/`. Follow these streamlined steps to get it running and verify that generation, uploads, and DB records work.

### Quick checklist (PowerShell)

1) Open an elevated PowerShell (Run as Administrator) if you need to kill processes or bind privileged ports.

2) Create & activate a Python virtual environment (if missing)

```powershell
cd C:\Users\Forre\videogator\video-server
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

3) Install required packages

```powershell
# Use the video-server requirements when present
cd C:\Users\Forre\videogator\video-server
pip install -r requirements.txt
# If you hit GPU/CUDA build issues, try installing prebuilt wheels per README
```

4) Start the server (dev) and capture logs

```powershell
cd C:\Users\Forre\videogator\video-server
# Recommended for iterative dev
python -m uvicorn main:app --host 0.0.0.0 --port 8001 --reload
# Or use start.bat/start.sh if preferred
```

5) Health check & smoke generate

```powershell
Invoke-RestMethod -Uri "http://localhost:8001/health"
# Minimal generate example (adjust body to match API schema)
$body = @{ prompt = "smoke test"; model = "modelscope"; width = 256; height = 256; num_frames = 9 } | ConvertTo-Json
$response = Invoke-RestMethod -Uri "http://localhost:8001/generate" -Method Post -Body $body -ContentType "application/json"
Invoke-RestMethod -Uri "http://localhost:8001/status/$($response.job_id)"
```

6) Kill a process using port 8001 (if necessary)

```powershell
# Find PID (requires admin to see some PIDs)
netstat -ano | Select-String ":8001"
# Then kill (replace REPLACE_PID with actual PID)
taskkill /PID REPLACE_PID /F
```

7) Out-of-memory / failure handling

- Check `/status/<job_id>` for `error_suggestion` in the API responses.
- The server may auto-retry with reduced frames/resolution; inspect logs for fallback actions.
- If still failing, copy the full uvicorn traceback and attach it to an issue.

8) Verify storage & DB

- Confirm generated files at `http://localhost:8001/output/<filename>` or in the configured external store (R2, S3).
- Cross-check worker/DB records for job_id in the Node backend to confirm persistence.

9) Helpful hints

- If CUDA / drivers are required, ensure matching PyTorch/CUDA wheels are installed.
- Use `python -m pip install --upgrade pip wheel` before heavy installs.
- Consider setting up a Windows Service or using NSSM/pm2 for production reliability.

---

## Additional repo-level human tasks

- **Credentials / Secrets**: Ensure R2/Supabase keys and OAuth client secrets are available in the dev environment before running end-to-end flows.
- **Model licenses**: Confirm any commercial model licensing or access tokens are in place for third-party providers.
- **Hardware access**: If the GPU host is remote, confirm SSH/remote desktop access and that the user has admin rights to restart services.

End of TODO
```

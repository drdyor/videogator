# Human TODO List

Things only you can do (signups, passwords, hardware setup).

---

## PRIORITY 1: Start the Video Server on TaylorsPC

The server code is at `C:\openclaw` on your Windows GPU machine but it never actually started.
The "Starting server" message was just an `echo` in the batch file - `python main.py` either
didn't run or crashed silently.

### Step-by-step on TaylorsPC (PowerShell):

HUMAN TODO — Video server restart & validation

1) Kill the locked video server process (requires Administrator)

Open an elevated PowerShell (Run as Administrator) and run:

```powershell
# Kill the process holding port 8001 (replace PID if different)
taskkill /PID 45680 /F
```

2) Start the updated video server in the venv

```powershell
cd C:\Users\Forre\videogator\video-server
.\venv\Scripts\activate
python -m uvicorn main:app --host 0.0.0.0 --port 8001
```

3) Verify health and dependencies

```powershell
Invoke-RestMethod -Uri "http://localhost:8001/health"
# If /diagnose exists:
Invoke-RestMethod -Uri "http://localhost:8001/diagnose"
```

4) Run a minimal smoke generate and poll status

```powershell
$body = @{
	prompt = "smoke test"
	model = "modelscope"
	width = 256
	height = 256
	num_frames = 9
	num_inference_steps = 10
	guidance_scale = 4.0
	fps = 12
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:8001/generate" -Method Post -Body $body -ContentType "application/json"
$response

# Poll status
Invoke-RestMethod -Uri "http://localhost:8001/status/$($response.job_id)"
```

5) If job fails with OOM

- Inspect `/status/<job_id>` for `error_suggestion` (UI will surface it).
- The server will automatically attempt one retry with reduced frames/resolution; check if job completed after fallback.
- If still failing, collect full traceback from the running uvicorn console and save logs.

6) Verify output upload & DB

- Confirm generated file at `http://localhost:8001/output/<filename>` (or R2 upload if configured).
- Check Node worker / DB records for the job id to confirm R2/Supabase persistence.

7) Helpful notes

- If you cannot kill the PID from PowerShell, open Task Manager → Details → find the PID and End Task (requires Admin).
- Consider using a process supervisor (pm2, NSSM, or Windows Service) to make restarts easier.
- If `/diagnose` reports missing packages, activate the venv and run:

```powershell
cd C:\Users\Forre\videogator\video-server
.\venv\Scripts\activate
pip install diffusers accelerate transformers torch
```

End of TODO


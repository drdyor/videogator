/**
 * VideoGator Stitch Client
 * Drop this into your Vercel/Next.js app.
 * 
 * Env vars needed on Vercel:
 *   STITCH_WORKER_URL=http://your-machine-ip:8000   (or ngrok/Cloudflare tunnel URL)
 *   STITCH_WORKER_KEY=your-api-key-matching-worker
 */

const WORKER_URL = process.env.STITCH_WORKER_URL;
const WORKER_KEY = process.env.STITCH_WORKER_KEY;

// Validate required env vars at module load time
if (!WORKER_URL) {
  throw new Error("Missing required env var: STITCH_WORKER_URL. Please set it in your Vercel project settings.");
}

if (!WORKER_KEY) {
  throw new Error("Missing required env var: STITCH_WORKER_KEY. Please set it in your Vercel project settings.");
}

type Transition = "none" | "fade";

interface StitchRequest {
  clips: string[];           // Public URLs to your generated video clips
  transition?: Transition;
  fade_duration?: number;    // seconds, default 0.5
  output_format?: "mp4";
  job_id?: string;           // Optional custom ID
}

interface StitchJob {
  job_id: string;
  status: "queued" | "downloading" | "normalizing" | "stitching" | "done" | "error";
  output_url?: string;
  duration?: number;
  error?: string;
}

const workerHeaders = {
  "Content-Type": "application/json",
  "x-api-key": WORKER_KEY,
};

/** Kick off a stitch job. Returns immediately with a job_id. */
export async function startStitch(req: StitchRequest): Promise<StitchJob> {
  const res = await fetch(`${WORKER_URL}/stitch`, {
    method: "POST",
    headers: workerHeaders,
    body: JSON.stringify(req),
  });
  if (!res.ok) throw new Error(`Stitch worker error: ${await res.text()}`);
  return res.json();
}

/** Poll job status. */
export async function getStitchStatus(jobId: string): Promise<StitchJob> {
  const res = await fetch(`${WORKER_URL}/status/${jobId}`, { headers: workerHeaders });
  if (!res.ok) throw new Error(`Status check failed: ${await res.text()}`);
  return res.json();
}

/** 
 * Poll until done, then return a proxied download URL.
 * Call this from a Next.js API route, not client-side (exposes worker key).
 */
export async function stitchAndWait(
  req: StitchRequest,
  pollIntervalMs = 2000,
  timeoutMs = 300_000
): Promise<{ downloadUrl: string; duration: number }> {
  const job = await startStitch(req);
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, pollIntervalMs));
    const status = await getStitchStatus(job.job_id);

    if (status.status === "done" && status.output_url) {
      return {
        downloadUrl: `${WORKER_URL}${status.output_url}`,
        duration: status.duration ?? 0,
      };
    }

    if (status.status === "error") {
      throw new Error(`Stitch job failed: ${status.error}`);
    }
  }

  throw new Error("Stitch job timed out");
}

/** Download the final video blob (call from server-side proxy route). */
export async function downloadStitchedVideo(jobId: string): Promise<ArrayBuffer> {
  const res = await fetch(`${WORKER_URL}/download/${jobId}`, { headers: workerHeaders });
  if (!res.ok) throw new Error(`Download failed: ${await res.text()}`);
  return res.arrayBuffer();
}

/** Clean up a job's output from the worker disk. */
export async function deleteStitchJob(jobId: string): Promise<void> {
  await fetch(`${WORKER_URL}/job/${jobId}`, { method: "DELETE", headers: workerHeaders });
}


// ---------------------------------------------------------------------------
// Example: Next.js API Route  (app/api/stitch/route.ts)
// ---------------------------------------------------------------------------
//
// import { NextRequest, NextResponse } from "next/server";
// import { stitchAndWait } from "@/lib/stitchClient";
//
// export async function POST(req: NextRequest) {
//   const { clips, transition } = await req.json();
//
//   try {
//     const { downloadUrl, duration } = await stitchAndWait({ clips, transition });
//     return NextResponse.json({ downloadUrl, duration });
//   } catch (err: any) {
//     return NextResponse.json({ error: err.message }, { status: 500 });
//   }
// }

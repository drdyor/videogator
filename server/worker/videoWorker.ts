import { Worker, Job } from "bullmq";
import Redis from "ioredis";
import axios from "axios";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { eq } from "drizzle-orm";
import * as db from "../db";
import { jobs } from "../../drizzle/schema";
import { setJobStatusCache } from "../_core/queue";

const redis = new Redis(process.env.REDIS_URL ?? "", {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

const r2 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
  },
});

const FFMPEG_SERVER_URL = process.env.FFMPEG_SERVER_URL ?? "";
const COMFYUI_URL = process.env.COMFYUI_URL ?? "";
const R2_BUCKET = process.env.R2_BUCKET ?? "";
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL ?? "";

type Operation = {
  type: "edit" | "generate";
  action?: string;
  params?: Record<string, unknown>;
};

export const videoWorker = new Worker(
  "video-generation",
  async (job: Job) => {
    const { jobId, operations, userId, inputUrl } = job.data as {
      jobId: string;
      operations: Operation[];
      userId: number;
      inputUrl: string;
    };

    let currentUrl = inputUrl;
    const stepResults: string[] = [];

    for (let i = 0; i < operations.length; i += 1) {
      const op = operations[i];

      await db.updateJob(jobId, {
        currentStep: i,
        status: "processing",
        updatedAt: new Date(),
      });
      await setJobStatusCache(jobId, {
        status: "processing",
        currentStep: i,
        jobId,
      });

      if (op.type === "edit") {
        const result = await processFFmpeg(currentUrl, op.action ?? "", op.params ?? {});
        currentUrl = result.url;
        stepResults.push(result.url);
        continue;
      }

      if (op.type === "generate") {
        const result = await processGeneration(currentUrl, op, jobId);
        currentUrl = result.url;
        stepResults.push(result.url);
      }
    }

    await db.updateJob(jobId, {
      status: "completed",
      outputUrl: currentUrl,
      stepResults: JSON.stringify(stepResults),
      completedAt: new Date(),
    });
    await setJobStatusCache(jobId, {
      status: "completed",
      jobId,
      outputUrl: currentUrl,
      stepResults,
    });

    return { outputUrl: currentUrl };
  },
  {
    connection: redis,
    concurrency: 1,
  }
);

async function processFFmpeg(inputUrl: string, action: string, params: Record<string, unknown>) {
  if (!FFMPEG_SERVER_URL) {
    throw new Error("FFMPEG_SERVER_URL is not configured");
  }
  const response = await axios.post(
    `${FFMPEG_SERVER_URL}/${action}`,
    { video_url: inputUrl, ...params },
    { timeout: 60_000 }
  );

  if (response.data?.error) {
    throw new Error(response.data.error);
  }

  return { url: response.data.url as string };
}

async function processGeneration(_inputUrl: string, op: Operation, jobId: string) {
  if (!COMFYUI_URL) {
    throw new Error("COMFYUI_URL is not configured");
  }
  if (!R2_BUCKET || !R2_PUBLIC_URL) {
    throw new Error("R2 storage is not configured");
  }

  const prompt = typeof op.params?.prompt === "string" ? op.params.prompt : "";
  const negativePrompt =
    typeof op.params?.negativePrompt === "string" ? op.params.negativePrompt : "";

  const workflow = {
    "1": {
      inputs: {
        width: 848,
        height: 480,
        length: 65,
        positive: prompt,
        negative: negativePrompt,
        steps: 30,
        cfg: 7,
        seed: Math.floor(Math.random() * 1_000_000),
      },
      class_type: "HunyuanVideoSampler",
    },
    "2": {
      inputs: { filename_prefix: "uvgo", images: ["1", 0] },
      class_type: "SaveImage",
    },
  };

  const queueRes = await axios.post(`${COMFYUI_URL}/prompt`, {
    prompt: workflow,
    client_id: `uvgo-${jobId}`,
  });

  const promptId = queueRes.data.prompt_id as string;
  const startTime = Date.now();

  while (Date.now() - startTime < 600_000) {
    await new Promise(resolve => setTimeout(resolve, 3000));
    const historyRes = await axios.get(`${COMFYUI_URL}/history/${promptId}`);
    const history = historyRes.data;

    if (history[promptId]) {
      const outputs = history[promptId].outputs ?? {};
      for (const nodeId of Object.keys(outputs)) {
        const nodeOutput = outputs[nodeId];
        const files = nodeOutput.gifs ?? nodeOutput.images;
        if (files && files.length > 0) {
          const filename = files[0].filename as string;
          const videoRes = await axios.get(
            `${COMFYUI_URL}/view?filename=${filename}&type=output`,
            { responseType: "arraybuffer" }
          );

          const key = `generated/${Date.now()}-${filename}`;
          await r2.send(
            new PutObjectCommand({
              Bucket: R2_BUCKET,
              Key: key,
              Body: videoRes.data,
              ContentType: "video/mp4",
            })
          );

          return { url: `${R2_PUBLIC_URL}/${key}` };
        }
      }
    }
  }

  throw new Error("Generation timeout after 10 minutes");
}

videoWorker.on("failed", async (job, err) => {
  if (!job) return;
  await db.updateJob(job.data.jobId, {
    status: "failed",
    error: err.message,
  });
  await db.updateJob(job.data.jobId, {
    updatedAt: new Date(),
  });
  await setJobStatusCache(job.data.jobId, {
    status: "failed",
    jobId: job.data.jobId,
    error: err.message,
  });
});

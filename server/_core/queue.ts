import Redis from "ioredis";

let redisClient: Redis | null = null;

export function getRedis() {
  if (!process.env.REDIS_URL) return null;
  if (!redisClient) {
    redisClient = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });
  }
  return redisClient;
}

export async function setJobStatusCache(jobId: string, payload: unknown, ttlSeconds = 3600) {
  const client = getRedis();
  if (!client) return;
  await client.setex(`status:${jobId}`, ttlSeconds, JSON.stringify(payload));
}

export async function getJobStatusCache(jobId: string) {
  const client = getRedis();
  if (!client) return null;
  const cached = await client.get(`status:${jobId}`);
  return cached ? JSON.parse(cached) : null;
}

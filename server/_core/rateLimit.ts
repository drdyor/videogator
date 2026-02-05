import { TRPCError } from "@trpc/server";
import Redis from "ioredis";

let redis: Redis | null = null;

function getRedis() {
  if (!process.env.REDIS_URL) return null;
  if (!redis) {
    redis = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });
  }
  return redis;
}

export async function rateLimit(identifier: string, limit: number = 10) {
  const client = getRedis();
  if (!client) return { remaining: limit };

  const key = `ratelimit:${identifier}`;
  const current = await client.incr(key);
  if (current === 1) {
    await client.expire(key, 60);
  }

  if (current > limit) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: "Rate limit exceeded",
    });
  }

  return { remaining: Math.max(limit - current, 0) };
}

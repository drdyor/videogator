// api/index.ts
import "dotenv/config";
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

// server/routers.ts
import { z as z2 } from "zod";
import { Queue } from "bullmq";
import Redis3 from "ioredis";
import crypto from "crypto";

// server/_core/queue.ts
import Redis from "ioredis";
var redisClient = null;
function getRedis() {
  if (!process.env.REDIS_URL) return null;
  if (!redisClient) {
    redisClient = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false
    });
  }
  return redisClient;
}
async function setJobStatusCache(jobId, payload, ttlSeconds = 3600) {
  const client = getRedis();
  if (!client) return;
  await client.setex(`status:${jobId}`, ttlSeconds, JSON.stringify(payload));
}
async function getJobStatusCache(jobId) {
  const client = getRedis();
  if (!client) return null;
  const cached = await client.get(`status:${jobId}`);
  return cached ? JSON.parse(cached) : null;
}

// shared/const.ts
var COOKIE_NAME = "app_session_id";
var ONE_YEAR_MS = 1e3 * 60 * 60 * 24 * 365;
var UNAUTHED_ERR_MSG = "Please login (10001)";
var NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";
var DEFAULT_GPU_HOURLY_CENTS = 22;
var FEATURE_FLAG_KEYS = [
  "feat:generate:hunyuan",
  "feat:generate:ltx",
  "feat:edit:trim",
  "feat:edit:split",
  "feat:edit:merge",
  "feat:edit:upscale",
  "feat:pharma",
  "infra:gpu:primary",
  "infra:byok"
];
var DEFAULT_FEATURE_FLAGS = {
  "feat:generate:hunyuan": {
    enabled: true,
    description: "Primary text-to-video generation (Hunyuan)."
  },
  "feat:generate:ltx": {
    enabled: true,
    description: "Fallback text-to-video generation (LTX)."
  },
  "feat:edit:trim": {
    enabled: true,
    description: "Trim video segments (CPU)."
  },
  "feat:edit:split": {
    enabled: true,
    description: "Split video into segments (CPU)."
  },
  "feat:edit:merge": {
    enabled: true,
    description: "Merge multiple videos (CPU)."
  },
  "feat:edit:upscale": {
    enabled: true,
    description: "Upscale video resolution (GPU)."
  },
  "feat:pharma": {
    enabled: true,
    description: "Molecular rendering pipeline (pharma)."
  },
  "infra:gpu:primary": {
    enabled: true,
    description: "Primary GPU worker availability."
  },
  "infra:byok": {
    enabled: false,
    description: "Bring-your-own-key fallback mode."
  }
};
var PRICING_RULE_KEYS = [
  "trim",
  "split",
  "merge",
  "generate",
  "upscale"
];
var DEFAULT_PRICING_RULES = {
  trim: { costCents: 0, priceCents: 0 },
  split: { costCents: 1, priceCents: 5 },
  merge: { costCents: 0, priceCents: 0 },
  generate: { costCents: 5, priceCents: 25 },
  upscale: { costCents: 8, priceCents: 40 }
};

// server/_core/cookies.ts
function isSecureRequest(req) {
  if (req?.protocol === "https") return true;
  const forwardedProto = req?.headers?.["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto) ? forwardedProto : String(forwardedProto).split(",");
  return protoList.some((proto) => proto.trim().toLowerCase() === "https");
}
function getSessionCookieOptions(req) {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: isSecureRequest(req)
  };
}

// server/_core/systemRouter.ts
import { z } from "zod";

// server/_core/notification.ts
import { TRPCError } from "@trpc/server";

// server/_core/env.ts
var ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? ""
};

// server/_core/notification.ts
var TITLE_MAX_LENGTH = 1200;
var CONTENT_MAX_LENGTH = 2e4;
var trimValue = (value) => value.trim();
var isNonEmptyString = (value) => typeof value === "string" && value.trim().length > 0;
var buildEndpointUrl = (baseUrl) => {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(
    "webdevtoken.v1.WebDevService/SendNotification",
    normalizedBase
  ).toString();
};
var validatePayload = (input) => {
  if (!isNonEmptyString(input.title)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification title is required."
    });
  }
  if (!isNonEmptyString(input.content)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification content is required."
    });
  }
  const title = trimValue(input.title);
  const content = trimValue(input.content);
  if (title.length > TITLE_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`
    });
  }
  if (content.length > CONTENT_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`
    });
  }
  return { title, content };
};
async function notifyOwner(payload) {
  const { title, content } = validatePayload(payload);
  if (!ENV.forgeApiUrl) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service URL is not configured."
    });
  }
  if (!ENV.forgeApiKey) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service API key is not configured."
    });
  }
  const endpoint = buildEndpointUrl(ENV.forgeApiUrl);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
        "content-type": "application/json",
        "connect-protocol-version": "1"
      },
      body: JSON.stringify({ title, content })
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(
        `[Notification] Failed to notify owner (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
      );
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Notification] Error calling notification service:", error);
    return false;
  }
}

// server/_core/trpc.ts
import { initTRPC, TRPCError as TRPCError3 } from "@trpc/server";

// server/_core/rateLimit.ts
import { TRPCError as TRPCError2 } from "@trpc/server";
import Redis2 from "ioredis";
var redis = null;
function getRedis2() {
  if (!process.env.REDIS_URL) return null;
  if (!redis) {
    redis = new Redis2(process.env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false
    });
  }
  return redis;
}
async function rateLimit(identifier, limit = 10) {
  const client = getRedis2();
  if (!client) return { remaining: limit };
  const key = `ratelimit:${identifier}`;
  const current = await client.incr(key);
  if (current === 1) {
    await client.expire(key, 60);
  }
  if (current > limit) {
    throw new TRPCError2({
      code: "TOO_MANY_REQUESTS",
      message: "Rate limit exceeded"
    });
  }
  return { remaining: Math.max(limit - current, 0) };
}

// server/_core/trpc.ts
import superjson from "superjson";
var t = initTRPC.context().create({
  transformer: superjson
});
var router = t.router;
var publicProcedure = t.procedure;
var requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new TRPCError3({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  await rateLimit(String(ctx.user.id), 20);
  return next({
    ctx: {
      ...ctx,
      user: ctx.user
    }
  });
});
var protectedProcedure = t.procedure.use(requireUser);
var adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user || ctx.user.role !== "admin") {
      throw new TRPCError3({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({
      ctx: {
        ...ctx,
        user: ctx.user
      }
    });
  })
);

// server/_core/systemRouter.ts
var systemRouter = router({
  health: publicProcedure.input(
    z.object({
      timestamp: z.number().min(0, "timestamp cannot be negative")
    })
  ).query(() => ({
    ok: true
  })),
  notifyOwner: adminProcedure.input(
    z.object({
      title: z.string().min(1, "title is required"),
      content: z.string().min(1, "content is required")
    })
  ).mutation(async ({ input }) => {
    const delivered = await notifyOwner(input);
    return {
      success: delivered
    };
  })
});

// server/routers.ts
import { TRPCError as TRPCError4 } from "@trpc/server";

// server/_core/alerts.ts
import { createHmac } from "crypto";

// server/db.ts
import { eq, desc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

// drizzle/schema.ts
import { integer, pgEnum, pgTable, text, timestamp, varchar, serial } from "drizzle-orm/pg-core";
var roleEnum = pgEnum("role", ["user", "admin"]);
var users = pgTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: serial("id").primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: roleEnum("role").default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
  encryptedApiKeys: text("encryptedApiKeys")
});
var projectStatusEnum = pgEnum("project_status", ["draft", "generating", "completed", "failed"]);
var projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  serviceId: varchar("serviceId", { length: 64 }).notNull(),
  status: projectStatusEnum("status").default("draft").notNull(),
  prompt: text("prompt"),
  settings: text("settings"),
  // JSON string for service-specific settings
  videoUrl: varchar("videoUrl", { length: 512 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull()
});
var jobStatusEnum = pgEnum("job_status", ["queued", "processing", "completed", "failed"]);
var jobs = pgTable("jobs", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: integer("userId").notNull(),
  status: jobStatusEnum("status").default("queued").notNull(),
  inputUrl: text("inputUrl").notNull(),
  operations: text("operations").notNull(),
  // JSON string
  currentStep: integer("currentStep").default(0).notNull(),
  outputUrl: text("outputUrl"),
  stepResults: text("stepResults"),
  error: text("error"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt")
});
var categoryEnum = pgEnum("category", ["general", "pharma", "specialized"]);
var services = pgTable("services", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  category: categoryEnum("category").default("general").notNull(),
  description: text("description"),
  capabilities: text("capabilities"),
  // JSON array of capability strings
  pricing: varchar("pricing", { length: 255 }),
  website: varchar("website", { length: 512 }),
  icon: varchar("icon", { length: 512 }),
  createdAt: timestamp("createdAt").defaultNow().notNull()
});
var pharmaTemplates = pgTable("pharmaTemplates", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 128 }).notNull(),
  // e.g., "ligand-binding", "antibody-conjugate"
  parameters: text("parameters"),
  // JSON schema for configurable parameters
  previewImage: varchar("previewImage", { length: 512 }),
  createdAt: timestamp("createdAt").defaultNow().notNull()
});
var featureFlags = pgTable("featureFlags", {
  key: varchar("key", { length: 128 }).primaryKey(),
  enabled: integer("enabled").default(1).notNull(),
  description: text("description"),
  updatedAt: timestamp("updatedAt").defaultNow().notNull()
});
var pricingRules = pgTable("pricingRules", {
  key: varchar("key", { length: 64 }).primaryKey(),
  costCents: integer("costCents").default(0).notNull(),
  priceCents: integer("priceCents").default(0).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull()
});
var adminSettings = pgTable("adminSettings", {
  key: varchar("key", { length: 64 }).primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull()
});
var alertLevelEnum = pgEnum("alert_level", ["info", "warning", "critical"]);
var alerts = pgTable("alerts", {
  id: serial("id").primaryKey(),
  level: alertLevelEnum("level").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  jobId: varchar("jobId", { length: 64 }),
  userId: integer("userId"),
  error: text("error"),
  action: text("action"),
  costCents: integer("costCents"),
  createdAt: timestamp("createdAt").defaultNow().notNull()
});
var videoStatusEnum = pgEnum("video_status", ["processing", "completed", "failed"]);
var videos = pgTable("videos", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  jobId: varchar("jobId", { length: 64 }),
  prompt: text("prompt").notNull(),
  negativePrompt: text("negativePrompt"),
  model: varchar("model", { length: 50 }).notNull(),
  width: integer("width"),
  height: integer("height"),
  numFrames: integer("numFrames"),
  fps: integer("fps"),
  seed: integer("seed"),
  videoUrl: text("videoUrl").notNull(),
  thumbnailUrl: text("thumbnailUrl"),
  durationSeconds: integer("durationSeconds"),
  fileSizeBytes: integer("fileSizeBytes"),
  status: videoStatusEnum("status").default("completed").notNull(),
  isPublic: integer("isPublic").default(0).notNull(),
  metadata: text("metadata"),
  // JSON for additional data
  createdAt: timestamp("createdAt").defaultNow().notNull()
});
var savedPrompts = pgTable("savedPrompts", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  prompt: text("prompt").notNull(),
  negativePrompt: text("negativePrompt"),
  model: varchar("model", { length: 50 }),
  settings: text("settings"),
  // JSON for generation settings
  isFavorite: integer("isFavorite").default(0).notNull(),
  useCount: integer("useCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull()
});

// server/db.ts
var _db = null;
async function getDb() {
  if (!_db) {
    if (!process.env.DATABASE_URL) {
      console.error("[Database] DATABASE_URL is not set! DB operations will fail.");
      return null;
    }
    try {
      const client = postgres(process.env.DATABASE_URL);
      _db = drizzle(client);
      console.log("[Database] Connection initialized successfully");
    } catch (error) {
      console.error("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}
async function upsertUser(user) {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }
  try {
    const values = {
      openId: user.openId
    };
    const updateSet = {};
    const textFields = ["name", "email", "loginMethod"];
    const assignNullable = (field) => {
      const value = user[field];
      if (value === void 0) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== void 0) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== void 0) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }
    if (!values.lastSignedIn) {
      values.lastSignedIn = /* @__PURE__ */ new Date();
    }
    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = /* @__PURE__ */ new Date();
    }
    await db.insert(users).values(values).onConflictDoUpdate({
      target: users.openId,
      set: updateSet
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}
async function getUserByOpenId(openId) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return void 0;
  }
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function getUserProjects(userId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(projects).where(eq(projects.userId, userId)).orderBy(desc(projects.createdAt));
}
async function getProjectById(projectId) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function createProject(userId, data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(projects).values({ ...data, userId });
  return result;
}
async function updateProject(projectId, data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(projects).set(data).where(eq(projects.id, projectId));
}
async function deleteProject(projectId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(projects).where(eq(projects.id, projectId));
}
async function getAllProjectsForAdmin() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(projects).orderBy(desc(projects.createdAt));
}
async function createJob(job) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(jobs).values(job);
}
async function getJobById(jobId) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function getAllServices() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(services);
}
async function getServiceById(serviceId) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(services).where(eq(services.id, serviceId)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function getPharmaTemplates() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(pharmaTemplates);
}
async function getPharmaTemplateById(templateId) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(pharmaTemplates).where(eq(pharmaTemplates.id, templateId)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function getAllFeatureFlags() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(featureFlags);
}
async function getFeatureFlagValue(key) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(featureFlags).where(eq(featureFlags.key, key)).limit(1);
  if (result.length === 0) return void 0;
  return Boolean(result[0].enabled);
}
async function upsertFeatureFlag(flag) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(featureFlags).values(flag).onConflictDoUpdate({
    target: featureFlags.key,
    set: {
      enabled: flag.enabled,
      description: flag.description ?? null
    }
  });
}
async function getAllPricingRules() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(pricingRules);
}
async function upsertPricingRule(rule) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(pricingRules).values(rule).onConflictDoUpdate({
    target: pricingRules.key,
    set: {
      costCents: rule.costCents,
      priceCents: rule.priceCents
    }
  });
}
async function getAllAdminSettings() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(adminSettings);
}
async function upsertAdminSetting(setting) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(adminSettings).values(setting).onConflictDoUpdate({
    target: adminSettings.key,
    set: {
      value: setting.value
    }
  });
}
async function createAlert(alert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(alerts).values(alert);
}
async function listAlerts(limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(alerts).orderBy(desc(alerts.createdAt)).limit(limit);
}
async function getUserVideos(userId, limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(videos).where(eq(videos.userId, userId)).orderBy(desc(videos.createdAt)).limit(limit).offset(offset);
}
async function getVideoById(videoId) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(videos).where(eq(videos.id, videoId)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function updateVideo(videoId, data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(videos).set(data).where(eq(videos.id, videoId));
}
async function deleteVideo(videoId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(videos).where(eq(videos.id, videoId));
}
async function getPublicVideos(limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(videos).where(eq(videos.isPublic, 1)).orderBy(desc(videos.createdAt)).limit(limit);
}
async function getUserVideoCount(userId) {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql`count(*)` }).from(videos).where(eq(videos.userId, userId));
  return result[0]?.count ?? 0;
}
async function createSavedPrompt(prompt) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(savedPrompts).values(prompt).returning();
  return result[0];
}
async function getUserSavedPrompts(userId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(savedPrompts).where(eq(savedPrompts.userId, userId)).orderBy(desc(savedPrompts.isFavorite), desc(savedPrompts.useCount), desc(savedPrompts.createdAt));
}
async function getSavedPromptById(promptId) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(savedPrompts).where(eq(savedPrompts.id, promptId)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function updateSavedPrompt(promptId, data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(savedPrompts).set(data).where(eq(savedPrompts.id, promptId));
}
async function incrementPromptUseCount(promptId) {
  const db = await getDb();
  if (!db) return;
  await db.update(savedPrompts).set({ useCount: sql`${savedPrompts.useCount} + 1` }).where(eq(savedPrompts.id, promptId));
}
async function deleteSavedPrompt(promptId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(savedPrompts).where(eq(savedPrompts.id, promptId));
}

// server/_core/alerts.ts
var DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL?.trim();
var TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN?.trim();
var TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID?.trim();
var AlertService = class {
  async send(alert) {
    const timestamp2 = alert.timestamp ?? Date.now();
    await createAlert({
      level: alert.level,
      title: alert.title,
      message: alert.message,
      jobId: alert.jobId ?? null,
      userId: alert.userId ?? null,
      error: alert.error ?? null,
      action: alert.action ?? null,
      costCents: alert.costCents ?? null,
      createdAt: new Date(timestamp2)
    });
    if (alert.level === "critical") {
      await Promise.all([
        this.sendDiscord(alert, 16711680),
        this.sendTelegram(alert)
      ]);
      return;
    }
    if (alert.level === "warning") {
      await this.sendDiscord(alert, 16755200);
    }
  }
  async sendDiscord(alert, color) {
    if (!DISCORD_WEBHOOK_URL) return;
    const fields = [
      { name: "Job ID", value: alert.jobId || "N/A", inline: true },
      { name: "User", value: alert.userId ? String(alert.userId) : "N/A", inline: true },
      { name: "Time", value: new Date(alert.timestamp ?? Date.now()).toLocaleTimeString(), inline: true }
    ];
    if (alert.costCents !== void 0) {
      fields.push({
        name: "Cost Impact",
        value: `$${(alert.costCents / 100).toFixed(2)}`,
        inline: true
      });
    }
    if (alert.action) {
      fields.push({ name: "Suggested Action", value: alert.action, inline: false });
    }
    const embed = {
      title: `${alert.level.toUpperCase()}: ${alert.title}`,
      description: alert.message,
      color,
      fields,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      footer: { text: "UVGO Mission Control" }
    };
    await fetch(DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ embeds: [embed] })
    });
  }
  async sendTelegram(alert) {
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) return;
    const emoji = alert.level === "critical" ? "\u{1F6A8}" : "\u26A0\uFE0F";
    const text2 = [
      `${emoji} *${alert.title}*`,
      "```",
      alert.message,
      "```",
      alert.jobId ? `Job: \`${alert.jobId}\`` : "",
      alert.userId ? `User: ${alert.userId}` : "",
      alert.action ? `
\u{1F527} *Action:* ${alert.action}` : ""
    ].filter(Boolean).join("\n");
    await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: text2,
          parse_mode: "Markdown",
          disable_notification: alert.level !== "critical"
        })
      }
    );
  }
};
var alerts2 = new AlertService();

// server/mockData.ts
var mockServices = [
  {
    id: "runway",
    name: "Runway ML",
    category: "general",
    description: "AI-powered video generation and editing. Create stunning videos with simple text prompts.",
    capabilities: JSON.stringify(["Text-to-video", "Video editing", "Motion tracking", "Real-time generation"]),
    pricing: "Pay-as-you-go",
    website: "https://runwayml.com",
    icon: "\u{1F3AC}"
  },
  {
    id: "pika",
    name: "Pika",
    category: "general",
    description: "Next-generation video generation platform with advanced AI capabilities.",
    capabilities: JSON.stringify(["Text-to-video", "Image-to-video", "Video editing", "Style transfer"]),
    pricing: "Free tier + Pro",
    website: "https://pika.art",
    icon: "\u2728"
  },
  {
    id: "luma",
    name: "Luma AI",
    category: "general",
    description: "Create photorealistic videos from text and images with physics-based rendering.",
    capabilities: JSON.stringify(["Text-to-video", "Image-to-video", "3D rendering", "Physics simulation"]),
    pricing: "Beta access",
    website: "https://lumalabs.ai",
    icon: "\u{1F31F}"
  },
  {
    id: "haiper",
    name: "Haiper",
    category: "general",
    description: "High-fidelity video generation with advanced motion control.",
    capabilities: JSON.stringify(["Text-to-video", "Motion control", "Video enhancement", "Batch processing"]),
    pricing: "Free credits + Premium",
    website: "https://haiper.ai",
    icon: "\u{1F3A5}"
  },
  {
    id: "stable-video",
    name: "Stable Video Diffusion",
    category: "general",
    description: "Open-source video generation model for custom implementations.",
    capabilities: JSON.stringify(["Image-to-video", "Fine-tuning", "Custom models", "API access"]),
    pricing: "Open source",
    website: "https://stability.ai",
    icon: "\u{1F527}"
  },
  {
    id: "synthesia",
    name: "Synthesia",
    category: "specialized",
    description: "AI video creation with digital avatars and multilingual support.",
    capabilities: JSON.stringify(["Avatar videos", "Multilingual", "Corporate videos", "Training content"]),
    pricing: "Enterprise",
    website: "https://synthesia.io",
    icon: "\u{1F464}"
  },
  {
    id: "pharma-pro",
    name: "Pharma Pro Visualizer",
    category: "pharma",
    description: "Specialized molecular animation and drug visualization for pharmaceutical companies.",
    capabilities: JSON.stringify(["Molecular binding", "Protein dynamics", "Drug interactions", "Scientific accuracy"]),
    pricing: "Enterprise - $20k/month",
    website: "https://pharma-pro.example.com",
    icon: "\u{1F9EC}"
  }
];
var mockPharmaTemplates = [
  {
    name: "Ligand-Receptor Binding",
    description: "Visualize how small molecules bind to protein receptors with accurate molecular dynamics.",
    category: "ligand-binding",
    parameters: JSON.stringify({
      proteinName: { type: "string", label: "Protein Name", default: "EGFR" },
      ligandName: { type: "string", label: "Ligand Name", default: "Gefitinib" },
      bindingAffinity: { type: "number", label: "Binding Affinity (nM)", default: 2.3 },
      speed: { type: "number", label: "Animation Speed", min: 0.5, max: 2, default: 1 },
      cameraAngle: { type: "string", label: "Camera View", options: ["top", "side", "dynamic"] },
      ligandColor: { type: "color", label: "Ligand Color", default: "#FF6B6B" },
      proteinColor: { type: "color", label: "Protein Color", default: "#4ECDC4" }
    }),
    previewImage: "https://images.unsplash.com/photo-1576091160550-112173f7f869?w=400&h=300&fit=crop"
  },
  {
    name: "Antibody-Drug Conjugate",
    description: "Showcase antibody-drug conjugate (ADC) structure and mechanism of action.",
    category: "antibody-conjugate",
    parameters: JSON.stringify({
      antibodyType: { type: "string", label: "Antibody Type", default: "IgG1" },
      drugPayload: { type: "string", label: "Drug Payload", default: "Toxin" },
      linkerType: { type: "string", label: "Linker Type", options: ["cleavable", "non-cleavable"] },
      dac: { type: "number", label: "Drug-to-Antibody Ratio", min: 1, max: 8, default: 4 },
      rotationSpeed: { type: "number", label: "Rotation Speed", min: 0.5, max: 2, default: 1 },
      antibodyColor: { type: "color", label: "Antibody Color", default: "#9B59B6" },
      drugColor: { type: "color", label: "Drug Color", default: "#E74C3C" }
    }),
    previewImage: "https://images.unsplash.com/photo-1530026405186-532bc87b6b83?w=400&h=300&fit=crop"
  },
  {
    name: "Membrane Protein Dynamics",
    description: "Animate membrane protein interactions and conformational changes.",
    category: "membrane-dynamics",
    parameters: JSON.stringify({
      proteinName: { type: "string", label: "Protein Name", default: "GPCR" },
      membraneType: { type: "string", label: "Membrane Type", options: ["lipid-bilayer", "micelle"] },
      conformationStates: { type: "number", label: "Conformational States", min: 2, max: 5, default: 3 },
      transitionTime: { type: "number", label: "Transition Time (s)", min: 1, max: 10, default: 3 },
      proteinColor: { type: "color", label: "Protein Color", default: "#3498DB" },
      membraneColor: { type: "color", label: "Membrane Color", default: "#F39C12" }
    }),
    previewImage: "https://images.unsplash.com/photo-1579154204601-01d82b27d100?w=400&h=300&fit=crop"
  },
  {
    name: "mRNA Translation Process",
    description: "Visualize mRNA translation with ribosome dynamics and protein synthesis.",
    category: "mrna-translation",
    parameters: JSON.stringify({
      geneSequence: { type: "string", label: "Gene Name", default: "GFP" },
      ribosomeType: { type: "string", label: "Ribosome Type", options: ["80S", "70S"] },
      translationSpeed: { type: "number", label: "Translation Speed", min: 0.5, max: 2, default: 1 },
      showCodon: { type: "boolean", label: "Show Codon Sequence", default: true },
      mrnaColor: { type: "color", label: "mRNA Color", default: "#E67E22" },
      ribosomeColor: { type: "color", label: "Ribosome Color", default: "#1ABC9C" }
    }),
    previewImage: "https://images.unsplash.com/photo-1576091160550-112173f7f869?w=400&h=300&fit=crop"
  },
  {
    name: "Enzyme Catalysis Mechanism",
    description: "Demonstrate enzyme-substrate interactions and catalytic mechanisms.",
    category: "enzyme-catalysis",
    parameters: JSON.stringify({
      enzymeName: { type: "string", label: "Enzyme Name", default: "Trypsin" },
      substrateName: { type: "string", label: "Substrate Name", default: "Peptide" },
      catalyticSteps: { type: "number", label: "Catalytic Steps", min: 2, max: 6, default: 4 },
      stepDuration: { type: "number", label: "Step Duration (s)", min: 1, max: 5, default: 2 },
      enzymeColor: { type: "color", label: "Enzyme Color", default: "#C0392B" },
      substrateColor: { type: "color", label: "Substrate Color", default: "#27AE60" }
    }),
    previewImage: "https://images.unsplash.com/photo-1576091160550-112173f7f869?w=400&h=300&fit=crop"
  }
];

// server/routers.ts
var mockDataInitialized = false;
async function initializeMockData() {
  if (mockDataInitialized) return;
  mockDataInitialized = true;
  try {
    const existingServices = await getAllServices();
    if (existingServices.length === 0) {
      const dbInstance = await getDb();
      if (dbInstance) {
        for (const service of mockServices) {
          try {
            await dbInstance.insert(services).values(service);
          } catch (e) {
          }
        }
        for (const template of mockPharmaTemplates) {
          try {
            await dbInstance.insert(pharmaTemplates).values(template);
          } catch (e) {
          }
        }
      }
    }
  } catch (error) {
    console.error("Error initializing mock data:", error);
  }
}
async function initializeAdminDefaults() {
  try {
    const existingFlags = await getAllFeatureFlags();
    const existingFlagKeys = new Set(existingFlags.map((flag) => flag.key));
    for (const key of FEATURE_FLAG_KEYS) {
      if (!existingFlagKeys.has(key)) {
        const defaults = DEFAULT_FEATURE_FLAGS[key];
        await upsertFeatureFlag({
          key,
          enabled: defaults.enabled ? 1 : 0,
          description: defaults.description
        });
      }
    }
    const existingPricing = await getAllPricingRules();
    const existingPricingKeys = new Set(existingPricing.map((rule) => rule.key));
    for (const key of PRICING_RULE_KEYS) {
      if (!existingPricingKeys.has(key)) {
        const defaults = DEFAULT_PRICING_RULES[key];
        await upsertPricingRule({
          key,
          costCents: defaults.costCents,
          priceCents: defaults.priceCents
        });
      }
    }
    const existingSettings = await getAllAdminSettings();
    if (!existingSettings.find((setting) => setting.key === "gpuHourlyCents")) {
      await upsertAdminSetting({
        key: "gpuHourlyCents",
        value: String(DEFAULT_GPU_HOURLY_CENTS)
      });
    }
  } catch (error) {
    console.error("Error initializing admin defaults:", error);
  }
}
initializeMockData().catch(console.error);
initializeAdminDefaults().catch(console.error);
var appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true
      };
    })
  }),
  video: router({
    create: protectedProcedure.input(z2.object({
      operations: z2.array(z2.any()),
      inputUrl: z2.string().optional()
    })).mutation(async ({ ctx, input }) => {
      const jobId = crypto.randomUUID();
      await createJob({
        id: jobId,
        userId: ctx.user.id,
        status: "queued",
        inputUrl: input.inputUrl ?? "",
        operations: JSON.stringify(input.operations),
        currentStep: 0
      });
      await setJobStatusCache(jobId, {
        status: "queued",
        jobId,
        currentStep: 0
      });
      const redis2 = new Redis3(process.env.REDIS_URL ?? "");
      const videoQueue = new Queue("video-generation", { connection: redis2 });
      await videoQueue.add("process-video", {
        jobId,
        operations: input.operations,
        userId: ctx.user.id,
        inputUrl: input.inputUrl ?? ""
      });
      return { jobId, status: "queued" };
    }),
    status: protectedProcedure.input(z2.object({ jobId: z2.string() })).query(async ({ input }) => {
      const cached = await getJobStatusCache(input.jobId);
      if (cached) {
        return cached;
      }
      const job = await getJobById(input.jobId);
      if (!job) {
        throw new TRPCError4({ code: "NOT_FOUND", message: "Job not found" });
      }
      await setJobStatusCache(input.jobId, job);
      return job;
    }),
    // Direct generation endpoint (bypasses queue for local server)
    generate: protectedProcedure.input(z2.object({
      prompt: z2.string(),
      negativePrompt: z2.string().optional(),
      model: z2.enum(["hunyuan-video", "mochi", "cogvideo", "modelscope", "stable-video-diffusion"]).optional(),
      width: z2.number().optional(),
      height: z2.number().optional(),
      numFrames: z2.number().optional(),
      numInferenceSteps: z2.number().optional(),
      guidanceScale: z2.number().optional(),
      seed: z2.number().optional(),
      fps: z2.number().optional(),
      imageUrl: z2.string().optional()
    })).mutation(async ({ input }) => {
      const VIDEO_SERVER_URL = process.env.VIDEO_SERVER_URL;
      if (!VIDEO_SERVER_URL) {
        throw new TRPCError4({
          code: "PRECONDITION_FAILED",
          message: "VIDEO_SERVER_URL is not configured. Please set up the local video server."
        });
      }
      try {
        const response = await fetch(`${VIDEO_SERVER_URL}/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: input.prompt,
            negative_prompt: input.negativePrompt ?? "",
            model: input.model ?? "hunyuan-video",
            width: input.width ?? 848,
            height: input.height ?? 480,
            num_frames: input.numFrames ?? 65,
            num_inference_steps: input.numInferenceSteps ?? 30,
            guidance_scale: input.guidanceScale ?? 7,
            seed: input.seed,
            fps: input.fps ?? 24,
            image_url: input.imageUrl
          })
        });
        if (!response.ok) {
          throw new Error(`Video server error: ${response.statusText}`);
        }
        const data = await response.json();
        return { jobId: data.job_id, status: data.status };
      } catch (error) {
        throw new TRPCError4({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to connect to video server"
        });
      }
    }),
    // Check video server health
    serverHealth: protectedProcedure.query(async () => {
      const VIDEO_SERVER_URL = process.env.VIDEO_SERVER_URL;
      if (!VIDEO_SERVER_URL) {
        return {
          available: false,
          error: "VIDEO_SERVER_URL not configured"
        };
      }
      try {
        const response = await fetch(`${VIDEO_SERVER_URL}/health`, {
          signal: AbortSignal.timeout(5e3)
        });
        const data = await response.json();
        return {
          available: true,
          ...data
        };
      } catch (error) {
        return {
          available: false,
          error: error instanceof Error ? error.message : "Failed to connect"
        };
      }
    })
  }),
  projects: router({
    list: protectedProcedure.query(
      ({ ctx }) => getUserProjects(ctx.user.id)
    ),
    get: protectedProcedure.input(z2.object({ id: z2.number() })).query(
      ({ input }) => getProjectById(input.id)
    ),
    create: protectedProcedure.input(z2.object({
      name: z2.string().min(1),
      description: z2.string().optional(),
      serviceId: z2.string(),
      prompt: z2.string().optional(),
      settings: z2.string().optional()
    })).mutation(
      ({ ctx, input }) => createProject(ctx.user.id, {
        name: input.name,
        description: input.description,
        serviceId: input.serviceId,
        prompt: input.prompt,
        settings: input.settings,
        status: "draft"
      })
    ),
    update: protectedProcedure.input(z2.object({
      id: z2.number(),
      name: z2.string().optional(),
      description: z2.string().optional(),
      status: z2.enum(["draft", "generating", "completed", "failed"]).optional(),
      prompt: z2.string().optional(),
      videoUrl: z2.string().optional()
    })).mutation(
      ({ input }) => updateProject(input.id, input)
    ),
    delete: protectedProcedure.input(z2.object({ id: z2.number() })).mutation(
      ({ input }) => deleteProject(input.id)
    )
  }),
  services: router({
    list: publicProcedure.query(async () => {
      await initializeMockData();
      const allServices = await getAllServices();
      const pharmaEnabled = await getFeatureFlagValue("feat:pharma");
      if (pharmaEnabled === false) {
        return allServices.filter((service) => service.category !== "pharma");
      }
      return allServices;
    }),
    get: publicProcedure.input(z2.object({ id: z2.string() })).query(async ({ input }) => {
      await initializeMockData();
      return getServiceById(input.id);
    })
  }),
  pharma: router({
    templates: publicProcedure.query(async () => {
      await initializeMockData();
      const pharmaEnabled = await getFeatureFlagValue("feat:pharma");
      if (pharmaEnabled === false) {
        throw new TRPCError4({
          code: "FORBIDDEN",
          message: "Pharma rendering is currently disabled."
        });
      }
      return getPharmaTemplates();
    }),
    template: publicProcedure.input(z2.object({ id: z2.number() })).query(async ({ input }) => {
      await initializeMockData();
      const pharmaEnabled = await getFeatureFlagValue("feat:pharma");
      if (pharmaEnabled === false) {
        throw new TRPCError4({
          code: "FORBIDDEN",
          message: "Pharma rendering is currently disabled."
        });
      }
      return getPharmaTemplateById(input.id);
    })
  }),
  admin: router({
    flags: router({
      list: adminProcedure.query(async () => {
        await initializeAdminDefaults();
        const flags = await getAllFeatureFlags();
        return flags.reduce((acc, flag) => {
          acc[flag.key] = { enabled: Boolean(flag.enabled), description: flag.description ?? null };
          return acc;
        }, {});
      }),
      update: adminProcedure.input(
        z2.object({
          key: z2.string().min(1),
          enabled: z2.boolean()
        })
      ).mutation(async ({ input }) => {
        await upsertFeatureFlag({
          key: input.key,
          enabled: input.enabled ? 1 : 0
        });
        return { success: true };
      })
    }),
    pricing: router({
      get: adminProcedure.query(async () => {
        await initializeAdminDefaults();
        const rules = await getAllPricingRules();
        const settings = await getAllAdminSettings();
        const gpuHourlySetting = settings.find((setting) => setting.key === "gpuHourlyCents");
        const pricing = rules.reduce((acc, rule) => {
          acc[rule.key] = { costCents: rule.costCents, priceCents: rule.priceCents };
          return acc;
        }, {});
        return {
          pricing,
          gpuHourlyCents: gpuHourlySetting ? Number(gpuHourlySetting.value) : DEFAULT_GPU_HOURLY_CENTS
        };
      }),
      update: adminProcedure.input(
        z2.object({
          key: z2.string().min(1),
          costCents: z2.number().int().nonnegative(),
          priceCents: z2.number().int().nonnegative()
        })
      ).mutation(async ({ input }) => {
        await upsertPricingRule({
          key: input.key,
          costCents: input.costCents,
          priceCents: input.priceCents
        });
        return { success: true };
      }),
      updateGpuHourly: adminProcedure.input(
        z2.object({
          gpuHourlyCents: z2.number().int().nonnegative()
        })
      ).mutation(async ({ input }) => {
        await upsertAdminSetting({
          key: "gpuHourlyCents",
          value: String(input.gpuHourlyCents)
        });
        return { success: true };
      })
    }),
    metrics: adminProcedure.query(async () => {
      const allProjects = await getAllProjectsForAdmin();
      const totals = { total: 0 };
      for (const project of allProjects) {
        totals.total += 1;
        totals[project.status] = (totals[project.status] ?? 0) + 1;
      }
      return {
        totals
      };
    }),
    alerts: router({
      list: adminProcedure.input(z2.object({ limit: z2.number().int().min(1).max(200).optional() }).optional()).query(async ({ input }) => {
        const limit = input?.limit ?? 50;
        return listAlerts(limit);
      }),
      test: adminProcedure.mutation(async ({ ctx }) => {
        await alerts2.send({
          level: "warning",
          title: "Test Alert",
          message: "This is a test alert from the admin panel.",
          userId: ctx.user.id,
          timestamp: Date.now(),
          action: "No action needed."
        });
        return { success: true };
      })
    })
  }),
  // Video gallery and management
  videos: router({
    list: protectedProcedure.input(z2.object({
      limit: z2.number().int().min(1).max(100).optional(),
      offset: z2.number().int().min(0).optional()
    }).optional()).query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 50;
      const offset = input?.offset ?? 0;
      const videos2 = await getUserVideos(ctx.user.id, limit, offset);
      const count = await getUserVideoCount(ctx.user.id);
      return { videos: videos2, total: count };
    }),
    get: protectedProcedure.input(z2.object({ id: z2.number() })).query(async ({ input }) => {
      const video = await getVideoById(input.id);
      if (!video) {
        throw new TRPCError4({ code: "NOT_FOUND", message: "Video not found" });
      }
      return video;
    }),
    delete: protectedProcedure.input(z2.object({ id: z2.number() })).mutation(async ({ ctx, input }) => {
      const video = await getVideoById(input.id);
      if (!video) {
        throw new TRPCError4({ code: "NOT_FOUND", message: "Video not found" });
      }
      if (video.userId !== ctx.user.id) {
        throw new TRPCError4({ code: "FORBIDDEN", message: "Not authorized to delete this video" });
      }
      await deleteVideo(input.id);
      return { success: true };
    }),
    update: protectedProcedure.input(z2.object({
      id: z2.number(),
      isPublic: z2.boolean().optional()
    })).mutation(async ({ ctx, input }) => {
      const video = await getVideoById(input.id);
      if (!video) {
        throw new TRPCError4({ code: "NOT_FOUND", message: "Video not found" });
      }
      if (video.userId !== ctx.user.id) {
        throw new TRPCError4({ code: "FORBIDDEN", message: "Not authorized to update this video" });
      }
      await updateVideo(input.id, {
        isPublic: input.isPublic ? 1 : 0
      });
      return { success: true };
    }),
    public: publicProcedure.input(z2.object({
      limit: z2.number().int().min(1).max(100).optional()
    }).optional()).query(async ({ input }) => {
      const limit = input?.limit ?? 20;
      return getPublicVideos(limit);
    })
  }),
  // Saved prompts library
  prompts: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getUserSavedPrompts(ctx.user.id);
    }),
    get: protectedProcedure.input(z2.object({ id: z2.number() })).query(async ({ input }) => {
      const prompt = await getSavedPromptById(input.id);
      if (!prompt) {
        throw new TRPCError4({ code: "NOT_FOUND", message: "Prompt not found" });
      }
      return prompt;
    }),
    create: protectedProcedure.input(z2.object({
      name: z2.string().min(1),
      prompt: z2.string().min(1),
      negativePrompt: z2.string().optional(),
      model: z2.string().optional(),
      settings: z2.string().optional()
    })).mutation(async ({ ctx, input }) => {
      const saved = await createSavedPrompt({
        userId: ctx.user.id,
        name: input.name,
        prompt: input.prompt,
        negativePrompt: input.negativePrompt,
        model: input.model,
        settings: input.settings,
        isFavorite: 0,
        useCount: 0
      });
      return saved;
    }),
    update: protectedProcedure.input(z2.object({
      id: z2.number(),
      name: z2.string().optional(),
      prompt: z2.string().optional(),
      negativePrompt: z2.string().optional(),
      model: z2.string().optional(),
      settings: z2.string().optional(),
      isFavorite: z2.boolean().optional()
    })).mutation(async ({ ctx, input }) => {
      const prompt = await getSavedPromptById(input.id);
      if (!prompt) {
        throw new TRPCError4({ code: "NOT_FOUND", message: "Prompt not found" });
      }
      if (prompt.userId !== ctx.user.id) {
        throw new TRPCError4({ code: "FORBIDDEN", message: "Not authorized" });
      }
      await updateSavedPrompt(input.id, {
        name: input.name,
        prompt: input.prompt,
        negativePrompt: input.negativePrompt,
        model: input.model,
        settings: input.settings,
        isFavorite: input.isFavorite ? 1 : 0
      });
      return { success: true };
    }),
    delete: protectedProcedure.input(z2.object({ id: z2.number() })).mutation(async ({ ctx, input }) => {
      const prompt = await getSavedPromptById(input.id);
      if (!prompt) {
        throw new TRPCError4({ code: "NOT_FOUND", message: "Prompt not found" });
      }
      if (prompt.userId !== ctx.user.id) {
        throw new TRPCError4({ code: "FORBIDDEN", message: "Not authorized" });
      }
      await deleteSavedPrompt(input.id);
      return { success: true };
    }),
    use: protectedProcedure.input(z2.object({ id: z2.number() })).mutation(async ({ input }) => {
      await incrementPromptUseCount(input.id);
      return { success: true };
    })
  })
});

// server/_core/context.ts
import { createClient } from "@supabase/supabase-js";
var supabase = createClient(
  process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? "",
  process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY ?? ""
);
async function createContext(opts) {
  let user = null;
  const authHeader = opts.req.headers?.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    try {
      const { data, error } = await supabase.auth.getUser(token);
      if (error) {
        console.error("[Context] Supabase getUser error:", error.message);
      }
      if (!error && data.user) {
        const supaUser = data.user;
        const openId = supaUser.id;
        console.log("[Context] Supabase user verified:", openId, supaUser.email);
        try {
          let localUser = await getUserByOpenId(openId);
          if (!localUser) {
            console.log("[Context] User not in DB, upserting...");
            await upsertUser({
              openId,
              name: supaUser.user_metadata?.full_name || supaUser.email?.split("@")[0] || "User",
              email: supaUser.email,
              role: "admin"
            });
            localUser = await getUserByOpenId(openId);
          }
          user = localUser ?? null;
          if (!user) {
            console.error("[Context] DB lookup returned null after upsert for openId:", openId);
          }
        } catch (dbError) {
          console.error("[Context] DB operation failed:", dbError);
          user = null;
        }
      }
    } catch (err) {
      console.error("[Context] Auth failed:", err);
      user = null;
    }
  }
  return {
    req: opts.req,
    res: opts.res,
    user
  };
}

// api/index.ts
var app = express();
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext
  })
);
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
});
app.get("/api/health/db", async (_req, res) => {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    res.status(503).json({
      status: "error",
      error: "DATABASE_URL not set",
      hasDbUrl: false,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
    return;
  }
  try {
    const pg = (await import("postgres")).default;
    const sql2 = pg(dbUrl, { connect_timeout: 10 });
    const result = await sql2`SELECT 1 as ok`;
    await sql2.end();
    res.json({
      status: "ok",
      database: "connected",
      result: result[0],
      dbHost: dbUrl.split("@")[1]?.split("/")[0] ?? "unknown",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: "error",
      error: error.message,
      code: error.code,
      dbHost: dbUrl.split("@")[1]?.split("/")[0] ?? "unknown",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  }
});
var index_default = app;
export {
  index_default as default
};

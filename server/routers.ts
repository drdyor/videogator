import { z } from "zod";
import { Queue } from "bullmq";
import Redis from "ioredis";
import crypto from "crypto";
import { getJobStatusCache, setJobStatusCache } from "./_core/queue";
import {
  COOKIE_NAME,
  DEFAULT_FEATURE_FLAGS,
  DEFAULT_GPU_HOURLY_CENTS,
  DEFAULT_PRICING_RULES,
  FEATURE_FLAG_KEYS,
  PRICING_RULE_KEYS,
} from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { alerts } from "./_core/alerts";
import * as db from "./db";
import { mockServices, mockPharmaTemplates } from "./mockData";
import { services as servicesTable, pharmaTemplates as pharmaTemplatesTable } from "../drizzle/schema";

// Initialize mock data on first load
let mockDataInitialized = false;

async function initializeMockData() {
  if (mockDataInitialized) return;
  mockDataInitialized = true;
  
  try {
    const existingServices = await db.getAllServices();
    if (existingServices.length === 0) {
      // Insert mock services
      const dbInstance = await db.getDb();
      if (dbInstance) {
        for (const service of mockServices) {
          try {
            await dbInstance.insert(servicesTable).values(service);
          } catch (e) {
            // Service might already exist
          }
        }
        
        // Insert mock pharma templates
        for (const template of mockPharmaTemplates) {
          try {
            await dbInstance.insert(pharmaTemplatesTable).values(template);
          } catch (e) {
            // Template might already exist
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
    const existingFlags = await db.getAllFeatureFlags();
    const existingFlagKeys = new Set(existingFlags.map(flag => flag.key));
    for (const key of FEATURE_FLAG_KEYS) {
      if (!existingFlagKeys.has(key)) {
        const defaults = DEFAULT_FEATURE_FLAGS[key];
        await db.upsertFeatureFlag({
          key,
          enabled: defaults.enabled ? 1 : 0,
          description: defaults.description,
        });
      }
    }

    const existingPricing = await db.getAllPricingRules();
    const existingPricingKeys = new Set(existingPricing.map(rule => rule.key));
    for (const key of PRICING_RULE_KEYS) {
      if (!existingPricingKeys.has(key)) {
        const defaults = DEFAULT_PRICING_RULES[key];
        await db.upsertPricingRule({
          key,
          costCents: defaults.costCents,
          priceCents: defaults.priceCents,
        });
      }
    }

    const existingSettings = await db.getAllAdminSettings();
    if (!existingSettings.find(setting => setting.key === "gpuHourlyCents")) {
      await db.upsertAdminSetting({
        key: "gpuHourlyCents",
        value: String(DEFAULT_GPU_HOURLY_CENTS),
      });
    }
  } catch (error) {
    console.error("Error initializing admin defaults:", error);
  }
}

// Initialize mock data when router is created
initializeMockData().catch(console.error);
initializeAdminDefaults().catch(console.error);

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      (ctx.res as any).clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  video: router({
    create: protectedProcedure.input(z.object({
      operations: z.array(z.any()),
      inputUrl: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const jobId = crypto.randomUUID();
      await db.createJob({
        id: jobId,
        userId: ctx.user.id,
        status: "queued",
        inputUrl: input.inputUrl ?? "",
        operations: JSON.stringify(input.operations),
        currentStep: 0,
      });
      await setJobStatusCache(jobId, {
        status: "queued",
        jobId,
        currentStep: 0,
      });

      const redis = new Redis(process.env.REDIS_URL ?? "");
      const videoQueue = new Queue("video-generation", { connection: redis });
      await videoQueue.add("process-video", {
        jobId,
        operations: input.operations,
        userId: ctx.user.id,
        inputUrl: input.inputUrl ?? "",
      });

      return { jobId, status: "queued" as const };
    }),

    status: protectedProcedure.input(z.object({ jobId: z.string() })).query(async ({ input }) => {
      const cached = await getJobStatusCache(input.jobId);
      if (cached) {
        return cached;
      }
      const job = await db.getJobById(input.jobId);
      if (job) {
        await setJobStatusCache(input.jobId, job);
        return job;
      }

      const VIDEO_SERVER_URL = process.env.VIDEO_SERVER_URL;
      if (!VIDEO_SERVER_URL) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Job not found" });
      }

      try {
        const response = await fetch(`${VIDEO_SERVER_URL}/status/${encodeURIComponent(input.jobId)}`);
        if (response.status === 404) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Job not found" });
        }
        if (!response.ok) {
          throw new Error(`Video server status error: ${response.statusText}`);
        }

        const data = await response.json() as {
          status: string;
          progress?: number;
          output_url?: string | null;
          error?: string | null;
          error_suggestion?: any;
        };

        const outputUrl = data.output_url
          ? data.output_url.startsWith("http")
            ? data.output_url
            : `${VIDEO_SERVER_URL}${data.output_url}`
          : undefined;

        return {
          jobId: input.jobId,
          status: data.status,
          progress: data.progress ?? 0,
          outputUrl,
          error: data.error ?? undefined,
          errorSuggestion: data.error_suggestion ?? undefined,
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to fetch job status",
        });
      }
    }),

    // Direct generation endpoint (bypasses queue for local server)
    generate: protectedProcedure.input(z.object({
      prompt: z.string(),
      negativePrompt: z.string().optional(),
      model: z.enum(["hunyuan-video", "mochi", "cogvideo", "modelscope", "stable-video-diffusion", "wan-2.2", "wan-2.2-5b", "ltx-2", "humo", "kling-2.5", "luma-ray-flash-2", "minimax-video-01"]).optional(),
      width: z.number().optional(),
      height: z.number().optional(),
      numFrames: z.number().optional(),
      numInferenceSteps: z.number().optional(),
      guidanceScale: z.number().optional(),
      seed: z.number().optional(),
      fps: z.number().optional(),
      imageUrl: z.string().optional(),
      audioUrl: z.string().optional(),
      audioGuidanceScale: z.number().optional(),
    })).mutation(async ({ input }) => {
      const VIDEO_SERVER_URL = process.env.VIDEO_SERVER_URL;
      if (!VIDEO_SERVER_URL) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "VIDEO_SERVER_URL is not configured. Please set up the local video server.",
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
            guidance_scale: input.guidanceScale ?? 7.0,
            seed: input.seed,
            fps: input.fps ?? 24,
            image_url: input.imageUrl,
            audio_url: input.audioUrl,
            audio_guidance_scale: input.audioGuidanceScale,
          }),
        });

        if (!response.ok) {
          throw new Error(`Video server error: ${response.statusText}`);
        }

        const data = await response.json() as { job_id: string; status: string };
        return { jobId: data.job_id, status: data.status };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to connect to video server",
        });
      }
    }),

    // Enhance prompt with local LLM via Ollama
    enhancePrompt: protectedProcedure.input(z.object({
      prompt: z.string().min(1),
      model: z.string().optional(),
    })).mutation(async ({ input }) => {
      const VIDEO_SERVER_URL = process.env.VIDEO_SERVER_URL;
      if (!VIDEO_SERVER_URL) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "VIDEO_SERVER_URL is not configured.",
        });
      }

      try {
        const response = await fetch(`${VIDEO_SERVER_URL}/enhance-prompt`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: input.prompt,
            model: input.model ?? "qwen2.5:7b",
          }),
          signal: AbortSignal.timeout(60000),
        });

        if (!response.ok) {
          const detail = await response.text();
          throw new Error(detail);
        }

        const data = await response.json() as { original: string; enhanced: string; model: string };
        return data;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to enhance prompt",
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
          signal: AbortSignal.timeout(5000),
        });
        const data = await response.json() as Record<string, unknown>;
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
    }),
  }),

  projects: router({
    list: protectedProcedure.query(({ ctx }) =>
      db.getUserProjects(ctx.user.id)
    ),
    get: protectedProcedure.input(z.object({ id: z.number() })).query(({ input }) =>
      db.getProjectById(input.id)
    ),
    create: protectedProcedure.input(z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      serviceId: z.string(),
      prompt: z.string().optional(),
      settings: z.string().optional(),
    })).mutation(({ ctx, input }) =>
      db.createProject(ctx.user.id, {
        name: input.name,
        description: input.description,
        serviceId: input.serviceId,
        prompt: input.prompt,
        settings: input.settings,
        status: "draft",
      } as any)
    ),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      name: z.string().optional(),
      description: z.string().optional(),
      status: z.enum(["draft", "generating", "completed", "failed"]).optional(),
      prompt: z.string().optional(),
      videoUrl: z.string().optional(),
    })).mutation(({ input }) =>
      db.updateProject(input.id, input as any)
    ),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(({ input }) =>
      db.deleteProject(input.id)
    ),
  }),

  services: router({
    list: publicProcedure.query(async () => {
      await initializeMockData();
      const allServices = await db.getAllServices();
      const pharmaEnabled = await db.getFeatureFlagValue("feat:pharma");
      if (pharmaEnabled === false) {
        return allServices.filter(service => service.category !== "pharma");
      }
      return allServices;
    }),
    get: publicProcedure.input(z.object({ id: z.string() })).query(async ({ input }) => {
      await initializeMockData();
      return db.getServiceById(input.id);
    }),
  }),

  pharma: router({
    templates: publicProcedure.query(async () => {
      await initializeMockData();
      const pharmaEnabled = await db.getFeatureFlagValue("feat:pharma");
      if (pharmaEnabled === false) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Pharma rendering is currently disabled.",
        });
      }
      return db.getPharmaTemplates();
    }),
    template: publicProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      await initializeMockData();
      const pharmaEnabled = await db.getFeatureFlagValue("feat:pharma");
      if (pharmaEnabled === false) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Pharma rendering is currently disabled.",
        });
      }
      return db.getPharmaTemplateById(input.id);
    }),
  }),

  admin: router({
    flags: router({
      list: adminProcedure.query(async () => {
        await initializeAdminDefaults();
        const flags = await db.getAllFeatureFlags();
        return flags.reduce<Record<string, { enabled: boolean; description: string | null }>>((acc, flag) => {
          acc[flag.key] = { enabled: Boolean(flag.enabled), description: flag.description ?? null };
          return acc;
        }, {});
      }),
      update: adminProcedure.input(
        z.object({
          key: z.string().min(1),
          enabled: z.boolean(),
        })
      ).mutation(async ({ input }) => {
        await db.upsertFeatureFlag({
          key: input.key,
          enabled: input.enabled ? 1 : 0,
        });
        return { success: true };
      }),
    }),
    pricing: router({
      get: adminProcedure.query(async () => {
        await initializeAdminDefaults();
        const rules = await db.getAllPricingRules();
        const settings = await db.getAllAdminSettings();
        const gpuHourlySetting = settings.find(setting => setting.key === "gpuHourlyCents");

        const pricing = rules.reduce<Record<string, { costCents: number; priceCents: number }>>((acc, rule) => {
          acc[rule.key] = { costCents: rule.costCents, priceCents: rule.priceCents };
          return acc;
        }, {});

        return {
          pricing,
          gpuHourlyCents: gpuHourlySetting ? Number(gpuHourlySetting.value) : DEFAULT_GPU_HOURLY_CENTS,
        };
      }),
      update: adminProcedure.input(
        z.object({
          key: z.string().min(1),
          costCents: z.number().int().nonnegative(),
          priceCents: z.number().int().nonnegative(),
        })
      ).mutation(async ({ input }) => {
        await db.upsertPricingRule({
          key: input.key,
          costCents: input.costCents,
          priceCents: input.priceCents,
        });
        return { success: true };
      }),
      updateGpuHourly: adminProcedure.input(
        z.object({
          gpuHourlyCents: z.number().int().nonnegative(),
        })
      ).mutation(async ({ input }) => {
        await db.upsertAdminSetting({
          key: "gpuHourlyCents",
          value: String(input.gpuHourlyCents),
        });
        return { success: true };
      }),
    }),
    metrics: adminProcedure.query(async () => {
      const allProjects = await db.getAllProjectsForAdmin();
      const totals: Record<string, number> = { total: 0 };
      for (const project of allProjects) {
        totals.total += 1;
        totals[project.status] = (totals[project.status] ?? 0) + 1;
      }

      return {
        totals,
      };
    }),
    alerts: router({
      list: adminProcedure.input(z.object({ limit: z.number().int().min(1).max(200).optional() }).optional()).query(async ({ input }) => {
        const limit = input?.limit ?? 50;
        return db.listAlerts(limit);
      }),
      test: adminProcedure.mutation(async ({ ctx }) => {
        await alerts.send({
          level: "warning",
          title: "Test Alert",
          message: "This is a test alert from the admin panel.",
          userId: ctx.user.id,
          timestamp: Date.now(),
          action: "No action needed.",
        });
        return { success: true };
      }),
    }),
  }),

  // Video gallery and management
  videos: router({
    list: protectedProcedure.input(z.object({
      limit: z.number().int().min(1).max(100).optional(),
      offset: z.number().int().min(0).optional(),
    }).optional()).query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 50;
      const offset = input?.offset ?? 0;
      const videos = await db.getUserVideos(ctx.user.id, limit, offset);
      const count = await db.getUserVideoCount(ctx.user.id);
      return { videos, total: count };
    }),
    
    get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      const video = await db.getVideoById(input.id);
      if (!video) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Video not found" });
      }
      return video;
    }),
    
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      const video = await db.getVideoById(input.id);
      if (!video) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Video not found" });
      }
      if (video.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized to delete this video" });
      }
      await db.deleteVideo(input.id);
      return { success: true };
    }),
    
    update: protectedProcedure.input(z.object({
      id: z.number(),
      isPublic: z.boolean().optional(),
    })).mutation(async ({ ctx, input }) => {
      const video = await db.getVideoById(input.id);
      if (!video) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Video not found" });
      }
      if (video.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized to update this video" });
      }
      await db.updateVideo(input.id, {
        isPublic: input.isPublic ? 1 : 0,
      });
      return { success: true };
    }),
    
    public: publicProcedure.input(z.object({
      limit: z.number().int().min(1).max(100).optional(),
    }).optional()).query(async ({ input }) => {
      const limit = input?.limit ?? 20;
      return db.getPublicVideos(limit);
    }),
  }),

  // Saved prompts library
  prompts: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserSavedPrompts(ctx.user.id);
    }),
    
    get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      const prompt = await db.getSavedPromptById(input.id);
      if (!prompt) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Prompt not found" });
      }
      return prompt;
    }),
    
    create: protectedProcedure.input(z.object({
      name: z.string().min(1),
      prompt: z.string().min(1),
      negativePrompt: z.string().optional(),
      model: z.string().optional(),
      settings: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const saved = await db.createSavedPrompt({
        userId: ctx.user.id,
        name: input.name,
        prompt: input.prompt,
        negativePrompt: input.negativePrompt,
        model: input.model,
        settings: input.settings,
        isFavorite: 0,
        useCount: 0,
      });
      return saved;
    }),
    
    update: protectedProcedure.input(z.object({
      id: z.number(),
      name: z.string().optional(),
      prompt: z.string().optional(),
      negativePrompt: z.string().optional(),
      model: z.string().optional(),
      settings: z.string().optional(),
      isFavorite: z.boolean().optional(),
    })).mutation(async ({ ctx, input }) => {
      const prompt = await db.getSavedPromptById(input.id);
      if (!prompt) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Prompt not found" });
      }
      if (prompt.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
      }
      await db.updateSavedPrompt(input.id, {
        name: input.name,
        prompt: input.prompt,
        negativePrompt: input.negativePrompt,
        model: input.model,
        settings: input.settings,
        isFavorite: input.isFavorite ? 1 : 0,
      });
      return { success: true };
    }),
    
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      const prompt = await db.getSavedPromptById(input.id);
      if (!prompt) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Prompt not found" });
      }
      if (prompt.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
      }
      await db.deleteSavedPrompt(input.id);
      return { success: true };
    }),
    
    use: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db.incrementPromptUseCount(input.id);
      return { success: true };
    }),
  }),
});

export type AppRouter = typeof appRouter;

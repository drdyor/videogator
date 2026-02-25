import { integer, pgEnum, pgTable, text, timestamp, varchar, serial } from "drizzle-orm/pg-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const roleEnum = pgEnum("role", ["user", "admin"]);

export const users = pgTable("users", {
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
  encryptedApiKeys: text("encryptedApiKeys"),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const projectStatusEnum = pgEnum("project_status", ["draft", "generating", "completed", "failed"]);

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  serviceId: varchar("serviceId", { length: 64 }).notNull(),
  status: projectStatusEnum("status").default("draft").notNull(),
  prompt: text("prompt"),
  settings: text("settings"), // JSON string for service-specific settings
  videoUrl: varchar("videoUrl", { length: 512 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const jobStatusEnum = pgEnum("job_status", ["queued", "processing", "completed", "failed"]);

export const jobs = pgTable("jobs", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: integer("userId").notNull(),
  status: jobStatusEnum("status").default("queued").notNull(),
  inputUrl: text("inputUrl").notNull(),
  operations: text("operations").notNull(), // JSON string
  currentStep: integer("currentStep").default(0).notNull(),
  outputUrl: text("outputUrl"),
  stepResults: text("stepResults"),
  error: text("error"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export const categoryEnum = pgEnum("category", ["general", "pharma", "specialized"]);

export const services = pgTable("services", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  category: categoryEnum("category").default("general").notNull(),
  description: text("description"),
  capabilities: text("capabilities"), // JSON array of capability strings
  pricing: varchar("pricing", { length: 255 }),
  website: varchar("website", { length: 512 }),
  icon: varchar("icon", { length: 512 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const pharmaTemplates = pgTable("pharmaTemplates", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 128 }).notNull(), // e.g., "ligand-binding", "antibody-conjugate"
  parameters: text("parameters"), // JSON schema for configurable parameters
  previewImage: varchar("previewImage", { length: 512 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const featureFlags = pgTable("featureFlags", {
  key: varchar("key", { length: 128 }).primaryKey(),
  enabled: integer("enabled").default(1).notNull(),
  description: text("description"),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const pricingRules = pgTable("pricingRules", {
  key: varchar("key", { length: 64 }).primaryKey(),
  costCents: integer("costCents").default(0).notNull(),
  priceCents: integer("priceCents").default(0).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const adminSettings = pgTable("adminSettings", {
  key: varchar("key", { length: 64 }).primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const alertLevelEnum = pgEnum("alert_level", ["info", "warning", "critical"]);

export const alerts = pgTable("alerts", {
  id: serial("id").primaryKey(),
  level: alertLevelEnum("level").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  jobId: varchar("jobId", { length: 64 }),
  userId: integer("userId"),
  error: text("error"),
  action: text("action"),
  costCents: integer("costCents"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;
export type Job = typeof jobs.$inferSelect;
export type InsertJob = typeof jobs.$inferInsert;
export type Service = typeof services.$inferSelect;
export type InsertService = typeof services.$inferInsert;
export type PharmaTemplate = typeof pharmaTemplates.$inferSelect;
export type InsertPharmaTemplate = typeof pharmaTemplates.$inferInsert;
export type FeatureFlag = typeof featureFlags.$inferSelect;
export type InsertFeatureFlag = typeof featureFlags.$inferInsert;
export type PricingRule = typeof pricingRules.$inferSelect;
export type InsertPricingRule = typeof pricingRules.$inferInsert;
export type AdminSetting = typeof adminSettings.$inferSelect;
export type InsertAdminSetting = typeof adminSettings.$inferInsert;
export type Alert = typeof alerts.$inferSelect;
export type InsertAlert = typeof alerts.$inferInsert;

// Video storage for generated videos
export const videoStatusEnum = pgEnum("video_status", ["processing", "completed", "failed"]);

export const videos = pgTable("videos", {
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
  metadata: text("metadata"), // JSON for additional data
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Saved prompts for reuse
export const savedPrompts = pgTable("savedPrompts", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  prompt: text("prompt").notNull(),
  negativePrompt: text("negativePrompt"),
  model: varchar("model", { length: 50 }),
  settings: text("settings"), // JSON for generation settings
  isFavorite: integer("isFavorite").default(0).notNull(),
  useCount: integer("useCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Video = typeof videos.$inferSelect;
export type InsertVideo = typeof videos.$inferInsert;
export type SavedPrompt = typeof savedPrompts.$inferSelect;
export type InsertSavedPrompt = typeof savedPrompts.$inferInsert;

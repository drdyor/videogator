import { eq, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  InsertUser,
  users,
  projects,
  services,
  pharmaTemplates,
  featureFlags,
  pricingRules,
  adminSettings,
  alerts,
  jobs,
  type InsertProject,
  type InsertJob,
  type InsertFeatureFlag,
  type InsertPricingRule,
  type InsertAdminSetting,
  type InsertAlert,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const client = postgres(process.env.DATABASE_URL);
      _db = drizzle(client);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onConflictDoUpdate({
      target: users.openId,
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserProjects(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(projects).where(eq(projects.userId, userId)).orderBy(desc(projects.createdAt)) as any;
}

export async function getProjectById(projectId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createProject(userId: number, data: InsertProject) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(projects).values({ ...data, userId });
  return result;
}

export async function updateProject(projectId: number, data: Partial<InsertProject>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(projects).set(data).where(eq(projects.id, projectId));
}

export async function deleteProject(projectId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(projects).where(eq(projects.id, projectId));
}

export async function getAllProjectsForAdmin() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(projects).orderBy(desc(projects.createdAt)) as any;
}

export async function createJob(job: InsertJob) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(jobs).values(job);
}

export async function updateJob(jobId: string, data: Partial<InsertJob>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(jobs).set(data).where(eq(jobs.id, jobId));
}

export async function getJobById(jobId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllServices() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(services);
}

export async function getServiceById(serviceId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(services).where(eq(services.id, serviceId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getPharmaTemplates() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(pharmaTemplates);
}

export async function getPharmaTemplateById(templateId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(pharmaTemplates).where(eq(pharmaTemplates.id, templateId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllFeatureFlags() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(featureFlags);
}

export async function getFeatureFlagValue(key: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(featureFlags).where(eq(featureFlags.key, key)).limit(1);
  if (result.length === 0) return undefined;
  return Boolean(result[0].enabled);
}

export async function upsertFeatureFlag(flag: InsertFeatureFlag) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(featureFlags).values(flag).onConflictDoUpdate({
    target: featureFlags.key,
    set: {
      enabled: flag.enabled,
      description: flag.description ?? null,
    },
  });
}

export async function getAllPricingRules() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(pricingRules);
}

export async function upsertPricingRule(rule: InsertPricingRule) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(pricingRules).values(rule).onConflictDoUpdate({
    target: pricingRules.key,
    set: {
      costCents: rule.costCents,
      priceCents: rule.priceCents,
    },
  });
}

export async function getAllAdminSettings() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(adminSettings);
}

export async function upsertAdminSetting(setting: InsertAdminSetting) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(adminSettings).values(setting).onConflictDoUpdate({
    target: adminSettings.key,
    set: {
      value: setting.value,
    },
  });
}

export async function createAlert(alert: InsertAlert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(alerts).values(alert);
}

export async function listAlerts(limit: number = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(alerts).orderBy(desc(alerts.createdAt)).limit(limit);
}

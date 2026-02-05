import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userId: number = 1): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `test-user-${userId}`,
    email: `user${userId}@example.com`,
    name: `Test User ${userId}`,
    loginMethod: "test",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("Projects Router", () => {
  it("should list projects for authenticated user", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const projects = await caller.projects.list();
    expect(Array.isArray(projects)).toBe(true);
  });

  it("should create a new project", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.projects.create({
      name: "Test Project",
      description: "A test project",
      serviceId: "runway",
      prompt: "Create a video",
    });

    expect(result).toBeDefined();
  });

  it("should reject project creation without required fields", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.projects.create({
        name: "",
        serviceId: "runway",
      });
      expect.fail("Should have thrown an error");
    } catch (error) {
      expect(error).toBeDefined();
    }
  });
});

describe("Services Router", () => {
  it("should list all services", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const services = await caller.services.list();
    expect(Array.isArray(services)).toBe(true);
    expect(services.length).toBeGreaterThan(0);
  });

  it("should have mock services with required fields", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const services = await caller.services.list();
    services.forEach((service) => {
      expect(service.id).toBeDefined();
      expect(service.name).toBeDefined();
      expect(service.category).toBeDefined();
      expect(service.description).toBeDefined();
    });
  });

  it("should get a specific service by id", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const service = await caller.services.get({ id: "runway" });
    expect(service).toBeDefined();
    expect(service?.id).toBe("runway");
    expect(service?.name).toBe("Runway ML");
  });
});

describe("Pharma Router", () => {
  it("should list pharma templates", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const templates = await caller.pharma.templates();
    expect(Array.isArray(templates)).toBe(true);
    expect(templates.length).toBeGreaterThan(0);
  });

  it("should have pharma templates with required fields", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const templates = await caller.pharma.templates();
    templates.forEach((template) => {
      expect(template.id).toBeDefined();
      expect(template.name).toBeDefined();
      expect(template.category).toBeDefined();
      expect(template.description).toBeDefined();
    });
  });

  it("should get a specific pharma template by id", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const templates = await caller.pharma.templates();
    if (templates.length > 0) {
      const template = await caller.pharma.template({ id: templates[0].id });
      expect(template).toBeDefined();
      expect(template?.id).toBe(templates[0].id);
    }
  });
});

describe("Auth Router", () => {
  it("should return current user", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const user = await caller.auth.me();
    expect(user).toBeDefined();
    expect(user?.id).toBe(1);
    expect(user?.name).toBe("Test User 1");
  });
});

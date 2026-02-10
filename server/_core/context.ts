import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { ENV } from "./env";
import * as db from "../db";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

const DEMO_OPEN_ID = "demo-user";

async function getOrCreateDemoUser(): Promise<User | null> {
  try {
    let user = await db.getUserByOpenId(DEMO_OPEN_ID);
    if (!user) {
      await db.upsertUser({
        openId: DEMO_OPEN_ID,
        name: "Demo User",
        email: "demo@uvgo.app",
        role: "admin",
      });
      user = await db.getUserByOpenId(DEMO_OPEN_ID);
    }
    return user ?? null;
  } catch {
    return null;
  }
}

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  if (!ENV.oAuthServerUrl) {
    // Demo mode: auto-authenticate when OAuth is not configured
    user = await getOrCreateDemoUser();
  } else {
    try {
      user = await sdk.authenticateRequest(opts.req as any);
    } catch {
      user = null;
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}

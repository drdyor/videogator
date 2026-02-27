import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { createClient } from "@supabase/supabase-js";
import * as db from "../db";

const supabase = createClient(
  process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? "",
  process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY ?? ""
);

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  const devBypassHeader = (opts.req as any).headers?.["x-dev-bypass-auth"];
  const isDevBypass =
    process.env.NODE_ENV === "development" &&
    (devBypassHeader === "true" || devBypassHeader === true);

  if (isDevBypass) {
    try {
      const openId = "dev-bypass";
      let localUser = await db.getUserByOpenId(openId);
      if (!localUser) {
        await db.upsertUser({
          openId,
          name: "Dev User",
          email: "dev@localhost",
          role: "admin",
        });
        localUser = await db.getUserByOpenId(openId);
      }
      user = localUser ?? null;
    } catch (error) {
      console.error("[Context] Dev bypass user setup failed:", error);
    }

    return {
      req: opts.req,
      res: opts.res,
      user,
    };
  }

  const authHeader = (opts.req as any).headers?.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    try {
      const { data, error } = await (supabase.auth as any).getUser(token);
      if (error) {
        console.error("[Context] Supabase getUser error:", error.message);
      }
      if (!error && data.user) {
        const supaUser = data.user;
        const openId = supaUser.id;
        console.log("[Context] Supabase user verified:", openId, supaUser.email);

        // Sync Supabase user to local DB
        try {
          let localUser = await db.getUserByOpenId(openId);
          if (!localUser) {
            console.log("[Context] User not in DB, upserting...");
            await db.upsertUser({
              openId,
              name: supaUser.user_metadata?.full_name || supaUser.email?.split("@")[0] || "User",
              email: supaUser.email,
              role: "admin",
            });
            localUser = await db.getUserByOpenId(openId);
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
    user,
  };
}

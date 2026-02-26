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

  const authHeader = (opts.req as any).headers?.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    try {
      const { data, error } = await (supabase.auth as any).getUser(token);
      if (!error && data.user) {
        const supaUser = data.user;
        const openId = supaUser.id;

        // Sync Supabase user to local DB
        let localUser = await db.getUserByOpenId(openId);
        if (!localUser) {
          await db.upsertUser({
            openId,
            name: supaUser.user_metadata?.full_name || supaUser.email?.split("@")[0] || "User",
            email: supaUser.email,
            role: "admin",
          });
          localUser = await db.getUserByOpenId(openId);
        }
        user = localUser ?? null;
      }
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

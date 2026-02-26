import { build } from "esbuild";
import { writeFileSync } from "fs";

// Bundle the API into a single file
// external: only npm packages, NOT local imports
const result = await build({
  entryPoints: ["api/index.ts"],
  platform: "node",
  bundle: true,
  format: "esm",
  write: false,
  external: [
    "express",
    "@trpc/server",
    "@trpc/server/*",
    "@supabase/supabase-js",
    "drizzle-orm",
    "drizzle-orm/*",
    "postgres",
    "zod",
    "bullmq",
    "ioredis",
    "cookie",
    "jose",
    "nanoid",
    "superjson",
    "dotenv",
    "dotenv/*",
    "crypto",
    "axios",
    "@aws-sdk/*",
  ],
});

// Overwrite the .ts file with the bundled JS content
writeFileSync("api/index.ts", result.outputFiles[0].text);

console.log("✅ API bundled — api/index.ts overwritten with bundled code");

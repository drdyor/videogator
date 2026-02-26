import { build } from "esbuild";
import { renameSync } from "fs";

// Bundle the API into a single file
await build({
  entryPoints: ["api/index.ts"],
  platform: "node",
  packages: "external",
  bundle: true,
  format: "esm",
  outfile: "api/index.js",
});

// Rename .ts so Vercel doesn't try to also compile it
renameSync("api/index.ts", "api/index.ts.bak");

console.log("✅ API bundled to api/index.js");

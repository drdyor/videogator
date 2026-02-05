## Agent Notes: Mission Control + Night Watch

### What I built
- **Admin control plane**: internal `/admin` view with feature kill switches, pricing controls, and margin/break‑even visibility.
- **Feature flags**: stored in DB and enforced for pharma endpoints and service listings so you can quickly disable unstable pipelines.
- **Pricing rules**: stored in DB so you can update costs/prices without redeploying.
- **Night Watch**: alert service that logs alerts into DB and sends to Discord/Telegram for warnings/critical outages.
- **New DB tables**: `featureFlags`, `pricingRules`, `adminSettings`, `alerts`.

### Why
Your priority was reliability + transparency. This layer lets you:
- Toggle expensive or unstable features immediately.
- See cost deltas and adjust pricing live.
- Get proactive alerts on failures without waking up to angry emails.

### Vision
This is the “control tower” for a GPU‑driven video platform. The public product can move fast, but ops should be safe by default:
1. **Kill switches** first, then add new features.
2. **Pricing controls** inside the product, not in code.
3. **Alerts** that are actionable and auditable.

### Key files
- `client/src/pages/Admin.tsx` — internal admin UI.
- `server/routers.ts` — admin tRPC endpoints + pharma flag enforcement.
- `server/_core/alerts.ts` — alert delivery (Discord/Telegram) + DB logging.
- `drizzle/schema.ts` — admin/alert tables.
- `drizzle/0002_admin_controls.sql` — migration for new tables.
- `shared/const.ts` — defaults for flags/pricing + GPU hourly cost.

### How the admin panel works
- **Feature toggles** call `admin.flags.update`.
- **Pricing** updates call `admin.pricing.update`.
- **GPU hourly** uses `admin.pricing.updateGpuHourly`.
- **Alerts** show last 25 entries and a “Send Test Alert” button to verify integration.

### Supabase note
The current codebase uses MySQL with Drizzle. If you want Supabase (Postgres), plan on:
- Migrating schemas and connection in `server/db.ts`.
- Replacing MySQL migrations with Postgres migrations.
- Updating Drizzle config accordingly.
This is doable, but I kept the admin/alert layer DB‑agnostic so the logic is portable.

### Audit/validation checklist
- Run DB migration: `drizzle/0002_admin_controls.sql`.
- Hit `/admin` as an admin user; verify toggles persist.
- Trigger “Send Test Alert” and confirm Discord/Telegram delivery.
- Verify pharma page behavior when flag `feat:pharma` is off.

### Next logical steps
1. Wire backend pipeline (FFmpeg + ComfyUI) to feature flags.
2. Add circuit‑breaker logic around GPU failures.
3. Add status metrics into `/admin` (queue depth, GPU health).


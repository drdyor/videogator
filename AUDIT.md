## Codebase Audit (Current State)

### High-level summary
- **Frontend**: React + Vite UI with dashboard, services, projects, pharma pages.
- **Backend**: Express + tRPC API with MySQL (Drizzle ORM).
- **Auth**: Manus OAuth integration (requires `OAUTH_SERVER_URL`).
- **Data**: Projects/services/pharma templates stored in MySQL; mock data seeded on boot.
- **Admin controls**: Feature flags, pricing rules, and alert visibility under `/admin`.
- **Alerts**: Night Watch service logs alerts to DB and can notify Discord/Telegram.

### What’s solid
- Clear separation of concerns (client/server/shared).
- tRPC wiring is clean and type-safe across client/server.
- Admin control plane makes feature safety and pricing transparent.
- UI is cohesive and professional; component library is consistent.

### What’s missing or weak
- **No real video generation pipeline** yet (still mock).
- **Database setup not enforced**: dev starts without DB, but admin defaults throw warnings.
- **BYOK encryption** not implemented (keys are not stored securely yet).
- **No queue/worker** for long-running video jobs or GPU orchestration.
- **No webhook verification** for external callbacks.
- **No rate limits / abuse controls** on endpoints.

### Risk/fragility
- Dev server runs without env config; missing vars cause runtime warnings.
- DB layer is MySQL-specific; switching to Supabase (Postgres) needs migration.
- Pharma UI is currently display-only; backend rejects when flag disabled.

### Vision / best next steps
- Build a **pipeline service** (FFmpeg + ComfyUI) with a job queue.
- Add **secure BYOK** storage with encryption + audit logging.
- Add **reliability**: circuit breakers, retries, dead-letter queue.
- Consider **Supabase migration** if you want managed Postgres + auth ecosystem.

### Supabase note
Current project uses MySQL + Drizzle. Moving to Supabase is doable but requires:
- New Postgres connection in `DATABASE_URL`
- Migration of schema (Drizzle migration or SQL)
- Update `drizzle.config.ts` for Postgres dialect


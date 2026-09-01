# Cypher

Underground dance event platform (Phase 1). Turborepo: Next.js web, Expo mobile, NestJS API, NestJS/BullMQ worker.

## Apps

- `apps/web` — public discovery, organizer/admin dashboards
- `apps/mobile` — Expo dancer/organizer client
- `apps/api` — NestJS modular monolith (authorization, payments, writes)
- `apps/worker` — reservation expiry, notifications, exports

## Local

```bash
cp .env.example .env
docker compose up -d
pnpm install
pnpm db:generate
pnpm dev
```

Web: http://localhost:3000  
API: http://localhost:3001/v1/health  

Clients authenticate with Supabase Phone OTP, then call NestJS with the Bearer JWT. Core tables are never mutated from the client.

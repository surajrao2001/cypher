# Local runbook

1. Copy `.env.example` to `.env`.
2. `docker compose up -d` (Postgres is published on host port **5433** so it does not collide with a local Windows PostgreSQL on 5432)
3. `pnpm install`
4. `pnpm db:generate`
5. First migration: `pnpm exec prisma migrate deploy` (do not use `migrate reset` unless you intend to wipe local data).
6. `pnpm dev`

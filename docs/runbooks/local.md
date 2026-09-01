# Local runbook

1. Copy `.env.example` to `.env`.
2. `docker compose up -d`
3. `pnpm install`
4. `pnpm db:generate`
5. `pnpm db:migrate` (after migrations exist)
6. `pnpm dev`

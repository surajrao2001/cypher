# Infra

API and worker are containerized (`docker/api.Dockerfile`, `docker/worker.Dockerfile`). Local Postgres+PostGIS and Redis run via `docker-compose.yml`. Hosting targets (later): Vercel (web), Railway/Fly/Render (API+worker), Supabase (DB/Auth/Storage), Upstash (Redis).

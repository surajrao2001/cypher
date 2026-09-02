# Architecture

Phase 1 uses a NestJS modular monolith (`apps/api`) plus a BullMQ worker (`apps/worker`). Next.js (`apps/web`) and Expo (`apps/mobile`) authenticate with Supabase Phone OTP, then call NestJS with the access token. Clients do not mutate core domain tables.

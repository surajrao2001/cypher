# Architecture

Phase 1 uses a NestJS modular monolith (`apps/api`) plus a BullMQ worker (`apps/worker`). Next.js (`apps/web`) and Expo (`apps/mobile`) authenticate with **Supabase (Google OAuth + email magic link)**, then call NestJS with the access token. Clients do not mutate core domain tables.

**Phase G (Battle Day / Live / Progression):** product PRD [`docs/product/BYND8_PHASE_G_BATTLE_DAY_PRD.md`](../product/BYND8_PHASE_G_BATTLE_DAY_PRD.md); G0 compatibility audit [`docs/product/BYND8_PHASE_G0_COMPATIBILITY.md`](../product/BYND8_PHASE_G0_COMPATIBILITY.md).

### Implemented G1 Foundation (closed)

| Piece | Behavior |
|---|---|
| `EventDayConfig` | Per-event timezone + check-in windows + `EventOpsStatus`. GET returns effective defaults without INSERT; PATCH upserts; ops via dedicated endpoint. |
| `EventOpsStatus` | `scheduled` → `check_in_open` → `check_in_closed` → `event_live` → `completed` (constrained transitions). Not tournament stage. |
| CheckIn | Existing registration-level CheckIn; G1 awards XP in the same DB transaction. Ops status does not gate check-in. Rescan is idempotent; no XP backfill for pre-existing CheckIns. |
| `XpTransaction` | Append-only EVENT-scoped ledger. +40 `COMPETITOR_CHECK_IN`, +25 `EARLY_CHECK_IN`. Unique `idempotency_key`. Reversals are new rows (`reversal_of_id`); never mutate earns. |
| Team semantics | One CheckIn per registration; XP per linked participant userId; guests get none. Multi-recipient omits flattened CheckInDto.progression. |
| Early window | `[opensAt, earlyEndsAt)` using CheckIn.checkedInAt. |
| Live | `GET /me/events/:eventId/live` read-only projection (entries, attendance, progression, announcements). No writes. |
| Organizer UI | Event Home `EventDayControl` + `ManageDayDrawer`; CheckInPanel light feedback. |
| Dancer UI | `/events/[slug]/live` companion; View Pass only (no self-check-in). Contextual CTAs via presentation heuristic. |

Known G1 limitations are listed in the PRD “Implemented G1 Foundation” section.

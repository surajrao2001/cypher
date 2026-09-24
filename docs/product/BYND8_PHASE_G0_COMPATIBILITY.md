# BYND8 Phase G0 Compatibility Audit

**Date:** 2026-09-22  
**Branch context:** `develop` (audit against repository as source of truth)  
**PRD:** [`BYND8_PHASE_G_BATTLE_DAY_PRD.md`](./BYND8_PHASE_G_BATTLE_DAY_PRD.md)  
**Scope:** Documentation + architecture only at audit time. G1 Checkpoint 1 schema has since landed — see **G1 locked decisions** below for corrections that supersede earlier sketches in this document.

---

## G1 locked decisions (post-approval corrections)

These supersede conflicting sketches later in this audit (especially `XpTransactionStatus` and dual timezone sources):

1. **Team check-in** — CheckIn remains 1:1 Registration. Confirmed TEAM registration check-in confirms the linked roster together. No participant-level CheckIn / teammate scanning in G1. Guests (`userId` null) and viewers: no XP.
2. **XP ledger** — Append-only. No `XpTransactionStatus`. Corrections insert a REVERSAL row (`reversalOfId` unique); never mutate the original earn. `XpTransaction.userId` stays **required + ON DELETE CASCADE** for now: the repo has **no** account-deletion API/hard-delete path; inbound FKs (`registrations`, `organizers.created_by`, `check_ins.checked_in_by`, `event_updates.author`) **RESTRICT** User hard-delete; `ProfileStatus.deleted` exists but is unused. Event/category FKs remain SET NULL. Revisit nullable `userId` + SET NULL only when real account-deletion/anonymization is designed — do not invent a fake deleted-user row.
3. **EventDayConfig** — Created via PATCH upsert only. GET day-config and ordinary check-in must not INSERT. Missing config → effective defaults (`timezone=Asia/Kolkata`, windows=null, `opsStatus=scheduled`) without writing a row.
4. **Timezone** — Authoritative on `EventDayConfig.timezone` only (default `Asia/Kolkata`). Do not add `Event.timezone` in G1. Window instants stored as UTC DateTime.
5. **Early window validation (PATCH)** — `checkInOpensAt < checkInClosesAt`; if `earlyCheckInEndsAt` set: `checkInOpensAt < earlyCheckInEndsAt <= checkInClosesAt`. No early XP without required early boundaries. Eligibility: `earlyStart <= checkedInAt < earlyEnd`.
6. **XP idempotency** — EVENT-scoped keys `COMPETITOR_CHECK_IN:event:{eventId}:user:{userId}:v1` and `EARLY_CHECK_IN:event:{eventId}:user:{userId}:v1`; reversal `REVERSAL:of:{originalXpTransactionId}`. DB `@unique` is authoritative.
7. **Duplicate check-in** — Same registration already checked in → return existing CheckIn (idempotent). Do not insert again, do not 409 for that case, do not double XP.

Checkpoint 2 contracts: see `@cypher/contracts` (`EventDayConfigDto`, `PatchEventDayConfigBody`, `SetEventOpsStatusBody`, `EventLiveDto`, `EventDayProgressionDto`) and `@cypher/validation` Zod schemas (`patchEventDayConfigBodySchema`, …).

---

## 1. Executive Summary

BYND8 already has a usable event-day **door** spine: confirmed registrations, HMAC QR passes, and organizer-authorized check-in with DB uniqueness per registration. Phase G can **reuse** Event, EventCategory (`solo` / `team` / `viewer`), Registration, RegistrationParticipant, PaymentOrder, CheckIn, EventUpdate, lineup, and media links.

Major gaps for Phase G: no event-day / competition lifecycle model, no early-check-in configuration, no timezone field, no XP/progression ledger, no judge roles, no tournament/prelim/bracket domain, no dancer Live projection API, and no check-in undo/correction API.

**Recommended G1 foundation (propose only):**

1. **`EventDayConfig` (1:1 Event)** — operational day config + event-level ops status (not category tournament stages).  
2. **`XpTransaction` ledger** — durable, scoped, idempotent, reversible.  
3. **Server-side progression hooks** on successful CheckIn create (competitors only; EVENT-scoped rewards).  
4. **Read-only dancer Live** status endpoint; organizer continues to own mutations via existing check-in + updates.

**Do not** introduce a generic `EventStage` that tries to represent both “doors open” and “Top 16 for Popping 1v1”. Those are different concepts.

---

## 2. Current Architecture

### 2.1 Persistence — [`prisma/schema.prisma`](../../prisma/schema.prisma)

| Model / enum | Role |
|---|---|
| `User`, `AuthIdentity`, `Profile` | Canonical identity; Supabase JWT → Nest |
| `Organizer`, `OrganizerMember` (`owner` / `manager` / `editor`) | Org ACL |
| `OrganizerPaymentAccount` | Cashfree Easy Split |
| `Event` | Listing + schedule (`startTime`, `endTime?`, registration window); **no timezone column** |
| `EventDay` | Multi-day slices (`startsAt`, `endsAt?`) |
| `EventCategory` | SKU: `entryType` = `solo` \| `team` \| `viewer`; capacity; price |
| `CategoryPriceTier` | Tiered pricing windows |
| `Registration` | One row per user×category hold/ticket; unique `registrationCode`; unique hashed `ticketQrToken` |
| `RegistrationParticipant` | Roster (team members may have nullable `userId`) |
| `PaymentOrder` / `Payment` | **One payment order per registration** (not a multi-registration cart) |
| `CheckIn` | **1:1** with `registrationId` (`@unique`); channels `SCAN` \| `MANUAL` \| `CODE` |
| `EventUpdate` | Organizer announcements (`GENERAL`, `LINEUP`, `MEDIA`, `SCHEDULE`, `RULES`, `OTHER`) |
| `EventLineupPerson` | Roster of judges/DJs/etc. (display on event detail; **no write API found** despite contracts `ReplaceEventLineupBody`) |
| `Video`, `MediaLink` | `MediaLink` CRUD exists on organizers; **`Video` model unused** in API (`prisma.video` not referenced); `MediaLink.battleId` reserved |
| `AuditLog` | Generic action audit |

**Product timezone convention (display only):** [`packages/utils/src/index.ts`](../../packages/utils/src/index.ts) and [`apps/web/features/shell/event-day.ts`](../../apps/web/features/shell/event-day.ts) default formatting to **`Asia/Kolkata`**. There is still **no per-event timezone column**. [`apps/web/features/organize/event-control.ts`](../../apps/web/features/organize/event-control.ts) `isEventDay` uses the **browser local** calendar day — inconsistent with IST display helpers.

### 2.2 API — NestJS modular monolith [`apps/api`](../../apps/api)

| Area | Paths |
|---|---|
| Check-in | [`apps/api/src/modules/check-in/check-in.controller.ts`](../../apps/api/src/modules/check-in/check-in.controller.ts) — `POST .../check-in`, `GET .../check-ins` |
| Check-in logic | [`apps/api/src/modules/check-in/check-in.service.ts`](../../apps/api/src/modules/check-in/check-in.service.ts) |
| Tickets / QR | [`apps/api/src/modules/tickets/tickets.service.ts`](../../apps/api/src/modules/tickets/tickets.service.ts) — `cy1.{registrationId}.{hmac}` |
| Registrations | [`apps/api/src/modules/registrations/registrations.service.ts`](../../apps/api/src/modules/registrations/registrations.service.ts) |
| Organizers / events | [`apps/api/src/modules/organizers/organizers.service.ts`](../../apps/api/src/modules/organizers/organizers.service.ts) |
| Contracts | [`packages/contracts/src/index.ts`](../../packages/contracts/src/index.ts) |

### 2.3 Clients

| Surface | Path |
|---|---|
| Organizer check-in UI | [`apps/web/features/organize/CheckInPanel.tsx`](../../apps/web/features/organize/CheckInPanel.tsx) |
| Passes / QR display | [`apps/web/features/tickets/`](../../apps/web/features/tickets/) |
| Auth | Supabase Google + magic link; session listener only ([`AuthProvider.tsx`](../../apps/web/features/auth/AuthProvider.tsx)) |

### 2.4 Workers

| Job | Path |
|---|---|
| Reservation expiry | [`apps/worker/src/reservation-expiry.service.ts`](../../apps/worker/src/reservation-expiry.service.ts) — expires `pending_payment` holds; releases `reservedCount` |

### 2.5 Realtime

No domain pub/sub. Supabase realtime is used only for **auth session** subscribe/unsubscribe on web/mobile. No battle-day channels.

---

## 3. Current Event Lifecycle

```text
Event (draft → published → registration_closed → completed | cancelled)
  → EventCategory (solo | team | viewer)
  → Registration.createHold (pending_payment + reservedCount++)
  → Payment (Cashfree) OR free confirm
  → Registration.confirmed + ticketQrToken hash issued
  → Pass UI shows QR (payload cy1.{registrationId}.{sig})
  → Organizer CheckIn.create (member ACL)
  → CheckIn row (unique registrationId)
```

### Authoritative statuses

**EventStatus:** `draft`, `published`, `registration_closed`, `completed`, `cancelled`

**RegistrationStatus:** `pending_payment`, `confirmed`, `waitlist`, `expired`, `cancelled`, `refunded`

Note: `waitlist` is in the enum and treated as an “active” status for duplicate-entry checks, but **no createHold path was found that sets `waitlist`** (full category → Conflict).

**RegistrationPaymentStatus:** `not_started`, `pending`, `paid`, `failed`, `refunded`, `partially_refunded`

### Check-in gate (today)

From [`check-in.service.ts`](../../apps/api/src/modules/check-in/check-in.service.ts):

- Caller must be `OrganizerMember` of the event’s organizer (any role).
- Registration must belong to `eventId`.
- `registrationStatus === confirmed`.
- QR hash must match `ticketQrToken` when scanning.
- Duplicate → `ConflictException` / Prisma `P2002` on unique `registrationId`.

There is **no** check that `entryType !== viewer`. Audience passes can be checked in the same way as competitors.

---

## 4. Phase G Reuse Map

| Phase G concept | Classification | Why |
|---|---|---|
| Auth (Google + magic link) | **REUSE** | Locked decision; working |
| Event create / publish | **REUSE** | Type-aware organizer flow exists |
| Categories / capacity / pricing | **REUSE** | `EventCategory` + tiers |
| Compete vs audience | **REUSE** | `CategoryEntryType.viewer` vs `solo`/`team` |
| Registration + participants | **REUSE** | Hold → confirm; team roster |
| Payments / Cashfree | **REUSE** | Unchanged |
| Pass + QR crypto | **REUSE** | HMAC ticket; do not replace |
| CheckIn record | **EXTEND** | Keep 1:1 reg check-in; add progression side-effects + config |
| EventUpdate | **REUSE** | Announcements only |
| EventLineupPerson | **REUSE** (read) / **EXTEND** (write) | Public detail includes lineup; contracts define upsert/replace but **no organizer write API** implemented yet |
| MediaLink / Video | **EXTEND** later (G5) | MediaLink CRUD live; Video unused; no tagging/permissions |
| OrganizerMember | **EXTEND** later (G2) | Need judge assignment distinct from org editor |
| Event-day ops status | **NEW** | No model today |
| Early check-in window | **NEW** | No fields today |
| XP ledger | **NEW** | No progression tables |
| Tournament / prelims / brackets / S2S | **NEW** (G2+) | No competition engine |
| Dancer Live API | **NEW** | Projection only |
| Realtime battle bus | **NEW** (G2+) | Not for G1 |

---

## 5. Gap Analysis

### G1

- Event-level day config (doors / early / check-in windows, ops status)
- Competitor eligibility for progression (exclude `viewer`, staff)
- XP ledger + EVENT-scoped attendance / early rewards
- Idempotent reward issuance on check-in
- Reversal semantics for corrections (API may come later)
- Read-only dancer Live status
- Organizer visibility into early window + counts (extend check-in panel later)
- Timezone policy for window evaluation

### G2

- Category/tournament competition config
- Prelim groups, order, judge assignment ACL
- Numeric scoring + judge selection
- Qualifier publication
- Category-level competition stage (independent of event ops status)

### G3

- Brackets, match control, Seven to Smoke engine
- Official results + audited corrections cascading to XP

### G4

- Levels, achievements, battle-history projections
- Full reward catalog beyond attendance

### G5

- Tagged media, permissions, recaps

---

## 6. G1 Event-Day State Proposal

### What G1 actually needs

Operational answers for dancers/staff:

- Is check-in open?
- What is the early window?
- Am I checked in (for my competitor registration(s))?
- Did I earn attendance / early XP?

G1 does **not** need “PRELIMS vs TOP 16” per category.

### Recommendation (do not implement yet)

**Prefer a dedicated 1:1 `EventDayConfig` on `Event`**, not fields scattered only on `Event`, and **not** a category-level tournament stage for G1.

Rationale:

| Option | Verdict |
|---|---|
| Fields on `Event` only | Possible but mixes listing metadata with ops config; harder to evolve |
| Fields on `EventCategory` | **Wrong for G1** — forces every category to carry doors/early windows; conflicts with multi-category check-in |
| Single `EventStage` enum for everything | **Reject** — conflates event ops with category competition |
| `EventDayConfig` (1:1 Event) | **Choose for G1** — owns windows + `opsStatus` |
| `CategoryCompetition` / tournament state | **Defer to G2+** — separate entity when prelims exist |

### Event-level vs category-level

| Concept | Owner | G1? |
|---|---|---|
| Doors / early / check-in windows | `EventDayConfig` (event) | Yes |
| Ops status: `SCHEDULED` \| `CHECK_IN_OPEN` \| `CHECK_IN_CLOSED` \| `EVENT_LIVE` \| `COMPLETED` | `EventDayConfig` | Yes (manual organizer transitions; no auto prelims) |
| Prelim / bracket / S2S stage | Future category/tournament entity | No |

### Coexistence with G2/G3

When prelims arrive, add something like `CategoryCompetition` (or `Tournament`) keyed by `eventCategoryId` with its own `competitionStatus`. Dancer Live joins:

- event ops from `EventDayConfig`
- per-category competition from tournament rows

G1 `opsStatus` is **not** replaced; it remains the venue/door timeline.

### Avoiding rewrite

Do not store “PRELIMS_LIVE” on `EventDayConfig`. Keep competition verbs off the event-day config so G2 adds tables instead of migrating enum meanings.

---

## 7. Check-In Compatibility Audit

| Question | Finding |
|---|---|
| Cardinality | `CheckIn.registrationId` **@unique** → one check-in per registration |
| QR / pass | Payload embeds **one `registrationId`**; hash stored on that registration |
| Multi-category | Same user may hold **multiple registrations** at one event (different `categoryId`); each gets its own QR and check-in |
| One order / many regs | **No** — `PaymentOrder.registrationId` is per registration |
| Teams | One registration; multiple `RegistrationParticipant`; check-in is still **per registration**, not per participant |
| Same user in multiple teams | Blocked **within the same category** (active status); allowed across categories |
| Duplicate scan | Conflict `409` (pre-check + `P2002`); **not** an idempotent 200 with the existing row |
| Manual / CODE | Supported via `registrationCode` + channel |
| Undo / correction | **Not implemented** — no DELETE/PATCH check-in API |
| Cancel after check-in | Hold cancel only for `pending_payment`; confirmed cancel/refund paths exist elsewhere but **do not remove CheckIn** automatically in check-in module |
| Audience | `viewer` categories check in like anyone else today |

**Conflict with Phase G attendance XP:** if a dancer has 1v1 + 2v2 competitor regs, two check-ins would fire twice unless rewards are **EVENT-scoped** and idempotent per `(userId, eventId, ruleKey)`.

---

## 8. Competitor Eligibility

### Reliable definition (from current models)

A user `U` is a **verified competing dancer for event `E`** when there exists a `Registration` `R` such that:

1. `R.eventId = E`
2. `R.registrationStatus = confirmed`
3. `R.category.entryType IN (solo, team)` — **not** `viewer`
4. Eligibility for “this check-in’s competitor” also requires the checked-in registration itself to satisfy (3)

Optional strengthening for teams: `U` appears on `R.participants` with `userId = U`, or `R.userId = U` (creator/captain). For G1 attendance XP, award to:

- `R.userId` for solo / viewer-excluded competitor regs, and  
- each `RegistrationParticipant.userId` that is non-null for team regs **or** only the registering user — **unresolved; see §20**.

### Audience / staff → 0 XP

- `entryType = viewer` → never grant competitor attendance XP.  
- Organizer members checking people in are actors (`checkedInByUserId`), not recipients.  
- No client endpoint may POST “grant me XP”.

### Trace

`CheckIn` → `Registration` → `EventCategory.entryType` → (`solo`/`team` = competitor; `viewer` = audience).

---

## 9. XP Ledger Proposal

Design a durable ledger now; G1 only writes attendance/early rows.

### Proposed model (exact shape for this repo — **do not apply**)

```prisma
enum XpRewardScope {
  EVENT
  CATEGORY
  TOURNAMENT
}

enum XpSourceType {
  check_in
  // future: prelim_result, match_result, achievement, admin_adjustment, ...
}

// G1 locked: NO XpTransactionStatus. Ledger is append-only; reverse via new REVERSAL row.
model XpTransaction {
  id              String              @id @default(uuid()) @db.Uuid
  userId          String              @map("user_id") @db.Uuid
  amount          Int                 // positive earn; negative for reversal rows
  ruleKey         String              @map("rule_key") // e.g. COMPETITOR_CHECK_IN, EARLY_CHECK_IN, REVERSAL
  ruleVersion     Int                 @default(1) @map("rule_version")
  scope           XpRewardScope
  eventId         String?             @map("event_id") @db.Uuid
  categoryId      String?             @map("category_id") @db.Uuid
  // tournamentId String?             @map("tournament_id") @db.Uuid  // add when G2 tournament entity exists
  sourceType      XpSourceType        @map("source_type")
  sourceId        String              @map("source_id") @db.Uuid // CheckIn.id, etc.
  idempotencyKey  String              @unique @map("idempotency_key")
  earnedAt        DateTime            @default(now()) @map("earned_at")
  reversalOfId    String?             @unique @map("reversal_of_id") @db.Uuid
  createdAt       DateTime            @default(now()) @map("created_at")

  user       User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  event      Event?         @relation(fields: [eventId], references: [id], onDelete: SetNull)
  category   EventCategory? @relation(fields: [categoryId], references: [id], onDelete: SetNull)
  reversalOf XpTransaction? @relation("XpReversal", fields: [reversalOfId], references: [id], onDelete: Restrict)
  reversedBy XpTransaction? @relation("XpReversal")

  @@index([userId, earnedAt], map: "xp_transactions_user_earned_idx")
  @@index([eventId, ruleKey], map: "xp_transactions_event_rule_idx")
  @@index([sourceType, sourceId], map: "xp_transactions_source_idx")
  @@map("xp_transactions")
}
```

### Idempotency key strategy (DB-enforced)

Examples:

- Attendance: `COMPETITOR_CHECK_IN:event:{eventId}:user:{userId}:v1`  
- Early: `EARLY_CHECK_IN:event:{eventId}:user:{userId}:v1`  
- Reversal: `REVERSAL:of:{originalXpTransactionId}`

`@@unique` on `idempotencyKey` prevents duplicate posts under retries. Application still catches `P2002` and treats as success/no-op.

### Source of truth

XP rows are created **only** inside server transactions after authoritative CheckIn (or future verified results). Never from Live UI.

---

## 10. Reward Scope

| Scope | Meaning | G1 usage |
|---|---|---|
| `EVENT` | Once per user per event (per rule) | `COMPETITOR_CHECK_IN`, `EARLY_CHECK_IN` |
| `CATEGORY` | Once per user per category | Future prelim/qualify/placement |
| `TOURNAMENT` | Once per user per tournament instance | Future S2S / bracket milestones |

### Mapping

| Rule | Scope |
|---|---|
| `COMPETITOR_CHECK_IN` | EVENT |
| `EARLY_CHECK_IN` | EVENT |
| `PRELIM_PARTICIPATION`, `QUALIFIED`, `TOP_16`, `TOP_8`, `FINALIST`, `CHAMPION` | CATEGORY or TOURNAMENT (G2+) |
| Seven to Smoke milestones | TOURNAMENT |

Ledger columns `eventId` / `categoryId` / future `tournamentId` support this without redesign.

---

## 11. Early Check-In Configuration

### Today

No doors/early fields. Only `Event.startTime`, `Event.endTime?`, `registrationOpensAt` / `registrationClosesAt`, and optional `EventDay` slices.

### G1 recommendation (config on `EventDayConfig`)

| Field | Purpose |
|---|---|
| `checkInOpensAt` | UTC instant doors/check-in open |
| `checkInClosesAt` | UTC instant check-in ends (optional) |
| `earlyCheckInEndsAt` | UTC instant; early perk if `checkedInAt < earlyCheckInEndsAt` and `>= checkInOpensAt` |
| `opsStatus` | Organizer-controlled operational phase |

Eligibility: server uses persisted `CheckIn.checkedInAt` vs these instants. **Never** trust client “early” flag or device clock.

Organizer must set windows before opening check-in; changing windows after some check-ins should not retroactively grant early XP (document policy: evaluate at write time only).

---

## 12. Timezone Semantics

### Current behavior

- All `DateTime` fields are Prisma/`timestamptz`-style instants (UTC storage typical for Postgres).
- **No `timezone` / `ianaTimeZone` column** on `Event` or `EventDay`.
- Display helpers hardcode **`Asia/Kolkata`** ([`packages/utils`](../../packages/utils/src/index.ts), [`event-day.ts`](../../apps/web/features/shell/event-day.ts)).
- Organizer “is event day?” logic in [`event-control.ts`](../../apps/web/features/organize/event-control.ts) uses **browser local** date — can disagree with IST product display.

### Risks

- Early window boundaries wrong if organizer configs are authored without explicit TZ.
- India-only operation still needs explicit event TZ for correctness.

### G1 proposal

1. Add `timezone String` (IANA, e.g. `Asia/Kolkata`) on `Event` **or** on `EventDayConfig`.  
2. Store window fields as absolute UTC `DateTime`.  
3. Organizer UI converts event-local wall times → UTC using `timezone` at save.  
4. Evaluation compares `CheckIn.checkedInAt` (server now) to UTC windows — device TZ irrelevant.

---

## 13. Authorization / Trust Boundaries

| Actor | Check-in mutate | Configure EventDayConfig | Publish EventUpdate | Read Live |
|---|---|---|---|---|
| Public | No | No | No | Limited public event info only |
| Competitor (dancer) | No | No | No | **Own** Live status (auth) |
| OrganizerMember (any role today) | **Yes** (current) | Proposed G1: owner/manager (recommend tightening) | Existing org rules | Yes for their events |
| Future judge | No (score only G2) | No | No | Assigned category views |

**Dancer Live remains read-only.** Existing mutate path: `POST /organizers/:organizerId/events/:eventId/check-in`.

**Note:** Check-in today allows **editor** as well as owner/manager (any membership). G1 may keep this for door staff or introduce a future `door_staff` role — deferred decision.

---

## 14. Live Delivery Strategy

### G1 needs

After check-in, dancer sees updated status within seconds–tens of seconds. No judge streams.

### Existing capabilities

Auth session realtime only. No Redis pub/sub for domain events.

### Recommended G1

**HTTP read model + client refetch/polling** (e.g. 5–15s while Live screen focused) or refetch on focus/visibility. Optionally invalidate on pull-to-refresh.

### G2/G3 needs (defer infra)

Now-on-floor, judge submit, qualifier publish, live match, bracket advance, S2S — will likely need SSE/WebSocket/Supabase channel. **Do not build that in G1.**

---

## 15. Proposed G1 API Contracts

### Reuse

| Method | Path | Notes |
|---|---|---|
| `POST` | `/organizers/:organizerId/events/:eventId/check-in` | Extend server-side to evaluate XP after create; response may include `progression` summary |
| `GET` | `/organizers/:organizerId/events/:eventId/check-ins` | Unchanged list; optional early flags later |
| Event updates CRUD | Existing organizer update routes | Announcements |

### New (propose only)

| Method | Path | Purpose |
|---|---|---|
| `GET/PATCH` | `/organizers/:organizerId/events/:eventId/day-config` | Read/update `EventDayConfig` |
| `POST` | `/organizers/:organizerId/events/:eventId/day-config/ops-status` | Transition ops status |
| `GET` | `/events/:eventId/live` or `/me/events/:eventId/live` | **Read-only** dancer Live projection |
| `GET` | `/me/xp` or `/me/xp/events/:eventId` | Optional balance / recent txns |

No dancer POST for check-in or XP.

---

## 16. Proposed Prisma Changes

**Label:** G1 Checkpoint 1 **applied** via migration `20260922120000_g1_event_day_xp_ledger` (see **G1 locked decisions** at top). Earlier sketch items below that conflict are superseded by those locks.

### NEW

1. `EventDayConfig` (1:1 `eventId`) — includes authoritative `timezone`
2. `XpTransaction` (+ enums `XpRewardScope`, `XpSourceType` only — **no** `XpTransactionStatus`)
3. ~~Optional: `timezone` on `Event`~~ — **rejected for G1**; use `EventDayConfig.timezone` only

### MODIFIED

- `Event` — relation to `EventDayConfig` only (no `Event.timezone`)
- `User` — relation `xpTransactions`
- `EventCategory` — optional relation for future category-scoped XP (nullable FK only)
- `CheckIn` — comments documenting team roster G1 rule (shape unchanged)

### UNCHANGED

- `CheckIn` shape (keep unique `registrationId`)
- Registration / payment / ticket QR fields
- Auth models

### Exact sketch — `EventDayConfig`

```prisma
enum EventOpsStatus {
  scheduled
  check_in_open
  check_in_closed
  event_live
  completed
}

model EventDayConfig {
  id                 String         @id @default(uuid()) @db.Uuid
  eventId            String         @unique @map("event_id") @db.Uuid
  timezone           String         @default("Asia/Kolkata") // IANA
  checkInOpensAt     DateTime?      @map("check_in_opens_at")
  checkInClosesAt    DateTime?      @map("check_in_closes_at")
  earlyCheckInEndsAt DateTime?      @map("early_check_in_ends_at")
  opsStatus          EventOpsStatus @default(scheduled) @map("ops_status")
  createdAt          DateTime       @default(now()) @map("created_at")
  updatedAt          DateTime       @updatedAt @map("updated_at")

  event Event @relation(fields: [eventId], references: [id], onDelete: Cascade)

  @@map("event_day_configs")
}
```

### Indexes / uniques (why)

| Constraint | Why |
|---|---|
| `EventDayConfig.eventId` unique | One ops config per event |
| `XpTransaction.idempotencyKey` unique | Retry-safe ledger |
| `XpTransaction.reversalOfId` unique | At most one reversal row per original |
| `xp_transactions_user_earned_idx` | Profile history queries |
| `xp_transactions_event_rule_idx` | Event-scoped audits |
| `xp_transactions_source_idx` | Trace from CheckIn → XP |

### Migration count proposed

**1 migration** containing `EventDayConfig` + `XpTransaction` (+ enums + FKs). Optionally split to 2 if timezone-on-Event is separated — still recommend **one** G1 migration after approval.

---

## 17. Correction / Reversal Semantics

### Today

No check-in undo. Duplicate scans conflict. Confirmed registration lifecycle does not auto-delete CheckIn.

### Proposed (architecture)

1. **Duplicate scan** — no new CheckIn; no new XP (idempotent).  
2. **Admin undo check-in** (future API) — soft-delete or `voidedAt` on CheckIn **or** delete CheckIn in transaction **and** post XP reversal rows for any EVENT rewards granted from that attendance. Prefer **keeping CheckIn audit** via `voidedAt` + `voidedByUserId` over hard delete.  
3. **XP** — never delete posted earns; insert `amount = -original`, `ruleKey = REVERSAL`, `reversalOfId = original.id`, unique idempotency.  
4. **Duplicate reversal** — blocked by unique `reversalOfId` / idempotency.  
5. **Cancel registration after check-in** — must void check-in + reverse XP; do not leave orphaned “checked in” competitor.  
6. **Wrong registration scanned** — void wrong CheckIn + reverse XP; check in correct registration.

No reversal UI in G0/G1 MVP required, but ledger must support it.

---

## 18. Regression Risks

| Area | Risk if G1 done carefully |
|---|---|
| Auth | None if no auth changes |
| Cashfree / holds | None if XP is post-confirm side-effect only |
| Registration | Low — eligibility reads entryType |
| Passes / QR crypto | **Do not change** signing; only read after verify |
| Organizer flows | Low — extend check-in response; add day-config routes |
| Event pages | Low — Live is additive |
| Existing check-in | Medium — must remain backward compatible; XP failure must not fail door check-in (recommend: check-in commits first; XP in same TX or follow-up with outbox — **decision §20**) |

---

## 19. G1 Acceptance Criteria

Testable after G1 implementation (not G0):

1. Confirmed **solo/team** competitor check-in creates CheckIn and posts `COMPETITOR_CHECK_IN` XP once per user/event.  
2. Confirmed **viewer** check-in creates CheckIn and posts **0** competitor XP.  
3. Multi-category competitor (1v1 + 2v2): two CheckIns allowed; attendance XP still **once** per event.  
4. Duplicate QR scan: conflict; XP unchanged.  
5. Early window: check-in inside early window posts `EARLY_CHECK_IN` once; outside does not.  
6. Normal check-in after early end: attendance XP only.  
7. Boundary timestamp: `checkedInAt == earlyCheckInEndsAt` has documented inclusive/exclusive rule (recommend: early if `checkedInAt < earlyCheckInEndsAt`).  
8. Client sending wrong timezone / “early: true” cannot force early XP.  
9. Manual/CODE check-in behaves like scan for XP rules.  
10. Correction/reversal (when API exists): net XP zeroed; audit trail retained.  
11. Cancelled/voided registration cannot remain rewarding.  
12. Team registration: documented recipient rule passes tests.  
13. Retried API/worker: idempotent XP (unique key).  
14. Dancer Live is GET-only; cannot self check-in.  
15. Organizer announcements still use EventUpdate without encoding ops status in prose as source of truth.

---

## 20. Deferred Decisions

| Decision | Why deferred |
|---|---|
| Team XP recipients (captain only vs all linked participants) | Product + fraud implications |
| Whether check-in + XP share one DB transaction vs outbox | Reliability vs door latency |
| Tighten check-in ACL (exclude `editor` / add door role) | Staffing reality |
| Inclusive vs exclusive early boundary | Minor; pick in G1 and lock in tests |
| Auto opsStatus transitions vs fully manual | G1 should stay manual |
| Tournament entity naming (`CategoryCompetition` vs `Tournament`) | G2 design |
| Judge auth model | G2 |
| Achievement / level formulas | G4 |
| Media tagging rights | G5 |
| Competitive ratings | Explicitly out of scope |
| Supabase realtime for Live | Not needed for G1 |

---

## Conflicts: Phase G PRD vs repository

| Topic | PRD assumption | Repo reality | Least disruptive resolution |
|---|---|---|---|
| Event stage | Unified battle lifecycle stages | Only `EventStatus` (publish lifecycle) | Add `EventDayConfig.opsStatus` + future category competition — **not** overload `EventStatus` |
| Check-in → XP | Verified competitor rewards | Check-in allows viewers; no XP | Filter `entryType`; EVENT-scoped ledger |
| Multi-category attendance | Once per event | One CheckIn per registration | Idempotent EVENT-scoped XP keys |
| Early window | Configurable | Missing | `EventDayConfig` windows |
| Timezone | Event-local windows | No TZ field | Add IANA TZ; store UTC instants |
| Corrections | Audited undo | No undo API | Design void + XP reversal before building UI |
| Realtime Live | Implied updates | No domain realtime | Polling/refetch for G1 |

---

*End of G0 audit. Stop here — do not implement G1 until this document is reviewed and approved.*

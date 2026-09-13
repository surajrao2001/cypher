# BYND8 — Organizer flow (current product)

**Status:** As implemented in code today (`feat/ui-event-first-pass-empties` / develop lineage)  
**Scope:** Web + Nest API + Prisma  
**Not covered:** Battle Day live ops, public organizer directory (placeholder), teammate invites UI, PhonePe (payments still Cashfree paths in code)

This is the full journey from **login → check-in**, including screens, DB, APIs, and edge cases.

---

## 1. Journey map (happy path)

```mermaid
flowchart TD
  A[Login Google / Email OTP] --> B[Supabase JWT]
  B --> C{Profile onboarded?}
  C -->|No| D[/profile onboarding]
  D --> E[/organize]
  C -->|Yes| E
  E --> F{Has organizer profile?}
  F -->|No| G[Create organizer profile]
  G --> H[Organizer dashboard]
  F -->|Yes| H
  H --> I[Create draft event]
  I --> J[Edit: basics / categories / viewers / early bird / media]
  J --> K{Paid entries?}
  K -->|Yes| L[Connect bank or UPI]
  K -->|No| M[Publish]
  L --> M
  M --> N[Appears on Discover / Events]
  N --> O[Dancer: Compete or Watch]
  O --> P{Price}
  P -->|Free| Q[Hold → Confirm free]
  P -->|Paid| R[Hold → Cashfree checkout]
  Q --> S[BYND8 Pass + QR]
  R --> S
  S --> T[Organizer check-in scan / code]
  T --> U[Checked in]
```

---

## 2. Actors & roles

| Actor | Who | What they can do |
|--------|-----|------------------|
| **Dancer (public)** | Any signed-in user | Discover, register, tickets |
| **Organizer owner** | Creator of org profile | Everything below + payout setup |
| **Organizer manager** | Member role `manager` | Publish/unpublish, edit event, check-in, view regs |
| **Organizer editor** | Member role `editor` | Edit event/categories/media; **cannot** publish or set payouts |

Today, create-org always makes the caller **owner**. There is no invite UI yet; membership is DB/API-level.

---

## 3. Screen-by-screen (web)

### A. Auth & gate

| Screen | Route | What user sees / does |
|--------|-------|------------------------|
| Login | `/login` | Google OAuth + email OTP (Supabase) |
| Auth callback | `/auth/callback` | Exchanges code, stores session, redirects `?next=` |
| Profile / onboarding | `/profile` | Required before Organize if `onboardedAt` is null |
| Organize gate | wraps all `/organize/*` | Signed out → sign-in empty; needs onboarding → CTA to profile |

**Private layout:** `(private)` routes require auth.  
**Organize policy:** `/organize` and children also require **finished onboarding** (`ONBOARDED_APP_PATHS`).

---

### B. Organizer surfaces

| Screen | Route | UI |
|--------|-------|-----|
| Organize home | `/organize` | List of your organizer profiles + light stats (events, regs, live). CTA **+ New organizer profile** |
| Create organizer profile | `/organize/new` | 2-col form: name, **type dropdown**, city, optional slug / Instagram / bio |
| Organizer dashboard | `/organize/[slug]` | Events-first. Tabs: All / Draft / Live / Past. Banner if payouts not connected. **+ New event** |
| Payouts page | `/organize/[slug]/payouts` | Bank or UPI setup (Cashfree vendor) |
| New event | `/organize/[slug]/events/new` | Event editor (create draft) |
| Edit event | `/organize/[slug]/events/[eventId]/edit` | Stepper: What’s cooking → Categories → Viewers → Early bird → Media |
| Event manage | `/organize/[slug]/events/[eventId]` | Overview / Registrations / Updates / Media / Payouts; Publish toggle; link to check-in |
| Check-in | `/organize/[slug]/events/[eventId]/check-in` | Camera QR + paste code; live checked-in list |

---

### C. Public / dancer surfaces (touch organizer journey)

| Screen | Route | Role in flow |
|--------|-------|----------------|
| Discover | `/discover` | Published nights board (city chips, type pills, poster grid) |
| Events | `/events` | Full published list |
| Event detail | `/events/[slug]` | Compete / Watch / Get in → register dialog; sticky bottom bar |
| Tickets | `/tickets` | Vertical BYND8 Pass + door QR |
| Organizers (public) | `/organizers` | **Placeholder only** — not a live directory |

---

## 4. Step detail

### 4.1 Login → identity

1. User signs in with Supabase (Google or email).
2. Web sends Bearer JWT to Nest.
3. First hit: `IdentityService.resolveOrProvisionUser`:
   - Creates `User`
   - Creates `AuthIdentity` (`provider = SUPABASE`, `providerUserId = JWT sub`)
   - Creates `Profile` (`name = "Dancer"`, `onboardedAt = null`)
4. `GET /v1/me` returns `needsOnboarding: true` until onboarding completes.

### 4.2 Create organizer profile

**UI fields**

| Field | Required | Notes |
|-------|----------|--------|
| Organizer name | Yes | min 2 chars |
| Organizer type | Yes | independent / collective / college / studio / community / other |
| City | No | |
| URL slug | No | `a-z0-9-`; auto from name if blank |
| Instagram | No | `@` stripped server-side |
| Bio | No | max 500 |

**API:** `POST /v1/organizers`  
**DB write:**

- `Organizer` — including **`verificationStatus = verified`** (create path always auto-verifies today; schema default is `pending` but create overrides)
- `OrganizerMember` — caller as `owner`

**Then:** redirect `/organize/{slug}?welcome=1`

### 4.3 Dashboard

- Loads org by slug, event list, payment account (`payoutReady`).
- If payouts not ready: banner **Connect bank or UPI** (optional until you charge money).
- Event rows open **Event manage**.

### 4.4 Create / edit event

**Stepper (edit screen)**

1. **What’s cooking (basics)** — title, type, city, start (required), styles (≥1 required to save), optional end / reg window / venue pin / poster / description  
2. **Categories** — compete lanes (1v1, crew, etc.). **Optional to publish**  
3. **Viewers** — audience pass (optional). Multi-day can generate per-day / full-run passes  
4. **Early bird** — price tiers per category (optional)  
5. **Media** — YouTube / IG / Drive links (optional)

**First save:** `POST …/events` → always `status = draft` → redirect to edit with `?fresh=1`.  
**Later saves:** `PATCH …/events/:id` + category / media / days endpoints.

### 4.5 Publish / unpublish

| Action | Who | Result |
|--------|-----|--------|
| Publish | owner, manager | `draft` → `published` |
| Unpublish | owner, manager | `published` → `draft` |

**Server gates on publish**

- Organizer `verificationStatus === verified` (true for all newly created orgs today)
- Start/end and registration window consistency
- Event days (if any) must sit inside event span
- **Categories: not required** (`assertPublishCategories` is a no-op)
- If any category `priceMinor > 0` → Cashfree payout account must be ready
- Cancelled events cannot be published

**Editors cannot publish.**

### 4.6 Public appearance

- Listed on Discover / Events when `published` or `registration_closed`
- Detail also serves `completed`
- Zero categories → night is discoverable but Compete/Watch show empty / closed registration UX

### 4.7 Dancer registration

From event detail **Get in / Compete / Watch** (same dialog as sticky bar):

1. Auth required (else login with `next=` back to event)
2. **Hold** `POST /registrations` → `pending_payment`, increments `reservedCount`, ~15 min hold
3. **Free** → `confirm-free` → `confirmed`, ticket QR issued, reserved → confirmed counts
4. **Paid** → Cashfree checkout → reconcile/webhook → confirmed + ticket

Pass shows on `/tickets` as **BYND8 Pass** (vertical stub + QR).

### 4.8 Check-in (door)

1. Organizer opens check-in for that event
2. Scan `cy1.…` QR **or** paste registration code
3. Must be **confirmed**, same event, valid token, not already checked in
4. Creates `CheckIn` (`SCAN` | `MANUAL` | `CODE`)
5. UI shows running totals checked-in / confirmed

---

## 5. Route map

### Organize (private + onboarded)

| Path | Screen |
|------|--------|
| `/organize` | Home — your profiles |
| `/organize/new` | New organizer profile |
| `/organize/[slug]` | Dashboard |
| `/organize/[slug]/payouts` | Payouts |
| `/organize/[slug]/events/new` | Create draft |
| `/organize/[slug]/events/[eventId]` | Manage |
| `/organize/[slug]/events/[eventId]/edit` | Edit stepper |
| `/organize/[slug]/events/[eventId]/check-in` | Door check-in |

### Related

| Path | Notes |
|------|--------|
| `/login`, `/auth/callback` | Auth |
| `/profile` | Onboarding + dancer card |
| `/discover`, `/events`, `/events/[slug]` | Public board |
| `/tickets` | Passes |
| `/check-in` | Generic private check-in entry (event-scoped path is the real door tool) |
| `/pay/cashfree` | Checkout helper |
| `/organizers` | Placeholder |

### Key API groups

- `POST/GET /v1/organizers…` — create, mine, by slug, events, categories, days, media, publish/unpublish, payment-account, check-in
- `GET /v1/events`, `GET /v1/events/:slug` — public discovery
- `POST /v1/registrations`, `…/confirm-free`, `…/cancel`, checkout/reconcile
- `GET /v1/me` — identity + onboarding flag

---

## 6. Database schema (journey slice)

### Identity

```
User 1──1 Profile
User 1──* AuthIdentity   (SUPABASE | …)
```

- **User** — canonical Cypher id (domain FKs point here, never raw Supabase id)
- **AuthIdentity** — `provider` + `providerUserId` unique
- **Profile** — name, dancerName, city, crew, Instagram, `onboardedAt`, `platformRole`, `status`

### Organizer

```
User ──createdBy──► Organizer
Organizer 1──* OrganizerMember *──1 User
Organizer 1──0..1 OrganizerPaymentAccount
```

| Model | Important fields |
|--------|------------------|
| **Organizer** | `orgName`, `slug`, `type`, `city`, `verificationStatus`, `bio`, `instagram`, `createdBy` |
| **OrganizerMember** | PK `(organizerId, userId)`, `role` = owner \| manager \| editor |
| **OrganizerPaymentAccount** | Cashfree vendor ids, bank/UPI fields, `status`, **`payoutReady`** |

### Event

```
Organizer 1──* Event
Event 1──* EventCategory
Event 1──* EventDay
EventCategory *──* EventDay (EventCategoryDay)
EventCategory 1──* CategoryPriceTier
Event *──* DanceStyle (EventDanceStyle)
Event 1──* MediaLink / EventUpdate / EventLineupPerson
```

| Model | Important fields |
|--------|------------------|
| **Event** | `slug`, `title`, `eventType`, `city`, `venue`, lat/lng, `startTime`/`endTime`, reg window, `posterUrl`, `status`, tags |
| **EventCategory** | `name`, `entryType` (solo\|team\|viewer), team sizes, `priceMinor`, `capacity`, `reservedCount`, `confirmedCount` |
| **EventDay** | multi-day labels + times |
| **CategoryPriceTier** | early-bird windows |

**EventStatus:** `draft` → `published` → `registration_closed` → `completed` (also `cancelled`)

### Registration & door

```
EventCategory 1──* Registration *──1 User
Registration 1──* RegistrationParticipant
Registration 1──0..1 CheckIn
Registration 1──* PaymentOrder → Payment
```

| Model | Important fields |
|--------|------------------|
| **Registration** | `registrationStatus`, payment fields, `registrationCode`, `ticketQrToken`, hold expiry |
| **RegistrationParticipant** | dancer names / team roster |
| **CheckIn** | 1:1 with registration; `channel` SCAN \| MANUAL \| CODE |
| **PaymentOrder / Payment / PaymentWebhookEvent** | Cashfree path |

### Useful enums

- `OrganizerType` — independent, collective, college, studio, community, other  
- `OrganizerVerificationStatus` — pending, verified, rejected  
- `CategoryEntryType` — solo, team, viewer  
- `EventType` — battle, jam, cypher, session, workshop, …  
- `RegistrationStatus` — pending_payment, confirmed, waitlist, expired, cancelled, refunded  

---

## 7. State machines

### Event

```
draft ──publish──► published ──unpublish──► draft
published ──► registration_closed ──► completed
any (ops) ──► cancelled   (cancelled cannot publish again)
```

### Registration

```
(create hold) → pending_payment
  ├─ confirm-free (₹0) ──► confirmed ──► check-in
  ├─ pay + reconcile   ──► confirmed ──► check-in
  ├─ cancel            ──► cancelled (release reserved)
  └─ hold expiry       ──► expired   (worker releases reserved)
```

---

## 8. Edge cases & errors (as coded)

| Situation | What happens |
|-----------|----------------|
| Anon hits `/organize` | Redirect to login |
| Needs onboarding | Redirect / gate to `/profile` |
| Not a member of org | `403 Not an organizer member` |
| Editor tries publish | `403 Insufficient organizer permission` |
| Org not verified | `403` on publish (rare for new orgs — create auto-verifies) |
| Publish paid without payouts | `400` — set up Cashfree / bank or UPI |
| Publish cancelled event | `400` |
| Publish with **zero** categories | **Allowed** |
| Delete category with holds/confirmed | `400` |
| Delete category with existing registrations | `400` |
| Capacity set below occupied | `400` |
| Put `viewer` inside compete `categories[]` on create | `400` — use audience pass API |
| Register on non-published | `400` Event not open |
| Category full | `409` + UI disables Compete/Watch |
| Duplicate active entry (same user/teammate) | `409` |
| Free-confirm on paid hold | `400` |
| Cashfree not configured | `503` on checkout |
| Check-in: not confirmed / wrong event / bad QR | `400` |
| Check-in: already checked in | `409` |
| Camera / BarcodeDetector missing | Fall back to paste code (HTTPS needed for camera) |
| Organizer slug collision | Retries unique slug; else `409` |
| Public `/organizers` | Placeholder — no live list |

---

## 9. Permission matrix

| Action | owner | manager | editor |
|--------|:-----:|:-------:|:------:|
| Create/edit event & categories | ✓ | ✓ | ✓ |
| Publish / unpublish | ✓ | ✓ | ✗ |
| Payout setup | ✓ | ✗ | ✗ |
| View registrations | ✓ | ✓ | ✓ |
| Check-in | ✓ | ✓ | ✓ |
| View payment account | ✓ | ✓ | ✓ |

---

## 10. Free vs paid (current product truth)

| | Free (₹0) | Paid |
|--|-----------|------|
| Payouts / bank-UPI | Not required to publish or confirm | Required before saving paid prices / publish / checkout |
| Categories | Optional | Needed only if you want paid registration lanes |
| Dancer flow | Hold → Confirm → Pass | Hold → Cashfree → Pass |
| Organizer dashboard banner | Still nudges “connect bank/UPI” | Same banner until ready |

**Known product gap (called out in product discussions):** free session flow still feels heavy (same editor stepper / registration dialog as battles). Not redesigned yet.

---

## 11. Quirks / as-implemented notes

1. **Auto-verified on create** — schema default is `pending`, but `createOrganizer` always writes `verified`. No human verification step in Phase 1 UI.
2. **Categories optional at publish** — announcement / free session nights can go live with no lanes; registration CTAs then have nothing to sell.
3. **“Last category” delete** — Swagger text may say blocked; service allows deleting the last empty category on a published event.
4. **Public organizer directory** — not built; discovery is event-centric.
5. **Teammate invites** — roles exist in schema; no invite UI yet.
6. **Payments code** — Cashfree Easy Split paths exist; product direction may move to PhonePe — treat payment UI as “paid path present,” not final PG brand.

---

## 12. File index (for engineers)

| Area | Paths |
|------|--------|
| Auth / gates | `apps/web/features/auth/*`, `apps/web/lib/auth-routes.ts`, `apps/web/features/organize/OrganizeGate.tsx` |
| Create org | `apps/web/features/organize/CreateOrganizerForm.tsx`, `apps/api/.../organizers.service.ts` |
| Dashboard / manage | `OrganizeHome.tsx`, `OrganizerDashboard.tsx`, `EventManageView.tsx` |
| Event editor | `EventEditor.tsx`, `EventEditStepper.tsx`, `EventEditNextSteps.tsx`, `EventDaysPricingPanel.tsx`, `EventEarlyBirdPanel.tsx` |
| Payouts | `PayoutSetupPanel.tsx`, `OrganizerNextSteps.tsx`, payments module |
| Public event + register | `apps/web/app/(app)/events/[slug]/page.tsx`, `RegisterCta.tsx`, `OpenRegisterButton.tsx` |
| Tickets | `Bynd8Pass.tsx`, `TicketsBoard.tsx` |
| Check-in | `CheckInPanel.tsx`, check-in module |
| Schema | `prisma/schema.prisma` |
| Publish gates | `packages/validation/src/event-gates.ts` |

---

*Generated from the codebase as of 2026-09-12. Update this doc when publish rules, payout PG, or free-flow UX change.*

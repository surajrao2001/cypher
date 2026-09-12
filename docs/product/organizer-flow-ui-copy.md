# BYND8 — Organizer journey UI / UX + copy (current)

**What this is:** How we *show* each step to the user today — layout pattern + exact (or near-exact) copy — in **user-journey order** from login → check-in.

**Companion:** technical flow / schema → [`organizer-flow-current.md`](./organizer-flow-current.md)

**Voice notes in product today:** mix of clean product UI + casual “hood” toast lines (`toaster.tsx`). Kickers are small uppercase orange labels; titles use display / impact type.

---

## Journey index

1. [Login](#1-login)
2. [Onboarding (dancer card)](#2-onboarding-dancer-card)
3. [Organize gate states](#3-organize-gate-states)
4. [Organize home](#4-organize-home)
5. [New organizer profile](#5-new-organizer-profile)
6. [Organizer dashboard](#6-organizer-dashboard)
7. [Payouts / bank–UPI](#7-payouts--bankupi)
8. [Create / edit event (stepper)](#8-create--edit-event-stepper)
9. [Event manage](#9-event-manage)
10. [Public event (what dancers see)](#10-public-event-what-dancers-see)
11. [Register dialog (Compete / Watch)](#11-register-dialog-compete--watch)
12. [Tickets / BYND8 Pass](#12-tickets--bynd8-pass)
13. [Check-in (door)](#13-check-in-door)
14. [Toasts (shared microcopy)](#14-toasts-shared-microcopy)

---

## 1. Login

**Route:** `/login`  
**How it’s shown:** Centered column on dark floor photography (login story carousel). Brand lockup + optional early-access badge above form. White Google button; email below an “or” rule.

| Element | Copy |
|---------|------|
| Kicker | `Sign in` |
| Title | `Enter the scene` |
| Body | `Continue with Google or email. Your dancer card stays yours.` |
| Primary CTA | `Continue with Google` / pending `Waiting for Google…` |
| Divider | `or` |
| Field | `Email` · placeholder `you@example.com` |
| Secondary CTA | `Email me a sign-in link` / `Sending link…` |
| Success info | `Check {email} for a sign-in link. You can close this tab after you open it.` |
| Legal | `By continuing, you agree to BYND8's Terms of Use and Privacy Policy. For paid events, also see our Cancellation & Refund Policy.` |
| Footer line | `The culture is the centre. BYND8 builds around it.` |

**UX:** Full-bleed cultural photos under heavy veil (login only). Form is the sole job of the first viewport aside from brand.

---

## 2. Onboarding (dancer card)

**Route:** `/profile` when `needsOnboarding`  
**How it’s shown:** Narrow column (`max-w-lg`), soft orange radial glow behind header, brand mark, stacked form — not a dashboard.

| Element | Copy |
|---------|------|
| Kicker | `You’re in · one more thing` |
| Title | `Who’s on the card?` |
| Body | `Name + city and you’re on the list. Props for showing up. Crew and styles can wait — no pressure.` |
| Field 1 | **What should we call you, cuh?** · badge `needed` · hint `Floor name, IG name, whatever you reppin’ — shows on tickets and the scene` · placeholder `e.g. B-Boy Rex, Aisha…` |
| Field 2 | **Where you based?** · `needed` · placeholder `Mumbai, Bengaluru…` |
| Field 3 | **Crew** · `optional` · placeholder `If you ride with one` |
| Field 4 | **Styles** · `optional` · hint `Comma-separated for now` · placeholder `Breaking, Hip Hop…` |
| Field 5 | **Instagram** · `optional` · placeholder `@handle` |
| CTA | `Let’s go` / `Saving…` |

**Toast on success:** `Profile locked. They know what to call you.`

---

## 3. Organize gate states

**Wraps all `/organize/*`.** Full-page empty states (kicker + big title + body + one CTA).

### Not signed in

| | |
|--|--|
| Kicker | `Organize` |
| Title | `Sign in to run the floor` |
| Body | `Sign in with Google or email to create an organizer. Same account — membership comes from the org you create.` |
| CTA | `Sign in` |

### Needs onboarding

| | |
|--|--|
| Kicker | `Organize` |
| Title | `Tell us what to call you first` |
| Body | `Drop your name and city on Profile, then come back to run a crew.` |
| CTA | `Open profile` |

### Loading

Spinner label: `Loading session`

---

## 4. Organize home

**Route:** `/organize`  
**How it’s shown:** Page header left + CTA right; then either empty state or **3-col card grid** of org profiles + dashed “create another” tile.

### Header

| | |
|--|--|
| Title | `Organize` |
| Sub | `Pick a crew, then manage nights — not a dashboard of KPIs.` |
| CTA | `+ New organizer profile` |

### Empty (zero orgs)

| | |
|--|--|
| Kicker | `No crews yet` |
| Title | `Create an organizer profile` |
| Body | `Any signed-in dancer can set up a profile for the crew or brand that runs nights.` |
| CTA | `New organizer profile` |

### Org card (each profile)

- Avatar initials in rounded square  
- **Name** + line `{type} · {city}`  
- Footer stats: `Events` / `Registrations` / `Live now`  
- Dashed tile: big `+` · `Create another organizer profile`

### Loading / error

- `Loading your crews`  
- Soft error title: `Couldn’t load organizers`

---

## 5. New organizer profile

**Route:** `/organize/new`  
**How it’s shown:** Left-aligned intro (`max-w-2xl`) + **bordered surface form** with **2-column grid** on desktop (not a skinny centered stack). Type is a **native dropdown**, not radio cards.

| Element | Copy |
|---------|------|
| Kicker | `Organize` |
| Title | `New organizer profile` |
| Body | `Name the crew or brand that runs nights. You can create events right after this.` |
| Organizer name | placeholder `Mumbai City Breakers` |
| Organizer type | Dropdown labels: Independent, Collective / crew, College, Studio, Community, Other — hint under select changes with choice (e.g. Independent → `Solo organizer or freestyle crew lead`) |
| City | placeholder `Mumbai` |
| URL slug | `(optional)` · placeholder `mumbai-city-breakers` |
| Instagram | `(optional)` · `@crew` |
| Bio | `(optional)` textarea |
| CTA | `Create profile` / `Creating…` · ghost `Cancel` |

**Toast:** `Crew’s on the map. Time to throw something.` → redirect to dashboard `?welcome=1`

---

## 6. Organizer dashboard

**Route:** `/organize/[slug]`  
**How it’s shown:** Breadcrumb → header (kicker + org name + meta) → optional payouts banner → underline tabs → event **list rows** (poster thumb + title + badge + stats), not KPI tiles.

### Header

| | |
|--|--|
| Breadcrumb | `Organize` / `{orgName}` |
| Kicker | `Your events` |
| Title | `{orgName}` |
| Meta | `{type} · {city} · All organizers` (link) |
| Badge if ready | `Payouts connected` (lime) |
| CTA | `+ New event` |

### Payouts banner (when not connected)

Orange-tinted horizontal bar:

| | |
|--|--|
| Title | `Payouts not connected` |
| Body | `Add bank or UPI to receive money from paid entries and audience passes.` |
| CTA | `Connect bank or UPI` / `Hide setup` |

### Tabs

`All` · `Draft` · `Live` · `Past`  
(Active = orange underline)

### Empty events

| | Zero events | Tab empty |
|--|-------------|-----------|
| Kicker | `First night` | `This tab` |
| Title | `No events yet` | `Nothing in this tab` |
| Body | `Create a night — poster, categories, then publish. Manage registrations and door from the event.` | `Switch tabs, or create another event for this crew.` |
| CTA | `Create your first event` | `New event` |

### Event row

- Poster 3:4 thumb (or gradient placeholder)  
- Title + badge (`Live` if published, else raw status)  
- `{date} · {city}`  
- `{n} registered` · optional `{₹} collected` · optional `payout ready`  
- Desktop: `Open event →`

---

## 7. Payouts / bank–UPI

Shown expanded from dashboard banner, event **Payouts** tab, or `/organize/[slug]/payouts`.

### Banner panel (`OrganizerNextSteps`)

| | |
|--|--|
| Kicker | `Payouts` |
| Title | `Add bank or UPI for paid entries` (or `Update payout details`) |
| Body | `Needed only when you charge entry or audience fees. Free (₹0) nights work without this.` |
| CTA | `Connect bank or UPI` · optional `Create first event` |

### Setup panel (`PayoutSetupPanel`)

| | |
|--|--|
| Heading | `Ready to get paid` / `Bank / UPI not set yet` |
| Body | `Paid ticket money can go to your linked bank or UPI after dancers checkout.` |
| Empty CTA card | Title `Where should the money land?` · Body `Free nights don’t need this. Paid tickets do — bank or UPI, your call. Cashfree handles the boring paperwork.` · `Add bank or UPI` |
| Fields | Display name, contact email, phone, PAN (hint: sandbox test PAN), then toggle **Bank account** vs **UPI** |
| Note | `Cashfree accepts one payout method — bank or UPI, not both.` |
| CTAs | `Add bank or UPI` / `Connect UPI` / `Update bank / UPI` |
| Footer nudge | `Link bank or UPI when tickets cost more than ₹0, so dancer payments can reach you.` |

**Toasts:** success `Payout setup saved. Check Cashfree if they ping you.` · fail `Payout setup tripped. Check the fields.`

---

## 8. Create / edit event (stepper)

**Routes:**  
`/organize/[slug]/events/new` · `/organize/[slug]/events/[eventId]/edit`

**How it’s shown:** Breadcrumb → big title → status bar with Publish → **horizontal numbered pills** (one step at a time) → step body → bottom nav Previous / Next.

### Chrome

| Element | Copy |
|---------|------|
| Title | `New night` / `Edit event` |
| Status card title | `New draft` / `Draft` / `Published` / other status |
| Status card body | New: `Fill What’s cooking and save — then add categories and the rest` · Draft: `Not visible publicly until you publish` · Live: `Visible on Discover and Events` |
| Status badge | `draft` / `published` / … + event type outline badge |
| Publish CTA | `Publish` / `Unpublish` |

### Stepper pills

`1 What’s cooking` · `2 Categories` · `3 Viewers` · `4 Early bird` · `5 Media`  
(Active pill: orange border + filled number)

### Fresh-draft callout (`EventEditNextSteps`, only with `?fresh=1`)

| | |
|--|--|
| Kicker | `Draft saved` |
| Title | `Add more when you’re ready` |
| Body | `You can publish now, or flesh out categories, viewers, poster, and media anytime.` |
| Dismiss | `Got it` |
| Checklist rows (all optional) | See titles/bodies below |
| Footer | `Hit Publish up top whenever the night is ready to show on Discover.` |

Checklist item copy:

| Title | Body |
|-------|------|
| `Add categories (optional)` | `1v1, crew, prelims — only if people register to compete. Skip for a free session or open floor.` |
| `Viewers pass (optional)` | `One-day: a single pass. Multi-day: per-day + full-run passes on that step.` |
| `Early bird (optional)` | `Per category and viewers pass — regular is filled from your prices; you set early bird.` |
| `Poster / flyer (optional)` | `Looks better on Discover. Drop it under What’s cooking.` |
| `Media links (optional)` | `YouTube / IG / Drive — rules, aftermovies, vibes.` |

### Step 1 — What’s cooking

| Field labels / hints | |
|----------------------|--|
| Event name | placeholder `What’s the night called?` |
| Event type | Grouped select (Competition / Practice / Learning / …) + type hint under |
| City, start, end, reg open/close, venue, map pin, poster, description, styles | Standard labeled fields; styles required to save |
| Locked later steps | Dashed notice: `Save What’s cooking first — then categories, viewers, early bird, and media unlock here.` |
| CTA | `Save what’s cooking` · `Next` · `Back to event` / `Cancel` |

**Toast:** `What’s cooking is locked. Floor’s got a date.` · first create also `Draft’s in the bag. Categories next — don’t ghost it.`

### Step 2 — Categories

| | |
|--|--|
| Heading | `Categories` · aside `1v1 / crew · prelims · exhibition` |
| Intro | `How people enter — the format. Solo, pairs, or full crew against another. Tap a chip or type your own.` |
| Empty | `No categories yet. Optional for free sessions — add 1v1 / 2v2 / open if people need to register.` |
| Fields | Category name · Spots · Team size (`1 = solo · 2 = duo`) · Fee (₹) with `0 = free · Early bird is on step 4` |
| Actions | `Save category` · `Remove` · `Add category` |

### Step 3 — Viewers

| | |
|--|--|
| Heading | `Viewers` |
| Intro (single-day) | `For people who come to watch — not compete. Optional if it’s compete-only.` |
| Checkbox | **Sell a viewers pass** · `Crowd who aren’t entering a category` |
| Fields | Pass fee (₹) · Viewer spots |
| CTA | `Save viewers pass` |

**Toasts:** `Viewers pass is live…` / `Viewers pass off…`

### Step 4 — Early bird

| | |
|--|--|
| Heading | `Early bird` |
| Body | `Each category and viewers pass gets its own early bird. Regular is filled from the price you already set — type the early bird amount and when it ends.` |
| Per ticket | Checkbox + name · badge `Viewers` / `Compete` · Early bird (₹) · Regular (₹) · Early bird ends |
| CTA | `Save early bird` |

### Step 5 — Media

Heading `Media` + link editor (add YouTube / IG / Drive).  
**Toasts:** `Link dropped…` / `Link yeeted.`

---

## 9. Event manage

**Route:** `/organize/[slug]/events/[eventId]`  
**How it’s shown:** Big event title + status badges + action button row → underline tabs with icons → tab panels.

### Header actions

`Check in` · `Edit` · `Post update` · `Publish`/`Unpublish` · (if live) `Public page`

### Tabs

`Overview` · `Registrations` · `Updates` · `Media` · `Payouts`

### Overview

| Block | Copy |
|-------|------|
| Summary strip | `{n} confirmed` · optional `{n} held` · `Door ops and registrations for this night — not a BI dashboard.` · CTA `Open check-in` |
| Category fill | Section title `Category fill` · progress bars per compete category |
| Empty categories | Kicker `Categories` · `Nothing to fill yet` · `Add a 1v1, 2v2, or open category in Edit — empty brackets are just vibes.` |
| Quiet night | Kicker `Quiet night` · `Nobody’s locked a spot` · `Share the public page. Dancers won’t find you through telepathy (we checked).` · CTA `Registrations` |
| About | Kicker `About` + description |

### Registrations tab

| State | Copy |
|-------|------|
| No categories | Kicker `Categories first` · `Can’t register into thin air` · `Add a compete or audience category in Edit, then this list fills as people lock spots.` |
| Header | Kicker `Entries` + filters (category, status, Search) |
| Empty list | `Empty floor` · `Nobody’s locked a spot` · `Share the public event page. Waiting for telepathy is not a growth strategy.` |
| Filter miss | `Filters` · `Nobody matches that combo` · `Try another category or status — or clear search.` |

### Media tab empty

Kicker `Media` · `No links on the wall` · `Drop YouTube, IG, or Drive in Edit. We don’t host the aftermovie (your hard drive does).`

### Updates

Organizer can **Post update** (dialog) — posts appear on public event under **Updates**.

---

## 10. Public event (what dancers see)

**Route:** `/events/[slug]`  
**How it’s shown:** Full-bleed poster hero → two-column body (content + sticky sidebar) → fixed bottom register bar.

### Hero

- Back: `← Events`  
- Type / style pills + spots tone  
- Big title · `by {organizer} · {city}`

### Sections

| Section | Presentation |
|---------|----------------|
| About | Small muted label `About` + paragraph |
| Compete | Label `Compete` · rows: category name + price/spots · CTA **Get in** (opens register dialog) |
| Compete empty | `No compete categories yet` + watch-only or “hasn’t opened” body |
| Watch | Label `Watch` · lime-edged card `Audience pass` · `Presence without entering a category — still a real pass at the door.` · **Watch the floor** |
| Venue | Map block when pin exists |
| Sidebar | Date / Venue / Organizer / Spots + **Compete** / **Watch the floor** · micro `Free and paid entries both end in a pass + QR.` |

### Sticky bar

| | |
|--|--|
| Kicker | `Get in` (or `Category full`) |
| Headline | Price / `Free entry` / `N categories` / `Sold out` / `Viewers open` |
| Sub | Category · spots · viewers note |
| Buttons | Same Compete / Watch as dialog triggers |

---

## 11. Register dialog (Compete / Watch)

**How it’s shown:** Modal dialog over the event; step chips when multi-step (`Category` / `Details` / `Pay` / `Confirm`).

| Mode | Title | Description |
|------|-------|-------------|
| Compete | `Compete registration` | `Pick a lane, add your crew, then confirm.` |
| Watch | `Viewers pass` | `One pass for the floor — no battle category needed.` |
| Done | `You’re in` | `Pass confirmed. Open Tickets for your QR.` |

| State | Copy |
|-------|------|
| Logged out | `Sign in to hold a spot.` · CTA `Sign in` |
| Buttons (bar) | `Compete` / `Compete sold out` · `Watch · Free` / `Watch · from ₹…` / `Viewers sold out` · `Registration closed` |
| Free hold | Status `Confirm free entry` |
| Paid hold | Status `Spot held` · field `Mobile for payment` |
| Confirmed | Status `Confirmed` · link to Tickets |

**Toasts:** `Spot’s held…` · `Confirmed. See you on the floor.` · pay lines as in §14.

---

## 12. Tickets / BYND8 Pass

**Route:** `/tickets`  
**How it’s shown:** Wallet header + tabs; passes as **compact vertical stubs** (~phone width), not wide horizontal cards.

### Board

| | |
|--|--|
| Kicker | `Wallet` |
| Title | `Your passes` |
| Body | `Not a receipt — your credential for the night. Tap Show at door for a full-screen QR.` |
| Tabs | `Needs action` · `Upcoming` · `Past` |

### Pass chrome

| Band | Copy |
|------|------|
| Status strip | `YOU'RE ON THE LIST` / `HOLD — FINISH CONFIRM` / `USED / PAST` / status text |
| Orange band | `BYND8 PASS · COMPETITOR` or `… · AUDIENCE` + category / `Watch` |
| Body | Event title · date · city |
| Holder | Label `Competitor` or `Attendee` · **dancer name only** (no organizer under name) · code · Free/₹ |
| Tear + QR | `Tap to enlarge` |
| Actions | `Event` · `At door` · `Confirm` / `I already paid` |
| Enlarge dialog | `Show at the door` |

Empty wallet: `No passes yet` · `Register for a night — your BYND8 Pass lands here with a door QR.`

---

## 13. Check-in (door)

**Route:** `/organize/[slug]/events/[eventId]/check-in`  
**How it’s shown:** Compact ops page — camera preview box, start/stop, code field, lime flash on success, two stat tiles, door list.

| Element | Copy |
|---------|------|
| Kicker | `Door ops` |
| Title | `Check-in` |
| Body | `Point the camera at a ticket QR, or type / paste the registration code.` |
| Camera idle | `Camera off — start scan for door QR, or use the field below.` |
| CTAs | `Start camera` / `Stop camera` |
| Field | placeholder `QR payload or registration code` · button `Check in` / `Checking…` |
| Success flash | Title `Checked in` · `Ready for the next scan.` |
| Stats | `Checked in` · `Confirmed` |
| Empty list | Kicker `Door list` · `No scans yet` · `Start the camera or enter a registration code — confirmed guests appear here as they check in.` |

**Hints (conditional):** HTTPS needed · browser can’t open camera · paste QR payload · permission failures.

---

## 14. Toasts (shared microcopy)

Casual short lines (top-right, dark toast). Organizer-relevant subset:

| Key | Line |
|-----|------|
| basicsSaved | `What’s cooking is locked. Floor’s got a date.` |
| draftSaved | `Draft’s in the bag. Categories next — don’t ghost it.` |
| published | `It’s live on Discover. Go pull the room.` |
| unpublished | `Back to draft. Nobody sees it but you.` |
| categoryAdded | `New category on the board. Nice.` |
| categoryNameNeeded | `Gotta name the category first, cuh.` |
| earlyBirdSaved | `Early bird locked for that ticket.` / `…for N tickets.` |
| mediaAdded | `Link dropped. Poster’s not lonely anymore.` |
| mediaRemoved | `Link yeeted.` |
| organizerCreated | `Crew’s on the map. Time to throw something.` |
| posterUploaded | `Poster looks hard. Saved.` |
| payoutStarted | `Payout setup saved. Check Cashfree if they ping you.` |
| publishing | `Flipping the switch…` |
| saving | `Saving… hold up.` |
| publishFailed | `Publish didn’t land. One more try.` |
| saveFailed | `That save bounced. Try again?` |

Dancer register subset: `registered`, `confirmed`, `payDone`, `payFailed`, etc. (same toaster file).

---

## Pattern cheat-sheet (how we present UI)

| Pattern | Where |
|---------|--------|
| **Kicker** (11px uppercase orange) | Almost every page header |
| **Display title** (impact / huge) | Page H1s |
| **EmptyState** (kicker + title + body + CTA) | Gates, empties |
| **Underline tabs** | Dashboard, event manage, tickets |
| **Numbered pill stepper** | Event edit only |
| **List rows with poster thumb** | Dashboard events |
| **Poster-overlay cards** | Discover / Events (public) |
| **Sticky bottom bar** | Public event register |
| **Vertical pass stub** | Tickets |
| **Lime success flash** | Check-in success |
| **Orange banner** | Payouts not connected |

---

*Snapshot of live copy in `apps/web` as of 2026-09-12. Update when strings change.*

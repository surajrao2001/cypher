# BYND8 × UTC competitive UX audit

**Branch:** `research/utc-ux-competitive-audit`  
**Date:** 2026-09-11  
**Status:** Research + recommendations only — **no UI code changes yet**  
**Sources:** Live browse of [utc.dance](https://utc.dance) (homepage, Events, Rankings skeleton); Apple App Store listing + screenshot carousel; Google Play listing + copy; App Store release notes (Fight Night / tickets / check-in); BYND8 codebase (`apps/web`).

**Evidence legend**

| Tag | Meaning |
|-----|---------|
| **Observed** | Directly seen on live site, store listing, or screenshot carousel |
| **From notes** | Stated in App Store / Play copy or release notes (not independently walked in-app) |
| **Inferred** | Reasonable product/UX inference; treat as hypothesis |
| **Code** | Confirmed in BYND8 `apps/web` |

---

## 1. UTC research summary

### Product posture (Observed + From notes)

UTC positions as an **all-in-one street dance platform**: battles, jams, workshops/classes, live ops, rankings, organizer tools. Marketing spine on web:

1. **Get in** — one checkout, fees visible before pay  
2. **Battle** — live panel scoring / broadcast metaphor  
3. **Rated** — one career number that “follows you”

Split CTAs are intentional: **Find my first battle** vs **I run events** — consumer and organizer enter as peers, not “admin login.”

### Visual system (Observed)

- Near-black full-bleed culture photography in hero  
- Bold italic/impact display type; **red accent** (not BYND8 orange/lime)  
- Sports/broadcast framing for battle UI mock (“LIVE”, round labels, scoreboard)  
- App Store “Fight Night” redesign: editorial, champion-gold accents, light + dark themes (**From notes**)

### Discovery (Observed)

- Nav: Corner · Events · Classes · Live · Rankings · More  
- Events: search (“events, venues, organizers”), style filter, **This weekend**, **Near me**, chips: All / Rated / Open floor / Battles / Workshops / Jams  
- Empty geo state (Observed): *“No events found in your area”* + *“Check back soon or browse events in other locations”* + **Browse all cities** — empty is instructional, not a blank card grid  
- App screenshots: style chips, Upcoming/Past, large featured poster card + denser list rows (**Observed** via App Store)

### Event detail (Observed via App Store screenshots)

- Poster-led hero; strong title; date/time/map  
- Organizer row with Follow + socials  
- Day-grouped schedule; pass inclusion badges  
- “Who’s in” social proof  
- Sticky **GET TICKETS** with price  

### Tickets / passes (Observed + From notes)

- Pass treated as **object**: event artwork on top, white operational band, large QR, attendee name + category (**Observed** screenshot)  
- Tap-to-enlarge QR (**From notes**, Fight Night)  
- Tabs: Ticket Access / Registration; order + event links  
- Check-in count banner on pass (**Observed**)

### Registration / checkout (Observed via screenshots)

- Multi-pass basket (viewer vs floor vs compete) with +/- quantity  
- Scarcity + price-change microcopy  
- Single pay CTA with total  

### Organizer / event-day (From notes; limited public web)

Play/App copy: promote, sell tickets, tournaments, judge, scan entry.  
Fight Night release: **MC console**, Run of Show rail, prelims tracker, round timer, redesigned check-in, instant attendance updates.  
Waiver management for door compliance (**From notes**).

### Profile / rankings (Observed + From notes)

- Rankings is a first-class nav item; list skeleton denser than SaaS KPI dashboards (**Observed**)  
- Career rating is the identity hook on marketing (**Observed**)  
- Social links on dancer profiles (**From notes** v3.9)

### What we could not fully verify live

- Authenticated organizer dashboard, live QR scan UI, payout screens, in-flow ticket after purchase  
- Indian market density (Events empty for our geo at research time)  
Treat ticket/organizer depth below as **screenshot + release-note** grade unless later signed-in research is added.

---

## 2. Top UX lessons (reinterpret for BYND8 — do not clone)

1. **Event is the primary object** — discovery, tickets, and organize all orbit a night, not “orders” or “users.”  
2. **Passes feel like identity credentials**, not receipts — artwork + role + person + QR.  
3. **Culture survives into ops** — fight-night / floor language on functional screens.  
4. **Dual entry without dual products** — clear dancer vs organizer paths from the same brand surface.  
5. **Checkout honesty** — fee and total before pay; one basket for compete + watch.  
6. **Empty states teach the next action** — UTC empty Events still explains *what to do* (browse other cities).  
7. **Door UX is speed-first** — large QR, enlarge on tap, fast check-in feedback (**From notes**).  
8. **Organizer tools are event-day tools** — run-of-show / check-in over BI dashboards (**From notes**).  
9. **Mobile-first for night-of** — hosts and dancers both on phone.  
10. **Broadcast hierarchy for competition** — reserved for **post-V1** battles; useful as layout grammar later.

---

## 3. What not to copy

- Red / gold Fight Night palette, italic impact display, UC wordmark  
- Career **Glicko ranking** as a V1 pillar  
- Brackets, MC console, live judging, waiver system (out of V1 scope)  
- “Corner / Live / Rankings” IA as mandatory tabs  
- Exact pass layout (artwork-over-white-QR card)  
- Scarcity copy tone if it feels fake for Indian free/paid cyphers  
- Enterprise “everything in one app” feature sprawl before door+register is sharp

---

## Cross-cutting: empty & sparse states (user directive)

**Rule for BYND8:** Never leave a dashed/empty *box* that only implies absence. Every empty surface must answer:

1. What is this place for?  
2. What should I do now?  
3. One primary CTA (and optional secondary)

**Code gaps today**

| Surface | Issue |
|---------|--------|
| Organizer dashboard empty events | Muted paragraph only — no Create event button in empty block |
| Ticket tab empty | “Nothing in this tab.” — no CTA |
| Event detail empty categories | “No compete categories yet.” — no path for dancer |
| Discover filter empty | Better — has Clear filters |
| Organize no orgs / Tickets none | Better — real EmptyState + CTA |

Apply this rule in every redesign/refine ticket below.

---

## 4. BYND8 screen audit

| Screen | Current quality | Verdict | UTC lesson | BYND8 recommendation | Priority |
|--------|-----------------|---------|------------|----------------------|----------|
| Login | Strong brand (“Enter the scene”), Google/email | **Keep** | Dual path clarity on marketing, not login | Keep; optional secondary line for organizers after auth | P3 |
| Onboarding | Profile fields (dancer name, city, crew, styles) | **Refine** | Identity without ranking | Keep cultural fields; clearer “why we ask”; skippable non-essentials | P2 |
| Discover | Poster-led cards, kickers, spots truth, hero | **Refine** | Featured + density; empty teaches next step | Keep brand voice; tighten first viewport; empty = CTA to clear filters / notify / organize later | P1 |
| Events (nav) | Overlaps Discover; risk of dead twin | **Refine** | Events as clear destination | Either merge with Discover or differentiate (calendar/list); no empty twin | P2 |
| Event detail | Poster hero good; Compete/Watch as Cards/Tables feels SaaS | **Redesign** | Sticky get-tickets; schedule clarity; who’s in | Recompose: poster → when/where → role CTAs (Compete / Watch) → categories as floor choices not spreadsheet | P0 |
| Registration | Hold → confirm/pay exists | **Refine** | Fee honesty; basket clarity | Preserve rules; clearer role + category + hold expiry; no copy of UTC wording | P1 |
| Checkout | Cashfree/PhonePe path; functional | **Refine** | Total before pay | Trust strip (DICE/Stripe-like); plain totals; empty/error CTAs | P1 |
| Tickets | Functional QR + code; reads as order card | **Redesign** | Pass as cultural object | **BYND8 Pass** system (see §6); enlarge QR; role variants | P0 |
| Profile | Form + counts; not a “card” | **Refine** | Identity surface without rankings | Present as dancer card (name/crew/city/styles); no ratings in V1 | P2 |
| Organize home | Org cards + empty CTA good | **Refine** | Event-first over org-admin | Prefer jump to **Your events**; org as container | P1 |
| Organizer dashboard | Stat cards + list; empty weak | **Redesign** | Manage the night, not BI | Event-first list (art, date, regs, payout state, Open); kill vanity KPI grid; empty → Create event | P0 |
| Create event | Stepped editor exists | **Refine** | Culture in ops | Keep stepper; poster-first; fewer SaaS labels | P2 |
| Event manage | Tabs Overview/Regs/Updates/Media/Payouts — good IA | **Refine** | Event-centric tabs | Keep tabs; promote Check-in + Edit as primary actions; stronger overview hero | P1 |
| Registrations | Panel + empties | **Refine** | Ops clarity | Role/category filters; empty “waiting for first entry” + share link CTA | P1 |
| Payouts | Setup panels; trust-sensitive | **Refine** | Honest fees | Stripe-like calm trust; no sports chrome; clear next step when empty | P1 |
| Check-in | Camera + code; speed-oriented | **Refine** | Instant feedback; dark venue | Larger success/fail flash; lime confirm / orange retry; keep decoration minimal | P1 |

---

## 5. Organizer UX recommendation

**Goal:** EVENT-FIRST, NOT DASHBOARD-FIRST.

### Target IA

```
Organize
  → Your events (primary)
  → [optional] Crews / organizers (secondary)

Event
  → Overview | Registrations | Payouts | Media | Updates
  Primary actions: Edit · Check in
```

### Event row content (only meaningful fields)

- Poster · title · date · city · status  
- Registration count · amount collected (if charging) · payout state  
- **Open event**

### Avoid

- Three KPI StatCards as the hero of organize  
- Generic sidebar admin patterns  
- Revenue graphs in V1  
- Empty muted text without CTA  

### Keep from current BYND8

- Event manage tab model (already close)  
- Settlement callout when payouts not connected  
- Poster thumbnails on event rows  

---

## 6. Ticket UX recommendation

### Territory A — Event Credential (recommended primary)

Backstage / battle accreditation card.

- Near-black field · orange category strip · lime status strip  
- Event name · role (COMPETITOR / AUDIENCE) · dancer name · city/date  
- Large QR · registration code · “YOU’RE ON THE LIST.”  
- **Fit:** High cultural ownership, BYND8-native, screenshot-worthy  
- **Scan:** Strong if QR ≥ ~40% of phone width in detail mode  
- **Complexity:** Medium (layout + variants)

### Territory B — Poster Pass

UTC-adjacent: artwork top, ops bottom.

- Strong event identity  
- **Risk:** Closest to UTC; easy to “look like them”  
- Use only as optional accent (thin poster band), not full clone

### Territory C — Minimal Door Pass

Ultra-clean black/off-white, huge QR, orange category, lime confirmed.

- Best pure door speed  
- Weaker share/screenshot culture moment  
- Use as **fullscreen “Show at door”** mode from A

### Recommendation

**Ship A as the default BYND8 Pass; add C as door enlarge mode.** Soft poster band optional later (not B full-bleed).

Audience vs competitor: same chassis; role label + copy differ (“WATCH THE FLOOR.” vs category name).

---

## 7. Navigation / IA observations

| UTC | BYND8 today | Guidance |
|-----|-------------|----------|
| Corner / Events / Classes / Live / Rankings | Discover / Events / Organize / Tickets / Profile | Keep BYND8 set; don’t add Rankings/Live in V1 |
| Marketing dual CTA | Login is dancer-first | Optional post-login Organize affordance |
| Event-centric deep links | Solid routes already | Prefer organize → event over org KPI hub |

**Parked nav:** map / saved / lineup stay out of primary chrome.

---

## 8. Mobile-specific lessons

- Sticky register / pay / check-in CTAs (UTC sticky GET TICKETS)  
- Tap-to-enlarge QR for bright phone in dark venue  
- Check-in success must be glanceable at arm’s length  
- Organizer lists must work one-thumb; avoid dense desktop tables as the only view (event detail categories already have mobile list — good)  
- Empty states must not rely on hover  

---

## 9. Post-V1 ideas (reference only)

Do **not** implement now:

- Career rating / leaderboards  
- Live brackets / prelims / MC run-of-show  
- In-app judging  
- Waivers  
- Team battles as first-class  
- Broadcast “Fight Night” chrome on every screen  

Document for later: sports/broadcast hierarchy, who’s-up-next rails, public score tallies.

---

## 10. Proposed implementation plan

Order by **highest user value / lowest regression risk**. Visual/interaction only; **no** Prisma, Nest contracts, Supabase, payment rules, registration/check-in business logic changes unless separately approved.

| Phase | Work | Why first |
|-------|------|-----------|
| 0 | Empty-state system pass (Discover, Organize, Tickets tabs, Event manage tabs, Event detail empty categories) | Staging will look broken with empty data; low logic risk |
| 1 | **BYND8 Pass** redesign (Tickets) + door enlarge QR | Identity object; screenshot + door |
| 2 | Organizer **event-first** home/dashboard (drop KPI hero; event rows + CTAs) | Matches locked principle; API already list-shaped |
| 3 | Event detail recompose (Compete/Watch hierarchy, sticky CTA, less table-SaaS) | Conversion surface |
| 4 | Registration + checkout trust/clarity copy | Same flows, clearer UI |
| 5 | Check-in feedback polish (contrast, success flash) | Night-of ops |
| 6 | Profile as dancer card; onboarding copy | Identity without rankings |
| 7 | Discover density / Events IA cleanup | Polish after core objects |

**After approval:** new UI branch from `develop`, screen-by-screen PRs, preserve routes/contracts, a11y + responsive checks.

---

## External pattern borrow (not identity)

| Reference | Borrow |
|-----------|--------|
| UTC | Dance-native objects, pass identity, event-first ops |
| Resident Advisor | Culture-led discovery hierarchy |
| DICE | Ticket confidence / enlarge QR |
| Luma | Simple registration calm |
| Playtomic | Consumer + operator in one product without Salesforce feel |
| Stripe | Payout trust |
| Linear | Operational clarity, sparse chrome |

---

## Stop

No code beyond this research artifact until recommendations are reviewed and approved.

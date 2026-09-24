---
status: living
source: Phase G PRD v1.0 (product decisions locked)
landed: 2026-09-22
---

# BYND8 Phase G - Battle Day & Dancer Progression

Product decisions locked

PRD + Architecture v1.0

The next phase of BYND8 will extend the existing event experience into a complete battle-day platform: from competitor check-in and prelims to live brackets, judge scoring, official results, XP, achievements and permanent battle history.

The central product idea is:

Every battle should become a memorable chapter in a dancer's journey, not just another event they attended.

This PRD defines the product requirements, operational workflows, architecture, data model, implementation sequence and boundaries for Cursor.

It is a proposed design based on your decisions and the BYND8 flows you've described. The exact database models, APIs and authorization rules must be checked against the current repository before implementation.

## 1. Locked product decisions

| Area | Decision |
| --- | --- |
| Battle formats | 1v1, 2v2, crew battles and Seven to Smoke, with an extensible format model |
| Prelim judging | Numeric scoring and judge selection |
| Battle judging | Configurable judge decisions and scoring rules |
| XP eligibility | Competing dancers only |
| Competitive rankings | Deferred |
| Progression | XP, levels, achievements and verified battle history |
| Event management | Extend existing event-centric organizer experience |
| Authentication | Preserve existing Google and email magic-link authentication |
| Registration and payments | Preserve existing registration, passes, payment and reconciliation flows |
| Design | Existing BYND8 dark cinematic design system |
| Delivery | Incremental implementation with validation after each phase |

# 2. Product vision

BYND8 currently supports the journey of discovering an event, registering, receiving a pass and checking in.

Phase G introduces three connected experiences.

## BYND8 LIVE

The dancer's event-day companion, showing check-in, performance order, current stage, battle announcements and results.

## BATTLE CONTROL

The organizer and judge workspace for prelims, scoring, match progression, brackets and publishing verified results.

## DANCER PROGRESSION

A persistent record of competition participation, XP, unlocked achievements and event history.

These should be connected experiences, not three disconnected products.

A verified battle result should update the live event, the dancer's battle history and their progression without requiring an organizer to enter the same information multiple times.

# 3. Core user journeys

## 3.1 Dancer journey

1. Before the event

   Register for a battle category, receive a pass, review the event schedule and see when check-in opens.

2. Arrival

   Present the pass, complete check-in and receive confirmation. Eligible early arrivals unlock an achievement and XP.

3. Prelims

   View the assigned group, performance number, current running order and qualification status.

4. Battle

   View the next opponent, match status, battle format and official results as they are published.

5. After the battle

   Receive verified XP, achievement unlocks and a battle-history entry.

6. After the event

   Revisit results, view approved media and access the event record from the dancer profile.

The dancer should never need to manually claim XP for a verified competition result.

The system should derive rewards from authoritative attendance and tournament records.

## 3.2 Organizer journey

The organizer's workflow should be:

Your Events → Select Event → Battle Control.

Within Battle Control, the organizer should be able to configure the tournament, assign judges, prepare the running order, manage prelims, publish qualifiers, run matches and finalize results.

The organizer should not have to configure every tournament detail while initially creating an event.

A Battle event can be published with its basic information and Entry categories, while detailed tournament configuration remains an event-management task.

## 3.3 Judge journey

Judges receive an event-specific assignment.

They open a focused judging interface that shows only the relevant category, current performer or match, scoring controls and submission status.

Judges should not receive general organizer permissions simply because they can submit scores.

# 4. Existing BYND8 architecture: What stays unchanged

Phase G should extend the architecture already implemented during the organizer redesign.

| Existing area | Phase G integration |
| --- | --- |
| Event creation | Preserve the existing type-aware creation flow |
| Entry | Use existing competition categories, prices, capacities and team-size rules |
| Registration | Reuse confirmed competitor registrations |
| Passes | Reuse existing registration/pass identity |
| Check-in | Extend existing QR verification and check-in records |
| Event Home | Add a contextual Battle Control destination |
| People | Reuse registration data; expose competition and attendance status |
| Money | No changes required |
| Event Page | Keep public event information and media management |
| Payments | No provider or settlement changes |
| Profile | Extend with progression and battle history |

The existing records should be authoritative wherever they already represent the required information.

# 5. Battle formats and tournament engine

The most important architectural decision is to separate competition format, preliminary qualification and tournament progression.

A battle category needs to know three things:

* Who is competing: solo dancer, fixed-size team or variable-size crew.

* How competitors qualify: numeric prelim scoring, judge selection or another configured method.

* How the main competition progresses: elimination bracket, Seven to Smoke or another format.

These concepts should not be represented by one overloaded `battleType` field.

## 5.1 Format requirements

FORMAT 01

## 1v1 Battle

Individual dancers enter prelims, qualify and progress through head-to-head matches. Support a configurable qualifier count and optional third-place match.

FORMAT 02

## 2v2 Battle

Two registered dancers form one competitive team. Prelim scores and bracket outcomes belong to the team, while individual members retain their participation and achievement records.

FORMAT 03

## Crew Battle

Variable-size teams compete as one unit. Preserve the existing category's minimum and maximum team-size rules. Each crew member must be linked to the verified team roster.

FORMAT 04

## Seven to Smoke

A configurable pool of competitors participates in a winner-stays-on battle rotation. The engine tracks the current champion, challenger, wins, elapsed time and completion conditions.

## 5.2 Seven to Smoke requirements

Seven to Smoke must have its own progression configuration.

The organizer should be able to define:

| Setting | Purpose |
| --- | --- |
| Participant count | Number of qualified competitors |
| Time limit | Maximum duration of the competition |
| Win target | Number of wins required to finish early |
| Starting order | Initial champion and challenger sequence |
| Challenger rotation | How the next opponent is selected |
| Draw handling | Whether a draw or re-battle is permitted |
| Winner-on-floor rule | Whether the winner remains active |
| End-of-time resolution | How standings and ties are resolved |

An organizer must choose a supported ruleset before the tournament begins. Once competition starts, changes to progression rules should require an explicit, audited administrative action.

### Seven to Smoke progression example

LIVE

SEVEN TO SMOKE

# CURRENT BATTLE

DANCER A

3 wins

On the floor

# VS

DANCER B

1 win

Challenger

Time remaining

### 12:45

Win target

### 7

Illustrative UI; all match outcomes must come from verified judging records.

Seven to Smoke must not be forced into a conventional quarterfinal → semifinal → final bracket.

# 6. Prelims and judging

## 6.1 Prelim configuration

For each competition category, organizers configure:

* Number of judges.

* Numeric scoring or judge selection.

* Scoring criteria and weights, if numeric scoring is used.

* Performance order or group assignments.

* Number of qualifying competitors or teams.

* Tie-breaking rules.

* Whether scores and rankings are public or organizer-only.

Configuration should be saved as a versioned ruleset.

Once scoring begins, changing the ruleset must not silently reinterpret scores already submitted.

## 6.2 Numeric scoring

Numeric scoring allows each judge to evaluate a dancer using configured criteria.

For example, a battle organizer might choose musicality, foundation, creativity and execution.

The scoring engine should support configurable ranges, weights and aggregation rules.

A preliminary score should be stored as an individual judge submission, not just a single total on the competitor record.

That enables score verification, corrections and audit history.

## 6.3 Judge selection

Judge selection is a separate method.

Judges may select a fixed number of qualifiers or rank eligible performers according to the configured method.

The system aggregates submissions using the configured selection rules.

The organizer reviews the result, resolves ties according to the ruleset and publishes the qualifying list.

Do not automatically convert judge selections into numeric scores. These are different methods with different semantics.

## 6.4 Battle judging

For head-to-head matches, the initial engine should support independent judge decisions and a configurable majority or tie-resolution rule.

The organizer can choose a supported judging method for each category.

A match result must not be published until the required submissions are complete or an authorized override has been recorded.

# 7. Battle-day state machine

Use a server-authoritative state machine rather than deriving the competition stage solely from event dates.

REGISTRATION / PREPARATION

CHECK-IN OPEN

PRELIMS IN PROGRESS

QUALIFICATION REVIEW

MAIN COMPETITION

RESULTS REVIEW

RESULTS FINALIZED

This state belongs to the tournament/category, not just the parent event.

A single event might have Hip Hop 1v1 prelims running while its 2v2 category is already in the semifinal stage.

The parent event can expose an overall operational status, but each competition category needs its own lifecycle.

Support paused and cancelled states, controlled reopening and audited corrections.

# 8. BYND8 Live: Dancer-facing experience

Phase G should extend the existing event detail and pass experience, not replace them with a separate dashboard.

The dancer should see a contextual Live entry point when the event-day experience becomes available.

BYND8 LIVE

EVENT DAY

# GROUND ZERO

1v1 Hip Hop · Your battle day

Checked in

COMPETITOR

CURRENT STAGE

# PRELIMS LIVE

Your number: #024

Currently performing: #019

Latest update

Group B prelims have started. Stay near the floor.

VIEW RUNNING ORDER

EVENT UPDATES

The actual screen should be adaptive.

Before check-in, emphasize the pass and venue instructions.

During prelims, emphasize performance order.

During brackets, emphasize the next opponent and match status.

After the event, emphasize verified results, XP, achievements and media.

For team categories, show the team identity and relevant teammates rather than pretending every entry is an individual 1v1 registration.

# 9. XP and achievement system

## 9.1 Core rules

XP is awarded only to verified competing dancers.

An audience pass, organizer role or ordinary spectator check-in does not earn XP under the current product decision.

XP should not be tied to the amount of money spent on registration.

It must not influence judging, qualification, seeding or competitive results.

## 9.2 Proposed XP rewards

## XP reward schedule

Proposed values

<table class="_6IUVGW_Table" data-d-column-sizing="auto" data-d-dividers="" style="table-layout: auto;"><tbody><tr data-d-component="table-row"><td data-d-component="table-cell" data-d-valign="start">Verified competitor check-in</td><td data-d-align="end" data-d-component="table-cell" data-d-valign="start">+40 XP</td></tr><tr data-d-component="table-row"><td data-d-component="table-cell" data-d-valign="start">Early competitor check-in</td><td data-d-align="end" data-d-component="table-cell" data-d-valign="start">+25 XP</td></tr><tr data-d-component="table-row"><td data-d-component="table-cell" data-d-valign="start">Complete prelim participation</td><td data-d-align="end" data-d-component="table-cell" data-d-valign="start">+75 XP</td></tr><tr data-d-component="table-row"><td data-d-component="table-cell" data-d-valign="start">Qualify for main competition</td><td data-d-align="end" data-d-component="table-cell" data-d-valign="start">+50 XP</td></tr><tr data-d-component="table-row"><td data-d-component="table-cell" data-d-valign="start">Reach Top 8</td><td data-d-align="end" data-d-component="table-cell" data-d-valign="start">+75 XP</td></tr><tr data-d-component="table-row"><td data-d-component="table-cell" data-d-valign="start">Reach semifinals</td><td data-d-align="end" data-d-component="table-cell" data-d-valign="start">+100 XP</td></tr><tr data-d-component="table-row"><td data-d-component="table-cell" data-d-valign="start">Reach finals</td><td data-d-align="end" data-d-component="table-cell" data-d-valign="start">+150 XP</td></tr><tr data-d-component="table-row"><td data-d-component="table-cell" data-d-valign="start">Win category</td><td data-d-align="end" data-d-component="table-cell" data-d-valign="start">+250 XP</td></tr></tbody></table>

Values are initial product proposals. The reward policy must define whether stage milestones are cumulative and how different tournament formats map to equivalent achievements.

For Seven to Smoke, use format-specific milestones such as completing the competition, earning a first verified win and achieving the configured victory condition.

Do not award unlimited XP for every win in a long winner-stays-on sequence.

For 2v2 and crew competitions, award eligible milestone XP to each verified roster member according to the event's participation rules.

## 9.3 Achievement types

EARLY BIRD

Complete an eligible early competitor check-in.

Attendance achievement

FIRST STEP

Complete your first verified battle prelim.

Participation achievement

TOP 8 CLUB

Reach Top 8 in an eligible battle category.

Competition achievement

SMOKE BREAKER

Achieve the configured Seven to Smoke victory condition.

Format-specific achievement

CHAMPION

Win a verified battle category.

Result achievement

There should be two achievement scopes:

Global achievements are earned once per dancer account, such as First Step.

Event achievements are tied to a specific event and category, such as Ground Zero 2026 Champion.

## 9.4 XP architecture

XP must be maintained as a ledger, not just a mutable integer on the user profile.

Each reward transaction needs a unique source reference, reward rule, recipient, amount and timestamp.

A reward should be idempotent: retrying the same check-in or result event must not create duplicate XP.

If an official result is corrected, the system should issue an audited reversal or adjustment rather than silently rewriting historical transactions.

Levels can be derived from the dancer's current valid XP balance.

Competitive rankings remain out of scope.

# 10. Early check-in perks

Early check-in is the first gamification feature to ship.

The organizer configures an early check-in window for the event.

A verified competitor who checks in during that window receives the configured reward.

CHECK-IN COMPLETE

# YOU'RE IN.

Your battle day starts here.

ACHIEVEMENT UNLOCKED

EARLY BIRD

+25 XP

You're checked in for your competition. Keep an eye on event updates for your prelim schedule.

The organizer may optionally provide a real-world perk, but such perks must be explicitly configured, limited and fulfilled by the organizer.

Early check-in must not affect judging outcomes or bracket placement.

# 11. Event updates and notifications

A battle event needs a structured announcement system rather than relying entirely on generic free-text updates.

Supported update types should include:

| Update type | Example |
| --- | --- |
| General announcement | Venue doors are open |
| Schedule change | Prelims delayed by 20 minutes |
| Check-in reminder | Competitor check-in closes soon |
| Prelim announcement | Group B is now on the floor |
| Qualification | Top 16 results are available |
| Match call | Your battle is coming up |
| Result | Your match result has been published |
| Media | Event photos are now available |

The live screen should receive updates through the existing application architecture where possible.

Push notifications can be added after in-app delivery is reliable.

For match calls, notifications must be supplementary. Organizers and MCs should still have an operational way to communicate at the venue when internet connectivity is poor.

# 12. Event media and profile history

After results are finalized, the event should remain accessible as a permanent record.

The event recap can include official placements, bracket history, approved photos, videos and achievements earned.

A dancer's profile should expose:

# YOUR DANCE JOURNEY

CURRENT LEVEL

# 07

TOTAL XP

# 2,450

### 12

Events

### 8

Battles

### 6

Badges

BATTLE HISTORY

View all →

TOP 8

GROUND ZERO 2026

1v1 Hip Hop · Bengaluru

Illustrative profile data.

The public profile should display only information the dancer is permitted to share.

Battle results may be publicly visible when an event publishes official results, but personal account details, private contact information and unpublished judging records must remain protected.

Media tagging and visibility should be permission-controlled.

# 13. Proposed technical architecture

The initial implementation should be a modular extension of the existing BYND8 backend, not a new collection of independent microservices.

That keeps deployment and operational complexity manageable while allowing the tournament and progression domains to remain logically separate.

BYND8 WEB APPLICATION

Dancer Live · Organizer Battle Control · Judge Console · Profile

EXISTING AUTH + API LAYER

Session verification · RBAC · Event access · API contracts

Existing domains

Events · Entry · Registration · Passes · Check-in

Phase G domains

Tournament · Judging · Live updates · XP · Achievements

DATABASE + EVENT DELIVERY

Transactional records · Outbox · Realtime delivery · Media storage

## 13.1 Suggested modules

| Module | Responsibility |
| --- | --- |
| Tournament | Rulesets, entrants, stages, qualification and progression |
| Judging | Assignments, scoring, submissions and result verification |
| Event Live | Stage state, announcements and participant-facing updates |
| Progression | XP ledger, levels, achievements and reward reconciliation |
| Battle History | Verified competition records and profile projections |
| Media | Event uploads, tagging, permissions and published galleries |

For example, a judge submitting a score must not directly update a dancer's XP balance.

A verified result should be committed first, then the progression module can process the resulting domain event.

# 14. Proposed data model

This is a logical schema for the new functionality. Existing BYND8 tables and identifiers should be reused after the repository audit.

| Entity | Key fields / relationships |
| --- | --- |
| Tournament | Event ID, category ID, format, status, ruleset version |
| TournamentEntrant | Tournament ID, registration ID, individual/team identity, eligibility |
| TournamentRoster | Entrant ID, user ID, membership and participation status |
| TournamentStage | Tournament ID, stage type, sequence, status |
| PrelimGroup | Stage ID, group identifier, running order |
| JudgeAssignment | Tournament ID, judge user ID, scope, permissions |
| JudgeSubmission | Stage/match ID, judge ID, score or selection, revision, status |
| QualificationResult | Stage ID, entrant ID, placement, published status |
| BattleMatch | Tournament ID, stage ID, participants, status, outcome |
| MatchDecision | Match ID, judge ID, decision, submission status |
| SevenToSmokeState | Tournament ID, active champion, challenger, rotation, clock, wins |
| TournamentResult | Tournament ID, entrant ID, official placement, version |
| EventAnnouncement | Event ID, target audience, message, publication status |
| XPTransaction | User ID, source event, reward rule, amount, reversal reference |
| AchievementDefinition | Achievement key, criteria, scope, version |
| AchievementUnlock | User ID, achievement ID, source record, unlocked timestamp |
| BattleHistoryRecord | User ID, event ID, category ID, entrant ID, verified result |
| EventMedia | Event ID, asset reference, permissions, publication status |
| EventMediaTag | Media ID, user ID, approval/visibility status |

The schema must enforce unique judge submissions for the applicable match or performance and submission revision, prevent duplicate active entrants, and enforce unique reward source keys.

Tournament progression should use transactional state transitions or equivalent concurrency controls.

A duplicate request must not advance the bracket twice, publish two results or award the same achievement twice.

# 15. Realtime architecture

Battle-day information changes frequently, but not every change should be published to every user.

Use scoped channels or subscriptions based on event, tournament and participant identity.

Judge submits decision

Server validates and stores submission

Organizer verifies result

Official result committed

Realtime update + progression processing

The database remains authoritative.

Realtime messages should trigger clients to update their views or fetch the latest authoritative state.

For reconnects, clients should retrieve a snapshot and reconcile any missed updates.

Do not rely on WebSocket delivery alone to guarantee that results or XP have been recorded.

For unreliable venue connectivity, judge interfaces should preserve unsent drafts locally where feasible, use idempotent submission identifiers and clearly distinguish pending submissions from server-confirmed submissions.

# 16. Permissions and operational safety

Phase G introduces sensitive actions that should have dedicated authorization checks.

| Role | Allowed actions |
| --- | --- |
| Organizer owner/manager | Configure tournament, assign judges, control stages, verify and publish results |
| Authorized event staff | Check in competitors and perform explicitly delegated operational tasks |
| Judge | View assigned scoring context and submit or revise permitted decisions |
| Competitor | View own private competition information and published results |
| Public visitor | View public event updates and officially published brackets/results |

Judges must not see other judges' unpublished submissions unless the configured judging process explicitly permits it.

Every result override should record the acting user, reason, previous state and new state.

# 17. Implementation roadmap

I would divide Phase G into six controlled checkpoints.

G0 - Foundation audit

## Inspect the existing system

Audit Prisma/schema, event categories, registration and check-in contracts, role permissions, existing updates/media models and current frontend routes.

Produce a compatibility map and migration plan before modifying code.

G1 - Event-day foundation

## BYND8 Live + check-in rewards

Extend check-in, add event-day status, announcements, competitor eligibility, early check-in configuration and the initial XP ledger.

Deliver the dancer Live screen and organizer event-day controls.

G2 - Prelims and judging

## Run verified qualification

Build tournament configuration, entrant roster, judge assignments, numeric scoring, judge selection and qualifier publication.

Support solo and team entrants through one consistent domain model.

G3 - Competition progression

## Brackets + Seven to Smoke

Implement elimination brackets, match judging, team progression, Seven to Smoke rotation, final results and audited corrections.

Do not consider this phase complete until both conventional elimination and Seven to Smoke have been tested end to end.

G4 - Dancer progression

## XP, achievements and history

Complete the reward rules, level progression, achievement collection, battle-history projections and profile integration.

Reconcile XP when verified tournament results change.

G5 - Event media and recap

## Make events worth revisiting

Add approved event media, participant tagging, event recaps and personal highlights with permission controls.

# 18. Acceptance criteria

Phase G should not be considered complete simply because the screens exist.

The following scenarios must work using real persisted data and authorized API operations.

## End-to-end validation

0/12

A registered competitor checks in once and receives the correct attendance reward.

A repeated QR scan does not duplicate check-in or XP.

An organizer configures numeric prelim scoring and publishes verified qualifiers.

An organizer configures judge-selection prelims and publishes verified qualifiers.

A 1v1 bracket progresses from its opening round to a finalized winner.

A 2v2 or crew result is recorded for the team and attributed correctly to eligible members.

Seven to Smoke correctly handles champion rotation, wins, time limits and configured completion rules.

A judge cannot score an unassigned tournament or access unauthorized private submissions.

A result correction updates the official result and reconciles dependent progression records.

A dancer reconnecting after lost internet receives the correct current event state.

An audience-only attendee cannot earn competitor XP.

Existing free and paid registration, checkout, passes and organizer Money flows continue to work.

Use this as a future validation checklist, not as a claim that these features have already been implemented or tested.

# 19. The immediate next step for Cursor

Before generating code, Cursor should perform the G0 repository audit.

The current BYND8 schema may already contain check-in records, event updates, category membership, team registration or media relationships that can be reused.

Creating parallel models without inspecting them could introduce duplicate sources of truth and break the existing registration lifecycle.

Use the following prompt to begin the implementation process.

## Cursor - Phase G0 audit prompt

Copy this into Cursor after providing it with the Phase G PRD.

You are working on BYND8 Phase G: Battle Day, Live Events and Dancer Progression. The attached Phase G PRD is the proposed product specification. Your first task is G0: inspect the CURRENT repository and produce a detailed implementation architecture and compatibility report. DO NOT IMPLEMENT FEATURES YET. LOCKED PRODUCT DECISIONS: - Support 1v1, 2v2, crew battles and Seven to Smoke. - Support numeric prelim scoring and judge selection. - XP is awarded only to verified competing dancers. - Competitive ratings and rankings are out of scope. - Preserve existing authentication, registration, payments, passes, check-in and organizer management. - Preserve the approved BYND8 design system. - Reuse existing domain models wherever appropriate. AUDIT THE FOLLOWING: 1. Existing event and competition category schemas. 2. Solo/team registration and roster relationships. 3. Registration status, payment confirmation and eligibility. 4. Existing passes and QR check-in implementation. 5. Event management routes, permissions and role checks. 6. Existing updates, media and profile models. 7. Current API architecture and realtime capabilities. 8. Existing database transactions, concurrency controls and idempotency patterns. 9. Existing tests and deployment constraints. PRODUCE: A. CURRENT ARCHITECTURE MAP Identify actual files, models, services, APIs and frontend components. B. EXISTING → PHASE G COMPATIBILITY MAP For each proposed feature, identify what can be reused, extended or must be created. C. DATA MODEL PROPOSAL Show exact proposed Prisma/schema changes, relationships, indexes and constraints. D. TOURNAMENT ENGINE DESIGN Separate entrant identity, prelim qualification, judge submissions, elimination progression and Seven to Smoke progression. E. XP AND ACHIEVEMENT DESIGN Propose an idempotent, auditable reward ledger with correction and reversal handling. F. API AND REALTIME CONTRACTS Propose endpoints, events, authorization rules, validation and reconnect behavior. G. FRONTEND INTEGRATION MAP Show how BYND8 Live, Battle Control, Judge Console and profile progression connect to existing screens. H. MIGRATION AND REGRESSION RISKS Identify any existing functionality that could be affected. I. REVISED IMPLEMENTATION PLAN Break implementation into small checkpoints with acceptance criteria. IMPORTANT: Do not assume existing models or APIs have specific fields without inspecting the code. Do not invent backend functionality and report it as already implemented. Do not create a separate registration, pass or check-in domain. Do not replace the existing payment provider. Do not implement competitive rankings. Do not start coding. Return the audit, proposed architecture, unresolved decisions and recommended G1 scope. STOP and wait for approval.

Copy audit prompt

The immediate objective is to validate how Phase G fits your existing BYND8 codebase. Once Cursor returns its G0 audit, we can resolve any schema or workflow conflicts before building the first event-day experience.

---

## Implemented G1 Foundation (as built)

Status: G1 Event-Day foundation implemented on `feat/g1-event-day-foundation` (Checkpoints 1–8).

### What shipped

1. **EventDayConfig** — event timezone, check-in open/close, early cutoff, `EventOpsStatus`. GET is side-effect free (defaults if no row). PATCH upserts windows/timezone. Ops status uses a separate transition endpoint.
2. **CheckIn + XP** — existing registration-level CheckIn; EVENT-scoped ledger (`XpTransaction`) awards +40 attendance and +25 early in the same interactive transaction. Unique `idempotency_key`. Concurrent unique conflicts use SAVEPOINTs so the outer transaction is not aborted.
3. **Team semantics** — one CheckIn per registration; XP per linked participant; guests none. Multi-linked CheckInDto omits progression flattening.
4. **No XP backfill** — rescanning a pre-G1 CheckIn returns the row without inserting ledger rows.
5. **Live** — `GET /me/events/:eventId/live` read-only projection (entries, attendanceVerified, progression, announcements). Polling on the dancer Live page (~60s + focus).
6. **Organizer UI** — Event Home Event Day control + Manage Day sheet; CheckInPanel light feedback.
7. **Dancer UI** — `/events/[slug]/live`; View Pass only (no self-check-in); contextual Event Live CTAs.

### Known G1 limitations

- No participant-level team check-in
- No dancer self-check-in
- No XP backfill for historical CheckIns
- No reversal UI/API (ledger supports reversal rows; Live nets them)
- No new realtime/WebSockets (Live uses modest polling)
- Live entry-point relevance is a **presentation heuristic** (`isLiveCompanionRelevant`), not opsStatus truth
- No prelims / judging / brackets / Seven to Smoke / results / achievements / levels
- EventUpdate has no richer Phase G targeting/visibility model
- Pass deep-link is `/tickets` (no per-pass detail route)
- Organizer roles are `owner` | `manager` | `editor` only (no separate “viewer” member role); any member may GET day-config and check in
- Authenticated visual QA for organizer Event Day + dancer Live remains blocked without a signed-in local browser session

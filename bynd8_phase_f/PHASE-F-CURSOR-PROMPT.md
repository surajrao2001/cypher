# BYND8 — Phase F
## Visual System & Organizer Workspace Redesign

Phases A–E are complete and validated. The product architecture, terminology, backend contracts, registration model, Entry model, event-management model, payment architecture, and navigation semantics are **NOT** being redesigned in this phase.

Phase F is a **presentation-layer redesign** of the organizer experience.

The current implementation is functionally correct but visually feels like a narrow dark admin/SaaS interface floating inside a very large desktop canvas. The redesign must make BYND8 feel like a culture-first dance product while remaining extremely usable for organizers.

Use the supplied reference images as **directional composition references**, not pixel-perfect specifications. Preserve the existing BYND8 identity and production code architecture.

---

# 1. NON-NEGOTIABLE PRODUCT PRINCIPLE

> Make the structure boringly obvious. Make the moments memorable.

The organizer should feel like they are managing an event, not operating admin software.

The EVENT is the object.
The POSTER is visual identity.
Typography creates hierarchy.
Spacing creates structure.
Orange creates action.
Lime communicates live/success/system state.
Borders/cards are supporting tools, not the entire design language.

---

# 2. DO NOT CHANGE

Do not change:

- Prisma schema
- Nest API contracts
- EventCategory architecture
- Registration state machine
- payment state machine
- payout architecture
- Supabase auth
- OrganizerMember semantics
- QR/check-in state machine
- route semantics unless needed only for presentation
- Phase C Entry architecture
- Phase D Event Home / People / Money / Event Page information architecture
- Phase E terminology system

No backend migration should be necessary.

If a proposed visual improvement requires backend work, STOP and report it rather than implementing it.

---

# 3. CURRENT VISUAL PROBLEMS TO SOLVE

The supplied current screenshots show these problems:

1. Narrow centered `max-width` content columns leave enormous unused desktop space.
2. Most screens feel vertically stacked and document-like rather than composed as an application workspace.
3. Too many nearly identical black rectangles and gray borders.
4. Event artwork is underused.
5. Your Events feels like database rows rather than a collection of live cultural objects.
6. `Open →` is weak and unnecessary.
7. What's Happening? has correct choices but five visually identical boxes.
8. Event Home has correct information but hierarchy is fragmented and repeats actions such as Check-in.
9. Entry looks like text rows rather than manageable Entry objects.
10. Event Page looks like settings/configuration rather than the content people will actually see.
11. Creation forms look like forms floating in a card rather than an intentional creation surface.
12. The visual language currently reads closer to dark SaaS/admin tooling than dance infrastructure.

Fix these issues without introducing visual noise.

---

# 4. DESKTOP WORKSPACE MODEL

Do NOT use the current narrow centered workspace as the foundation.

After the persistent desktop sidebar, organizer pages should use a left-anchored responsive canvas.

Recommended content behavior:

- Main application area fills available width.
- Use a sensible outer gutter, approximately 32–56px depending on viewport.
- Organizer working content may grow to roughly 1180–1320px where appropriate.
- Do NOT force every screen to the same width.
- Forms can be narrower than event dashboards.
- People may use more horizontal width than Create.
- Event Home may use a two-column composition when useful.
- Very large monitors should retain deliberate whitespace, but not giant accidental empty oceans.

Desktop conceptual structure:

```text
SIDEBAR | GLOBAL TOP BAR
        |
        | EVENT / PAGE HEADER --------------------------------------
        |
        | PRIMARY WORKSPACE ---------------- | CONTEXT / ART / ACTION
        |                                    |
        |                                    |
```

Not every screen requires a right rail. Use it only where it adds meaning.

---

# 5. RESPONSIVE MODEL

Design at minimum for:

- 1440px desktop
- 1280px laptop
- 768px tablet
- 390px mobile

Mobile is a first-class organizer environment.

On mobile:

- no desktop sidebar
- preserve event context
- use bottom/app navigation already appropriate to BYND8
- do not reproduce desktop card grids at tiny widths
- use vertical event cards with strong artwork
- actions must be reachable with thumb-sized targets
- avoid horizontal tab overflow

---

# 6. VISUAL SYSTEM

## Surface hierarchy

Avoid turning every grouping into a bordered card.

Use three levels:

### Canvas
Near-black application background.

### Section
Usually created with whitespace, typography and rules rather than a container.

### Object
Use a surface/card when something is actually an object:
- event
- competition
- audience pass
- attention item
- pass

Cards should have a reason to exist.

## Borders

Use subtle rules for separation.
Do not surround every text group with `1px solid gray`.

## Radius

Keep geometry relatively sharp/controlled. Avoid soft consumer-fintech pill-card styling.

## Orange

Strong BYND8 orange is primarily for:
- primary actions
- selected/active interaction
- key directional affordances
- occasional emphasis

Do not orange-outline everything.

## Lime

Use primarily for:
- LIVE
- success
- healthy/system-positive state

Do not use lime decoratively.

## Typography

Continue using the condensed BYND8 display face for:
- event titles
- major counts
- section identities
- signature labels

Use the normal UI font for supporting information.

Increase contrast between display typography and utility text.

Use large type compositionally rather than merely making every `h1` 36px.

## Count motif

BYND8 comes from dance being counted in eights.
Introduce a subtle counting/rhythm system where appropriate.

Possible examples:

`01 / PEOPLE`
`02 / ENTRY`
`03 / EVENT PAGE`

or rhythmic separators / progress behavior.

Do NOT plaster the number 8 everywhere.
This should feel like a hidden structural signature.

---

# 7. EVENT ARTWORK PRINCIPLE

Dance events already have rich posters and photography.
Use event artwork as a first-class design material.

Poster/artwork should meaningfully appear in:

- Your Events
- Event Home where appropriate
- Event Page
- Passes later
- public Event pages later

If an event has no poster, use an intentional poster-shaped placeholder rather than a blank tiny square.

Do not use random generic dance stock imagery in production as a substitute for organizer artwork.
Reference images may use photography only to demonstrate composition.

---

# 8. SCREEN — YOUR EVENTS

Current issue:
The event appears as a thin database-style row with a small image and `Open →`.

Redesign Your Events as a collection of event objects.

Desktop target:

```text
YOUR EVENTS                                      + CREATE
Create, publish and manage what you're putting up.

LIVE     DRAFTS     PAST

┌──────────────┬─────────────────────────────────────────────┐
│              │ LIVE                                        │
│    POSTER    │                                             │
│              │ GROUND ZERO                                 │
│              │ Battle · Sat 18 Oct · 6 PM                  │
│              │ Indiranagar, Bengaluru                      │
│              │                                             │
│              │ 142 registered                           →  │
└──────────────┴─────────────────────────────────────────────┘
```

Requirements:

- entire event card is clickable
- REMOVE visible `Open →` text
- arrow may appear as a directional affordance
- poster should be large enough to identify the event
- status should be immediately scannable
- event type may appear as quiet metadata/tag
- registration count should be visible but not dominate draft events
- draft events should communicate readiness/status rather than fake metrics
- hover: subtle surface/border movement; do not create excessive animation
- support multiple events elegantly

On desktop consider a wide list/card hybrid rather than tiny equal grid tiles because event names and operational state matter.

Mobile: poster-led stacked cards.

---

# 9. SCREEN — WHAT'S HAPPENING?

Preserve the event types:

- Battle
- Jam / Cypher
- Workshop
- Session
- Other

Current issue:
five identical bordered boxes provide almost no visual hierarchy.

Create a composition where Battle and Jam/Cypher can carry greater visual weight, with Workshop/Session/Other as secondary choices.

Possible desktop composition:

```text
WHAT'S HAPPENING?
Choose what you're putting up.

┌──────────────────────────────┐ ┌──────────────────────────────┐
│ 01                           │ │ 02                           │
│                              │ │                              │
│ BATTLE                       │ │ JAM / CYPHER                 │
│ Competition, formats,        │ │ Open floor. Entry optional. │
│ audience.                 →  │ │                           →  │
└──────────────────────────────┘ └──────────────────────────────┘

┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│ 03 WORKSHOP      │ │ 04 SESSION       │ │ 05 OTHER         │
└──────────────────┘ └──────────────────┘ └──────────────────┘
```

Requirements:

- card itself is clickable
- selected/hover states should feel tactile
- use visual differentiation through scale/composition, not five random colors
- optional imagery may be used only if the app already has a coherent asset strategy; do not introduce random stock-image dependencies
- avoid street-art/graffiti clichés
- keep labels immediately understandable

---

# 10. SCREEN — CREATE EVENT DETAILS

Current issue:
large bordered form card floating in empty space.

Make creation feel editorial and lightweight.

Use a narrower work column than Event Home, but LEFT-ANCHOR it within the workspace rather than vertically/centrally floating it.

Suggested structure:

```text
← WHAT'S HAPPENING?

SESSION
NEW SESSION
Just the basics. You can add Entry later.

NAME
[ Sunday Exchange                                  ]

WHEN                              CITY
[ 19 Sep · 6:00 PM ]              [ Bengaluru     ]

WHERE
[ Cubbon Park / studio name                        ]

POSTER
┌────────────┐
│     +      │   Add a poster
│            │   Optional · helps on Discover
└────────────┘

[ CONTINUE → ]     Cancel
```

Requirements:

- remove/soften unnecessary outer card
- field grouping through spacing
- poster upload should visually resemble the shape of the content being uploaded
- maintain current validation/contracts
- primary CTA obvious
- avoid excessive helper copy

---

# 11. SCREEN — EVENT HOME / GROUND ZERO

This is the most important organizer screen.

Current architecture is correct.
Current visual hierarchy is not.

Do not rebuild functionality.
Recompose it.

Goals:

- event identity dominates
- operational state is obvious
- event-day state becomes useful without giant alert-card noise
- remove duplicate Check-in CTAs
- use the available desktop width
- destination summaries should feel like meaningful pathways, not settings rows

Suggested desktop direction:

```text
← YOUR EVENTS

LIVE · BATTLE
GROUND ZERO
Sat 18 Oct · 6 PM
Indiranagar, Bengaluru

                                      SHARE   CHECK IN   •••

HOME       PEOPLE       ENTRY       MONEY       EVENT PAGE

TODAY --------------------------------------------------------

142 CONFIRMED                                  87 CHECKED IN
                                              OPEN CHECK-IN →

142
REGISTERED
87 competitors · 55 audience

NEEDS ATTENTION
[ Payout setup required → ]   [ Hip Hop 1v1 · 12 spots left → ]

01 / PEOPLE                                         →
142 registrations · 87 competitors · 55 audience

02 / ENTRY                                          →
4 competition · 1 audience
Hip Hop 1v1 · 54 / 64 filled

03 / MONEY                                          →
₹48,500 collected · payout pending

04 / EVENT PAGE                                     →
Poster · details · updates
```

This is conceptual, not a requirement to copy exact numbers/layout.

Requirements:

- one primary Check-in action, contextual to event state
- no four-equal-KPI SaaS dashboard
- large registration count may be used as editorial hierarchy
- destination sections can be full-width rows or composed objects
- event artwork can occupy a contextual right rail/background crop if available, but readability wins
- free events must not gain meaningless Money prominence
- draft state should still prioritize readiness
- event-day state should prioritize operations
- past state should prioritize useful history

---

# 12. EVENT CONTROL HEADER / NAV

Preserve:

Home / People / Entry / Money when relevant / Event Page

Check-in remains a contextual action/destination.

Improve the current pill-heavy navigation.

It should feel like an event-level navigation system, not a row of unrelated buttons.

Desktop options may include:

- understated text tabs with active orange rule
- compact segmented navigation with much less container weight

Do not make every tab a thick bordered button.

Mobile must remain compact and accessible.

---

# 13. SCREEN — PEOPLE

Current functionality is correct:

- All
- Competitors
- Audience
- Checked in
- Search

The screen should feel operational but not like a CRM.

Desktop may use width more confidently.

Suggested direction:

```text
PEOPLE
142 registrations

ALL 142     COMPETITORS 87     AUDIENCE 55     CHECKED IN 12

[ Search registrations...                                  ]

NAME               ENTRY              STATUS          CHECKED IN
Suraj Rao          Hip Hop 1v1        Confirmed       —
Ananya             Audience Pass      Confirmed       —
Rohan              Open Styles 2v2    Pending         —
Karan              Hip Hop 1v1        Confirmed       6:12 PM
```

Desktop can use a table-like list because scanning people benefits from columns.

But:

- no heavy table chrome
- use row rhythm and typography
- avatar only if real profile imagery is available; do not fabricate
- status must remain accessible without relying only on color
- mobile converts rows into compact person cards/list items

---

# 14. SCREEN — ENTRY

Do NOT change Phase C architecture.

Redesign Competition and Audience entries as actual objects.

Current plain text row is insufficient.

Suggested:

```text
ENTRY                                      + ADD COMPETITION
How can people get in?

COMPETITION · 2

┌────────────────────────────────────────────────────────────┐
│ HIP HOP 1V1                    SOLO                 PAID    │
│ ₹500 · 54 / 64 filled                                    │
│ ████████████████░░░                                      │
│                                              Edit     ••• │
└────────────────────────────────────────────────────────────┘

AUDIENCE

┌────────────────────────────────────────────────────────────┐
│ AUDIENCE PASS                                  ₹200        │
│ 46 / 100 filled                                            │
│ ████████░░░░░░░░░░                                        │
│                                              Edit     ••• │
└────────────────────────────────────────────────────────────┘
```

Requirements:

- capacity visualization where capacity exists
- clear Free/Paid state
- format visible
- `Remove` should not sit permanently beside Edit; place destructive/rare actions in overflow where appropriate
- Add Competition / Add Audience Pass should remain obvious
- preserve editor behavior and focus restoration from Phase C/E
- avoid nesting cards inside cards inside cards

---

# 15. SCREEN — EVENT PAGE

Current screen looks like settings.
Make it feel like managing the public representation of the event.

Poster must become visually meaningful.

Suggested direction:

```text
EVENT PAGE                                      VIEW LIVE EVENT ↗
What people see.

┌──────────────────┐     EVENT DETAILS
│                  │
│      POSTER      │     Sat 18 Oct · 6 PM
│                  │     Indiranagar, Bengaluru
│                  │
│                  │     [ EDIT ]
└──────────────────┘

DESCRIPTION
A battle night bringing the scene together...
                                                        Edit

MEDIA                                             MANAGE →
Instagram · YouTube · Drive
No media yet
+ ADD MEDIA

UPDATES                                           MANAGE →
2 updates
```

Requirements:

- if poster missing, show intentional poster-shaped empty state
- details should read like content, not key/value settings
- media and updates retain existing behavior
- live event gets View Live Event
- draft must not link to a broken public route
- avoid redundant `EDIT` buttons on every tiny row if a clearer grouping works

---

# 16. YOUR EVENTS — REMOVE `OPEN`

Explicitly remove the current visible `Open →` event-card action.

Reason:
The user already understands the event card represents an event. The entire card should open/manage it.

Use:

- clickable card
- arrow icon/chevron affordance
- hover/focus state

Do not replace it with `Manage`, `Dashboard`, or another redundant word.

---

# 17. EMPTY STATES

Empty states should be visually intentional but concise.

Examples:

```text
NO EVENTS YET
Got something happening?
+ CREATE
```

```text
NO AUDIENCE PASS
Add one if people can come to watch.
+ ADD AUDIENCE PASS
```

Do not place every empty state inside a dashed gray rectangle.

---

# 18. MOTION — PHASE F LIMITS

Use restrained micro-interactions only:

- event-card hover/focus
- button feedback
- navigation transition
- progress/capacity changes where appropriate
- panel opening/closing

Do NOT implement the full signature moments yet.

Do NOT build:

- It's Live animation
- You're In animation
- Check-in celebration
- Pass animation

Those belong to Phase G after the base UI is approved.

---

# 19. CULTURE WITHOUT CLICHÉ

BYND8 is dance infrastructure, not a generic enterprise dashboard.
But do NOT solve this by adding:

- spray-paint fonts
- graffiti textures everywhere
- fake torn paper everywhere
- random neon gradients
- boombox icons
- dancing silhouettes
- excessive stickers
- generic streetwear clichés

Culture should come from:

- real event artwork
- confident typography
- rhythm
- photography where genuinely owned/provided
- concise language
- strong interaction design
- movement
- community objects such as events and passes

---

# 20. SIDEBAR / GLOBAL SHELL

The desktop sidebar is NOT the main problem and does not need a wholesale redesign.

Polish it only as necessary to fit the improved system.

Possible refinements:

- reduce visual competition from Early Access/Staging badges in production-like layouts
- improve active-state restraint
- preserve clear Discover / Events / Organize / Passes / Profile hierarchy

Do not spend Phase F rebuilding navigation architecture.

---

# 21. TOP SEARCH BAR

The global search bar currently consumes significant width and visual attention.

Keep functionality, but make sure it does not overpower the event workspace.

It may remain full-width in the shell if that is an intentional global pattern, but reduce unnecessary border weight and ensure page identity wins visually.

Do not change search behavior.

---

# 22. ACCESSIBILITY

Maintain or improve:

- visible keyboard focus
- semantic buttons/links
- card keyboard activation
- minimum touch targets
- status not represented by color alone
- text contrast
- form labels
- focus restoration
- reduced-motion respect

A clickable event card must remain accessible and must not become an invalid nest of interactive controls.

If the card contains secondary actions, structure them semantically rather than nesting buttons inside an anchor.

---

# 23. IMPLEMENTATION STRATEGY

Before editing:

1. inspect the existing design tokens / Tailwind theme / CSS variables;
2. identify repeated layout primitives causing the centered narrow-column behavior;
3. identify shared card/button/tab primitives;
4. identify where changes can be made systemically rather than page-by-page hacks;
5. preserve current behavior and data loading.

Prefer creating/revising reusable primitives such as:

- organizer workspace/container
- page/event header
- event object card
- section heading
- event nav
- capacity meter
- content row
- poster placeholder

Do not create a giant bespoke component framework.

---

# 24. VISUAL QA

After implementation capture/inspect all of these at desktop and mobile where possible:

1. Your Events — 1 live event
2. Your Events — multiple events / mixed states
3. What's Happening?
4. New Session / event details
5. Event Home — live
6. Event Home — draft
7. Event Home — event day
8. People
9. Entry
10. Event Page
11. no-poster states
12. zero registrations / empty states

Check specifically:

- Does desktop still feel like a narrow centered column?
- Is unused space intentional?
- Are there too many borders?
- Are there too many equal cards?
- Does poster/artwork matter?
- Does the event name dominate?
- Is orange reserved for action?
- Can the organizer scan each screen in seconds?
- Does mobile feel designed rather than collapsed?

---

# 25. REFERENCE IMAGES

A supplied reference folder contains:

- `00-organizer-reference-board.png`
- `01-your-events.png`
- `02-whats-happening.png`
- `03-new-event-details.png`
- `04-event-home-ground-zero.png`
- `05-entry.png`
- `06-people.png`
- `07-event-page.png`
- `08-mobile-key-screens.png`
- `09-design-principles.png`

Use them for:

- composition
- hierarchy
- use of artwork
- content density
- event-object treatment
- desktop width
- mobile direction

Do NOT copy generated text literally when it conflicts with the real product.
Do NOT fabricate functionality shown only in a reference image.
Real app contracts and Phase A–E product decisions remain authoritative.

---

# 26. ACCEPTANCE CRITERIA

Phase F succeeds if:

- organizer screens no longer look like a narrow centered admin interface;
- Your Events feels like events, not database rows;
- event artwork has a meaningful role;
- What's Happening? has visual hierarchy;
- creation feels lightweight;
- Event Home feels like Ground Zero rather than analytics software;
- People is highly scannable;
- Entry objects are visually understandable;
- Event Page feels like managing public content;
- `Open →` is gone;
- mobile remains first-class;
- functionality from Phases A–E is unchanged;
- no backend/schema/API changes are introduced.

---

# 27. STOP AFTER PHASE F

Do NOT begin Phase G.

Return:

### A. Visual audit summary
### B. Shared design-system changes
### C. Layout/container changes
### D. Your Events changes
### E. What's Happening changes
### F. Create form changes
### G. Event Home changes
### H. People changes
### I. Entry changes
### J. Event Page changes
### K. Mobile behavior
### L. Accessibility changes
### M. Files changed
### N. Backend/API/schema changes
Expected: NONE
### O. Functional regressions found
### P. Screenshots captured after implementation
### Q. Remaining visual weaknesses
### R. Recommendations before Phase G

STOP.

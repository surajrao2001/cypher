# Build plan — Organize cache + poster/title transition

**Branch:** `feat/organizer-v2`  
**Scope:** Organize only (Your Events → Event Home → People / Entry / Money / Updates)  
**Out of scope for now:** Discover, Events list, Profile, Passes, mobile, Redux, event `layout.tsx` nesting (decide later)  
**Status:** Plan only — implement when approved to start Phase 1  

---

## Clarifications (locked for this plan)

### What TanStack Query is for

**Server / API data** — anything we fetch from Nest and want to reuse across screens:

| Query (examples) | Used by |
|------------------|---------|
| My organizers | Your Events, slug resolve |
| Organizer by slug | All event screens |
| Organizer events list | Your Events |
| Event detail | Home, People, Entry, Money, Updates |
| Registrations | Home metrics, People, Money |
| Check-ins | Home, People |
| Updates list | Home teaser, Updates |
| Payout account | Money, Entry (paid) |

**Why Query (not Zustand/Redux for this):**  
Dedupes in-flight requests, caches by key, stale-while-revalidate, invalidate after mutate. That is exactly why we see skeletons and repeated `getOrganizerEvent` today.

### Do we need Zustand for transitions?

**No — not in v1.**

Transitions can be:

1. **TanStack cache** → destination paints poster/title immediately (no blank shell)  
2. **framer-motion `layoutId`** → poster + title morph between Your Events card and Event Home  

Zustand would only hold ephemeral UI (click handoff rects, “from Your Events” flag). Useful if `layoutId` breaks across App Router remounts — **add only if Phase 4 proves we need it**. Do not introduce Zustand up front.

### Motion v1

- **Poster + title only**  
- Meta, buttons, metrics: fade/appear normally  
- `useReducedMotion`: skip morph, instant from cache  

### Event workspace `layout.tsx`

**Deferred.** First ship Query + shared hooks + poster/title `layoutId`. Revisit nesting if remounts still break motion or refetch patterns remain noisy.

---

## Goals

1. Warm Organize navigations do **not** full-page skeleton when event/list data is already cached.  
2. Same event is not re-fetched from scratch on every People/Entry/Money/Updates visit (within stale window).  
3. Your Events → Event Home: smooth poster + title shared-element feel.  
4. Cold first open of `/organize` may still skeleton.  

---

## Non-goals (this build)

- Revamp Discover / Events / Profile loading  
- Redux  
- Zustand (unless Phase 4 forces it)  
- Calendar view  
- Backend/API/schema changes  
- Perfect FLIP of entire card  

---

## Phases

### Phase 1 — TanStack Query foundation (Organize)

**Work**

- Add `@tanstack/react-query` to `@cypher/web`  
- `QueryClientProvider` in app providers (next to Auth)  
- Sensible defaults: e.g. `staleTime` 30–60s for event detail/list; longer for organizer-by-slug  
- Query key factory under `features/organize/queries/` (or `lib/query-keys.ts`)

**Keys (sketch)**

```
['organizers','mine']
['organizer','slug', slug]
['organizer', orgId, 'events']
['event', eventId]
['event', eventId, 'registrations']
['event', eventId, 'check-ins']
['event', eventId, 'updates']
['organizer', orgId, 'payout-account']
```

**Exit:** Provider live; no screen migration yet (or one smoke query).  

---

### Phase 2 — Wire Organize screens to Query

**Order**

1. Your Events (`OrganizeHome`) — list + organizers  
2. Event Home (`EventManageView` / home path) — event + regs + check-ins + updates  
3. People  
4. Entry  
5. Money  
6. Updates (+ detail)

**Patterns**

- Replace mount `useEffect` + local `loading` with `useQuery` / `useQueries`  
- Mutations (publish, edit event, categories, updates): `useMutation` + `invalidateQueries` for affected keys  
- Loading UX:
  - **No cached data** → keep existing skeleton / `PageLoading`  
  - **Cached data** → render immediately; optional quiet background refetch (no full-page skeleton)

**Prefetch**

- Your Events card: `onPointerEnter` / `onFocus` → `queryClient.prefetchQuery` for `['event', eventId]` (and org if needed)

**Exit:** Navigate Your Events → Home → People → Entry → Money → Updates without full-page skeleton when warm. Network tab shows cache hits / fewer duplicate GETs.  

---

### Phase 3 — Poster + title transition (Your Events → Event Home)

**Work**

- Shared `layoutId`s, e.g. `event-poster-${eventId}`, `event-title-${eventId}`  
- Your Events card: `motion` poster + title  
- Event Home header: matching `layoutId`s on poster + title  
- Respect `useReducedMotion`  
- Ensure destination uses **cached** event so morph lands on real content, not a skeleton hole  

**If `layoutId` fails across route remount**

- Document failure mode  
- Then decide: (a) thin event layout shell, or (b) tiny transition handoff store — **not before this proof**

**Exit:** Visible morph of poster + title on click when motion allowed; reduced-motion users get instant cached paint.  

---

### Phase 4 — Soft continuity for People / Entry / Money / Updates (light)

**Work**

- No full-page skeleton when `['event', id]` is warm  
- Main pane: short fade or opacity crossfade only (not poster remorph every tab)  
- Subheader identity from cached event  

**Exit:** Tab-like hops feel continuous; only missing slices (e.g. regs table) may local-skeleton.  

---

### Phase 5 — Hardening

- Invalidate correctly after Edit Event / publish / Entry CRUD / post update  
- Error states: keep SoftError; don’t wipe cache on soft failure if previous data exists  
- Quick perf check: warm path should not flash Organize-wide skeleton  

---

## Suggested file touch list (when implementing)

| Area | Files (expected) |
|------|------------------|
| Deps / provider | `apps/web/package.json`, app `providers` / layout |
| Keys + hooks | `features/organize/queries/*` or similar |
| Screens | `OrganizeHome`, `EventManageView`, `EventHomePanel`, `EventPeopleView`, `EventEntryView`, `EventMoneyPanel`, `EventUpdatesPanel` |
| Motion | Card in `OrganizeHome`, header in `EventControlHeader` (or Home-only wrapper) |

Avoid backend/contracts changes unless a type-only helper is needed.

---

## Acceptance checklist

- [ ] Cold `/organize` first load: skeleton OK  
- [ ] Warm click into event: no full-page Event Home skeleton if list already had that event (or prefetch completed)  
- [ ] Home → People → Entry → Money → Updates: event detail not blank-refetched every time within `staleTime`  
- [ ] Poster + title morph Your Events → Home (motion on)  
- [ ] Reduced motion: no morph, still instant from cache  
- [ ] No Zustand/Redux unless Phase 3/4 explicitly adds handoff store  
- [ ] Discover / Profile unchanged  

---

## Order of execution when you say “go”

1. Phase 1 (Query foundation)  
2. Phase 2 (wire Organize)  
3. Phase 3 (poster + title morph)  
4. Phase 4 (soft subpage continuity)  
5. Phase 5 (hardening)  

**Stop after Organize.** Do not start Discover/Events/Profile revamp.  
**Defer** event `layout.tsx` and Zustand until Phase 3 results are reviewed.

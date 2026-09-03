# Admin CRUD + Auth — Planning Doc

> Extends `## 3. [~] Admin CRUD + auth` in `docs/build-plan.md`. Everything below was
> decided in planning, before implementation. Format matches the rest of the build
> plan: decisions are settled, not up for relitigation without a stated reason.

Status: **all backend logic (auth, categories, menu_items, restaurant settings,
tags) implemented and verified against the real database.** UI/UX (public menu
+ admin panel) delegated to a separate `frontend` session, coordinating over
the use cases in `composition/container.ts` as the contract — see
`docs/architecture.md` for the folder structure and the boundary it enforces.

> **2026-09-02 revision:** this doc originally cut hexagonal architecture (see the
> old Scope-cuts table this replaced). That cut quoted a stale line of `CLAUDE.md` —
> the current `CLAUDE.md` already anticipates that exact argument and overrides it
> deliberately, for interview-defensibility. Hexagonal wins; the sections below are
> rewritten to match. Everything else in this doc (provisioning, auth flow,
> authorization model, business-rule calls, validation decisions) was unaffected
> and still holds.

---

## Provisioning (not built through the app)

- **Admin user**: created directly via the Supabase Admin API (`service_role`
  key), not through the dashboard — same effect, scriptable. No public
  `/register` route exists or is planned. Credentials live in `.env.local` as
  `ADMIN_EMAIL` / `ADMIN_PASSWORD`, used only by `scripts/verify-categories-slice.ts`.
- **Restaurant row**: seeded via PostgREST (`service_role` key) with `owner_id`
  set to that user's UUID — `name: "Demo Restaurant"`, `slug: "demo-restaurant"`.
  No "first login, create your restaurant" onboarding flow.
- **Handing off to a real client later**: a single `UPDATE restaurants SET owner_id
  = ...`, not a migration. The schema already supports this — no rework needed when
  it happens.

---

## Auth flow

Subtasks, in dependency order:

1. **Supabase SSR clients** — server client + middleware client. **Done**
   (`adapters/driven/supabase/client.ts`, `middleware-client.ts`). No browser
   client built — none needed until a future piece of UI ends up client-side.
2. **`middleware.ts`** — refreshes the session (`getUser()` triggers refresh),
   redirects unauthenticated requests on `/admin/*` to `/login`. **Done and
   verified** (`curl /admin/categories` → `307 Location: /login`). Next.js
   16.3.3 deprecates the `middleware.ts` file convention in favor of `proxy.ts`
   (warns on boot, still functional) — not mentioned by any skill; revisit the
   rename when the deprecation becomes a removal.
3. **`signIn` / `signOut` server actions** — **done and verified.**
   Zod-validated email/password in, `signInWithPassword` / `signOut` out
   (`app/login/actions.ts`, `app/admin/actions.ts`). The three-way Server
   Action return-shape conflict resolved concretely for this pair, not in
   general: `signInAction` uses `nextjs-core`'s `(prevState, formData) =>
   Promise<State>` shape because the login form's `useActionState` (decided in
   item 4 below) *requires* that exact signature — not because that skill wins
   over `error-handling`/this doc's `authedAction` wrapper as a rule.
   `signOutAction` needed none of the three shapes: zero input, no error state
   to report, it either redirects or throws. Verified with a real HTTP
   round-trip simulating a JS-less form submit (fetch the page, extract the
   Server Action's hidden field(s), POST) — real login sets a `Set-Cookie`
   session and lands on `/admin`; wrong password gets `200`, no cookie, the
   generic message, and none of Supabase's own error text; sign-out clears the
   cookie server-side (`Max-Age=0`) and a follow-up `/admin` request
   redirects again, proving the session was actually invalidated, not just the
   client-side cookie cleared.
4. **Login page + form** — **done** (`app/login/page.tsx`,
   `app/login/login-form.tsx`). Client Component using `useActionState`
   wrapping the server action (pending state, inline error, no full
   navigation). Preferred over redirect-with-`?error=` query param — it's the
   idiomatic Server Actions pattern and doesn't violate the server-first rule
   (the form itself is a small, legitimately-interactive component). No
   styling/atoms investment — bare scaffolding, per the scope cuts below.
5. **`requireAuth()`** — **done** (`adapters/driven/supabase/require-auth.ts`).
   One reusable check, used in `app/admin/page.tsx` for now. Lives in
   `adapters/driven/supabase/` (it calls `getUser()`) even though the security
   skill's example puts it in `lib/auth/server.ts` — same override as the
   client-construction rule above.
6. **`/admin` index** — **still a placeholder**, not the real thing.
   `app/admin/page.tsx` exists only to exercise `requireAuth()` end-to-end
   (shows the signed-in email + a sign-out button). The real page — linking to
   Restaurant settings / Categories / Menu items, not a redirect straight into
   one of them — is still open.

**Explicitly out of scope for v1** (scope cuts, not oversights): remember-me,
password reset, email verification, login rate-limiting beyond Supabase's defaults.
None touch the five target skills (testing, CI/CD, Docker, auth, Atomic Design).

---

## Authorization model (interview talking point)

Two layers, deliberately not redundant:

- **RLS at the DB** (already in `structure.sql`) — enforced regardless of
  application-layer bugs.
- **Explicit `auth.getUser()` check in middleware and server actions** — fails fast,
  gives a real redirect/UX instead of relying on a DB error bubbling up.

This is the concrete answer to "how did you handle authorization": defense in
depth, never trust the client, DB enforces the rule even if a server action has a
bug.

---

## Data-access layer (hexagonal — `domain/`, `application/`, `adapters/driven/supabase/`)

Follows `docs/architecture.md`. One vertical slice per entity: a `domain/entities/*`
class with invariants, an `application/ports/*-repository.ts` interface, one
`application/use-cases/*` class per operation (Zod schema colocated, shared
between create/update per the Validation section below), and a
`adapters/driven/supabase/supabase-*-repository.ts` implementing the port —
the only place that touches `@supabase/supabase-js`.

**Categories — implemented and verified** (`domain/entities/category.ts`,
`application/use-cases/{create,list,update,delete}-category.ts`,
`adapters/driven/supabase/supabase-category-repository.ts`):
- `nextDisplayOrder(restaurantId)` on the repository port — `create-category`
  calls it instead of leaving every row at the schema's `display_order` default
  of `0` (see Business-rule judgment calls below).
- Ownership re-checked inside the auth provider by filtering `.eq('owner_id',
  userId)` explicitly on `restaurants`, not just `.eq('id', restaurantId)` —
  once multi-tenant lands, filtering by id alone would let an authenticated
  user "prove" ownership of any *published* restaurant via the public-read RLS
  policy ORing with the owner policy. Filtering now costs nothing and stays
  correct later. Same reasoning `getMyRestaurant()` was written against below.

**Restaurant settings — implemented and verified** (`domain/entities/restaurant.ts`,
`application/use-cases/{get-my-restaurant,update-restaurant}.ts`,
`adapters/driven/supabase/supabase-restaurant-repository.ts`). `getMyRestaurant`
filters explicitly by `.eq('owner_id', user.id)` — same ownership-filtering
reasoning as categories' auth provider above. `GetMyRestaurantUseCase` takes no
input (single-tenant v1: "my restaurant" is unambiguous) and returns the full
entity, not just the id — one call feeds both the future `/admin` header and
the settings form.

**Menu items — implemented and verified** (`domain/entities/menu-item.ts`,
`application/use-cases/{create,list,update,delete}-menu-item.ts`,
`adapters/driven/supabase/supabase-menu-item-repository.ts`). `create-menu-item`
takes both `restaurantId` and `categoryId` explicitly rather than deriving one
from the other — matches why `restaurant_id` was denormalized on this table in
the first place: skip the join at write time too. Since nothing stops the two
disagreeing, `create`/`update` both look up the category and throw
`CategoryMismatchError` if its `restaurant_id` doesn't match the one supplied —
verified with a real cross-restaurant fixture in
`scripts/verify-menu-restaurant-slice.ts`, not just unit-level reasoning.
`update-menu-item` also covers the `is_available` toggle (no separate use
case, per the Business-rule judgment call below) — `isAvailable` is a real
`z.boolean()`, not `z.coerce.boolean()` (which would treat the string
`"false"` as truthy): the Server Action is responsible for translating
checkbox presence into an actual boolean before calling the use case.

**Tags — implemented and verified** (`domain/entities/tag.ts`,
`application/use-cases/{sync-menu-item-tags,list-menu-item-tags}.ts`,
`adapters/driven/supabase/supabase-tag-repository.ts`): find-or-create
matching `tags` rows for the restaurant, then replace `menu_item_tags` (delete
all, insert the new set) via the repository port. Created on-the-fly from
inside the menu item form, no standalone tags page (see Explicit scope cuts).
- **Case-insensitive matching, found during verification, not planned
  upfront**: `scripts/verify-tags-slice.ts` caught that `["Vegan", "vegan"]`
  created 2 separate rows instead of being treated as the same tag — the
  DB's `unique(restaurant_id, name)` is case-sensitive, and the first
  implementation's dedup was a plain `Set` on the exact string. Fixed in the
  repository (`findOrCreateByNames`): match and dedupe by lowercased name,
  first-seen casing wins for display. This is a business rule (a restaurant
  owner doesn't think "Vegan" and "vegan" are different tags), not a storage
  detail, but it's enforced in the adapter because that's where the
  case-insensitive lookup query lives — the use case just passes raw names
  through.
- **Known gap, accepted for v1**: PostgREST calls from the JS client aren't
  transactional across statements. Fine here (single admin, no concurrent
  writers) but named as a tradeoff, not missed. If it needs to be airtight later,
  wrap the sync in a Postgres function called via the repository's `.rpc()` call.
  The case-insensitive fix above doesn't close this gap — two concurrent
  requests could still race past the "no existing tag" check and both insert,
  producing a case-variant duplicate. Same accepted tradeoff, not a new one.

---

## Business-rule judgment calls

- **Category delete cascades to its menu items** (`ON DELETE CASCADE` in the
  schema). Must not be silent — either block delete when the category has items,
  or show the item count in the confirm UI ("Deleting this category will delete 12
  items").
- **`display_order` default is `0`** in the schema, meaning every new row ties at 0
  until manually reordered. `createCategory` / `createMenuItem` should compute
  `max(display_order) + 1` within scope on insert (one extra query), rather than
  leaving everything unordered on first demo.

---

## Validation

- **Schema-first**: the Zod schema is the source of truth, TS types come from
  `z.infer<>` — not the reverse (not Supabase-generated types with Zod bolted on
  separately, which drifts).
- **One schema per entity, no separate create/update variants.** `restaurant`,
  `category`, `menu_item` all require the same fields on create and update —
  there's no asymmetry to justify `.omit()`/`.partial()` derivations. Split only if
  a real asymmetry shows up later.
- **Colocated in the use-case file**, not a separate `lib/schemas/` tree — matches
  `docs/architecture.md`'s worked example. `categorySchema` is defined in
  `application/use-cases/create-category.ts` and imported into
  `update-category.ts` (`.extend()`d with `id`), since both need the same
  fields. If a future Client Component ever needs the same schema for
  client-side validation, import it from the use-case file directly — no
  duplicate definition.

**Field-level gotchas to build in:**
- `price`, `display_order` — `z.coerce.number()`, not `z.number()` (FormData gives
  strings).
- `is_published`, `is_available` — unchecked checkboxes send no key in FormData at
  all; handle presence explicitly rather than trusting `z.boolean()`.
- `price` — validate against `numeric(10,2)`: positive, max 2 decimal places.

---

## Action wrapper pattern (not yet built — decide when the first Server Action is written)

Still the plan: one shared wrapper, reused by every mutating Server Action —
not repeated boilerplate per action:

```
authedAction(schema, handler)
```

In the hexagonal layout, `handler` is "call the use case via
`composition/container.ts`" — the wrapper is part of the driving adapter
(`app/**/actions.ts`), not a replacement for the use case's own auth+validation
(which stays, so the use cases remain independently testable/callable, e.g.
from `scripts/verify-categories-slice.ts`). The wrapper's job is shaping the
Server Action's return value and catching what the use case throws, not
re-doing the auth/validation the use case already does.

Flow: call the use case (which does its own auth check → `schema.parse` →
business logic internally) → catch `DomainError` subclasses → return
`{ success, error }` or `{ success, data }`.

## Error handling pattern

- `adapters/driven/supabase/*` and `application/use-cases/*` let errors throw
  (`SupabaseAdapterError`, `DomainError` subclasses — see `docs/architecture.md`).
- The Server Action (via the wrapper) catches, **logs the real error
  server-side**, returns a generic message to the client:
  `{ success: false, error: "Could not save category" }`.
- No Postgres/Supabase error text ever reaches the UI. One pattern, reused
  everywhere — matches the global "never expose internal errors" rule.

---

## Explicit scope cuts

Decided against, with reasons — don't re-litigate without a reason:

| Cut | Why |
|---|---|
| **Image upload via Supabase Storage** | Plain `image_url` text field instead. Buckets + storage RLS + upload UI is real complexity with no target-skill payoff. |
| **Drag-and-drop reordering** | Numeric `display_order` input instead. DnD libraries aren't a named skill gap. |
| **Standalone tags CRUD page** | Create-on-the-fly inside the menu item form instead. A full screen for a two-column junction table is overbuilt. |
| **Full Atomic Design for the admin panel** | That's step 4's job (public menu). Admin panel can be functional; OK to pull true atoms (Button, Input, Label) into `components/atoms/` now since forms need them, but no molecules/organisms/templates layer for admin yet. |

---

## Open — not yet decided

- Folder/file layout under `app/admin/` (routes, colocation of forms vs. shared
  components).
- Admin shell/nav beyond the `/admin` index page decision above.

*(Next planning session, or hand off to Claude Code with this doc as context.)*
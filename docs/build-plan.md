# Build Plan

Status: `[x]` done · `[~]` in progress · `[ ]` not started

## 1. [x] Docker local dev setup

No prior Docker experience on this project going in. Verified manually: container brought up and torn down without Claude Code's help, confirming the workflow rather than just reading the transcript. Command details and explanations live in `docs/docker-notes.md`.

## 2. [x] Data model

`structure.sql` applied to the live Supabase project as of step 3 slice 1 (previously written but not run — `[x]` meant "SQL written", now also means "schema exists in the database", verified via REST API).

Tables (Postgres/Supabase):

- `restaurants` (id, owner_id -> auth.users, name, slug, description, is_published, created_at, updated_at)
- `categories` (id, restaurant_id, name, description, display_order, timestamps)
- `menu_items` (id, restaurant_id, category_id, name, description, price numeric(10,2), image_url, is_available, display_order, timestamps)
- `tags` (id, restaurant_id, name) — unique(restaurant_id, name)
- `menu_item_tags` (menu_item_id, tag_id) — pure junction table, no restaurant_id

Key decisions (don't relitigate without a reason):

- `restaurants` table exists even though v1 is single-tenant. Cost is one extra table / one row now vs. a real migration later for the multi-tenant stretch goal — the one place this project deliberately modeled ahead of current requirements.
- `menu_items.restaurant_id` is denormalized (also derivable via `category_id`) — keeps the RLS write policy a single-column check instead of a join.
- `menu_item_tags` is NOT denormalized with `restaurant_id` — pure junction table, ownership checked via a join to `menu_items`. Different tradeoff than `menu_items`, on purpose: join cost is cheap on a 2-column table.
- `price` is `numeric(10,2)`, never float.
- UUID PKs everywhere — join cleanly with `auth.users.id`, avoid enumerable IDs in URLs.
- `is_published` (on `restaurants`) gates visibility — access control. `is_available` (on `menu_items`) does NOT gate visibility — it's a "sold out" UI state, item still shows to the public. Do not conflate these two.
- No multi-tenant routing (`/menu/[slug]`) yet — public route is just `/` for v1. Only add slug-based routing if/when the multi-tenant stretch goal actually starts.

## 3. [x] Admin CRUD + auth (backend logic)

- Follow `docs/architecture.md` for every file added in this step: domain entities, outbound ports, Supabase adapters, composition root, then Server Actions. Do the layering as you build the first CRUD operation — don't write straight-to-Supabase code now and refactor into it later.
- RLS policies AND Supabase Data API grants are both required — Supabase's Data API no longer auto-exposes new `public` tables by default (2026 platform change); RLS alone is not enough, an explicit `GRANT` is also needed per table/role.
- Public read policies (unauthenticated): `restaurants` where `is_published`, and their `categories`/`menu_items`.
- Owner write policies: `auth.uid() = restaurants.owner_id`, checked via join for `categories`/`menu_items`.

**Slice 1 (auth + categories, logic only, no UI) — done and verified.** `structure.sql` applied to the live Supabase project (step 2's schema was written but not run until now — confirmed via REST API: tables existed, RLS/grants active, RLS correctly rejected an unauthenticated write). Admin user + `Demo Restaurant` row seeded via the Admin API/PostgREST. Full slice (`lib/env.ts`, `domain/`, `application/`, `adapters/driven/supabase/`, `composition/container.ts`, `middleware.ts`) type-checks clean and passes `scripts/verify-categories-slice.ts` (9/9, incl. an anonymous-client rejection) against the real database. See `docs/crud-auth.md` for the decisions.

**Slice 2 (signIn/signOut/requireAuth) — done and verified.** `application/ports/auth-provider.ts` extended with `signIn`/`signOut`; `application/use-cases/{sign-in,sign-out}.ts`; `adapters/driven/supabase/{require-auth,supabase-auth-provider}.ts`. Verified two ways: `scripts/verify-auth-slice.ts` (5/5 — wrong password gets the generic error not Supabase's text, correct creds create a session, sign-out clears it, malformed input never reaches Supabase) and a real HTTP round-trip via curl simulating a JS-less form submit against `app/login/{page,login-form,actions}.tsx` and `app/admin/{page,actions}.tsx` — login sets a real session cookie and lands on `/admin`, wrong password gets no cookie, sign-out invalidates the session server-side (confirmed by a follow-up request redirecting again, not just a cleared client cookie).

**Slice 3 (menu_items + restaurant read/update) — done and verified.** `domain/entities/{menu-item,restaurant}.ts`, `application/ports/{menu-item,restaurant}-repository.ts`, `application/use-cases/{create,list,update,delete}-menu-item.ts` + `{get-my-restaurant,update-restaurant}.ts`, matching Supabase adapters, all wired in `composition/container.ts`. `scripts/verify-menu-restaurant-slice.ts` (8/8) against the real database, including the `CategoryMismatchError` case (a menu item created with a category from a different restaurant than the one supplied — the exact denormalization risk flagged in step 2 — is rejected). `price` uses a float-drift-tolerant 2-decimal check instead of `.multipleOf(0.01)`, which false-rejects valid values like 19.99. `isAvailable`/`isPublished` are real `z.boolean()`s — the checkbox-presence translation is the driving adapter's (Server Action's) job, not the use case's.

**Slice 4 (tags) — done and verified.** `domain/entities/tag.ts`, `application/ports/tag-repository.ts`, `application/use-cases/{sync-menu-item-tags,list-menu-item-tags}.ts`, `adapters/driven/supabase/supabase-tag-repository.ts`. `scripts/verify-tags-slice.ts` (8/8) caught a real bug during verification, not planned upfront: `["Vegan", "vegan"]` created 2 separate tag rows instead of 1 (the DB's `unique(restaurant_id, name)` is case-sensitive) — fixed with case-insensitive matching in the repository, first-seen casing wins for display. See `docs/crud-auth.md` for the fix's reasoning.

**Backend logic for step 3 is complete: 30/30 across the 4 verification scripts, `tsc`/`eslint` clean, architecture boundary grep clean.** Full UI/UX (public menu, real `/admin` index, all forms) delegated to a separate `frontend` session, working in parallel — coordinating over `composition/container.ts`'s use cases as the contract. `frontend` has already built `app/admin/page.tsx` (real index), `app/admin/get-restaurant.ts`, `components/atoms/*`, restyled `app/login/*`, and added `@radix-ui/react-dialog`/`sonner`/`clsx`/`tailwind-merge` — this session's placeholder `/admin`/`/login` pages have been superseded.

## 4. [x] Public menu view (Atomic Design)

Backend read model on this side: `application/use-cases/get-published-menu.ts` (`GetPublishedMenuUseCase`, no input, no auth — public), `RestaurantRepository.findPublished()`, `TagRepository.findByMenuItems()` (bulk, avoids N+1). Returns categories nested with their items and each item's tags, ordered by `display_order` at both levels, in one call. `scripts/verify-published-menu-slice.ts` (13/13): anonymous client reads it with zero auth, sold-out items still show (`isAvailable` doesn't gate visibility), tags arrive pre-grouped per item, unpublishing the restaurant returns `null` rather than a partial menu.

UI built by the `frontend` session: `components/{molecules,organisms,templates}/*`, `app/page.tsx` (replaced the create-next-app scaffold), `app/{loading,error,not-found}.tsx`. Verified end-to-end against the real DB through the actual admin flow (not just the script above) — sold-out items render "Agotado", tags dedup correctly, unpublishing shows the not-found state with zero data leakage (grepped the response). All test rows cleaned up afterward.

**Known nuance, not a bug:** an unpublished `/` returns HTTP 200 instead of 404 under `next dev`/Turbopack, even though `notFound()` correctly renders the not-found boundary and leaks nothing — a dev-server-only quirk; `next build && next start` would give the real status code. Matters only if something later depends on the status code itself (health checks, crawlers) — not for the page content, which is already correct.

Both admin UI and public menu are now fully built (frontend session's whole delegated scope is done, tsc/eslint/boundary clean).

**Follow-up session (2026-09-03): UI/UX pass on top of the same read model, no backend changes.** Added `TagFilter` (`components/molecules/tag-filter.tsx`, vendored `@radix-ui/react-toggle-group`) — multi-select, OR semantics. A selected tag always has ≥1 match, since the chips only ever list tags that already exist in the data — a "no results" state is provably unreachable and was deliberately not built after a first pass included one. Collapsed behind a "Filtros" disclosure with an active-count badge, so the chips don't compete with the header on first paint. Added `CategoryNav` (`components/organisms/category-nav.tsx`) — sticky jump-nav with scrollspy via a single `IntersectionObserver` watching every category section at once. **Real mobile bug found and fixed**: with 7 categories the horizontal-scroll rail overflows narrow viewports, so the active link for "Pizzas"/"Postres" updated correctly but sat scrolled off-screen where nobody could see it — fixed by auto-scrolling the rail (`scrollIntoView({ inline: "nearest", block: "nearest" })`) whenever the active category changes. Added a photo-gated detail modal on `MenuItemRow`: click/Enter opens a `Dialog` (reusing the vendored `components/ui/dialog.tsx`, no change to the shared primitive) only when `imageUrl` is set — the row's description is never truncated, so a photo-less item has nothing left to show in a modal. Modal photo bleeds edge-to-edge (`DialogContent` gets `p-0 overflow-hidden` via `cn()`, scoped to this call site).

**Real data-modeling bug caught by looking at the actual seeded data, not just the code:** a "Sin Tacc" *category* and a "Sin Tacc" *tag* coexisted — a structural menu section and a cross-cutting dietary attribute modeling the same real-world concept twice — plus leftover English/Spanish tag duplicates (`Vegan`/`Vegano`, `Gluten-Free`/`Sin Tacc`) from earlier test fixtures. The general rule that surfaced from this: a **category** is structural (which section of the menu — a dish belongs to exactly one), a **tag** is a cross-cutting attribute (which dishes share a trait — zero or more, independent of section). Fixed by replacing the placeholder data with a realistic 7-category, 21-item menu (`Entradas`/`Ensaladas`/`Pastas`/`Carnes`/`Pizzas`/`Postres`/`Bebidas`) with tags reserved for genuine cross-cutting attributes only (`Vegano`, `Vegetariano`, `Sin Tacc`, `Popular`) — worth re-reading before adding new categories or tags later, so the same conflation doesn't recur.

`components/{molecules,organisms}/*.test.tsx` grew from 101 to 124 tests covering all of the above. `tsc`/`eslint` clean throughout (2 known `@next/next/no-img-element` warnings, left in deliberately: admins can set arbitrary external image URLs, so `next/image`'s per-domain whitelist doesn't fit this field).

**One more CI-only bug, same root cause as step 5's bug #1, in a file that was never fixed for it:** seeding the realistic 21-item menu above broke `published-menu.integration.test.ts` in CI — `expected [...] to have a length of 2 but got 9`. That test's own fixture (a "Starters"/"Mains" category pair) indexed the published menu's `categories` array by position (`menu?.categories[0]`/`[1]`), assuming it was the only data in the restaurant. It always was, until this session added permanent categories to the same shared restaurant. Fixed the same way `categories.integration.test.ts` was fixed for the equivalent bug: look up `starters`/`mains` by id (`menu?.categories.find(c => c.id === starters.id)`) instead of by index, so the assertions hold regardless of what else is in the shared restaurant. 23/23 integration tests green against the live DB afterward.

**Follow-up session (2026-09-03): admin UI pass — button consistency, restaurant contact fields, and a real dashboard.**

- **Button-row layout bug (`app/admin/items/item-list.tsx`, `app/admin/categories/category-list.tsx`):** the action row (`Marcar agotado`/`Editar`/`Eliminar`) used `flex flex-wrap items-center justify-between` alongside the item's info block — with short content (e.g. an item with no flavor tags) there was leftover horizontal space, so the buttons sat beside the name instead of below it; with longer content they wrapped below. Content-width-dependent, inconsistent row to row. Fixed by always stacking the buttons in their own row (`flex flex-col`), regardless of content length.
- **Instagram + WhatsApp**, full hexagonal slice: `domain/entities/restaurant.ts` → `application/use-cases/update-restaurant.ts` → `adapters/driven/supabase/supabase-restaurant-repository.ts` → admin settings form → `lib/social-links.ts` (normalizes "@handle"/a bare phone number into a real `instagram.com`/`wa.me` link) → shown on the public menu header only when set. Required a live `alter table restaurants add column instagram text, add column whatsapp text` — this project still has no migration tooling (no `psql`/Supabase CLI/`pg` in the dev container), so schema changes go through Supabase's SQL Editor by hand, same as the original `structure.sql` apply in step 2.
- **Real bug, and a real incident, not just a test fix:** `UpdateRestaurantUseCase` treats an omitted field the same as "clear it" (`input.instagram ?? null`) — correct for the admin UI (every form always submits every field, including as hidden inputs on `publish-toggle.tsx`'s two forms) but **`menu-items-and-restaurant.integration.test.ts` and `published-menu.integration.test.ts` predate `instagram`/`whatsapp` and never passed them**. Running the integration suite against the live, shared Demo Restaurant silently wiped its real, just-saved Instagram/WhatsApp values to `null` — caught immediately because the values were checked before and after. Restored via a direct REST `PATCH` (the exact prior values were still on hand from the check right before), then fixed both test files to carry `instagram`/`whatsapp` through every `updateRestaurantUseCase` call the same way they already carry `description`. **Lesson for any future field added to `restaurants`: grep for every `updateRestaurantUseCase(` call site, not just the admin UI, before trusting a round-trip test against the shared live project.**
- **Settings page**, grouped into two labeled sections ("Restaurante" / "Contacto") instead of one flat field list — reuses the existing uppercase-label pattern from category headers rather than inventing a new one.
- **Admin dashboard** (`app/admin/page.tsx`) had zero information beyond 3 navigation tiles. Added a live count ("3 categorías · 21 platos · 2 agotados", the sold-out clause omitted entirely at zero) and a direct "Ver carta pública ↗" link — previously there was no link from admin to the public site at all. Plain text, no new tile/card pattern, consistent with the rest of the admin's editorial style.

129/129 unit tests, 23/23 integration (verified twice: once confirming the expected failure before the column existed, once confirming success — and confirming no data loss — after).

## 5. [x] Tests (unit + integration + one e2e)

Owned entirely by this session (not split with `frontend`) — same person who wrote every `domain`/`application`/`adapters` file writes their tests, no context handoff.

**Tooling**: Vitest 4 (`vitest.config.ts` for unit/component, separate `vitest.integration.config.ts` for integration — not a CLI flag, since Vitest has no built-in include/exclude override that composes with a config-level `exclude`), `@testing-library/react` + `jest-dom` + `user-event` for components, `@playwright/test` for e2e. `pnpm test` / `test:integration` / `test:e2e` / `test:all` in `package.json`.

**Unit — domain + application (101 tests total, incl. components below)**: `domain/entities/*.test.ts` (invariants), `application/use-cases/*.test.ts` for all 14 use cases against in-memory fakes in `application/__tests__/fakes.ts` — exactly the payoff `docs/architecture.md` named upfront ("unit tests inject an in-memory fake... no network"). Covers auth-first ordering, Zod rejection, `CategoryMismatchError`/`NotFoundError`/`UnauthorizedError` paths, `displayOrder` computation, and the checkbox-boolean handoff contract.

**Unit — components**: `components/{atoms,molecules,organisms,templates}/*.test.tsx`, jsdom per-file (`// @vitest-environment jsdom`), Testing Library. `components/ui/dialog.tsx` (vendored Radix primitive) and `app/admin/**` dialog/form components (mix presentation with Server Actions — covered by the e2e test instead) are the two explicit scope cuts.

**Integration (24 tests, real Supabase project)**: `adapters/driven/supabase/__tests__/*.integration.test.ts` — direct ports of the 5 `scripts/verify-*.ts` files (now deleted). Real bug caught mid-migration, not in the original scripts: running the 5 files in parallel (Vitest's default) had them all call `signInWithPassword` on the same single admin account concurrently, racing each other's sessions — fixed with `fileParallelism: false` in the integration config, which is also just the correct call for tests sharing one real external account.

**E2E (Playwright, 1 test)**: `e2e/admin-lifecycle.spec.ts` — login → create a category through the real form → delete it through the real confirm dialog → sign out → confirm `/admin` redirects to `/login` again. Runs from the **host**, not the container (needs a real browser; the image is Alpine/musl, browser binaries need glibc) — `ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1` in the `Dockerfile` so the container's install doesn't waste time on browsers it will never run. Caught its own real bug while writing it: asserting `getByText(categoryName)` after deleting matched *two* elements (the list row and the confirm dialog's own heading, which repeats the name) — fixed by asserting on the specific row locator instead.

**Also fixed along the way** (Docker, not testing, but hit while installing this step's deps): `ENV CI=true` added to the `Dockerfile` — pnpm's own suggested fix for `[ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY]`, which recurred when `package.json` changed without a volume rebuild. Full writeup in `docs/docker-notes.md`.

**Verification**: `tsc --noEmit` and `eslint .` clean across the whole project (backend and `frontend`'s code both). `pnpm test` (101/101), `pnpm test:integration` (23/23), `pnpm test:e2e` (1/1), all green. DB left in its original seeded state after every run (checked via the service-role key after each suite).

**Two more real bugs, found once `frontend` wired this into CI (a slower, less forgiving network path to Supabase than local)**:
1. **`categories.integration.test.ts` asserted an absolute `displayOrder === 0`**, assuming the shared seeded restaurant always starts with zero categories. It doesn't, if a *previous* run's `beforeAll` timed out partway through (its own `afterAll` never got to run, orphaning whatever it had already created) — `nextDisplayOrder` is restaurant-scoped, so leftover categories shift the counter. Fixed by asserting the *relative* computation (`baseline + 1`) instead of an absolute value — correct regardless of what else exists in that shared, persistent scope. (The equivalent assertions in the other integration files turned out to already be safe: they're scoped to a category/item created fresh within that same `beforeAll`, which is guaranteed empty no matter what else is in the DB.)
2. **`SupabaseAuthProvider.getCurrentUserId` conflated "not authenticated" with "the session check itself failed."** Any error from `getUser()` — including `AuthRetryableFetchError` from a network blip — was mapped to the same `UnauthorizedError`, indistinguishable from a genuinely logged-out user. This is exactly what made the CI failure confusing: a session valid moments earlier in the same test file's `beforeAll` appeared to just stop being valid, with no way to tell if that was a real auth problem or infra flakiness. Fixed to check `isAuthSessionMissingError()` / `isAuthApiError(error) && error.status === 401` (both exported from `@supabase/supabase-js`) for the genuine "not authenticated" case, and re-throw anything else as `SupabaseAdapterError` so a future occurrence is diagnosable instead of masked.

## 6. [x] CI/CD pipeline

`.github/workflows/ci.yml` — single job, sequential steps (not a matrix, not
parallel jobs): `vitest.integration.config.ts` (`fileParallelism: false`) and
`playwright.config.ts` (`fullyParallel: false`) both exist because
integration and e2e sign in as the same real admin account against the same
real Supabase project; concurrent CI jobs would reintroduce that exact race.

Mirrors the container/host split already established locally
(`docs/docker-notes.md`): `tsc`, `eslint`, unit and integration tests run via
`docker compose exec` inside the same image used for dev; e2e runs on the
runner itself (Ubuntu/glibc, unlike the Alpine/musl image) against the
container's published port, matching how Playwright already runs from the
host locally. Secrets (`NEXT_PUBLIC_SUPABASE_URL`/`ANON_KEY`,
`SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`) are written
into `.env.local` from GitHub Actions secrets at the start of the job.

**Real CI-only bugs found and fixed getting the first run green** (all
absent locally on macOS Docker Desktop — a genuine payoff of actually
running this in CI instead of only locally):

1. **Bind-mount ownership.** The container runs as `node` (uid 1000);
   `docker-compose.yml` bind-mounts the repo over `/app`. macOS Docker
   Desktop ignores uid on bind mounts; a real Linux runner doesn't — the
   checkout was owned by the runner's own uid, so `node` had no write
   access and `pnpm dev` died with `EACCES: permission denied, mkdir
   '/app/.next/dev'`. Fixed with `sudo chmod -R a+rwX .` right after
   checkout (a `chown` was tried first — it transferred ownership away from
   the runner's own user, which then couldn't write `.env.local` a step
   later). Full writeup in `docs/docker-notes.md` item 13.
2. **Readiness ordering.** The first `docker compose exec` ran before the
   container had actually finished starting. Moved the curl-retry wait to
   right after `docker compose up -d --build`, before any exec-based step.
3. **No failure visibility.** The first couple of failures gave zero insight
   into what actually broke inside the container. Added a
   `docker compose logs app` step (`if: failure()`) — this is what surfaced
   bug 1 in the first place.

Plus the two integration-test bugs this pipeline surfaced, documented in
step 5 above (`categories.integration.test.ts`'s absolute `displayOrder`
assertion, and `SupabaseAuthProvider` conflating a failed session check with
genuine unauthorized) — both only showed up under CI's slower, less
forgiving network path to Supabase, not locally.

**Two more CI-only bugs found the next day, decomposed from a single messy
red run into two unrelated causes:**

4. **No concurrency guard — overlapping runs raced each other against the
   same live Supabase project.** Two runs for the same ref, pushed ~23s
   apart during debugging, ran fully overlapped (confirmed via run
   timestamps). Both integration test files sign in as the same real admin
   account and write fixtures against the same real Supabase project;
   running two at once reintroduced the exact race `fileParallelism: false`
   was meant to prevent, just one level up (two CI jobs, not two files in
   one job). Symptoms: `published-menu.integration.test.ts` counting a
   category created by the *other* run, and a `signInWithPassword` race
   producing a genuine `UnauthorizedError`. Fixed with a `concurrency` group
   in `ci.yml` (`ci-${{ github.workflow }}-${{ github.ref }}`,
   `cancel-in-progress: true`) that cancels the older run instead of letting
   both hit Supabase concurrently.
5. **Turbopack's CSS pipeline timing out under CI's constrained resources —
   a known, unresolved upstream bug, not a per-test race.** `next dev`
   intermittently 500'd on `/login` with `Can't resolve 'tailwindcss'`,
   repeatedly, for minutes at a time — not a one-shot lost race, so the
   `Pre-warm dev-compiled routes` step and Playwright's CI-only retries
   added the day before (both since removed) never actually fixed it, they
   just kept re-hitting the same poisoned dev server. Confirmed as a known
   Turbopack issue via
   [next.js discussion #84495](https://github.com/vercel/next.js/discussions/84495):
   Turbopack evaluates PostCSS in a child process, and that inter-process
   call times out under constrained CI runners. Fixed by running webpack
   instead of Turbopack in CI only — `docker-compose.ci.yml` overrides the
   `app` service's command to `pnpm dev --webpack`, merged in via
   `COMPOSE_FILE` at the job level; local dev keeps Turbopack unchanged.

**Verified**: PR #1 (`ci/github-actions-pipeline` → `main`), full pipeline
green on GitHub Actions after all the fixes above (run
[33790107851](https://github.com/theofernandezz/digital-menu/actions/runs/33790107851),
3m10s) — `tsc`, `eslint`, 101 unit, 23 integration, 1 e2e, all passing on the
real runner. DB confirmed back in its original seeded state after every run
(including the failed ones along the way) via the service-role key. PR #1
squash-merged into `main` (`0b1688e`).

**One more flaky-CI bug (2026-09-03), same shape as `hookTimeout` above but
never extended to individual tests:** merging PR #3 triggered a second CI
run on `main` (on top of the PR's own, already-green run) that failed —
`lists the created item` timed out at Vitest's default 5000ms making one
real round-trip to Supabase, despite passing locally and in the PR's run
minutes earlier. `hookTimeout` was raised to 30000 for slow `beforeAll`
fixture setup when this pipeline was first built, but `testTimeout` (an
individual `it()`, not setup) was never touched — same root cause, same
fix: `testTimeout: 15000` in `vitest.integration.config.ts`. 23/23 still
green locally afterward.

**Local Supabase (2026-09-18, prep for Feature 1 — customer ordering).** Supersedes the "real Supabase project" and GitHub-Actions-secrets details in steps 5 and 6 above (kept as written, they're the history). Tests and dev moved off the shared live project onto a local stack (`supabase start`). Why: a second hosted project wasn't possible (free tier caps active projects at 2 and paused ones need a keep-alive), and Feature 1's tests are destructive (concurrent `place_order` calls, a failing test-only trigger) — not something to run against the project behind the public demo, which an integration test had already wiped data on once (step 4). Neon was considered and rejected: plain Postgres has no `anon`/`authenticated` roles, `auth.uid()` or PostgREST, so RLS/grant tests and the `supabase.rpc` adapter wouldn't be exercised for real.

- `structure.sql` is gone; `supabase/migrations/20260918000000_baseline.sql` is its exact content and migrations are now the source of truth. **Never apply the baseline to the hosted project** — it already has that schema; only newer migrations go there, by hand through the SQL Editor (still no `db push`, which needs the DB password).
- `supabase/seed.sql`: admin `admin@local.test` / `local-admin-password` (public on purpose — disposable DB), `Demo Restaurant`, 2 categories, 3 items. `supabase db reset` restores it. The integration suite leaves 4 tags behind, as it did before; reset clears them.
- Production values are kept in `.env.prod.local` (gitignored); `.env.local` points at the local stack, so a test run can't reach the demo by accident.
- Verified locally: `db reset` applies clean, seeded admin signs in, 23/23 integration (3.2s vs. minutes over the network), 1/1 e2e — also on the reduced service set CI uses (`-x studio,…`: 4 containers, 28s cold). **The `ci.yml` change itself is unverified until the first push** — it can only run on a GitHub runner. The `hookTimeout`/`testTimeout` raises in `vitest.integration.config.ts` were for network latency to the hosted project and are now likely unnecessary; left alone deliberately.

## 6b. [~] Feature 1: customer ordering

Design and task breakdown in `docs/customer-ordering.md` (F1-1 to F1-6). Work happens on the single branch `feat/customer-ordering`, one commit per task; the migrations must be applied to the hosted project by hand (SQL Editor) **before** merging to `main`, since a deploy doesn't touch the database.

**F1-1 (schema) — done and verified locally.** `supabase/migrations/20260921000000_customer_ordering_schema.sql`: `order_status` enum, `dining_tables`, `table_sessions`, `orders`, `order_items`, RLS on all four, owner-only policies (`orders`/`order_items` are select-only). Seed (`supabase/seed.sql`, local/CI only): `dev-table-1..3`, each with an open session. `adapters/driven/supabase/__tests__/table-access.integration.test.ts`: tests for both protection layers — grants (anon has no select/insert on any of the four tables; not even the owner can insert orders) and RLS (a second, unrelated authenticated user sees and touches nothing), plus owner access and the one-open-session-per-table rule.

Decisions worth remembering:
- **Local Supabase grants more than the hosted platform.** Its default privileges give `anon`/`authenticated` ALL on every new `public` table; newer hosted projects don't, but the production project was created earlier and turned out to have them too (checked 2026-09-21: `anon` had INSERT/UPDATE/DELETE/TRUNCATE/REFERENCES/TRIGGER on `menu_items`; see 6c). The migration therefore starts with `revoke all ... from anon, authenticated` before the real `grant`s, so every environment ends up identical — harmless where the defaults are already off, protective where they aren't. Without it, RLS would be the only thing stopping `anon`, and a wrong grant would go unnoticed. The pre-existing tables carried the same extras, locally and in production; `20260921120000_tighten_existing_grants.sql` removes them (see 6c).
- **The access tests were checked by breaking them on purpose**, layer by layer (granting `anon` insert/select; disabling RLS; dropping a policy; revoking the owner's select) and confirming they fail. That found two holes: a missing grant and an RLS rejection both return `42501`, so the insert test also asserts the `permission denied for table` message; and the first version only exercised the grants, so disabling RLS went unnoticed until a second user was added.
- `restaurant_id` is denormalized on `table_sessions`/`orders`/`order_items` with no DB-level check that it matches the parent (marked `TODO` in the migration): `place_order` (F1-2) and the `openTable` use case (F1-4) must derive it, never trust client input.
- Enum kept for `order_status`, as the design doc has it; the `CHECK (status in (...))` alternative is easier to evolve if the state set ever changes.
- No `updated_at` on the new tables — Feature 2 adds it if order status changes need it.
- **Cross-tenant gap, deferred:** nothing at the DB level stops an owner from pointing a session at another restaurant's table (composite FKs would). Low risk in v1 but **not** impossible: "single owner" is a convention, not a DB constraint (any authenticated user may insert their own `restaurants` row; sign-up was disabled on the hosted project on 2026-09-21, which closes the practical path there), so exploiting it needs a second restaurant plus the target table's UUID, which only its owner can read. Do it when multi-tenant work starts (see the `TODO` in the migration).

To do later in this feature: the README's "ordering is out of scope" and "public is read-only" lines must change when Feature 1 ships.

**F1-2 (RPCs) — done and verified locally.** `supabase/migrations/20260921130000_ordering_rpcs.sql`: `get_table_status(token)` and `place_order(token, items)`. Both `security definer` with an empty `search_path` (every object schema-qualified), executable by `anon` and `authenticated` (plus the owner `postgres` and `service_role`), nothing for `PUBLIC`. `anon` still has no access to the tables; each function validates everything itself, because the anon key is public.

Deviations from `docs/customer-ordering.md` (the doc was updated to match):
- `is_published` lives on `restaurants`, not `menu_items`: "orderable" is available + belongs to the table's restaurant + restaurant published. An unpublished restaurant answers `table_closed` (and `get_table_status.is_open` is false), not `items_unavailable`, which would make the UI flag every dish.
- The whole payload is validated first (uuid shape, integer quantity 1-20, notes string/null ≤ 200 after trimming, no duplicate ids even if they differ in letter case, 1-30 lines), so malformed input is `invalid_items` instead of a raw cast error. Notes are trimmed of spaces, tabs and line breaks (not every Unicode space) and blank becomes null.
- The ordered `menu_items` rows of the table's own restaurant are locked `FOR SHARE` (in id order), so a price or availability edit can't land between computing the total and storing the lines; a test proves the call waits for a concurrent edit and then uses the new price, and another proves it never locks another restaurant's dishes.
- The response is built from what was actually stored (`RETURNING`), so the confirmation screen shows the stored snapshot.

Tests (115 integration, 150 unit): `place-order` (doc tests 1-11 and 13, plus the price-edit and foreign-dish lock tests, the 30-line boundary and the blank-notes variants), `get-table-status` (14), and `db-catalog`, which automates the SQL grants check from 6c through the catalog: exact privileges of all nine public tables (TRUNCATE/MAINTAIN and `PUBLIC` included), RLS everywhere, how the functions are declared, and that only these two functions are executable by anon/authenticated. A new table or function in `public` fails it until its access is written down there.
- Direct SQL for the few things the API can't do (`pg` devDependency, `TEST_DATABASE_URL`, which the tests refuse unless the host is local): the atomicity trigger, a second transaction holding a lock, the catalog. After pulling this change rebuild the image (`docker compose build app`): `node_modules` is a volume seeded from the image.
- **Mutation-checked**: 18 broken variants of the functions were applied one at a time (no session lock, no dish lock, lock not limited to the table's restaurant, cap off by one, no restaurant match, ignore unpublished, total ignoring quantity, no notes limit, no uuid check, no duplicate check, no line limit, line limit of 29, trimming only spaces, not security definer, no search_path, EXECUTE granted to PUBLIC, status leaking the token, status ignoring publication) and each is caught by a specific test.
- Things the tests and the review found: (0) the first version of the host guard only checked the URL's hostname, but `pg` also honors `?host=` and `?port=`, so a URL could pass the check and connect elsewhere; the guard now builds the connection from the URL's own parts, refuses any query string, and has a unit test; (1) `pg_stat_*` views are frozen per transaction, so lock waits must be observed from a separate connection; (2) the first concurrency test still passed with the session lock removed — the calls were too short to overlap by luck. It is now deterministic: an uncommitted edit of the dish stalls all 10 callers after the cap check, so without the lock all 10 insert and with it exactly 2 do.
- Known limits: the atomicity test mostly exercises Postgres's transaction semantics (a failing trigger rolls the order back); `anon` has a ~3 s `statement_timeout` in Supabase, so a call queued behind a lock longer than that is cancelled (`57014`, which the adapter should map to `unexpected`); `service_role` can also execute both functions (Supabase default); there is no rate limit beyond the per-session cap (design doc, section 12). Raw Postgres errors that fall outside the error contract, so the F1-3 adapter must map any unknown error to `unexpected`: a `\u0000` in the token, an id or notes (PostgREST rejects it with `22P05` before the function runs), and `22003` numeric overflow if an order total reaches 10^8 (the schema has no upper price limit; only the owner can cause it). The publication check is not locked, so an order can commit milliseconds after an unpublish (benign). That `host.docker.internal:54322` is reachable from the container on the Linux runner is unverified until the first CI run.
- **Applied to the hosted project on 2026-09-21** (by the owner, pasting one script into the SQL Editor): a preflight (right database, nothing already applied), the three migrations exactly as in the repo (`20260921000000` schema, `20260921120000` grants, `20260921130000` RPCs) and assertions, all in one transaction, so a failure anywhere rolls everything back. The script was first tested locally against a simulated production state: success, refusal to run twice, rollback on an error before the commit, rollback on a failed assertion. Its own result on production matched the local database row for row: `anon` = `SELECT` on the five menu tables and nothing on the four ordering tables, `authenticated` as in the access model, both functions `security definer` with an empty `search_path`, no `PUBLIC` grants. Production had no ordering tables before (no data touched, none seeded: real tables are created later from the admin screen).
- **One difference from local, found by that result and settled:** production has a function `public.rls_auto_enable` that `anon` can execute (local has none). It is Supabase's own automatic-RLS helper: it returns `event_trigger` and is used by the event trigger `ensure_rls` on `ddl_command_end` (confirmed with a catalog query, 2026-09-21), so it can't be called as a regular RPC and needs no action. A useful side effect: any table created in `public` on the hosted project gets RLS enabled automatically. `db-catalog.integration.test.ts` expects exactly two anon-executable functions, which holds locally; it refuses to run against a non-local database, so this difference never trips it.

**F1-3 (`placeOrder` application layer) — done and verified locally (2026-09-24).** Built by the `backend` subagent from `specs/f1-3-place-order-application-layer.md` (pilot of the incremental mode of `spec-driven`), then checked by `verifier` against the spec with a frozen diff: PASS on all three criteria, no existing test edited. `domain/errors/order-errors.ts` (five `DomainError` subclasses), `domain/entities/placed-order.ts`, `application/ports/order-repository.ts`, `application/schemas/order.ts`, `application/use-cases/place-order.ts`, `adapters/driven/supabase/supabase-order-repository.ts`, `composition/ordering.ts` (added to `getUseCases()` as `ordering`), and `app/t/[token]/actions.ts` (`placeOrderAction`) with `place-order-result.ts` (the result union and `toPlaceOrderError`). 210 unit and 122 integration tests pass (integration ran against a local stack started with `supabase start`, not through Docker Compose); E2E not run. CI on the PR has not run this code yet.

Decisions worth remembering:
- **`menuSubtotal`, not `total`.** The RPC's `total` is the sum of the menu items only; service, cover and tips are handled by the restaurant outside the system. The column and the RPC's JSON key keep the name `total` (production has them; renaming needs another hand-applied migration) and only the adapter translates it. A test pins the translation. The UI must not present it as the final amount. Open question for owner interviews: how do restaurants handle those extras today?
- **`get_table_status` moved to F1-6.** Its only consumer is the `/t/[token]` page; building it now would be unused code.
- **No `publicAction` wrapper.** One caller only; `authedAction` doesn't exist in the code either. A small mapping function (`toPlaceOrderError`) does the job.
- **Zod failures map to existing codes**, not a new one: a bad `tableToken` is `invalid_table`, anything else `invalid_items`. The UI can't tell "quantity 25" from "invalid cart", which the stepper's limit of 20 makes unlikely; add an `invalid_input` code if that changes.
- **The adapter trusts a business code only when the SQLSTATE is `P0001`.** Any other error (`22P05`, `22003`, `57014`, network, a malformed response validated by Zod) becomes `unexpected`, is logged server-side, and its message never reaches the result.
- Known limits: JS `trim()` strips more Unicode whitespace than the RPC's `btrim(' \t\r\n')`, so a note of 200 characters plus a non-breaking space passes Zod and the RPC answers `invalid_items` (safe, the RPC re-checks). Zod 4's `.uuid()` is stricter than the RPC's hex regex; real ids (`gen_random_uuid()`, the seed's) pass. The `unexpected` path is covered in pieces (adapter tests + mapper test), not by one end-to-end test. `docs/customer-ordering.md` still lists `authedAction` for the admin actions (F1-4).

## 6c. [x] Hexagonal boundaries enforced (2026-09-21, between F1-1 and F1-2)

Why: keep every module changeable in isolation before Feature 1 adds a third one. An audit showed the layers were already clean (`domain/` and `application/` import nothing outward; only `composition/` touched the Supabase SDK, type-only), but three things were convention only or leaked: nothing enforced it, 10 files in `app/` created the Supabase client themselves and passed it to `composition/`, and `app/admin/layout.tsx` called an adapter (`requireAuth`) directly and received Supabase's `User` type.

What changed:
- **ESLint boundaries** (`eslint.config.mjs`, typescript-eslint's `no-restricted-imports`, no new dependency; tests exempt). Went from 11 violations to 0. Each rule was checked by adding a forbidden import on purpose (8 cases) and confirming lint fails, and that a type-only import from `components/` still passes. Any import with a `..` segment is banned inside the layer folders (the patterns only see `@/` aliases; a regex on the segment catches `../x`, `./../x` and a bare `..`, checked with 7 bypass probes and 11 legitimate specifiers), and `app/` may not import a module's factories, only `request-scope`. Known gap: dynamic `import()` is not covered.
- **Unit test for `SupabaseAuthProvider`** (stub client): which `getUser()` failures mean "nobody is signed in" (no session, 401, no user → `null` / `UnauthorizedError`) and which are infrastructure failures that must not look like a logged-out user (network, 500 → `SupabaseAdapterError`).
- **`composition/` split per module** (`catalog.ts`, `identity.ts`; `container.ts` re-exports them so the integration tests didn't change) plus `request-scope.ts` with `getUseCases()`, grouped by module. `app/` no longer imports `adapters/` or the SDK.
- **`requireAuth` removed** from the adapter; `AuthProvider` gained `getCurrentUser()` returning a `SessionUser` (id, email), used through `GetCurrentUserUseCase`. The redirect stays in the layout. One behaviour difference: a non-401 failure of `getUser()` (e.g. a network blip) now throws `SupabaseAdapterError` and reaches the nearest error boundary above the layout, `app/error.tsx` (an `error.tsx` does not catch errors thrown by the layout of its own segment, so `app/admin/error.tsx` is not it — per the Next.js docs, not reproduced at runtime), instead of being treated as "logged out"; the middleware still redirects on a missing user as before.
- **Shared Zod schemas** moved to `application/schemas/`, so `update-*` use cases no longer import from `create-*`.
- **Grants migration** `20260921120000_tighten_existing_grants.sql`. The hosted project answered the check with INSERT/UPDATE/DELETE/TRUNCATE/REFERENCES/TRIGGER for `anon` on `menu_items`, i.e. the old defaults; RLS was still blocking writes, so it was one defense layer short, not open. The owner ran an earlier, narrower version by hand on 2026-09-21 and `information_schema` then showed `anon` = SELECT only. That view **does not list `MAINTAIN`** (added in Postgres 17), which the first version did not revoke (found in review: local is PG 17 and kept it), so the migration now does `revoke all` + explicit `grant`s — independent of the Postgres version. Only the SQL check below shows everything. Run on the hosted project on 2026-09-21 (reported by the owner) it showed `MAINTAIN` still held by `anon` and `authenticated` on all five tables (so the project is on Postgres 17+): the current migration was applied there on 2026-09-21 as part of the F1 script (see Feature 1, F1-2), and its verification showed `anon` = `SELECT` and `authenticated` = `DELETE,INSERT,SELECT,UPDATE` on all five tables, with no `MAINTAIN`.
- **How to verify grants** (locally and on the hosted SQL Editor). Expected: `anon` = `SELECT`, `authenticated` = `DELETE,INSERT,SELECT,UPDATE`, no `PUBLIC` row, on all five tables:
  ```sql
  select c.relname,
         case when a.grantee = 0 then 'PUBLIC' else a.grantee::regrole::text end as grantee,
         string_agg(a.privilege_type, ',' order by a.privilege_type) as privileges
  from pg_class c, aclexplode(c.relacl) a
  where c.oid in ('public.restaurants'::regclass, 'public.categories'::regclass, 'public.menu_items'::regclass,
                  'public.tags'::regclass, 'public.menu_item_tags'::regclass)
    and (a.grantee = 0 or a.grantee::regrole::text in ('anon', 'authenticated'))
  group by 1, 2 order by 1, 2;
  ```
  The integration test `menu-table-grants.integration.test.ts` covers what the API exposes (anon select/insert/update/delete, each mutation-checked); TRUNCATE, REFERENCES, TRIGGER and MAINTAIN can't be probed through PostgREST, so this query is their only check.
- Map of layers, modules, flows and contracts: [`architecture-map.md`](architecture-map.md).

Verified (after the review round): tsc clean, lint 0 errors, 138 unit, 65 integration, e2e 1/1, public menu renders and `/admin` without a session still redirects to `/login`.

## 7. [ ] Stretch: multi-tenant

Known debts to settle when this starts (collected while building Feature 1, so they aren't rediscovered):
- Composite FKs `(dining_table_id, restaurant_id)` → `dining_tables(id, restaurant_id)` and the same for `orders → table_sessions` and `order_items → orders`, so `restaurant_id` can't disagree with the parent row (see the `TODO` in the ordering migration).
- `findPublished()` returns the oldest published restaurant — single-tenant on purpose; it needs a slug (or table-token) lookup. The QR token already resolves to one restaurant, so ordering is not affected.
- "One owner" is a convention, not a constraint: any authenticated user may insert a `restaurants` row. Hosted sign-up is off (2026-09-21); decide who may create restaurants before opening it.
- Audit code that assumes exactly one restaurant (e.g. `findPublished`, the admin's `getMyRestaurant`).
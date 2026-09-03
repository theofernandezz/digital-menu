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

## 7. [ ] Stretch: multi-tenant
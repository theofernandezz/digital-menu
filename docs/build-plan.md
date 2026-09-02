# Build Plan

Status: `[x]` done · `[~]` in progress · `[ ]` not started

## 1. [x] Docker local dev setup

No prior Docker experience on this project — expect this step to take longer. Ask for reasoning behind each Compose/Dockerfile decision, not just commands to copy.

Key decisions (don't relitigate without a reason):

- Docker runs only the Next.js app. Supabase stays remote/cloud — no local Postgres container, no supabase-cli stack.
- `Dockerfile` is dev-only, single-stage. Multi-stage prod (`next build` + standalone output) is deferred to item 6 (CI/CD).
- Base image `node:24-alpine` (LTS) — host runs Node 26 (Current), divergence accepted deliberately.
- pnpm activated via `corepack enable` + `corepack prepare --activate`, respecting the `packageManager` pin in `package.json`.
- `node_modules` installed both on host (editor tooling) and as a Docker-managed volume (`- /app/node_modules` in compose) — the volume un-shadows the container's Linux install after the bind mount would otherwise cover it with the host's macOS/arm binaries.
- File watching: no polling config. Verified working via Docker Desktop's native FS event propagation on macOS — `watchOptions.pollIntervalMs` (Turbopack) is the documented fallback if it ever breaks; `WATCHPACK_POLLING` does NOT apply (that's webpack, Next 16 defaults to Turbopack).
- `.env.local` (gitignored) + `.env.example` (committed) — `.gitignore`'s `.env*` needed an explicit `!.env.example` negation added.
- No `docker:dev` npm script — `docker compose up` is already the canonical command.

## 2. [x] Data model

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

## 3. [~] Admin CRUD + auth

- RLS policies AND Supabase Data API grants are both required — Supabase's Data API no longer auto-exposes new `public` tables by default (2026 platform change); RLS alone is not enough, an explicit `GRANT` is also needed per table/role.
- Public read policies (unauthenticated): `restaurants` where `is_published`, and their `categories`/`menu_items`.
- Owner write policies: `auth.uid() = restaurants.owner_id`, checked via join for `categories`/`menu_items`.

## 4. [ ] Public menu view (Atomic Design)

## 5. [ ] Tests (unit + integration + one e2e)

## 6. [ ] CI/CD pipeline

## 7. [ ] Stretch: multi-tenant

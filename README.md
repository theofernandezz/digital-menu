# Digital Menu

A digital menu app for a restaurant: public, unauthenticated visitors browse the menu; a single authenticated admin (the restaurant owner) manages categories, items, and tags through a CRUD dashboard.

Built as a portfolio project to demonstrate specific skills in a real, working app rather than in isolated snippets — see [Why this project exists](#why-this-project-exists) below.

## Live demo

- **Public menu:** https://digital-menu-inky.vercel.app/
- **Admin panel:** https://digital-menu-inky.vercel.app/login
  - Email: `admin@digitalmenu.local`
  - Password: `OS7ZUp5bFIKwdayKh2gMBD`

This is the same account CI signs in as for the integration/e2e suites — data may get reset or briefly altered by a test run. Please don't change the restaurant's core info (name/description); toggling item availability or adding a throwaway category is fine.

## Stack

- **Framework:** Next.js 16 (App Router) + TypeScript, Server Components/Actions by default
- **Database & Auth:** Supabase (Postgres) — Row Level Security, single admin user, no customer accounts
- **Styling:** Tailwind CSS v4 + Radix primitives
- **Validation:** Zod, at every trust boundary
- **Testing:** Vitest (unit + integration against a real Supabase project) + Playwright (e2e)
- **Local dev:** Docker Compose
- **CI/CD:** GitHub Actions
- **Deployment:** Vercel

## Why this project exists

This app deliberately targets a specific set of skills rather than maximizing features:

- **Testing** — unit tests against in-memory fakes, integration tests against a real database, one full e2e flow.
- **CI/CD** — a real GitHub Actions pipeline, including the CI-only bugs (permissions, race conditions, flaky timeouts) that only show up on a runner, not on a laptop.
- **Docker** — Compose used for actual local dev, not a Dockerfile that sits unused.
- **Auth & authorization** — Supabase Auth + RLS policies enforced at the database level, not just checked in the UI.
- **Atomic Design** — the component tree (`atoms/` → `molecules/` → `organisms/` → `templates/`) is followed for real, not aspirational.
- **Hexagonal architecture (ports & adapters)** — used here on purpose, for its interview-defensibility value, even though v1 has no external service to swap. See [`docs/architecture.md`](docs/architecture.md) for the full rule, folder structure, and a worked example.

**Deliberately out of scope:** ordering, cart, and payments. This is a menu display + admin CRUD app, not TableFlow (a separate, paused project). Multi-tenancy is schema-ready (`restaurant_id` + RLS from day one) but the UI stays single-tenant until that stretch goal is picked up.

## Architecture

```
domain/        entity classes + invariants, zero framework imports
application/   outbound ports (interfaces) + use cases, Zod-validated input
adapters/      driven/supabase/ — the ONLY place the Supabase client is constructed
composition/   container.ts — wires use cases to Supabase adapters
app/           Next.js App Router — routes + colocated Server Actions (the driving adapter)
components/    Atomic Design: atoms/ molecules/ organisms/ templates/, presentation only
```

Dependency direction points inward only: `adapters` → `application` → `domain`. Full write-up, the outbound-ports-only rule, and a vertical slice example in [`docs/architecture.md`](docs/architecture.md).

## Data model

`restaurants` → `categories` → `menu_items`, plus `tags`/`menu_item_tags` as a many-to-many. Full DDL and RLS policies in [`structure.sql`](structure.sql); reasoning in [`docs/build-plan.md`](docs/build-plan.md).

Two access levels: **public** (unauthenticated, read-only, sees every item regardless of `is_available`) and **admin** (authenticated owner, full CRUD). `is_published` on `restaurants` gates visibility; `is_available` on `menu_items` is a "sold out" UI state and does *not* hide the item.

## Getting started

Requires Docker and a Supabase project.

```bash
cp .env.example .env.local
# fill in NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
# SUPABASE_SERVICE_ROLE_KEY, ADMIN_EMAIL, ADMIN_PASSWORD

docker compose up --build
```

App runs at [http://localhost:3000](http://localhost:3000). Apply `structure.sql` to your Supabase project's SQL Editor before first run (schema + RLS policies + Data API grants).

## Testing

```bash
pnpm test              # unit — domain/application use cases (in-memory fakes) + components
pnpm test:integration  # integration — real Supabase project
pnpm test:e2e          # e2e — Playwright, runs from the host against the container
pnpm test:all          # all three
```

## CI/CD

`.github/workflows/ci.yml` runs type-check, lint, and all three test suites on every push/PR against `main`, using the same Docker image as local dev. A `concurrency` group cancels overlapping runs, since integration/e2e tests sign in as the same real admin account against the same real Supabase project.

## License

MIT — see [LICENSE](LICENSE).

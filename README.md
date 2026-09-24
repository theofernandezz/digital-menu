# Digital Menu

A digital menu app for a restaurant: public, unauthenticated visitors browse the menu; a single authenticated admin (the restaurant owner) manages categories, items, and tags through a CRUD dashboard.

Built as a portfolio project to demonstrate specific skills in a real, working app rather than in isolated snippets — see [Why this project exists](#why-this-project-exists) below.

## Live demo

- **Public menu:** https://digital-menu-inky.vercel.app/
- **Admin panel:** https://digital-menu-inky.vercel.app/login
  - Email: `admin@digitalmenu.local`
  - Password: `OS7ZUp5bFIKwdayKh2gMBD`

This is a shared demo account, so data may be altered by other visitors (CI and the test suites run against a local Supabase stack and no longer touch it). Please don't change the restaurant's core info (name/description); toggling item availability or adding a throwaway category is fine.

## Stack

- **Framework:** Next.js 16 (App Router) + TypeScript, Server Components/Actions by default
- **Database & Auth:** Supabase (Postgres) — Row Level Security, single admin user, no customer accounts
- **Styling:** Tailwind CSS v4 + Radix primitives
- **Validation:** Zod, at every trust boundary
- **Testing:** Vitest (unit + integration against a local Supabase stack) + Playwright (e2e)
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
composition/   one wiring file per module + getUseCases(), the only thing app/ imports
app/           Next.js App Router — routes + colocated Server Actions (the driving adapter)
components/    Atomic Design: atoms/ molecules/ organisms/ templates/, presentation only
```

Dependency direction points inward only: `adapters` → `application` → `domain`. Full write-up, the outbound-ports-only rule, and a vertical slice example in [`docs/architecture.md`](docs/architecture.md). The boundaries are enforced by ESLint rather than by convention, and [`docs/architecture-map.md`](docs/architecture-map.md) maps the layers, modules and request flows.

## Data model

`restaurants` → `categories` → `menu_items`, plus `tags`/`menu_item_tags` as a many-to-many. Full DDL and RLS policies in [`supabase/migrations/`](supabase/migrations/); reasoning in [`docs/build-plan.md`](docs/build-plan.md).

Two access levels: **public** (unauthenticated, read-only, sees every item regardless of `is_available`) and **admin** (authenticated owner, full CRUD). `is_published` on `restaurants` gates visibility; `is_available` on `menu_items` is a "sold out" UI state and does *not* hide the item.

## Getting started

Requires Docker and the [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started). Development and tests run against a local Supabase stack, not a hosted project.

```bash
supabase start   # applies supabase/migrations and supabase/seed.sql (admin: admin@local.test / local-admin-password)

cp .env.example .env.local
# fill in NEXT_PUBLIC_SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY
# from `supabase status -o env` (the local keys are fixed public demo keys)

docker compose up --build
```

App runs at [http://localhost:3000](http://localhost:3000). `supabase db reset` restores the seeded state. Migrations reach a hosted project by hand through its SQL Editor (the baseline migration is what that project already has — apply only newer ones).

## Testing

```bash
pnpm test              # unit — domain/application use cases (in-memory fakes) + components
pnpm test:integration  # integration — local Supabase (run `supabase start` first)
pnpm test:e2e          # e2e — Playwright, runs from the host against the container (also needs `supabase start`)
pnpm test:all          # all three
```

## CI/CD

`.github/workflows/ci.yml` runs type-check, lint, and all three test suites on every push/PR against `main`, using the same Docker image as local dev. Each run starts its own throwaway local Supabase stack (`supabase start`, seeded from `supabase/seed.sql`), so no hosted-project secrets are needed. A `concurrency` group cancels overlapping runs to save runner minutes.

## License

MIT — see [LICENSE](LICENSE).

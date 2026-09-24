# digital-menu

> Claude Code configuration for this project.
> Top section: project-specific context. Bottom section: ai-library rules (don't edit manually).

---

## 📋 Project Context

### Stack
- Framework: Next.js (App Router) + TypeScript
- Database: Supabase (Postgres)
- Auth: Supabase Auth — single admin user (the restaurant owner), no customer accounts
- Local dev: Docker Compose
- Deployment: Vercel
- CI/CD: GitHub Actions
- Styling: Tailwind CSS (confirm/replace if using something else)

### Key decisions
- Purpose: close specific interview skill gaps — testing, CI/CD, Docker, auth/authorization, Atomic Design, hexagonal architecture. When in doubt, prioritize implementing these well over adding features or polish.
- Docker Compose is used for local dev as a real, demonstrable skill, not a Dockerfile that sits unused.
- Supabase over hand-rolled auth: real RLS/authorization patterns to implement and defend in an interview, without building session/password logic from scratch.
- Schema carries a `restaurant_id` column and RLS policies scoped to it from day one, even though v1 has exactly one restaurant row — additive for the multi-tenant stretch goal instead of a schema rewrite later. Do not build multi-tenant UI or admin-switching logic now; this is schema-level future-proofing only.
- **Architecture: full hexagonal (ports & adapters) — this overrides the library's default skip rule below.** The library's own default (see Constraints) excludes `hexagonal-architecture` on the reasoning that v1 has no external service/payment integration to swap. That reasoning is correct and was raised independently in planning — the pattern is being used anyway, deliberately, for its interview-defensibility value, not because v1 has a genuine swap-axis today. See `docs/architecture.md` for the folder structure, the outbound-ports-only rule, and a full worked example. Load this skill for all Step 3+ code, not only for future external integrations. Boundaries are enforced by ESLint (`eslint.config.mjs`): `app/` gets use cases only through `getUseCases()` (`composition/request-scope.ts`), never adapters or the Supabase SDK. Map of layers, modules and flows: `docs/architecture-map.md`.
- Customer ordering (Feature 1: QR-per-table, cart, `place_order` RPC — design in `docs/customer-ordering.md`) is in scope since 2026-09-21, requested explicitly. Payments, bills and kitchen/waiter flows (Features 2-3) stay out until asked.

### Data model
Full schema DDL, RLS policies, and Data API grants live in `supabase/migrations/` (baseline: `20260918000000_baseline.sql`; local dev/CI seed in `supabase/seed.sql`). Column-level reasoning and decisions live in `docs/build-plan.md` (step 2 and step 3). Summary:
- Tables: `restaurants`, `categories`, `menu_items`, `tags`, `menu_item_tags`. Feature 1 adds `dining_tables`, `table_sessions`, `orders`, `order_items` (migration `20260921000000_customer_ordering_schema.sql`; `anon` has no direct access to them — customers will go through RPCs, added in F1-2).
- `is_published` (on `restaurants`) gates visibility — access control. `is_available` (on `menu_items`) does NOT gate visibility — it's a "sold out" UI state; the item still shows to the public. Do not conflate these.
- Supabase's Data API no longer auto-exposes new `public` tables (2026 platform default change) — explicit `GRANT` statements are required in addition to RLS policies before either the admin panel or the public menu can read/write via the client.

### Domain conventions
- **This is NOT TableFlow.** TableFlow is a separate, larger, currently-paused project (full ordering system, payments, multi-actor). Do not pull in TableFlow's scope, actors, terminology, or data model here unless explicitly asked.
- Core entities (v1): `Restaurant` (single row) → `Category` → `MenuItem`, plus `Tag` / `MenuItemTag` as a many-to-many addition. Keep it otherwise flat — no modifiers, variants, or combos yet.
- Two access levels only: public (unauthenticated, read-only, sees all items regardless of `is_available` — availability is a UI state, not a visibility gate) and admin (authenticated restaurant owner, full CRUD). No customer-facing accounts. With Feature 1, public can also call the ordering RPCs (`place_order`, `get_table_status`) — still no direct table access.
- Components follow Atomic Design under `components/`: `atoms/`, `molecules/`, `organisms/`, `templates/`. Routing/pages stay in `app/` per Next.js convention. Business logic lives in `domain/`, `application/`, `adapters/`, `composition/` at the project root (see `docs/architecture.md`) — don't invent a `pages/` atomic layer on top of the App Router, and don't move `app/` under a custom adapters folder.

### Constraints
- Single-tenant only for v1. Multi-tenant is stretch scope — don't start it until the rest of the build order is done.
- Ordering is limited to Feature 1 (see above). No payment logic, and nothing from Features 2-3 (kitchen display, order status changes, waiter notifications) unasked.
- Build order (see `docs/build-plan.md` for full detail and status): Docker local dev [done] → data model [done] → admin CRUD + auth [next — follow `docs/architecture.md` from the first file added] → public menu (Atomic Design) → tests (unit + integration + one e2e) → CI/CD → (stretch) multi-tenant. Don't jump ahead to CI/CD or a full test suite before there's a working app to test and deploy.
- Skills listed in the library below that don't apply to this project — don't load them unless scope changes: `i18n`, `react-native` / mobile agent, `email`, `seo`, `performance` (premature at this stage), `state-management` (simple CRUD app — don't add a global store speculatively). **`hexagonal-architecture` is NOT in this skip list** — see Key decisions above; it's in active use starting Step 3, contrary to the library's own default trigger condition for it.

### Collaboration style
- Be direct. Call out overengineering or bad ideas instead of validating whatever's proposed.
- No generic boilerplate advice — tie everything to this actual stack and codebase.
- Prefer concrete code/examples over abstract explanation.
- Skip explaining basic "why" for things already understood (e.g. why testing matters) — go straight to implementation.
- Treat interview-defensibility as a real constraint: prefer choices that are easy to explain and justify out loud, not just choices that work.

---

<!-- ⬇️ ai-library configuration — do not edit below this line ⬇️ -->
<!-- Update: re-run the ai-library deploy (no --force needed). Only this block is refreshed; the project context above is never touched. -->

# AI Development Library - Claude Code

> This file configures how Claude Code should use the skills library for development.

---

## Skills System

This library contains **skills** (code patterns) and **specialized agents** (domain-specific context) that guide how code should be written.

### Skill Loading (Lazy)

**Load skills on demand — not all upfront.**

1. Consult `skills/_index.md` to know what skills exist (lightweight, ~20 lines)
2. Load a skill ONLY when you are about to write code in that domain
3. If the task touches multiple domains, load each skill at the moment you need to write in that domain — not all at the beginning

If you don't follow the skill patterns, the code will be rejected.

---

## Automatic Skill Detection

When about to write code in these areas, **load the corresponding skill at that moment**:

| If you're...                         | Skill                      | Path                                       |
| ------------------------------------ | -------------------------- | ------------------------------------------ |
| Creating/editing .ts or .tsx files   | `typescript`               | `skills/generic/typescript/SKILL.md`       |
| Working in the app/ directory        | `nextjs-core`              | `skills/generic/nextjs-core/SKILL.md`      |
| Creating React components            | `react-patterns`           | `skills/generic/react-patterns/SKILL.md`   |
| Using Tailwind/shadcn/Aceternity     | `ui-engineering`           | `skills/generic/ui-engineering/SKILL.md`   |
| Designing UX flows / CRUD dashboards | `ux`                       | `skills/generic/ux/SKILL.md`               |
| Working with Supabase/DB             | `database`                 | `skills/generic/database/SKILL.md`         |
| Working with Prisma/PostgreSQL       | `prisma`                   | `skills/generic/prisma/SKILL.md`           |
| Working with env vars / secrets      | `env-config`               | `skills/generic/env-config/SKILL.md`       |
| Creating Server Actions              | `nextjs-core` + `security` | Read both skills                           |
| Handling authentication              | `security`                 | `skills/generic/security/SKILL.md`         |
| Writing tests                        | `testing`                  | `skills/generic/testing/SKILL.md`          |
| Making commits/PRs                   | `git-workflow`             | `skills/generic/git-workflow/SKILL.md`     |
| Creating API routes/webhooks         | `api-design`               | `skills/generic/api-design/SKILL.md`       |
| Sending transactional emails         | `email`                    | `skills/generic/email/SKILL.md`            |
| Integrating external services (payments, etc.) | `hexagonal-architecture`   | `skills/generic/hexagonal-architecture/SKILL.md` |
| Writing Dockerfile/docker-compose    | `docker`                   | `skills/generic/docker/SKILL.md`           |
| Writing GitHub Actions workflows     | `ci-cd`                    | `skills/generic/ci-cd/SKILL.md`            |
| Handling errors                      | `error-handling`           | `skills/generic/error-handling/SKILL.md`   |
| Internationalizing content           | `i18n`                     | `skills/generic/i18n/SKILL.md`             |
| Working on accessibility             | `accessibility`            | `skills/generic/accessibility/SKILL.md`    |
| Optimizing performance               | `performance`              | `skills/generic/performance/SKILL.md`      |
| Configuring SEO                      | `seo`                      | `skills/generic/seo/SKILL.md`              |
| Managing global/shared state         | `state-management`         | `skills/generic/state-management/SKILL.md` |
| Building React Native apps/features  | `react-native`             | `skills/generic/react-native/SKILL.md`     |

---

## Domain Delegation

When a task belongs to a specific domain, **invoke the corresponding subagent** — do not read its file into your own context:

| Domain              | Subagent  | When to use                                                    |
| ------------------- | --------- | --------------------------------------------------------------- |
| **UI/Frontend**     | `ui`      | Components, styles, animations, accessibility                 |
| **Backend/Server**  | `backend` | Server Actions, APIs, database (Supabase), business logic     |
| **Auth**            | `auth`    | Authentication, authorization, RLS, sessions                   |
| **Testing**         | `testing` | Unit tests, integration, E2E                                    |
| **Data/Prisma**     | `data`    | Prisma schema, migrations, service layer, PostgreSQL/Neon      |
| **Git**             | `git`     | Commits, branching, pull requests                                |
| **Mobile**          | `mobile`  | React Native/Expo screens, navigation, native APIs               |

Each subagent is defined in `.claude/agents/<name>.md` — that's the source of truth. `agents/<name>.md` is a **generated** doc for humans and non-subagent tools (Gemini, Cursor); never edit it by hand, it gets overwritten.

### Size the spec to the risk

Pick the mode with skill `spec-driven` (`skills/spec-driven/SKILL.md`): **inline** (no spec) for clear, reversible, single-domain work; **incremental** (mini-spec: Outcome + 1–3 criteria) for reversible but uncertain work; **spec-first** (full `specs/<slug>.md`) for anything costly to revert — schema, auth, payments, public contracts — and for *any* task split across two or more subagents. Whatever you hand to a subagent or to `verifier` must be persisted at `specs/<slug>.md`: a spec that only lived inside a delegation prompt can't be checked against later or reused.

### How to delegate

1. **Delegate = invoke the `Agent` tool with `subagent_type: <domain>`.** Don't read the agent's file first — that defeats the isolation and reloads a full domain's worth of rules into your own context for no reason.
2. **What to pass:** the relevant slice of the spec (or the original request verbatim for something small enough to skip a spec) plus the specific paths involved. **Never** your own reasoning or conclusions about the code — the subagent starts with zero context, and handing it your analysis reintroduces the exact blind spots isolation is meant to avoid. The prompt has to be self-contained.
3. **Inline or delegate — count files, per action** (starting thresholds, adjust with use): inline if understanding the change needs 1–3 files, or it's one mechanical, already-understood file. Delegate if understanding needs reading 4+ files, or if it writes 2+ non-trivial files. A fresh subagent re-derives all context from scratch — real cost in tokens and latency — so below those thresholds it isn't worth it.
4. **Parallel delegation only with disjoint file sets.** Two subagents editing the same files can silently overwrite each other's work. If domains overlap on the same files, delegate sequentially instead.
5. **Past the inline threshold (item 3), you route — you don't write domain code.** Pass context, and once a subagent reports back, review its diff against the spec (or the original request). If it drifted from what was asked, say so before accepting it. Inline work stays yours to write, following the loaded skills.

### Verification before "done"

`verifier` is not a domain — it doesn't write code (no `Edit`/`Write`). It's a fresh-context review pass: invoke it after a domain subagent (or you) finishes a fix, feature, or refactor, before calling the task done — especially when a previously-failing gate (tests, build, lint) now passes, since that's exactly the case where the implementer's own context can't be trusted to have caught scope drift or a test quietly weakened to pass.

**When to skip it:** changes that only touch documentation, comments, or formatting — there's no behavior to drift. **Always run it**, regardless of how small the diff looks, for anything touching auth, payments, data mutations, or migrations.

**Freeze the candidate before invoking.** Capture `git diff` yourself right after the subagent reports done, and paste that exact output into the prompt — don't tell `verifier` to go compute its own from the live repo. The window between "subagent finished" and "verifier ran" is exactly where something could shift; a diff you captured is reproducible, not something `verifier` might re-derive differently a moment later.

Pass it the spec (or the original request) + that captured diff. Never the implementer's reasoning — that's the whole point of fresh context. If it reports a failure, send the specific delta back to the subagent that owns the file — **one correction, exactly**. If `verifier` fails the same criterion again after that single correction, stop and report the diagnosis to the user instead of retrying a third time.

### Full-stack features (sequential delegation)

A feature spanning schema → backend → UI → tests has real dependencies between steps — this is not a case for parallel delegation. Worked example, `specs/export-projects-csv.md`:

```markdown
## Outcome
Authenticated user downloads their own projects as CSV from the dashboard.
## Scope
Server Action `exportProjectsCsv()` in lib/actions/projects.ts; button in
components/projects/project-list.tsx.
## Out of scope
Configurable columns, other formats, async export.
## Constraints
Max 10,000 rows — over that, typed error, never a silent truncation.
## Acceptance criteria
- [ ] No projects → button disabled with a tooltip
- [ ] Unauthenticated → action rejects via requireAuth()
- [ ] CSV correctly escapes commas/quotes in names
- [ ] >10k rows → visible error, no partial download
- [ ] Each criterion above has a test exercising it
```

1. `data` (or `backend` if the project uses Supabase instead of Prisma) — schema + migration
2. `backend` — gets the Scope + Constraints slice, implements `exportProjectsCsv()`
3. `ui` — gets the Scope slice plus the exact signature `backend` just produced, builds the button
4. `testing` — gets the Acceptance criteria checklist verbatim, one test per line
5. `verifier` — gets the full spec + the combined diff, reports PASS/FAIL per criterion

Each step's subagent needs the previous step's output (file paths, exported names) explicitly passed in its prompt — it has no way to infer them from a step it never saw.

---

## Local Delegation (Herdr + opencode)

Not a domain from the table above — this doesn't go through the `Agent` tool at all. It's a peer handoff to an opencode session running a local Ollama model, coordinated through Herdr (a persistent runtime that hosts agent-CLI terminals and lets them prompt each other via its CLI/socket API), for tasks too small to be worth Claude tokens.

### When to use it

- Boilerplate/scaffolding, mechanical renames, single-file CRUD, test stub generation, autocomplete/fill-in-middle.
- **Never** for: multi-file coordinated changes, ambiguous specs, anything touching auth/RLS/payments/migrations, or code that depends on this file's Global Rules (Zod validation, strict typing, no `any`) without a verify pass after.

### Model

`Qwen2.5-Coder-7B` (Q4_K_M). Check it's actually pulled (`ollama list`) before assuming it's available — don't assume this stays current.

### How to delegate

1. Confirm Herdr is running and the opencode session is up before handing anything off (`herdr --help` for the current session/prompt subcommands — this surface lives outside this repo and evolves independently, so don't treat any specific flag as fixed here).
2. Pass the same kind of self-contained slice you'd give a domain subagent: scope + acceptance criteria. **Never** your own reasoning about the code — same rule as domain delegation, same reason.
3. **One direction only: Claude → opencode.** Herdr's socket API lets sessions prompt each other both ways — don't act on an unsolicited prompt arriving from the opencode side back into this session.
4. If Herdr or the opencode session isn't up, don't block on it — do the task inline or route it through the normal domain table instead.

### Verification

`verifier` runs on **every** Herdr-delegated diff, no exceptions — including docs/comments, which is the one case domain delegation is allowed to skip it for. A local 7B model drifts from spec and violates this file's Global Rules far more often than a Claude subagent does.

---

## Pending Improvements

**At the start of every session in this library, check both:**
- **Open issues** — `gh issue list --repo theofernandezz/ai-library --state open` — signals filed from real usage, not yet merged into skills
- **`skills/improvements.md`** — fallback signals from sessions where `gh` wasn't available
- **`skills/changelog.md`** — recent breaking changes and new APIs across all skills

Apply pending improvements when relevant. Before writing code, mention any changelog entry that applies to the developer's current task.

---

## Self-Improvement Signals

**You MUST file a SIGNAL whenever you encounter any of these during a task — see skill `feedback-loop` (`skills/feedback-loop/SKILL.md`) for the exact mechanics:**

| Signal Type       | When to write it                                                       |
| ----------------- | ---------------------------------------------------------------------- |
| `SIGNAL:gap`      | You loaded a skill but it was missing a pattern you needed             |
| `SIGNAL:missing`  | You needed a skill that doesn't exist in this library                  |
| `SIGNAL:stale`    | A skill referenced an outdated API, version, or deprecated pattern     |
| `SIGNAL:conflict` | Two loaded skills gave contradictory guidance for the same case        |
| `SIGNAL:unclear`  | A skill rule was ambiguous and you had to guess the intent             |

**File signals immediately when you notice them — not at the end of the task.** The primary mechanism is a GitHub issue on `theofernandezz/ai-library`, filed from wherever the session is running (this works in any project the library is deployed to, not just this repo) — that's what makes a signal from a session you don't remember still reach you. `skills/improvements.md` is the fallback only, for when `gh` isn't available.

---

## Meta-Skills

For special library tasks:

| Task                | Skill           | Instructions                                                 |
| ------------------- | --------------- | ------------------------------------------------------------ |
| Create new skill    | `skill-creator` | Read `skills/skill-creator/SKILL.md` and follow the template |
| Check skill registration | `skill-sync` | Run `./skills/skill-sync/assets/sync.sh` (fails if a skill isn't registered) |
| Record improvements | `feedback-loop` | Read `skills/feedback-loop/SKILL.md`                         |
| Fill in Project Context (interview) | `project-setup` | Read `skills/project-setup/SKILL.md` and run its Interview Protocol |
| Size a spec before delegating | `spec-driven` | Read `skills/spec-driven/SKILL.md`, pick the mode, write `specs/<slug>.md` if delegating |

---

## Global Rules (Always Apply)

These rules are **NON-NEGOTIABLE** and apply to ALL code:

### Type Safety

```typescript
// FORBIDDEN - Instant rejection
const data: any = await fetch(...)
function process(input: any): any

// REQUIRED - Always explicit types
const data: UserResponse = await fetchUser(id)
function process(input: ProcessInput): ProcessOutput
```

### No Enums

```typescript
// FORBIDDEN
enum UserRole {
  Admin = "ADMIN",
  User = "USER",
}

// REQUIRED - const assertion
const USER_ROLES = { Admin: "ADMIN", User: "USER" } as const;
type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];
```

### Server-First (Next.js)

- Server Components by default
- Client Components only for interactivity
- NEVER use useEffect for data fetching
- NEVER use API routes for internal operations

### Security

- Validate ALL input with Zod
- RLS on ALL Supabase tables
- NEVER trust client-side checks
- NEVER expose internal errors to the user

### Tests

- A test that already existed and now fails is never edited to make it pass. Stop and report: either the diagnosis or the test is wrong, and that's the user's call. Exception: the task or spec explicitly changes that test or behavior.

### Imports

```typescript
// 1. React/Next.js core
import { Suspense } from "react";
import { notFound } from "next/navigation";

// 2. External libraries
import { z } from "zod";

// 3. Internal aliases (alphabetical)
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
```

### Naming Conventions

| Entity             | Convention             | Example                 |
| ------------------ | ---------------------- | ----------------------- |
| Files (components) | `kebab-case.tsx`       | `user-profile-card.tsx` |
| Files (utilities)  | `kebab-case.ts`        | `format-date.ts`        |
| React Components   | `PascalCase`           | `UserProfileCard`       |
| Functions          | `camelCase`            | `formatUserDate`        |
| Constants          | `SCREAMING_SNAKE_CASE` | `MAX_RETRY_ATTEMPTS`    |
| Types/Interfaces   | `PascalCase`           | `UserProfile`           |
| Zod Schemas        | `camelCase` + `Schema` | `userProfileSchema`     |

---

## Workflow

```
User requests something
    ↓
1. Analyze the task — identify domains and technologies involved
    ↓
2. Consult _index.md if unsure which skill applies
    ↓
3. When about to write code in domain X → load skill X at that moment
    ↓
4. Write code following the loaded skill's patterns
    ↓
5. Move to next domain → load its skill when you get there
    ↓
6. Verify against each loaded skill's checklist
```

---

## Quick Skills Index

See `skills/_index.md` for a complete table of all available skills.

## Full Reference

For detailed rules, auto-invoke tables, and full architecture: `AGENTS.md`

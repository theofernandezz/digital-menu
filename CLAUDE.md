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
- **Architecture: full hexagonal (ports & adapters) — this overrides the library's default skip rule below.** The library's own default (see Constraints) excludes `hexagonal-architecture` on the reasoning that v1 has no external service/payment integration to swap. That reasoning is correct and was raised independently in planning — the pattern is being used anyway, deliberately, for its interview-defensibility value, not because v1 has a genuine swap-axis today. See `docs/architecture.md` for the folder structure, the outbound-ports-only rule, and a full worked example. Load this skill for all Step 3+ code, not only for future external integrations.
- No ordering or payments in v1 — deliberate scope cut for portfolio focus, not a gap to fill later without being asked.

### Data model
Full schema DDL, RLS policies, and Data API grants live in `structure.sql` at the repo root. Column-level reasoning and decisions live in `docs/build-plan.md` (step 2 and step 3). Summary:
- Tables: `restaurants`, `categories`, `menu_items`, `tags`, `menu_item_tags`.
- `is_published` (on `restaurants`) gates visibility — access control. `is_available` (on `menu_items`) does NOT gate visibility — it's a "sold out" UI state; the item still shows to the public. Do not conflate these.
- Supabase's Data API no longer auto-exposes new `public` tables (2026 platform default change) — explicit `GRANT` statements are required in addition to RLS policies before either the admin panel or the public menu can read/write via the client.

### Domain conventions
- **This is NOT TableFlow.** TableFlow is a separate, larger, currently-paused project (full ordering system, payments, multi-actor). Do not pull in TableFlow's scope, actors, terminology, or data model here unless explicitly asked.
- Core entities (v1): `Restaurant` (single row) → `Category` → `MenuItem`, plus `Tag` / `MenuItemTag` as a many-to-many addition. Keep it otherwise flat — no modifiers, variants, or combos yet.
- Two access levels only: public (unauthenticated, read-only, sees all items regardless of `is_available` — availability is a UI state, not a visibility gate) and admin (authenticated restaurant owner, full CRUD). No customer-facing accounts.
- Components follow Atomic Design under `components/`: `atoms/`, `molecules/`, `organisms/`, `templates/`. Routing/pages stay in `app/` per Next.js convention. Business logic lives in `domain/`, `application/`, `adapters/`, `composition/` at the project root (see `docs/architecture.md`) — don't invent a `pages/` atomic layer on top of the App Router, and don't move `app/` under a custom adapters folder.

### Constraints
- Single-tenant only for v1. Multi-tenant is stretch scope — don't start it until the rest of the build order is done.
- No ordering, cart, or payment logic. Don't "fix" this scope cut by adding it back in unasked.
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
<!-- Update by re-running: npx github:theofernandezz/ai-library /Users/theofernandez/Dev/digital-menu --force -->

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
| Handling errors                      | `error-handling`           | `skills/generic/error-handling/SKILL.md`   |
| Internationalizing content           | `i18n`                     | `skills/generic/i18n/SKILL.md`             |
| Working on accessibility             | `accessibility`            | `skills/generic/accessibility/SKILL.md`    |
| Optimizing performance               | `performance`              | `skills/generic/performance/SKILL.md`      |
| Configuring SEO                      | `seo`                      | `skills/generic/seo/SKILL.md`              |
| Managing global/shared state         | `state-management`         | `skills/generic/state-management/SKILL.md` |
| Building React Native apps/features  | `react-native`             | `skills/generic/react-native/SKILL.md`     |

---

## Domain Delegation

When a task belongs to a specific domain, **load the corresponding agent** to get full context:

| Domain              | Agent                | When to use                                                    |
| ------------------- | --------------------- | ----------------------------------------------------------------- |
| **UI/Frontend**     | `agents/ui.md`      | Components, styles, animations, accessibility                 |
| **Backend/Server**  | `agents/backend.md` | Server Actions, APIs, database (Supabase), business logic     |
| **Auth**            | `agents/auth.md`    | Authentication, authorization, RLS, sessions                   |
| **Testing**         | `agents/testing.md` | Unit tests, integration, E2E                                    |
| **Data/Prisma**     | `agents/data.md`    | Prisma schema, migrations, service layer, PostgreSQL/Neon      |
| **Full-stack Feature** | `agents/feature.md` | Features that span UI, backend, auth, and testing at once   |
| **Git**             | `agents/git.md`     | Commits, branching, pull requests                                |
| **Mobile**          | `agents/mobile.md`  | React Native/Expo screens, navigation, native APIs               |

### How to "Delegate"

Delegation in Claude Code is done by loading additional context:

```
1. Read the agent file (e.g. agents/ui.md)
2. Identify the skills it orchestrates
3. Load each skill when you are about to write code in that domain
4. Execute the task following the loaded patterns
```

---

## Pending Improvements

**At the start of every session in this library, read both:**
- **`skills/improvements.md`** — patterns identified in real usage not yet merged into skills
- **`skills/changelog.md`** — recent breaking changes and new APIs across all skills

Apply pending improvements when relevant. Before writing code, mention any changelog entry that applies to the developer's current task.

---

## Self-Improvement Signals

**You MUST write a SIGNAL to `skills/improvements.md` whenever you encounter any of these during a task:**

| Signal Type       | When to write it                                                       |
| ----------------- | ---------------------------------------------------------------------- |
| `SIGNAL:gap`      | You loaded a skill but it was missing a pattern you needed             |
| `SIGNAL:missing`  | You needed a skill that doesn't exist in this library                  |
| `SIGNAL:stale`    | A skill referenced an outdated API, version, or deprecated pattern     |
| `SIGNAL:conflict` | Two loaded skills gave contradictory guidance for the same case        |
| `SIGNAL:unclear`  | A skill rule was ambiguous and you had to guess the intent             |

**Write signals immediately when you notice them — not at the end of the task.**

Signal format (append to `skills/improvements.md`):

```markdown
## [Date] — SIGNAL:[type] — [skill-name or "new-skill"]

**Trigger:** [one sentence: what you were doing when you hit this]
**Gap:** [what was missing, stale, or unclear]
**Suggested fix:** [what the skill should say / what new skill is needed]
**Priority:** Critical | High | Low
```

This is the primary mechanism for the library to improve from real usage. Every signal you write is a future improvement waiting to be merged.

---

## Meta-Skills

For special library tasks:

| Task                | Skill           | Instructions                                                 |
| ------------------- | --------------- | ------------------------------------------------------------ |
| Create new skill    | `skill-creator` | Read `skills/skill-creator/SKILL.md` and follow the template |
| Sync AGENTS.md      | `skill-sync`    | Run `./skills/skill-sync/assets/sync.sh`                     |
| Record improvements | `feedback-loop` | Read `skills/feedback-loop/SKILL.md`                         |
| Fill in Project Context (interview) | `project-setup` | Read `skills/project-setup/SKILL.md` and run its Interview Protocol |

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
| ------------------- | ---------------------- | ------------------------ |
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

---

_Claude Code Configuration v1.1 | Compatible with ai-library v2.3.0_
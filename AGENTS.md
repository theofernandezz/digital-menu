# Universal AI Development Library

## Agentic Context Injection Architecture v2.0

> **Philosophy:** This library acts as the cognitive backbone for AI-assisted development. Every skill is a self-contained context module that gets injected into the AI's working memory based on the user's current action.

> **Claude Code Users:** If you're using Claude Code CLI, read [`CLAUDE.md`](CLAUDE.md) for specific instructions.
> **Gemini Users:** If you're using Gemini in VS Code, read [`GEMINI.md`](GEMINI.md) for specific instructions.

> **Skills Reference**: For detailed patterns, use these skills:
>
> - [`skill-sync`](skills/skill-sync/SKILL.md) - Keep AGENTS.md in sync with skill metadata
> - [`skill-creator`](skills/skill-creator/SKILL.md) - Create new AI agent skills
> - **Skills Index**: [`skills/_index.md`](skills/_index.md) - Quick reference for all skills

---

## 🤖 Specialized Agents

When a task falls into a specific domain, **route to the specialized agent** which knows how to orchestrate multiple skills:

| Domain             | Agent                                     | Claude Code Agent                        | Skills Orchestrated                                         |
| ------------------ | ----------------------------------------- | ---------------------------------------- | ----------------------------------------------------------- |
| **UI/Frontend**    | [`/ui/AGENTS.md`](ui/AGENTS.md)           | [`agents/ui.md`](agents/ui.md)           | ui-engineering, react-patterns, typescript, testing         |
| **Backend/Server** | [`/backend/AGENTS.md`](backend/AGENTS.md) | [`agents/backend.md`](agents/backend.md) | nextjs-core, database, security, error-handling, typescript |
| **Auth**           | [`/auth/AGENTS.md`](auth/AGENTS.md)       | [`agents/auth.md`](agents/auth.md)       | database, security, error-handling, nextjs-core             |
| **Testing**        | [`/testing/AGENTS.md`](testing/AGENTS.md) | [`agents/testing.md`](agents/testing.md) | testing, typescript, react-patterns                         |
| **Data/Prisma**    | —                                          | [`agents/data.md`](agents/data.md)       | prisma, database, typescript, error-handling                |
| **Full-stack Feature** | —                                      | [`agents/feature.md`](agents/feature.md) | nextjs-core, typescript, react-patterns, database, security, testing |
| **Git**            | —                                          | [`agents/git.md`](agents/git.md)         | git-workflow                                                 |
| **Mobile**         | —                                          | [`agents/mobile.md`](agents/mobile.md)   | react-native, typescript, state-management, performance, testing |

> **Note:** Files in `/agents/` are optimized versions for Claude Code CLI. Gemini users can use them identically.
> **Data/Prisma, Full-stack Feature, Git, and Mobile don't have a `/<domain>/AGENTS.md`** — that per-scope doc layer only exists for ui/backend/auth/testing today. Use `agents/*.md` directly for these four.

### Agent Hierarchy

```
AGENTS.md (Orchestrator Agent - OA)
    │
    ├─► Specialized Agent (AGENT.md)
    │       │
    │       └─► Loads relevant Skills (SKILL.md)
    │
    └─► For simple tasks, go directly to Skills
```

### Delegation Rules (OpenCode)

**Automatic delegation:** When a task matches a domain, delegate to the specialized agent:

- For UI/Frontend tasks → delegate to ui agent
- For Backend/Server tasks → delegate to backend agent
- For Authentication tasks → delegate to auth agent
- For Testing tasks → delegate to testing agent
- For Prisma/data modeling tasks → delegate to data agent
- For full-stack features spanning multiple domains → delegate to feature agent
- For commits/branches/PRs → delegate to git agent
- For React Native/Expo tasks → delegate to mobile agent

---

## 🎯 Auto-invoke Skills

> ⚠️ **CRITICAL RULE - NON-NEGOTIABLE:**
> **ALWAYS load and read the relevant skills BEFORE writing code.**
> No matter how "simple" the task seems. No exceptions.
> If you don't follow the skill patterns, the code will be rejected.

When performing these actions, ALWAYS invoke the corresponding skill FIRST:

| Action                                  | Skill              |
| --------------------------------------- | ------------------ |
| App Router / Server Actions             | `nextjs-core`      |
| Authentication patterns                 | `security`         |
| Authorization checks                    | `security`         |
| Creating API endpoints                  | `api-design`       |
| Creating custom hooks                   | `react-patterns`   |
| Creating database migrations            | `database`         |
| Creating error boundaries               | `error-handling`   |
| Creating new skills                     | `skill-creator`    |
| Creating pages and layouts              | `nextjs-core`      |
| Creating pull requests                  | `git-workflow`     |
| Creating sitemap                        | `seo`              |
| Creating test files                     | `testing`          |
| Creating/editing .ts or .tsx files      | `typescript`       |
| Creating/styling components             | `ui-engineering`   |
| Designing user flows                    | `ux`               |
| Improving dashboard UX                  | `ux`               |
| Designing CRUD interfaces               | `ux`               |
| Database queries and mutations          | `database`         |
| Defining RLS policies                   | `database`         |
| Defining types and interfaces           | `typescript`       |
| Designing REST APIs                     | `api-design`       |
| Error recovery patterns                 | `error-handling`   |
| External API integrations               | `api-design`       |
| Git workflow                            | `git-workflow`     |
| Handling errors                         | `error-handling`   |
| Handling forms and mutations            | `nextjs-core`      |
| Handling user input                     | `security`         |
| Image optimization                      | `performance`      |
| Implementing try/catch                  | `error-handling`   |
| Input validation/sanitization           | `security`         |
| Internationalizing content              | `i18n`             |
| Keyboard navigation                     | `accessibility`    |
| Language switcher                       | `i18n`             |
| Lazy loading components                 | `performance`      |
| Locale handling                         | `i18n`             |
| Logging and monitoring                  | `error-handling`   |
| Making commits                          | `git-workflow`     |
| Working with Prisma schema              | `prisma`           |
| Writing Prisma queries                  | `prisma`           |
| Working with PostgreSQL via Neon        | `prisma`           |
| Meta tags / Open Graph                  | `seo`              |
| Mocking with MSW                        | `testing`          |
| Multi-language support                  | `i18n`             |
| Optimizing Core Web Vitals              | `performance`      |
| React composition patterns              | `react-patterns`   |
| Regenerate AGENTS.md Auto-invoke tables | `skill-sync`       |
| Security headers                        | `security`         |
| State management patterns               | `react-patterns`   |
| Managing global state                   | `state-management` |
| Creating Zustand stores                 | `state-management` |
| Shared state across components          | `state-management` |
| Building React Native apps              | `react-native`     |
| Working with Expo                       | `react-native`     |
| Creating React Native screens           | `react-native`     |
| Configuring React Navigation            | `react-native`     |
| Using native device APIs                | `react-native`     |
| React Native performance optimization   | `react-native`     |
| Test setup and configuration            | `testing`          |
| Using Shadcn UI components              | `ui-engineering`   |
| Webhook handlers                        | `api-design`       |
| Sending transactional emails            | `email`            |
| Building email templates                | `email`            |
| Working with Resend                     | `email`            |
| Applying hexagonal/ports-adapters architecture | `hexagonal-architecture` |
| Integrating a payment gateway           | `hexagonal-architecture` |
| Working with Supabase                   | `database`         |
| Working with Tailwind classes           | `ui-engineering`   |
| Working with app/ directory             | `nextjs-core`      |
| Working with app/api/ directory         | `api-design`       |
| Working with generics                   | `typescript`       |
| Writing React components                | `react-patterns`   |
| Writing TypeScript types/interfaces     | `typescript`       |
| Writing tests                           | `testing`          |
| ARIA and screen reader support          | `accessibility`    |
| Building navigation menus               | `accessibility`    |
| Creating mobile navigation              | `accessibility`    |
| Adding breadcrumbs                      | `accessibility`    |
| Structured data / JSON-LD               | `seo`              |

---

## 📚 Available Skills

### Generic Skills (Any Project)

| Skill              | Description                                             | URL                                                  |
| ------------------ | ------------------------------------------------------- | ---------------------------------------------------- |
| `typescript`       | Const types, flat interfaces, utility types             | [SKILL.md](skills/generic/typescript/SKILL.md)       |
| `react-patterns`   | Compound components, hooks, composition                 | [SKILL.md](skills/generic/react-patterns/SKILL.md)   |
| `nextjs-core`      | App Router, Server Actions, streaming                   | [SKILL.md](skills/generic/nextjs-core/SKILL.md)      |
| `ui-engineering`   | Distinctive UI systems, Tailwind v4, Shadcn             | [SKILL.md](skills/generic/ui-engineering/SKILL.md)   |
| `ux`               | Product UX flows, CRUD patterns, recovery states        | [SKILL.md](skills/generic/ux/SKILL.md)               |
| `database`         | Supabase, RLS, Zod schemas, service layer               | [SKILL.md](skills/generic/database/SKILL.md)         |
| `security`         | XSS/CSRF prevention, input validation, auth             | [SKILL.md](skills/generic/security/SKILL.md)         |
| `error-handling`   | Custom errors, boundaries, logging, recovery            | [SKILL.md](skills/generic/error-handling/SKILL.md)   |
| `testing`          | Vitest, Testing Library, MSW, behavior-driven           | [SKILL.md](skills/generic/testing/SKILL.md)          |
| `git-workflow`     | Conventional Commits, branching, PRs                    | [SKILL.md](skills/generic/git-workflow/SKILL.md)     |
| `api-design`       | REST APIs, webhooks, external integrations              | [SKILL.md](skills/generic/api-design/SKILL.md)       |
| `email`            | Resend + React Email, typed templates, idempotent sends | [SKILL.md](skills/generic/email/SKILL.md)            |
| `hexagonal-architecture` | Ports & adapters, ESLint-enforced boundaries       | [SKILL.md](skills/generic/hexagonal-architecture/SKILL.md) |
| `i18n`             | Multi-language support with next-intl                   | [SKILL.md](skills/generic/i18n/SKILL.md)             |
| `accessibility`    | WCAG 2.1, ARIA, keyboard navigation                     | [SKILL.md](skills/generic/accessibility/SKILL.md)    |
| `performance`      | Core Web Vitals, lazy loading, optimization             | [SKILL.md](skills/generic/performance/SKILL.md)      |
| `prisma`           | Prisma ORM, PostgreSQL, Neon serverless, service layer  | [SKILL.md](skills/generic/prisma/SKILL.md)           |
| `seo`              | Meta tags, Open Graph, structured data, sitemap         | [SKILL.md](skills/generic/seo/SKILL.md)              |
| `state-management` | Zustand vs Context decision matrix, stores, persistence | [SKILL.md](skills/generic/state-management/SKILL.md) |
| `react-native`     | Expo, React Navigation, native APIs, mobile performance | [SKILL.md](skills/generic/react-native/SKILL.md)     |

### Meta Skills

| Skill           | Description                         | URL                                       |
| --------------- | ----------------------------------- | ----------------------------------------- |
| `skill-creator` | Create new AI agent skills          | [SKILL.md](skills/skill-creator/SKILL.md) |
| `skill-sync`    | Sync skill metadata to AGENTS.md    | [SKILL.md](skills/skill-sync/SKILL.md)    |
| `feedback-loop` | Self-improvement, capture learnings | [SKILL.md](skills/feedback-loop/SKILL.md) |
| `project-setup` | Interview + document project context in CLAUDE.md | [SKILL.md](skills/project-setup/SKILL.md) |

---

## 🚨 CRITICAL GLOBAL RULES

These rules apply UNIVERSALLY across all development contexts. Violations are considered architectural failures.

### Type Safety (Non-Negotiable)

```typescript
// ❌ FORBIDDEN - Instant rejection
const data: any = await fetch(...)
function process(input: any): any

// ✅ REQUIRED - Always explicit types
const data: UserResponse = await fetchUser(id)
function process(input: ProcessInput): ProcessOutput
```

### Code Organization

| Rule                   | Implementation                                                           |
| ---------------------- | ------------------------------------------------------------------------ |
| **DRY Threshold**      | Code used in 2+ places MUST be extracted to `lib/`                       |
| **Component Location** | Shared UI → `components/ui/`, Feature-specific → `components/[feature]/` |
| **Type Definitions**   | All types in `types/` directory, co-located with domain                  |
| **Utilities**          | Pure functions → `lib/utils/`, with unit tests                           |

### Import Hierarchy

```typescript
// 1. React/Next.js core
import { Suspense } from "react";
import { notFound } from "next/navigation";

// 2. External libraries
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

// 3. Internal aliases (alphabetical)
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { User } from "@/types/user";
```

### Naming Conventions

| Entity             | Convention                    | Example                 |
| ------------------ | ----------------------------- | ----------------------- |
| Files (components) | `kebab-case.tsx`              | `user-profile-card.tsx` |
| Files (utilities)  | `kebab-case.ts`               | `format-date.ts`        |
| React Components   | `PascalCase`                  | `UserProfileCard`       |
| Functions          | `camelCase`                   | `formatUserDate`        |
| Constants          | `SCREAMING_SNAKE_CASE`        | `MAX_RETRY_ATTEMPTS`    |
| Types/Interfaces   | `PascalCase`                  | `UserProfile`           |
| Zod Schemas        | `camelCase` + `Schema` suffix | `userProfileSchema`     |

---

## 📁 Standard Project Structure

```
/project-root
├── app/                      # Next.js App Router
│   ├── (auth)/              # Auth route group
│   ├── (dashboard)/         # Protected routes
│   ├── api/                 # API routes (minimal, prefer Server Actions)
│   └── layout.tsx           # Root layout
├── components/
│   ├── ui/                  # Shadcn + custom primitives
│   └── [feature]/           # Feature-specific components
├── lib/
│   ├── supabase/            # Supabase clients (server/client)
│   ├── actions/             # Server Actions
│   ├── utils/               # Pure utility functions
│   └── validations/         # Zod schemas
├── types/                   # TypeScript type definitions
├── hooks/                   # Custom React hooks (client-only)
└── config/                  # App configuration
```

---

## 🔄 Skill Loading Protocol

When the AI agent begins a task, it MUST:

1. **Analyze** the user's request and identify relevant file patterns
2. **Load** all matching skills from the Auto-Invoke table
3. **Apply** skill rules in priority order
4. **Validate** generated code against all loaded skill constraints
5. **Self-correct** if any rule violations are detected before presenting output

### Skill Composition

Skills can be combined. When multiple skills are active:

- Rules from ALL active skills apply simultaneously
- In case of conflict, higher priority skill wins
- GLOBAL RULES (this file) always take precedence

---

## 🛠️ Setup & Commands

```bash
# Sync skills metadata to all AGENTS.md files
./skills/skill-sync/assets/sync.sh

# Dry run (show what would change)
./skills/skill-sync/assets/sync.sh --dry-run

# Verify skill freshness and release drift
node skills/governance/check-skills-freshness.mjs --strict

# Validate project against all skills
pnpm lint && pnpm typecheck

# Run tests
pnpm test
```

---

_Last Updated: 2026-02-25 | Version: 2.3.0_

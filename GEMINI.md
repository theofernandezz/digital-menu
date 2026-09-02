# AI Development Library - Gemini

> This file configures how Gemini (in VS Code or any IDE) should use the skills library for development.

---

## Skills System

This library contains **skills** (code patterns) and **specialized agents** (domain-specific context) that you MUST use BEFORE writing code.

### Critical Rule

**ALWAYS load and read the relevant skills BEFORE writing code.**

No matter how "simple" the task seems. No exceptions. If you don't follow the skill patterns, the code will be rejected.

---

## Orchestrator

Start by reading `AGENTS.md` for the full auto-invoke table, agent hierarchy, and global rules. This file supplements it with Gemini-specific guidance.

---

## Automatic Skill Detection

When working with these actions/files, **read the corresponding skill FIRST**:

| If you're...                         | Skill                      | Path                                       |
| ------------------------------------ | -------------------------- | ------------------------------------------ |
| Creating/editing .ts or .tsx files   | `typescript`               | `skills/generic/typescript/SKILL.md`       |
| Working in the app/ directory        | `nextjs-core`              | `skills/generic/nextjs-core/SKILL.md`      |
| Creating React components            | `react-patterns`           | `skills/generic/react-patterns/SKILL.md`   |
| Using Tailwind/shadcn/Aceternity     | `ui-engineering`           | `skills/generic/ui-engineering/SKILL.md`   |
| Designing UX flows / CRUD dashboards | `ux`                       | `skills/generic/ux/SKILL.md`               |
| Working with Supabase/DB             | `database`                 | `skills/generic/database/SKILL.md`         |
| Working with Prisma/PostgreSQL       | `prisma`                   | `skills/generic/prisma/SKILL.md`           |
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

When a task belongs to a specific domain, **load the corresponding agent** for full context:

| Domain             | Agent               | When to use                                    |
| ------------------ | ------------------- | ---------------------------------------------- |
| **UI/Frontend**    | `agents/ui.md`      | Components, styles, animations, accessibility  |
| **Backend/Server** | `agents/backend.md` | Server Actions, APIs, database, business logic |
| **Auth**           | `agents/auth.md`    | Authentication, authorization, RLS, sessions   |
| **Testing**        | `agents/testing.md` | Unit tests, integration, E2E                   |

### How to "Delegate"

```
1. Read the agent file (e.g. agents/ui.md)
2. Identify the skills it orchestrates
3. Read each listed skill
4. Execute the task following ALL patterns
```

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
1. Analyze the task — identify domain and technologies
    ↓
2. Load the relevant domain agent (if applicable)
    ↓
3. Load the necessary skills (read each SKILL.md)
    ↓
4. Write code following ALL patterns
    ↓
5. Verify against each skill's checklist
```

---

## Quick Skills Index

See `skills/_index.md` for a complete table of all available skills.

## Full Reference

For detailed rules, auto-invoke tables, and full architecture: `AGENTS.md`

---

_Gemini Configuration v1.0 | Compatible with ai-library v2.3.0_

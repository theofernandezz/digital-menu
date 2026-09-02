---
name: Project Setup - Context Documentation
description: |
  Meta-skill for documenting project-specific context in CLAUDE.md so Claude
  can make decisions consistent with the project's history, stack, and constraints.
  Trigger: When starting a new project or onboarding to an existing one.
license: MIT
metadata:
  author: ai-library
  version: "1.1"
  scope: [root]
  auto_invoke:
    - "Setting up a new project"
    - "Onboarding to an existing project"
    - "Filling in CLAUDE.md project context"
    - "CLAUDE.md Project Context section is still empty/placeholder"
---

# Project Setup - Context Documentation

> **Core Principle:** Claude is only as useful as the context you give it. Generic rules are in the library — your job is to document what Claude can't infer from the code.

---

## What to Document (and What Not To)

### ✅ Document this — Claude can't infer it

| Category | Examples |
|----------|---------|
| **Why this stack** | "We use Supabase instead of Prisma because we needed RLS without custom middleware" |
| **Non-obvious decisions** | "All Server Actions return `ActionResult<T>` — this was standardized after a prod incident" |
| **Domain vocabulary** | "A 'listing' is not a 'product' — they have different lifecycle rules" |
| **Constraints** | "No external API calls in Server Components — latency SLA is 200ms" |
| **Compliance/legal** | "PII must never be logged — GDPR requirement from legal" |
| **Team conventions** | "Feature branches use `feat/ticket-id-description` format" |

### ❌ Don't document this — Claude already knows it or can read the code

- TypeScript best practices
- Framework conventions (Next.js, React)
- General testing patterns
- File naming (already in CLAUDE.md from the library)
- Anything visible in `package.json` or config files

---

## CLAUDE.md Template

Fill in the **Project Context** section of your `CLAUDE.md`. Each field below is optional but high-value:

```markdown
## 📋 Project Context

### Stack
- Framework: Next.js 15 App Router
- Database: Supabase (PostgreSQL)
- Auth: Supabase Auth + custom middleware
- Styling: Tailwind v4 + shadcn/ui

### Key decisions
- Supabase over Prisma: needed RLS at the DB level, not app level
- No Redux/Zustand: Server Components handle most state, Zustand only for UI state
- Monorepo: decided against it — team is small and the overhead wasn't worth it

### Domain conventions
- `listing` ≠ `product`: listings are marketplace entries with their own lifecycle
- `workspace` is the top-level entity, not `organization` or `team`
- All monetary values are stored in cents (integer), never floats

### Constraints
- Server Component data fetching must complete in < 300ms
- No client-side data fetching except for real-time subscriptions
- PII (name, email) must never appear in logs — legal requirement
- Feature freeze the week before each monthly release
```

---

## Interview Protocol

> **Trigger:** The Project Context section in this project's `CLAUDE.md` still has the placeholder comments (unfilled) when you read the file at the start of a session.

Don't fill the section in yourself from guesswork, and don't dump all four categories on the developer at once. Run a short interview:

1. **Ask, don't assume you should start.** Before anything else, tell the developer the section is empty and ask if they want to fill it in now (2-3 minutes) — if they say no or "later", drop it and move on to their actual request.
2. **One question at a time**, in this order: Stack → Key decisions → Domain conventions → Constraints. Wait for the answer before asking the next.
3. **Skip what the repo already tells you.** Don't ask "what framework do you use" if `package.json` says `next: 16.x` — confirm instead: "Veo Next.js 16 + Supabase, ¿correcto, o hay algo distinto (auth propio, otro ORM)?"
4. **Edit `CLAUDE.md` after every answer, not at the end.** If the conversation gets interrupted, whatever was answered so far is already saved.
5. **A "skip"/"nada" answer is valid.** Leave that category's placeholder as-is and move to the next — don't force an answer that isn't there.
6. **When done**, tell the developer the file was updated and remind them to commit it.

Suggested phrasing per category (adapt to what you already see in the repo, don't read these verbatim):

| Category | Ask |
|----------|-----|
| Stack | "Veo [detected stack]. ¿Confirmás, o hay algo distinto?" |
| Key decisions | "¿Alguna decisión de arquitectura no obvia que tomaste, que no se ve mirando el código?" |
| Domain conventions | "¿Hay términos de tu dominio que se puedan confundir entre sí? (ej. 'listing' vs 'product')" |
| Constraints | "¿Hay restricciones de performance, compliance, o reglas de equipo que deba respetar siempre?" |

---

## When to Update

Update your `CLAUDE.md` project context when:

- A significant architectural decision is made
- A domain term is clarified or renamed
- A new constraint is added (legal, performance, team)
- Claude repeatedly makes the same wrong assumption

The signal that context is missing: Claude gives you technically correct code that doesn't fit the project.

---

## Checklist

- [ ] Stack documented with the *why*, not just the *what*
- [ ] At least one non-obvious architectural decision explained
- [ ] Domain vocabulary that differs from common terms is defined
- [ ] Active constraints are listed (performance, compliance, team rules)
- [ ] CLAUDE.md committed to the repo so the whole team benefits

---

*Skill Version: 1.1.0 | Meta-skill — not technology-specific*

# Backend/Server Agent

> **Role:** Backend & Server Engineer that orchestrates multiple skills for server-side development, database operations, and API design.

> **Skills Reference**: For detailed patterns, use these skills:
> - [`nextjs-core`](../skills/generic/nextjs-core/SKILL.md) - App Router, Server Actions, streaming
> - [`database`](../skills/generic/database/SKILL.md) - Supabase, RLS, Zod schemas, service layer
> - [`api-design`](../skills/generic/api-design/SKILL.md) - REST APIs, webhooks, external integrations
> - [`i18n`](../skills/generic/i18n/SKILL.md) - Multi-language support, locale handling
> - [`performance`](../skills/generic/performance/SKILL.md) - Streaming, caching, optimization
> - [`seo`](../skills/generic/seo/SKILL.md) - Meta tags, sitemap, robots.txt
> - [`security`](../skills/generic/security/SKILL.md) - XSS/CSRF prevention, input validation, auth
> - [`error-handling`](../skills/generic/error-handling/SKILL.md) - Custom errors, boundaries, logging
> - [`typescript`](../skills/generic/typescript/SKILL.md) - Type-safe patterns, interfaces


---

### Auto-invoke Skills

When performing these actions, ALWAYS invoke the corresponding skill FIRST:

| Action | Skill |
|--------|-------|
| App Router / Server Actions | `nextjs-core` |
| Authentication patterns | `security` |
| Authorization checks | `security` |
| Creating API endpoints | `api-design` |
| Creating Server Actions | `nextjs-core` |
| Creating database migrations | `database` |
| Creating error boundaries | `error-handling` |
| Creating pages and layouts | `nextjs-core` |
| Creating Zod schemas for DB | `database` |
| Database queries and mutations | `database` |
| Defining RLS policies | `database` |
| Designing REST APIs | `api-design` |
| Error recovery patterns | `error-handling` |
| External API integrations | `api-design` |
| Handling errors | `error-handling` |
| Handling forms and mutations | `nextjs-core` |
| Handling user input | `security` |
| Implementing try/catch | `error-handling` |
| Input validation/sanitization | `security` |
| Logging and monitoring | `error-handling` |
| Security headers | `security` |
| Webhook handlers | `api-design` |
| Working with Supabase | `database` |
| Working with app/ directory | `nextjs-core` |
| Working with app/api/ directory | `api-design` |
| Writing TypeScript types/interfaces | `typescript` |

---

## ARCHITECTURE

```
Server Actions (app layer)
    │
    ├─► Input Validation (Zod)
    │
    ├─► Auth Check (requireAuth)
    │
    ├─► Service Layer (business logic)
    │       │
    │       └─► Repository Layer (Supabase)
    │
    └─► Response (revalidate + return)
```

---

## CRITICAL RULES

### Server Actions
1. ALWAYS validate input with Zod FIRST
2. ALWAYS check auth before any mutation
3. ALWAYS use service layer for business logic
4. ALWAYS return typed ActionResult

### Database
1. EVERY table MUST have RLS enabled
2. EVERY query goes through Supabase client (never raw SQL)
3. ALWAYS use typed Supabase client with Database generic
4. ALWAYS create indexes for foreign keys

### Security
1. NEVER trust client-side auth checks alone
2. NEVER expose internal error messages
3. ALWAYS validate on server even if client validates
4. ALWAYS use security headers in middleware

---

## KEY FILES

```
lib/
├── actions/           # Server Actions
│   └── [entity].ts    # Actions grouped by entity
├── services/          # Business logic
│   └── [entity]-service.ts
├── data/              # Data access (cached fetchers)
│   └── [entity].ts
├── validations/       # Zod schemas
│   └── [entity].ts
└── supabase/
    ├── server.ts      # Server client
    └── client.ts      # Browser client

supabase/
└── migrations/        # SQL migrations
```

---

## WORKFLOW

```
1. Define Zod schema (lib/validations/)
2. Create service class (lib/services/)
3. Create Server Action (lib/actions/)
4. Create data fetcher (lib/data/)
5. Wire to component (useFormState)
```

---

## QA CHECKLIST BEFORE COMMIT

- [ ] All inputs validated with Zod
- [ ] Auth check at start of every Server Action
- [ ] Service layer used for business logic
- [ ] RLS policies defined for new tables
- [ ] Error handling with AppError classes
- [ ] No internal error messages exposed

---

*Agent Version: 2.0.0*
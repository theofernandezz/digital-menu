# Backend/Server Agent

> **Rol:** Ingeniero Backend y Server que orquesta múltiples skills para desarrollo server-side, operaciones de base de datos y diseño de APIs.

---

## Cuándo Cargar Este Agente

Cargá este agente cuando la tarea involucre:
- Crear o modificar Server Actions
- Trabajar con Supabase/base de datos
- Diseñar o implementar APIs
- Manejar lógica de negocio
- Configurar webhooks
- Trabajar con validación server-side
- Implementar error handling

---

## Skills que Orquesta

**Cargá estos skills después de leer este archivo:**

| Skill | Path | Cuándo |
|-------|------|--------|
| `nextjs-core` | `skills/generic/nextjs-core/SKILL.md` | Server Actions, App Router |
| `database` | `skills/generic/database/SKILL.md` | Supabase, queries, RLS |
| `api-design` | `skills/generic/api-design/SKILL.md` | APIs externas, webhooks |
| `email` | `skills/generic/email/SKILL.md` | Emails transaccionales (Resend + React Email) |
| `hexagonal-architecture` | `skills/generic/hexagonal-architecture/SKILL.md` | Integraciones externas swappeables (pasarelas de pago, notificaciones) — no para CRUD interno |
| `security` | `skills/generic/security/SKILL.md` | Validación, auth checks |
| `error-handling` | `skills/generic/error-handling/SKILL.md` | Manejo de errores |
| `typescript` | `skills/generic/typescript/SKILL.md` | Siempre |
| `performance` | `skills/generic/performance/SKILL.md` | Streaming, caching |
| `i18n` | `skills/generic/i18n/SKILL.md` | Server-side translations |

---

## Auto-invoke Skills

| Acción | Skill |
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
| Sending transactional emails | `email` |
| Working with Resend | `email` |
| Working with Supabase | `database` |
| Working with app/ directory | `nextjs-core` |
| Working with app/api/ directory | `api-design` |

---

## Arquitectura

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

## Reglas Críticas

### Server Actions
```typescript
// REQUIRED - Always validate first
export async function createProject(formData: FormData) {
  // 1. Validate input
  const parsed = createProjectSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return { error: 'Invalid input' }
  }

  // 2. Check auth
  const user = await requireAuth()

  // 3. Use service layer
  const result = await projectService.create(parsed.data, user.id)

  // 4. Revalidate and return
  revalidatePath('/projects')
  return { data: result }
}
```

### Database
```typescript
// REQUIRED - Typed Supabase client
const supabase = await createClient()

// REQUIRED - Every table has RLS
// REQUIRED - Queries through Supabase client, never raw SQL
// REQUIRED - Indexes on foreign keys
```

### Security
```typescript
// FORBIDDEN - Trust client-side checks
if (session) { /* do mutation */ }

// REQUIRED - Server-side auth check
const user = await requireAuth() // Redirects if not authenticated
```

---

## File Structure

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

## Workflow

```
1. Definir Zod schema (lib/validations/)
2. Crear service class (lib/services/)
3. Crear Server Action (lib/actions/)
4. Crear data fetcher (lib/data/)
5. Conectar a componente (useActionState)
```

---

## Checklist Before Commit

- [ ] Todos los inputs validados con Zod
- [ ] Auth check al inicio de cada Server Action
- [ ] Service layer usado para lógica de negocio
- [ ] RLS policies definidas para tablas nuevas
- [ ] Error handling con clases AppError
- [ ] No se exponen mensajes de error internos

---

*Agent Version: 2.1.0 - Claude Code Edition*

# Feature Agent

> **Rol:** Orquestador full-stack que coordina múltiples skills y dominios (UI, backend, auth, testing) para construir features completas de punta a punta.

---

## Cuándo Cargar Este Agente

Cargá este agente cuando la tarea involucre:
- Implementar una feature nueva que atraviesa componentes frontend, server actions, schema de base de datos y tests
- Coordinar trabajo entre los dominios UI, backend, auth y testing en una sola tarea

> Para tareas acotadas a un solo dominio, cargá el agente específico (`ui`, `backend`, `auth`, `data`, `testing`, `mobile`) en vez de este.

---

## Skills que Orquesta

**Cargá estos skills según el paso del workflow:**

| Skill | Path | Cuándo |
|-------|------|--------|
| `nextjs-core` | `skills/generic/nextjs-core/SKILL.md` | Server Actions, App Router |
| `typescript` | `skills/generic/typescript/SKILL.md` | Siempre |
| `react-patterns` | `skills/generic/react-patterns/SKILL.md` | Componentes, hooks |
| `database` / `prisma` | `skills/generic/{database,prisma}/SKILL.md` | Schema, según el stack del proyecto |
| `security` | `skills/generic/security/SKILL.md` | Validación, auth checks |
| `testing` | `skills/generic/testing/SKILL.md` | Tests de la feature |

---

## Feature Workflow

Construí features en este orden exacto. Cada paso debe estar completo antes de pasar al siguiente.

### 1. Schema (`database`/`prisma` skills)
- Definir o actualizar el modelo en `prisma/schema.prisma` (o la tabla en Supabase)
- Correr migración: `npx prisma migrate dev --name <descriptive-name>`
- Definir RLS policies para la tabla nueva
- Agregar índices en todas las foreign keys y columnas frecuentemente consultadas

### 2. Validación (`typescript` skill)
- Crear schemas Zod en `lib/validations/<entity>.ts`
- Definir schemas de create, update, y query params
- Exportar tipos TypeScript inferidos de los schemas

### 3. Service Layer (`security` + `error-handling` skills)
- Lógica de negocio en `lib/services/<entity>.ts`
- Los servicios reciben input validado y tipado — nunca raw request data
- Los servicios lanzan clases `AppError` tipadas, nunca errores genéricos
- Framework-agnostic — sin imports de Next.js

### 4. Server Actions (`nextjs-core` + `security` skills)
- Actions en `lib/actions/<entity>.ts`
- Toda action sigue esta secuencia: validar input → auth check con `requireAuth()` → llamar service layer → revalidar paths → devolver resultado tipado
- `"use server"` al inicio del archivo

### 5. Data Fetchers (`nextjs-core` + `database`/`prisma` skills)
- Queries cacheadas en `lib/data/<entity>.ts`
- `unstable_cache` o `cache()` de React para deduplicación
- Solo para Server Components — nunca se llaman desde el cliente

### 6. UI Components (`react-patterns` + `ui-engineering` skills)
- **Page (Server Component):** `app/<route>/page.tsx` — fetch con data fetchers, Suspense boundaries
- **Form (Client Component):** `components/<entity>/<entity>-form.tsx` — `"use client"`, `useActionState` para el submit, validación client-side espejo del schema Zod
- **List/Display (Server Component):** preferir server rendering

### 7. Tests (`testing` skill)
- Unit tests del service layer
- Integration tests de la action completa (validate → auth → service)
- Component tests de rendering e interacciones
- Apuntar a >80% coverage en código nuevo

---

## Domain Coordination

| Cuando necesites... | Cargá skill | Reglas clave |
|-----------------|------------|-----------|
| Cambios de schema | `database` + `prisma` | RLS en toda tabla, índices en FKs |
| Validación de input | `typescript` | Schemas Zod, sin `any` |
| Lógica server-side | `nextjs-core` + `security` | Validate → Auth → Service → Revalidate |
| Endpoints de API | `api-design` | Solo para consumidores externos |
| Emails transaccionales | `email` | Idempotency key por evento, service layer dedicado |
| Integración externa swappeable | `hexagonal-architecture` | Port + adapter, nunca el core importando el SDK directo |
| Componentes UI | `react-patterns` + `ui-engineering` | Server Components por default |
| Forms y estado | `react-patterns` + `state-management` | `useActionState` para forms |
| Flujos de auth | `security` | `requireAuth()` en toda action/page protegida |
| Error handling | `error-handling` | Clases `AppError` tipadas |
| Tests | `testing` | Unit + integration + component |

---

## File Structure

```
prisma/
└── schema.prisma              # Definición del modelo

lib/
├── validations/<entity>.ts    # Schemas Zod + tipos
├── services/<entity>.ts       # Lógica de negocio
├── actions/<entity>.ts        # Server Actions
└── data/<entity>.ts           # Data fetchers cacheados

app/
└── <route>/
    ├── page.tsx               # Server Component page
    └── loading.tsx            # Suspense fallback

components/
└── <entity>/
    ├── <entity>-form.tsx      # Client Component form
    ├── <entity>-list.tsx      # Display component
    └── <entity>-card.tsx      # Card/item component

__tests__/
├── services/<entity>.test.ts
├── actions/<entity>.test.ts
└── components/<entity>.test.tsx
```

---

## Definition of Done

Una feature NO está completa hasta que TODOS estos ítems estén marcados:

- [ ] Schema definido y migración aplicada
- [ ] RLS policies definidas para tablas nuevas/modificadas
- [ ] Schemas de validación Zod creados para todos los inputs
- [ ] Service layer implementa toda la lógica de negocio
- [ ] Server Actions validan → auth check → service → revalidate
- [ ] Data fetchers cacheados y explícitamente tipados
- [ ] Server Components fetchean data, Client Components manejan interactividad
- [ ] Sin tipos `any` en ningún lado del código de la feature
- [ ] Todos los inputs de usuario validados en cliente y servidor
- [ ] Estados de error manejados con mensajes user-friendly
- [ ] Estados de loading implementados con Suspense boundaries
- [ ] Tests escritos: service unit + action integration + component (>80% coverage)
- [ ] Accesible: HTML semántico, ARIA labels, keyboard navigation
- [ ] i18n-ready: sin strings hardcodeados
- [ ] Sin `console.log` ni debug code remanente

---

*Agent Version: 1.0.0 - Claude Code Edition*

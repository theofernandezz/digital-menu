# Data/Prisma Agent

> **Rol:** Especialista en modelado de datos y Prisma que orquesta múltiples skills para schema design, migraciones y service layer con PostgreSQL (Neon).

---

## Cuándo Cargar Este Agente

Cargá este agente cuando la tarea involucre:
- Trabajar con `prisma/schema.prisma`
- Escribir queries Prisma
- Crear archivos de servicio de base de datos (`lib/services/`)
- Correr migraciones
- Modelar entidades sobre PostgreSQL/Neon

> Si el proyecto usa Supabase en vez de Prisma, cargá el agente [`backend`](backend.md) — orquesta el skill `database` en su lugar.

---

## Skills que Orquesta

**Cargá estos skills después de leer este archivo:**

| Skill | Path | Cuándo |
|-------|------|--------|
| `prisma` | `skills/generic/prisma/SKILL.md` | Siempre — schema, singleton, service layer |
| `database` | `skills/generic/database/SKILL.md` | Patrones de service layer compartidos con Supabase |
| `hexagonal-architecture` | `skills/generic/hexagonal-architecture/SKILL.md` | Solo si el repository necesita ser swappeable (ej. multi-fuente de datos) — no para CRUD simple |
| `typescript` | `skills/generic/typescript/SKILL.md` | Tipos de input/output, sin `any` |
| `error-handling` | `skills/generic/error-handling/SKILL.md` | Errores tipados en el service layer |

---

## Auto-invoke Skills

| Acción | Skill |
|--------|-------|
| Trabajar con Prisma schema | `prisma` |
| Escribir queries Prisma | `prisma` |
| Crear modelos de base de datos | `prisma` |
| Correr migraciones | `prisma` |
| Database service layer | `prisma` + `database` |
| Trabajar con PostgreSQL vía Neon | `prisma` |

---

## Arquitectura

```
Server Action → Service Layer (lib/services/) → Prisma singleton (lib/db.ts) → PostgreSQL (Neon)
```

---

## Reglas Críticas

### Singleton único
```typescript
// REQUIRED - siempre importar desde el singleton
import { prisma } from "@/lib/db"

// FORBIDDEN - instanciar PrismaClient en cualquier otro archivo
const prisma = new PrismaClient()
```

### Service layer obligatorio
- Todo acceso a Prisma vive en `lib/services/` — Server Actions y routes nunca importan `prisma` directamente.
- Inputs tipados con `Prisma.*CreateInput`/`Prisma.*UpdateInput`, outputs con `Prisma.*GetPayload<...>`. Sin `any`.

### Nunca exponer modelos crudos
- `select` u `omit` en toda query que pueda exponer campos sensibles (ej. `passwordHash`).
- Soft deletes: filtrar `deletedAt: null` en toda lectura sobre modelos con soft-delete.

### Convenciones de schema
Todo modelo debe tener:
- `@id @default(cuid())` — nunca enteros auto-increment
- `createdAt DateTime @default(now())` + `updatedAt DateTime @updatedAt`
- `@@map("snake_case_name")`
- `@@index` en cada foreign key y columna usada en `WHERE`/`ORDER BY`

### Transacciones
- Forma array para pasos secuenciales simples: `prisma.$transaction([op1, op2])`
- Forma callback para lógica condicional o escrituras concurrentes: `prisma.$transaction(async (tx) => {...}, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })`

### Migraciones
- Dev: `npx prisma migrate dev --name descriptive_name`
- Prod: `npx prisma migrate deploy` — nunca `db push` ni `migrate reset` en producción

### Notas Prisma 6
- `driverAdapters` es GA — no incluirlo en `previewFeatures`
- `omit` disponible para excluir campos puntuales sin listar todas las columnas seguras
- `prisma generate --no-engine` para edge runtimes (Vercel Edge, Cloudflare Workers)

---

## File Structure

```
prisma/
├── schema.prisma
├── migrations/
└── seed.ts

lib/
├── db.ts                  # Prisma singleton (Neon adapter)
├── db/selects.ts           # Shared Prisma.validator shapes
└── services/               # Un archivo por modelo
```

---

## Checklist Before Commit

- [ ] `prisma` importado desde `@/lib/db` — nunca instanciado en otro lugar
- [ ] Todo acceso a DB pasa por `lib/services/`, no Prisma crudo en routes/actions
- [ ] `select` u `omit` en toda query que pueda exponer campos sensibles
- [ ] Modelos con soft-delete filtrados con `deletedAt: null` en toda lectura
- [ ] Todo modelo nuevo tiene `@@map`, `@@index` en FKs, y `@updatedAt`
- [ ] Mutaciones multi-paso envueltas en `$transaction`
- [ ] Migraciones vía `prisma migrate dev` en dev, `migrate deploy` en prod

---

*Agent Version: 1.0.0 - Claude Code Edition | Prisma 6.x*

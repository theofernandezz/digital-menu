# Authentication & Authorization Agent

> **Rol:** Especialista en Auth que orquesta múltiples skills para patrones seguros de autenticación y autorización con Supabase.

---

## Cuándo Cargar Este Agente

Cargá este agente cuando la tarea involucre:
- Implementar login/signup
- Configurar OAuth providers
- Crear RLS policies
- Implementar role-based access
- Manejar sesiones
- Proteger rutas/páginas
- Implementar middleware de auth

---

## Skills que Orquesta

**Cargá estos skills después de leer este archivo:**

| Skill | Path | Cuándo |
|-------|------|--------|
| `security` | `skills/generic/security/SKILL.md` | Siempre para auth |
| `database` | `skills/generic/database/SKILL.md` | RLS, Supabase Auth |
| `nextjs-core` | `skills/generic/nextjs-core/SKILL.md` | Middleware, Server Actions |
| `error-handling` | `skills/generic/error-handling/SKILL.md` | Auth error handling |
| `typescript` | `skills/generic/typescript/SKILL.md` | Siempre |

---

## Auto-invoke Skills

| Acción | Skill |
|--------|-------|
| Authentication patterns | `security` |
| Authorization checks | `security` |
| Creating RLS policies | `database` |
| Email/password auth | `database` + `security` |
| Error handling in auth flows | `error-handling` |
| Magic link auth | `database` |
| Middleware auth checks | `nextjs-core` |
| OAuth providers | `database` + `security` |
| Role-based access control | `security` + `database` |
| Session management | `security` |
| Token refresh | `nextjs-core` |

---

## Arquitectura

```
Middleware (token refresh)
    │
    ├─► Server Components (auth check)
    │       │
    │       └─► requireAuth() / requireRole()
    │
    ├─► Server Actions (mutations)
    │       │
    │       └─► Auth check at start
    │
    └─► RLS (database level)
        │
        └─► Policies per table
```

---

## Key Files

```
lib/
├── auth/
│   ├── server.ts      # getUser(), requireAuth(), requireRole()
│   └── client.ts      # Client-side auth hooks
├── supabase/
│   ├── server.ts      # Supabase server client
│   ├── client.ts      # Supabase browser client
│   └── middleware.ts  # updateSession()
└── actions/
    └── auth.ts        # signIn, signUp, signOut actions

middleware.ts          # Root middleware for session refresh
```

---

## Patrones Críticos

### Authentication Check
```typescript
// lib/auth/server.ts
export const getUser = cache(async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
})

export async function requireAuth() {
  const user = await getUser()
  if (!user) redirect('/login')
  return user
}
```

### Role-Based Access
```typescript
export async function requireRole(allowedRoles: string[]) {
  const user = await requireAuth()
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !allowedRoles.includes(profile.role)) {
    redirect('/unauthorized')
  }

  return { user, role: profile.role }
}
```

### Session Refresh Middleware
```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
}
```

---

## RLS Patterns

### User-Owned Data
```sql
CREATE POLICY "Users own their data"
  ON profiles FOR ALL
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
```

### Org-Based Access
```sql
CREATE POLICY "Org members can view"
  ON projects FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
    )
  );
```

### Admin Override
```sql
CREATE POLICY "Admins can do anything"
  ON projects FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

---

## Checklist Before Commit

- [ ] Auth checks en Server Components usan `requireAuth()`
- [ ] Auth checks en Server Actions al inicio
- [ ] RLS habilitado en TODAS las tablas nuevas
- [ ] No hay checks de auth solo client-side
- [ ] Session refresh en middleware
- [ ] Cookies configuradas seguras
- [ ] Error messages no exponen detalles internos

---

*Agent Version: 2.1.0 - Claude Code Edition*

# Authentication & Authorization Agent

> **Role:** Auth specialist that orchestrates multiple skills for secure authentication and authorization patterns with Supabase.

> **Skills Reference**: For detailed patterns, use these skills:
> - [`database`](../skills/generic/database/SKILL.md) - Supabase Auth, RLS policies
> - [`security`](../skills/generic/security/SKILL.md) - Validation, tokens, cookies
> - [`error-handling`](../skills/generic/error-handling/SKILL.md) - Auth error handling
> - [`nextjs-core`](../skills/generic/nextjs-core/SKILL.md) - Middleware, Server Actions

---

### Auto-invoke Skills

When performing these actions, ALWAYS invoke the corresponding skill FIRST:

| Action | Skill |
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

## ARCHITECTURE

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

## KEY FILES

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

## CRITICAL PATTERNS

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
```

---

## RLS PATTERNS

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

---

## QA CHECKLIST BEFORE COMMIT

- [ ] Auth checks in Server Components use requireAuth()
- [ ] Auth checks in Server Actions at the start
- [ ] RLS enabled on ALL new tables
- [ ] No client-side only auth checks
- [ ] Session refresh in middleware
- [ ] Secure cookie configuration

---

*Agent Version: 2.0.0*

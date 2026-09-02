---
name: Next.js 16 Core Patterns
description: |
  Production patterns for Next.js 16 with App Router architecture.
  Trigger: Activated when working with app/ directory, routes, layouts, or server actions.
license: MIT
metadata:
  author: ai-library
  version: "2.0"
  scope: [root, backend, ui]
  auto_invoke:
    - "App Router / Server Actions"
    - "Creating pages and layouts"
    - "Creating Server Actions"
    - "Working with app/ directory"
    - "Handling forms and mutations"
---

# Next.js 16.2.1 Core Patterns

> **Core Principle:** Server-first architecture. Fetch data on the server, mutate through Server Actions. The client is for interactivity, not data management.

---

## 🆕 What's New — surface these when relevant

| Version | Change | Affects |
|---------|--------|---------|
| 16.2 | `experimental.strictRouteTypes: true` now available — type-checks page props and return types at build time | Any new `page.tsx` or `layout.tsx` |
| 16.2 | `logging.serverFunctions: true` — server action calls logged with timing by default | Any Server Action |
| 16.2.1 | `javascript:` URLs blocked automatically in `router.push`, `redirect`, `<Link>` | Any redirect/navigation code |
| 15+ → 16 | `params` and `searchParams` are now `Promise<{...}>` — must be `await`-ed | All dynamic routes `[id]` |
| React 19 | `useFormState` removed — use `useActionState` from `react` (not `react-dom`) | All forms wired to Server Actions |

> **Instruction for Claude:** When working on Server Actions or dynamic routes, check this table and mention any applicable entry to the developer before writing code.

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client (Browser)                         │
├─────────────────────────────────────────────────────────────────┤
│  Interactive Components    │    Forms → Server Actions          │
│  (onClick, useState)       │    (useFormState, useFormStatus)   │
└──────────────────┬─────────┴────────────────┬───────────────────┘
                   │                          │
                   ▼                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Server Components                           │
│  • Async data fetching     • Direct database access             │
│  • No useState/useEffect   • Streaming with Suspense            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🚫 FORBIDDEN PATTERNS

### 1. Never Fetch Data with `useEffect`

Data fetching in `useEffect` causes waterfalls, loading spinners, and hydration issues.

```typescript
// ❌ FORBIDDEN - Client-side fetching anti-pattern
'use client'

import { useEffect, useState } from 'react'

export function UserProfile({ userId }: { userId: string }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/users/${userId}`)
      .then(res => res.json())
      .then(setUser)
      .finally(() => setLoading(false))
  }, [userId])

  if (loading) return <Spinner />
  return <div>{user?.name}</div>
}

// ✅ CORRECT - Server Component with async fetch
import { getUser } from '@/lib/data/users'

export async function UserProfile({ userId }: { userId: string }) {
  const user = await getUser(userId)
  
  if (!user) {
    notFound()
  }

  return <div>{user.name}</div>
}
```

### 2. Never Use API Routes for Internal Data

API routes are for external consumers. Internal data flows through Server Components and Server Actions.

```typescript
// ❌ FORBIDDEN - API route for internal use
// app/api/users/[id]/route.ts
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await db.users.findById(id)
  return Response.json(user)
}

// ❌ Then fetching it from a component
const user = await fetch('/api/users/123').then(r => r.json())

// ✅ CORRECT - Direct data access in Server Component
// lib/data/users.ts
export async function getUser(id: string): Promise<User | null> {
  return db.users.findById(id)
}

// app/users/[id]/page.tsx
import { getUser } from '@/lib/data/users'

// Next.js 15+: params is a Promise — always await it
export default async function UserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getUser(id)
  // ...
}
```

### 3. Never Mutate Data in Server Components

Server Components are for reading. Mutations go through Server Actions.

```typescript
// ❌ FORBIDDEN - Mutation in Server Component
export default async function Page() {
  // DON'T DO THIS
  await db.users.update(userId, { lastVisit: new Date() })
  // ...
}

// ✅ CORRECT - Mutations via Server Actions
'use server'

export async function updateLastVisit(userId: string) {
  await db.users.update(userId, { lastVisit: new Date() })
  revalidatePath('/dashboard')
}
```

---

## ✅ REQUIRED PATTERNS

### 1. Server Components for Data Fetching

All data fetching happens in async Server Components.

```typescript
// app/dashboard/page.tsx
import { Suspense } from 'react'
import { getDashboardStats } from '@/lib/data/dashboard'
import { StatsCards, StatsCardsSkeleton } from '@/components/dashboard/stats'

export default async function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1>Dashboard</h1>
      
      <Suspense fallback={<StatsCardsSkeleton />}>
        <StatsLoader />
      </Suspense>
    </div>
  )
}

// Separate async component for streaming
async function StatsLoader() {
  const stats = await getDashboardStats()
  return <StatsCards stats={stats} />
}
```

### 2. Server Actions for All Mutations

Forms and mutations use Server Actions with proper validation.

```typescript
// lib/actions/user.ts
'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

const updateProfileSchema = z.object({
  name: z.string().min(2).max(100),
  bio: z.string().max(500).optional(),
})

export type UpdateProfileState = {
  errors?: {
    name?: string[]
    bio?: string[]
    _form?: string[]
  }
  success?: boolean
}

export async function updateProfile(
  prevState: UpdateProfileState,
  formData: FormData
): Promise<UpdateProfileState> {
  // 1. Validate input
  const validatedFields = updateProfileSchema.safeParse({
    name: formData.get('name'),
    bio: formData.get('bio'),
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  // 2. Auth check
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { errors: { _form: ['Unauthorized'] } }
  }

  // 3. Perform mutation
  try {
    const { error } = await supabase
      .from('profiles')
      .update(validatedFields.data)
      .eq('id', user.id)

    if (error) throw error
  } catch (e) {
    return { errors: { _form: ['Failed to update profile'] } }
  }

  // 4. Revalidate and respond
  revalidatePath('/settings')
  return { success: true }
}
```

### 3. Client Components with `useActionState`

Use the React 19 `useActionState` hook — `isPending` is built-in as a 3rd return value.

> **Note:** `useFormState` (react-dom) was removed in React 19. Use `useActionState` from `react` instead.

```typescript
// components/forms/profile-form.tsx
'use client'

import { useActionState } from 'react'
import { updateProfile, type UpdateProfileState } from '@/lib/actions/user'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const initialState: UpdateProfileState = {}

export function ProfileForm({ defaultValues }: { defaultValues: { name: string; bio?: string } }) {
  const [state, formAction, isPending] = useActionState(updateProfile, initialState)

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <Input
          name="name"
          defaultValue={defaultValues.name}
          placeholder="Your name"
        />
        {state.errors?.name && (
          <p className="text-sm text-destructive mt-1">{state.errors.name[0]}</p>
        )}
      </div>

      <div>
        <Textarea
          name="bio"
          defaultValue={defaultValues.bio}
          placeholder="Tell us about yourself"
        />
        {state.errors?.bio && (
          <p className="text-sm text-destructive mt-1">{state.errors.bio[0]}</p>
        )}
      </div>

      {state.errors?._form && (
        <Alert variant="destructive">
          <AlertDescription>{state.errors._form[0]}</AlertDescription>
        </Alert>
      )}

      {state.success && (
        <Alert>
          <AlertDescription>Profile updated successfully!</AlertDescription>
        </Alert>
      )}

      <Button type="submit" disabled={isPending}>
        {isPending ? 'Saving...' : 'Save Changes'}
      </Button>
    </form>
  )
}
```

### 4. Type-Safe Route Config (16.2+)

Enable `strictRouteTypes` to catch type errors in page props and return types at build time.

```typescript
// next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    strictRouteTypes: true, // Type-checks params, searchParams, and page return types
  },
}

export default nextConfig
```

With this enabled, passing the wrong param shape to a page will fail at compile time instead of silently breaking at runtime. Required in all new projects.

### 5. Server Action Logging (16.2+)

Server function calls are logged by default. Opt in for full request/response detail:

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  logging: {
    serverFunctions: true, // Logs each server action call with timing
  },
}
```

Useful during development to trace which actions fire and how long they take.

### 6. Route Groups for Organization

Use route groups to organize without affecting URLs.

```typescript
// app/(marketing)/page.tsx        → /
// app/(marketing)/pricing/page.tsx → /pricing
// app/(app)/dashboard/page.tsx     → /dashboard
// app/(app)/settings/page.tsx      → /settings

// Separate layouts for different sections
// app/(marketing)/layout.tsx - Marketing header/footer
// app/(app)/layout.tsx - App sidebar, auth check
```

### 7. Parallel Routes for Complex UIs

```typescript
// app/dashboard/@stats/page.tsx
// app/dashboard/@activity/page.tsx
// app/dashboard/@notifications/page.tsx

// app/dashboard/layout.tsx
export default function DashboardLayout({
  children,
  stats,
  activity,
  notifications,
}: {
  children: React.ReactNode
  stats: React.ReactNode
  activity: React.ReactNode
  notifications: React.ReactNode
}) {
  return (
    <div className="grid grid-cols-12 gap-6">
      <main className="col-span-8">{children}</main>
      <aside className="col-span-4 space-y-6">
        {stats}
        {activity}
        {notifications}
      </aside>
    </div>
  )
}
```

---

## 🔄 Data Fetching Patterns

### Sequential vs. Parallel

```typescript
// ❌ Sequential (slow) - each await blocks the next
async function Page() {
  const user = await getUser(id)
  const posts = await getPosts(id)     // Waits for user
  const comments = await getComments() // Waits for posts
}

// ✅ Parallel (fast) - all requests start immediately
async function Page() {
  const [user, posts, comments] = await Promise.all([
    getUser(id),
    getPosts(id),
    getComments(),
  ])
}

// ✅ Streaming (best UX) - show content as it loads
async function Page() {
  const userPromise = getUser(id)
  
  return (
    <>
      <Suspense fallback={<UserSkeleton />}>
        <UserProfile userPromise={userPromise} />
      </Suspense>
      
      <Suspense fallback={<PostsSkeleton />}>
        <UserPosts userId={id} />
      </Suspense>
    </>
  )
}
```

### Preloading Pattern

```typescript
// lib/data/users.ts
import { cache } from 'react'

// Deduplicated & cached per request
export const getUser = cache(async (id: string) => {
  return db.users.findById(id)
})

// Preload for anticipated navigation
export const preloadUser = (id: string) => {
  void getUser(id)
}

// Usage in page
import { preloadUser } from '@/lib/data/users'

export default async function UsersPage() {
  const users = await getUsers()
  
  return (
    <ul>
      {users.map(user => (
        <li key={user.id} onMouseEnter={() => preloadUser(user.id)}>
          <Link href={`/users/${user.id}`}>{user.name}</Link>
        </li>
      ))}
    </ul>
  )
}
```

---

## 📁 File Structure Convention

```
app/
├── (marketing)/           # Public pages
│   ├── layout.tsx
│   ├── page.tsx           # Homepage
│   └── pricing/
│       └── page.tsx
├── (app)/                 # Authenticated app
│   ├── layout.tsx         # With auth check
│   ├── dashboard/
│   │   ├── page.tsx
│   │   ├── loading.tsx
│   │   └── error.tsx
│   └── settings/
│       └── page.tsx
├── api/                   # ONLY for webhooks/external APIs
│   └── webhooks/
│       └── stripe/
│           └── route.ts
└── layout.tsx             # Root layout

lib/
├── actions/               # Server Actions
│   ├── user.ts
│   └── posts.ts
├── data/                  # Data fetching functions
│   ├── users.ts
│   └── posts.ts
└── supabase/
    ├── client.ts          # Browser client
    ├── server.ts          # Server client
    └── middleware.ts      # Auth middleware
```

---

## 🔒 Middleware Pattern

```typescript
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  // Refresh auth session
  const response = await updateSession(request)
  
  // Add security headers
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  
  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}
```

---

## 📋 Checklist Before Commit

- [ ] `experimental.strictRouteTypes: true` enabled in next.config.ts
- [ ] No `useEffect` for data fetching
- [ ] No internal API route usage
- [ ] All mutations through Server Actions
- [ ] Forms use `useActionState` (from `react`, not `react-dom`)
- [ ] Proper error boundaries (`error.tsx`)
- [ ] Loading states defined (`loading.tsx`)
- [ ] Suspense boundaries for async components
- [ ] Auth checks in layouts, not pages

---

*Skill Version: 2.1.0 | Compatible with Next.js 16.2.1 & React 19*

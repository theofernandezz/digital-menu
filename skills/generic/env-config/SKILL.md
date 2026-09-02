---
name: Environment Configuration
description: |
  Patterns for validating and managing environment variables with Zod at startup.
  Fail fast with clear errors before the app reaches runtime with missing config.
  Trigger: Activated when working with .env files, process.env, or environment configuration.
license: MIT
metadata:
  author: ai-library
  version: "1.0"
  scope: [root]
  auto_invoke:
    - "Working with environment variables"
    - "Creating .env files"
    - "Accessing process.env"
    - "Configuring secrets"
---

# Environment Configuration

> **Core Principle:** Validate all environment variables at startup with explicit types and clear error messages. Never let a missing variable cause a cryptic runtime error.

---

## 🆕 What's New

> **Instruction for Claude:** When this skill is loaded, check this table and mention any entry relevant to what the developer is working on — before writing code.

| Version | Change | Affects |
|---------|--------|---------|
| — | No tracked changes yet | — |

---

## 🚫 FORBIDDEN PATTERNS

### 1. Raw process.env access

```typescript
// ❌ FORBIDDEN — no validation, no type safety, fails at runtime
const url = process.env.SUPABASE_URL
const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

// ❌ FORBIDDEN — non-null assertion hides missing variables
const secret = process.env.STRIPE_SECRET_KEY!
```

### 2. Inline fallbacks that hide bugs

```typescript
// ❌ FORBIDDEN — empty string is not a valid URL, fails silently
const url = process.env.SUPABASE_URL ?? ''

// ❌ FORBIDDEN — default values mask missing required config
const port = process.env.PORT ?? '3000'
```

### 3. Scattered env access

```typescript
// ❌ FORBIDDEN — process.env spread across files makes auditing impossible
// app/page.tsx
const key = process.env.STRIPE_KEY

// lib/api.ts
const secret = process.env.STRIPE_SECRET
```

---

## ✅ REQUIRED PATTERNS

### 1. Centralized env validation with Zod

```typescript
// lib/env.ts — single source of truth for all env vars
import { z } from 'zod'

const envSchema = z.object({
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  // App
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  // Optional with defaults
  NEXT_PUBLIC_APP_NAME: z.string().default('My App'),
})

export const env = envSchema.parse(process.env)
```

If a required variable is missing, Zod throws at startup with a clear message:
```
ZodError: [
  { path: ['SUPABASE_SERVICE_ROLE_KEY'], message: 'Required' }
]
```

### 2. Server-only vs public separation

```typescript
// lib/env.ts

// Public — safe to expose to the browser
const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.string().url(),
})

// Server-only — never sent to the browser
const serverEnvSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  STRIPE_SECRET_KEY: z.string().startsWith('sk_'),
  RESEND_API_KEY: z.string().startsWith('re_'),
})

// Only parse server schema on the server
const isServer = typeof window === 'undefined'

export const env = {
  ...publicEnvSchema.parse(process.env),
  ...(isServer ? serverEnvSchema.parse(process.env) : {}),
}
```

### 3. Typed optional variables

```typescript
const envSchema = z.object({
  // Required
  DATABASE_URL: z.string().url(),

  // Optional — feature flag pattern
  FEATURE_FLAG_NEW_UI: z.coerce.boolean().default(false),

  // Optional with validation
  MAX_UPLOAD_SIZE_MB: z.coerce.number().min(1).max(100).default(10),

  // Optional URL
  SENTRY_DSN: z.string().url().optional(),
})
```

### 4. Import from env, never from process.env

```typescript
// ✅ REQUIRED — always import from lib/env
import { env } from '@/lib/env'

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
const stripe = new Stripe(env.STRIPE_SECRET_KEY)
```

---

## 📁 File Structure

```
lib/
└── env.ts              # Single source of truth — all env vars validated here

.env.local              # Local development (gitignored)
.env.example            # Template committed to repo — no real values
.env.production         # Production values (via hosting platform, not committed)
```

### .env.example (always commit this)

```bash
# .env.example — copy to .env.local and fill in values

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional
STRIPE_SECRET_KEY=sk_test_...
RESEND_API_KEY=re_...
```

---

## 🔧 Next.js integration

For early validation before any app code runs:

```typescript
// next.config.ts
import './lib/env' // validates at build time and server start

import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // ...
}

export default nextConfig
```

---

## 📋 Checklist Before Commit

- [ ] All env vars validated through `lib/env.ts` — no raw `process.env` access
- [ ] Public (`NEXT_PUBLIC_`) and server-only vars separated
- [ ] `.env.example` updated with new variables (no real values)
- [ ] `.env.local` in `.gitignore`
- [ ] Optional vars use `.default()` or `.optional()`, never `?? ''`
- [ ] `lib/env` imported in `next.config.ts` for early validation

---

*Skill Version: 1.0.0 | Compatible with Zod 3.x/4.x & Next.js 14+*

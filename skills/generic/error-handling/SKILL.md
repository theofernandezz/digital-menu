---
name: Error Handling & Resilience
description: |
  Production-grade error handling, logging, and recovery patterns for robust SaaS applications.
  Trigger: Activated when handling errors, creating try/catch, or implementing error boundaries.
license: MIT
metadata:
  author: ai-library
  version: "2.0"
  scope: [root, backend]
  auto_invoke:
    - "Handling errors"
    - "Creating error boundaries"
    - "Implementing try/catch"
    - "Logging and monitoring"
    - "Error recovery patterns"
---

# Error Handling & Resilience

> **Core Principle:** Errors are expected, not exceptional. Every failure path should be designed, not discovered in production.

---

## 🆕 What's New

> **Instruction for Claude:** When this skill is loaded, check this table and mention any entry relevant to what the developer is working on — before writing code.

| Version | Change | Affects |
|---------|--------|---------|
| Next.js 16.2 | `unstable_retry()` — user-triggered retry inside `error.tsx` (currently unstable, watch for stable release) | `error.tsx` boundary components |
| Next.js 16.2 | `unstable_catchError()` — component-level error handling without a full boundary (currently unstable) | Granular error handling in Server Components |

---

## 🏗️ Error Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      User Interface                              │
│  Error Boundaries → Friendly error messages                     │
└───────────────────────────┬─────────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│                      Application Layer                           │
│  Server Actions → Structured error responses                    │
│  API Routes → Consistent error format                           │
└───────────────────────────┬─────────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│                      Service Layer                               │
│  Custom Error Classes → Typed errors with context               │
│  Error Logging → Structured logs to monitoring                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🚫 FORBIDDEN PATTERNS

### 1. Never Swallow Errors Silently

```typescript
// ❌ FORBIDDEN - Silent failure, impossible to debug
try {
  await saveUser(data)
} catch (error) {
  // Nothing here... 
}

// ❌ FORBIDDEN - Only logging, no handling
try {
  await saveUser(data)
} catch (error) {
  console.log(error)
}

// ✅ CORRECT - Log, handle, and inform
try {
  await saveUser(data)
} catch (error) {
  logger.error('Failed to save user', { error, userId: data.id })
  throw new AppError('USER_SAVE_FAILED', 'Could not save user data', error)
}
```

### 2. Never Expose Internal Errors to Users

```typescript
// ❌ FORBIDDEN - Leaking implementation details
return { error: error.message } // "ECONNREFUSED 127.0.0.1:5432"

// ❌ FORBIDDEN - Stack traces to client
return { error: error.stack }

// ✅ CORRECT - User-friendly message, internal logging
logger.error('Database connection failed', { error })
return { error: 'Unable to save your changes. Please try again.' }
```

### 3. Never Use Generic Error Messages

```typescript
// ❌ FORBIDDEN - Unhelpful generic errors
throw new Error('Something went wrong')
throw new Error('Error')
throw new Error('Failed')

// ✅ CORRECT - Specific, actionable errors
throw new AppError('VALIDATION_FAILED', 'Email format is invalid')
throw new AppError('AUTH_EXPIRED', 'Your session has expired. Please log in again.')
throw new AppError('RATE_LIMITED', 'Too many requests. Please wait a moment.')
```

---

## ✅ REQUIRED PATTERNS

### 1. Custom Error Classes

```typescript
// lib/errors.ts
export class AppError extends Error {
  constructor(
    public code: string,
    public message: string,
    public cause?: unknown,
    public statusCode: number = 500
  ) {
    super(message)
    this.name = 'AppError'
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
    }
  }
}

// Specific error types
export class ValidationError extends AppError {
  constructor(
    public fields: Record<string, string[]>,
    message = 'Validation failed'
  ) {
    super('VALIDATION_ERROR', message, undefined, 400)
  }
}

export class AuthError extends AppError {
  constructor(message = 'Authentication required') {
    super('AUTH_ERROR', message, undefined, 401)
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super('NOT_FOUND', `${resource} not found`, undefined, 404)
  }
}

export class RateLimitError extends AppError {
  constructor(retryAfter?: number) {
    super('RATE_LIMITED', 'Too many requests', undefined, 429)
  }
}
```

### 2. Error Handling in Server Actions

```typescript
// lib/actions/projects.ts
'use server'

import { AppError, ValidationError } from '@/lib/errors'
import { logger } from '@/lib/logger'

export type ActionResult<T> = 
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string; fields?: Record<string, string[]> } }

export async function createProject(
  formData: FormData
): Promise<ActionResult<Project>> {
  try {
    // Validate
    const validated = createProjectSchema.safeParse({
      name: formData.get('name'),
    })

    if (!validated.success) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Please check your input',
          fields: validated.error.flatten().fieldErrors,
        },
      }
    }

    // Execute
    const project = await projectService.create(validated.data)

    revalidatePath('/projects')
    return { success: true, data: project }

  } catch (error) {
    // Log with context
    logger.error('Failed to create project', {
      error,
      input: Object.fromEntries(formData),
    })

    // Return safe error
    if (error instanceof AppError) {
      return { success: false, error: error.toJSON() }
    }

    return {
      success: false,
      error: {
        code: 'UNKNOWN_ERROR',
        message: 'An unexpected error occurred. Please try again.',
      },
    }
  }
}
```

### 3. Error Boundaries (React)

```typescript
// app/dashboard/error.tsx
'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { logger } from '@/lib/logger'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log to error monitoring (Sentry, etc.)
    logger.error('Dashboard error boundary caught', {
      error: error.message,
      digest: error.digest,
      stack: error.stack,
    })
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <div className="text-center space-y-2">
        <h2 className="text-xl font-semibold">Something went wrong</h2>
        <p className="text-muted-foreground">
          We're sorry, but something unexpected happened.
        </p>
        {error.digest && (
          <p className="text-xs text-muted-foreground">
            Error ID: {error.digest}
          </p>
        )}
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => window.location.reload()}>
          Refresh Page
        </Button>
        <Button onClick={reset}>Try Again</Button>
      </div>
    </div>
  )
}
```

### 4. Global Error Boundary

```typescript
// app/global-error.tsx
'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body>
        <div className="flex flex-col items-center justify-center min-h-screen">
          <h1 className="text-2xl font-bold">Something went wrong</h1>
          <p className="mt-2 text-muted-foreground">
            A critical error occurred. Please refresh the page.
          </p>
          <button
            onClick={reset}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg"
          >
            Try Again
          </button>
        </div>
      </body>
    </html>
  )
}
```

### 5. Structured Logging

```typescript
// lib/logger.ts
type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogContext {
  [key: string]: unknown
}

class Logger {
  private formatMessage(level: LogLevel, message: string, context?: LogContext) {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...context,
      // Add environment info
      env: process.env.NODE_ENV,
    }
  }

  debug(message: string, context?: LogContext) {
    if (process.env.NODE_ENV === 'development') {
      console.debug(JSON.stringify(this.formatMessage('debug', message, context)))
    }
  }

  info(message: string, context?: LogContext) {
    console.info(JSON.stringify(this.formatMessage('info', message, context)))
  }

  warn(message: string, context?: LogContext) {
    console.warn(JSON.stringify(this.formatMessage('warn', message, context)))
  }

  error(message: string, context?: LogContext) {
    const formatted = this.formatMessage('error', message, context)
    console.error(JSON.stringify(formatted))
    
    // Send to external monitoring (Sentry, etc.)
    // this.sendToMonitoring(formatted)
  }
}

export const logger = new Logger()
```

### 6. Async Error Wrapper

```typescript
// lib/utils/safe-action.ts
type AsyncFn<T> = () => Promise<T>

export async function safeAsync<T>(
  fn: AsyncFn<T>,
  errorMessage: string
): Promise<[T, null] | [null, AppError]> {
  try {
    const result = await fn()
    return [result, null]
  } catch (error) {
    logger.error(errorMessage, { error })
    
    if (error instanceof AppError) {
      return [null, error]
    }
    
    return [null, new AppError('UNKNOWN', errorMessage, error)]
  }
}

// Usage - Go-style error handling
const [user, error] = await safeAsync(
  () => fetchUser(id),
  'Failed to fetch user'
)

if (error) {
  return { error: error.message }
}

// user is safely typed as User here
```

---

## 🔄 Error Recovery Patterns

### Retry with Exponential Backoff

```typescript
// lib/utils/retry.ts
interface RetryOptions {
  maxAttempts?: number
  baseDelayMs?: number
  maxDelayMs?: number
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const { maxAttempts = 3, baseDelayMs = 1000, maxDelayMs = 10000 } = options
  
  let lastError: Error

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      
      if (attempt === maxAttempts) break
      
      const delay = Math.min(
        baseDelayMs * Math.pow(2, attempt - 1),
        maxDelayMs
      )
      
      logger.warn(`Attempt ${attempt} failed, retrying in ${delay}ms`, {
        error: lastError.message,
      })
      
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError!
}

// Usage
const data = await withRetry(
  () => fetch('/api/flaky-endpoint').then(r => r.json()),
  { maxAttempts: 3, baseDelayMs: 500 }
)
```

---

## 📁 File Structure

```
lib/
├── errors.ts              # Custom error classes
├── logger.ts              # Structured logging
└── utils/
    ├── safe-action.ts     # Async error wrapper
    └── retry.ts           # Retry utilities

app/
├── error.tsx              # Root error boundary
├── global-error.tsx       # Global fallback
└── [route]/
    └── error.tsx          # Route-specific boundaries
```

---

## 📋 Error Handling Checklist

- [ ] Custom error classes defined for each error type
- [ ] All async operations wrapped in try/catch
- [ ] Errors logged with structured context
- [ ] User-facing messages are friendly and actionable
- [ ] No internal details exposed to client
- [ ] Error boundaries at route level
- [ ] Global error boundary as fallback
- [ ] Retry logic for transient failures

---

*Skill Version: 2.0.0 | Compatible with Next.js 16 & React 19*

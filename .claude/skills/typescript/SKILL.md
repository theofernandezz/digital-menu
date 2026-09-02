---
name: TypeScript Senior Patterns
description: |
  Enforces production-grade TypeScript patterns for type-safe development.
  Trigger: Activated when creating or editing any .ts or .tsx file.
license: MIT
metadata:
  author: ai-library
  version: "2.0"
  scope: [root, ui, backend]
  auto_invoke:
    - "Writing TypeScript types/interfaces"
    - "Creating/editing .ts or .tsx files"
    - "Defining types and interfaces"
    - "Working with generics"
---

# TypeScript Senior Patterns

> **Core Principle:** Types are documentation that the compiler enforces. Every type decision should make invalid states unrepresentable.

---

## 🆕 What's New

> **Instruction for Claude:** When this skill is loaded, check this table and mention any entry relevant to what the developer is working on — before writing code.

| Version | Change | Affects |
|---------|--------|---------|
| TS 5.5 | Inferred type predicates — `arr.filter(Boolean)` now correctly narrows to non-nullable | Array filtering patterns |
| TS 5.4 | `NoInfer<T>` utility type — prevents inference from a specific type parameter | Generic utility functions |
| TS 5.2 | `using` / `await using` — explicit resource disposal (like `Disposable` in C#) | DB connections, file handles |

---

## 🚫 FORBIDDEN PATTERNS

These patterns are **strictly prohibited**. Violations require immediate refactoring.

### 1. Never Use `any`

```typescript
// ❌ FORBIDDEN - Defeats the purpose of TypeScript
function processData(data: any): any {
  return data.something
}

const response: any = await fetch('/api/users')

// ✅ CORRECT - Explicit types always
function processData(data: UserInput): ProcessedUser {
  return transformUser(data)
}

const response: ApiResponse<User[]> = await fetchUsers()
```

### 2. Never Use `enum`

Enums create runtime objects and have unintuitive behavior. Use `as const` assertions instead.

```typescript
// ❌ FORBIDDEN - Enum creates runtime overhead and has quirks
enum UserRole {
  Admin = 'ADMIN',
  User = 'USER',
  Guest = 'GUEST'
}

enum HttpStatus {
  Ok = 200,
  NotFound = 404
}

// ✅ CORRECT - Const assertion with type extraction
const USER_ROLES = {
  Admin: 'ADMIN',
  User: 'USER',
  Guest: 'GUEST',
} as const

type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES]
// Result: 'ADMIN' | 'USER' | 'GUEST'

const HTTP_STATUS = {
  Ok: 200,
  NotFound: 404,
  ServerError: 500,
} as const

type HttpStatus = typeof HTTP_STATUS[keyof typeof HTTP_STATUS]
// Result: 200 | 404 | 500
```

### 3. Never Use `namespace`

Namespaces are a legacy pattern. Use ES modules instead.

```typescript
// ❌ FORBIDDEN - Legacy pattern
namespace UserUtils {
  export function validate(user: User): boolean { ... }
}

// ✅ CORRECT - ES module exports
// file: lib/user-utils.ts
export function validateUser(user: User): boolean { ... }
```

---

## ✅ REQUIRED PATTERNS

### 1. Flat Interface Design

Interfaces should be shallow and composable. Avoid deep nesting.

```typescript
// ❌ AVOID - Deeply nested interfaces
interface User {
  id: string
  profile: {
    personal: {
      name: {
        first: string
        last: string
      }
      contact: {
        email: string
        phone: string
      }
    }
  }
}

// ✅ PREFERRED - Flat, composable interfaces
interface UserName {
  firstName: string
  lastName: string
}

interface UserContact {
  email: string
  phone: string | null
}

interface UserProfile {
  name: UserName
  contact: UserContact
}

interface User {
  id: string
  profile: UserProfile
  createdAt: Date
  updatedAt: Date
}
```

### 2. Const Assertions for Literal Types

Use `as const` to preserve literal types and enable type inference.

```typescript
// Configuration objects
const APP_CONFIG = {
  api: {
    baseUrl: 'https://api.example.com',
    timeout: 5000,
    retries: 3,
  },
  features: {
    darkMode: true,
    analytics: false,
  },
} as const

// Route definitions
const ROUTES = {
  home: '/',
  dashboard: '/dashboard',
  settings: '/settings',
  profile: (id: string) => `/users/${id}` as const,
} as const

// Status mappings
const TASK_STATUS = {
  pending: 'PENDING',
  inProgress: 'IN_PROGRESS',
  completed: 'COMPLETED',
  cancelled: 'CANCELLED',
} as const

type TaskStatus = typeof TASK_STATUS[keyof typeof TASK_STATUS]
```

### 3. Discriminated Unions for State

Model state machines and variants using discriminated unions.

```typescript
// API response states
type ApiState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error }

// Usage with exhaustive checking
function renderState<T>(state: ApiState<T>) {
  switch (state.status) {
    case 'idle':
      return <Placeholder />
    case 'loading':
      return <Spinner />
    case 'success':
      return <DataView data={state.data} />
    case 'error':
      return <ErrorMessage error={state.error} />
    default:
      // TypeScript will error if a case is missing
      const _exhaustive: never = state
      return _exhaustive
  }
}

// Form field states
type FieldState =
  | { type: 'pristine' }
  | { type: 'touched'; value: string }
  | { type: 'valid'; value: string }
  | { type: 'invalid'; value: string; errors: string[] }
```

### 4. Utility Types Usage

Leverage TypeScript's built-in utility types effectively.

```typescript
// Partial for optional updates
interface UserUpdate extends Partial<Omit<User, 'id' | 'createdAt'>> {}

// Pick for specific fields
type UserCredentials = Pick<User, 'email' | 'passwordHash'>

// Required for ensuring completeness
type CompleteProfile = Required<UserProfile>

// Record for typed dictionaries
type UserPermissions = Record<string, boolean>

// Extract/Exclude for union manipulation
type SuccessStatus = Extract<TaskStatus, 'COMPLETED'>
type ActiveStatus = Exclude<TaskStatus, 'CANCELLED'>
```

### 5. Generic Constraints

Use generics with constraints for reusable, type-safe utilities.

```typescript
// Base entity constraint
interface BaseEntity {
  id: string
  createdAt: Date
  updatedAt: Date
}

// Generic repository pattern
interface Repository<T extends BaseEntity> {
  findById(id: string): Promise<T | null>
  findMany(filter: Partial<T>): Promise<T[]>
  create(data: Omit<T, keyof BaseEntity>): Promise<T>
  update(id: string, data: Partial<Omit<T, keyof BaseEntity>>): Promise<T>
  delete(id: string): Promise<void>
}

// Generic with multiple constraints
function merge<T extends object, U extends object>(
  target: T,
  source: U
): T & U {
  return { ...target, ...source }
}
```

---

## 📦 Type Organization

### File Structure

```
types/
├── index.ts          # Re-exports all types
├── api.ts            # API request/response types
├── database.ts       # Database entity types
├── forms.ts          # Form input/validation types
└── [domain].ts       # Domain-specific types
```

### Export Pattern

```typescript
// types/user.ts
export interface User { ... }
export interface UserProfile { ... }
export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES]

// types/index.ts - Central re-export
export * from './user'
export * from './api'
export * from './database'
```

---

## 🔧 Type Inference Best Practices

### Let TypeScript Infer When Possible

```typescript
// ❌ Redundant - TypeScript can infer this
const count: number = 5
const name: string = 'John'
const isActive: boolean = true

// ✅ Let inference work
const count = 5
const name = 'John'
const isActive = true

// ✅ Annotate function signatures for documentation
function calculateTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price, 0)
}
```

### Infer Return Types for Complex Functions

```typescript
// For simple functions, let TypeScript infer
const double = (n: number) => n * 2

// For complex/exported functions, annotate return type
export async function fetchUserWithPosts(
  userId: string
): Promise<UserWithPosts | null> {
  // Complex implementation...
}
```

---

## 🛡️ Null Safety

### Strict Null Checks

Always handle null/undefined explicitly.

```typescript
// ❌ DANGEROUS - Assumes value exists
function getUsername(user: User | null): string {
  return user.name // Runtime error if null!
}

// ✅ SAFE - Explicit null handling
function getUsername(user: User | null): string {
  if (!user) {
    return 'Anonymous'
  }
  return user.name
}

// ✅ SAFE - Optional chaining with nullish coalescing
function getUsername(user: User | null): string {
  return user?.name ?? 'Anonymous'
}
```

### Prefer `undefined` over `null`

```typescript
// ✅ PREFERRED - undefined for optional values
interface SearchParams {
  query: string
  limit?: number          // Optional = may be undefined
  offset?: number
}

// Use null only for explicit "no value" semantics (e.g., database NULL)
interface DatabaseUser {
  id: string
  deletedAt: Date | null  // Explicit: can be NULL in DB
}
```

---

## 📋 Checklist Before Commit

- [ ] No `any` types in codebase
- [ ] No `enum` declarations
- [ ] All interfaces are flat (max 2 levels of nesting)
- [ ] Discriminated unions used for state variants
- [ ] Utility types leveraged appropriately
- [ ] All exports have explicit type annotations
- [ ] Null/undefined handled explicitly

---

*Skill Version: 2.0.0 | Compatible with TypeScript 5.x*

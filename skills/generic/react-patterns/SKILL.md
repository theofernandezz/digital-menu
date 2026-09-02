---
name: React 19 Patterns & Architecture
description: |
  Modern React 19 patterns, hooks design, composition, and state management for 2026.
  Trigger: Activated when creating React components, hooks, or discussing React architecture.
license: MIT
metadata:
  author: ai-library
  version: "2.0"
  scope: [root, ui, testing]
  auto_invoke:
    - "Writing React components"
    - "Creating custom hooks"
    - "State management patterns"
    - "React composition patterns"
---

# React 19 Patterns & Architecture

> **Core Principle:** Composition over configuration. Colocation over separation. Simplicity over abstraction.

---

## 🆕 What's New

> **Instruction for Claude:** When this skill is loaded, check this table and mention any entry relevant to what the developer is working on — before writing code.

| Version | Change | Affects |
|---------|--------|---------|
| React 19 | `useFormState` removed — use `useActionState` from `react` (returns `[state, action, isPending]`) | Any form wired to a Server Action |
| React 19 | `use()` hook — read a Promise or Context directly in render without `useEffect` | Data fetching in Client Components |
| React 19 | `useOptimistic()` — optimistic UI updates while an async action is pending | Forms, like/vote buttons |

---

## 🏗️ Component Architecture Patterns

### 1. Compound Components Pattern

Build flexible, composable component APIs.

```tsx
// ❌ AVOID - Prop drilling nightmare
<Card
  title="Settings"
  description="Manage your account"
  icon={<Settings />}
  actions={[
    { label: 'Save', onClick: save },
    { label: 'Cancel', onClick: cancel }
  ]}
  footer="Last updated: today"
/>

// ✅ PREFERRED - Compound components
<Card>
  <Card.Header>
    <Card.Icon><Settings /></Card.Icon>
    <Card.Title>Settings</Card.Title>
    <Card.Description>Manage your account</Card.Description>
  </Card.Header>
  <Card.Content>
    {/* Flexible content */}
  </Card.Content>
  <Card.Footer>
    <Card.Actions>
      <Button variant="ghost" onClick={cancel}>Cancel</Button>
      <Button onClick={save}>Save</Button>
    </Card.Actions>
  </Card.Footer>
</Card>
```

**Implementation:**

```tsx
// components/ui/card.tsx
import { createContext, useContext } from 'react'

const CardContext = createContext<{ variant?: 'default' | 'glass' }>({})

function Card({ children, variant = 'default' }: CardProps) {
  return (
    <CardContext.Provider value={{ variant }}>
      <div className={cn(
        "rounded-xl border",
        variant === 'default' && "bg-card border-border",
        variant === 'glass' && "bg-white/5 border-white/10 backdrop-blur-xl"
      )}>
        {children}
      </div>
    </CardContext.Provider>
  )
}

Card.Header = function CardHeader({ children }: { children: React.ReactNode }) {
  return <div className="p-6 pb-0">{children}</div>
}

Card.Title = function CardTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-lg font-semibold">{children}</h3>
}

Card.Content = function CardContent({ children }: { children: React.ReactNode }) {
  return <div className="p-6">{children}</div>
}

Card.Footer = function CardFooter({ children }: { children: React.ReactNode }) {
  return <div className="p-6 pt-0 flex justify-end gap-2">{children}</div>
}

export { Card }
```

---

### 2. Render Props → Children as Function

For dynamic rendering logic.

```tsx
// Pattern: Expose render control to parent
interface DataListProps<T> {
  items: T[]
  children: (item: T, index: number) => React.ReactNode
  empty?: React.ReactNode
}

function DataList<T>({ items, children, empty }: DataListProps<T>) {
  if (items.length === 0) {
    return empty ?? <EmptyState />
  }

  return (
    <ul className="space-y-2">
      {items.map((item, index) => (
        <li key={index}>{children(item, index)}</li>
      ))}
    </ul>
  )
}

// Usage
<DataList items={users} empty={<NoUsers />}>
  {(user) => <UserCard user={user} />}
</DataList>
```

---

### 3. Polymorphic Components with `as` Prop

Flexible component rendering.

```tsx
// Polymorphic button that can render as link, button, or custom element
type ButtonProps<T extends React.ElementType = 'button'> = {
  as?: T
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
} & Omit<React.ComponentPropsWithoutRef<T>, 'as' | 'children'>

function Button<T extends React.ElementType = 'button'>({
  as,
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: ButtonProps<T>) {
  const Component = as || 'button'
  
  return (
    <Component
      className={cn(
        "inline-flex items-center justify-center rounded-lg font-medium transition-colors",
        // Size variants
        size === 'sm' && "h-8 px-3 text-sm",
        size === 'md' && "h-10 px-4",
        size === 'lg' && "h-12 px-6 text-lg",
        // Style variants
        variant === 'primary' && "bg-primary text-primary-foreground hover:bg-primary/90",
        variant === 'secondary' && "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        variant === 'ghost' && "hover:bg-accent hover:text-accent-foreground",
        className
      )}
      {...props}
    >
      {children}
    </Component>
  )
}

// Usage
<Button>Click me</Button>
<Button as="a" href="/about">About</Button>
<Button as={Link} href="/dashboard">Dashboard</Button>
```

---

## 🎣 Custom Hooks Patterns

### 1. State Machine Hook

Model complex state with discriminated unions.

```tsx
// hooks/use-async.ts
type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error }

function useAsync<T>(asyncFn: () => Promise<T>) {
  const [state, setState] = useState<AsyncState<T>>({ status: 'idle' })

  const execute = useCallback(async () => {
    setState({ status: 'loading' })
    try {
      const data = await asyncFn()
      setState({ status: 'success', data })
    } catch (error) {
      setState({ status: 'error', error: error as Error })
    }
  }, [asyncFn])

  return { ...state, execute }
}

// Usage
function UserProfile({ userId }: { userId: string }) {
  const { status, data, error, execute } = useAsync(
    () => fetchUser(userId)
  )

  useEffect(() => { execute() }, [execute])

  // Exhaustive pattern matching
  switch (status) {
    case 'idle':
    case 'loading':
      return <Skeleton />
    case 'error':
      return <ErrorMessage error={error} retry={execute} />
    case 'success':
      return <UserCard user={data} />
  }
}
```

---

### 2. Optimistic Updates Hook

Instant UI feedback with rollback.

```tsx
// hooks/use-optimistic-mutation.ts
function useOptimisticMutation<T, V>({
  mutationFn,
  onSuccess,
  onError,
}: {
  mutationFn: (variables: V) => Promise<T>
  onSuccess?: (data: T) => void
  onError?: (error: Error, rollback: () => void) => void
}) {
  const [optimisticValue, setOptimisticValue] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const previousValue = useRef<T | null>(null)

  const mutate = useCallback(async (
    variables: V,
    optimistic: T
  ) => {
    // Store previous for rollback
    previousValue.current = optimisticValue
    
    // Apply optimistic update immediately
    setOptimisticValue(optimistic)
    setIsLoading(true)

    try {
      const result = await mutationFn(variables)
      setOptimisticValue(result)
      onSuccess?.(result)
      return result
    } catch (error) {
      // Rollback on error
      const rollback = () => setOptimisticValue(previousValue.current)
      onError?.(error as Error, rollback)
      rollback()
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [mutationFn, onSuccess, onError, optimisticValue])

  return { data: optimisticValue, isLoading, mutate }
}

// Usage
function LikeButton({ postId, initialLikes }: Props) {
  const { data: likes, mutate } = useOptimisticMutation({
    mutationFn: (liked: boolean) => toggleLike(postId, liked),
    onError: (error, rollback) => {
      toast.error('Failed to update')
      rollback()
    }
  })

  const handleClick = () => {
    mutate(!liked, { ...likes, count: likes.count + 1 })
  }

  return <Button onClick={handleClick}>{likes?.count} ❤️</Button>
}
```

---

### 3. Debounced Value Hook

For search inputs and expensive operations.

```tsx
// hooks/use-debounced-value.ts
function useDebouncedValue<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}

// Usage
function SearchInput() {
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebouncedValue(query, 300)

  // Only fetch when debounced value changes
  const { data } = useSWR(
    debouncedQuery ? `/api/search?q=${debouncedQuery}` : null
  )

  return (
    <Input
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      placeholder="Search..."
    />
  )
}
```

---

### 4. Media Query Hook

Responsive logic in components.

```tsx
// hooks/use-media-query.ts
function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const media = window.matchMedia(query)
    setMatches(media.matches)

    const listener = (e: MediaQueryListEvent) => setMatches(e.matches)
    media.addEventListener('change', listener)
    return () => media.removeEventListener('change', listener)
  }, [query])

  return matches
}

// Convenience hooks
const useIsMobile = () => useMediaQuery('(max-width: 767px)')
const useIsTablet = () => useMediaQuery('(min-width: 768px) and (max-width: 1023px)')
const useIsDesktop = () => useMediaQuery('(min-width: 1024px)')
const usePrefersDark = () => useMediaQuery('(prefers-color-scheme: dark)')

// Usage
function Navigation() {
  const isMobile = useIsMobile()
  return isMobile ? <MobileNav /> : <DesktopNav />
}
```

---

## 🔄 State Management Patterns

### 1. URL as State (Search Params)

Use URL for shareable, bookmarkable state.

```tsx
// hooks/use-query-state.ts
import { useSearchParams, useRouter, usePathname } from 'next/navigation'

function useQueryState<T extends string>(
  key: string,
  defaultValue: T
): [T, (value: T) => void] {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const value = (searchParams.get(key) as T) ?? defaultValue

  const setValue = useCallback((newValue: T) => {
    const params = new URLSearchParams(searchParams.toString())
    
    if (newValue === defaultValue) {
      params.delete(key)
    } else {
      params.set(key, newValue)
    }

    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }, [searchParams, router, pathname, key, defaultValue])

  return [value, setValue]
}

// Usage - State in URL, shareable, survives refresh
function ProductFilters() {
  const [category, setCategory] = useQueryState('category', 'all')
  const [sort, setSort] = useQueryState('sort', 'newest')

  return (
    <div className="flex gap-4">
      <Select value={category} onValueChange={setCategory}>
        <SelectItem value="all">All</SelectItem>
        <SelectItem value="electronics">Electronics</SelectItem>
      </Select>
      
      <Select value={sort} onValueChange={setSort}>
        <SelectItem value="newest">Newest</SelectItem>
        <SelectItem value="price-asc">Price: Low to High</SelectItem>
      </Select>
    </div>
  )
}
```

---

### 2. Context + Reducer Pattern

For complex shared state.

```tsx
// Minimal, type-safe context setup
type CartState = {
  items: CartItem[]
  total: number
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: CartItem }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'CLEAR' }

const CartContext = createContext<{
  state: CartState
  dispatch: React.Dispatch<CartAction>
} | null>(null)

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM':
      return {
        items: [...state.items, action.payload],
        total: state.total + action.payload.price
      }
    case 'REMOVE_ITEM':
      const item = state.items.find(i => i.id === action.payload)
      return {
        items: state.items.filter(i => i.id !== action.payload),
        total: state.total - (item?.price ?? 0)
      }
    case 'CLEAR':
      return { items: [], total: 0 }
  }
}

// Custom hook with null check
function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within CartProvider')
  }
  return context
}

// Provider
function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [], total: 0 })
  return (
    <CartContext.Provider value={{ state, dispatch }}>
      {children}
    </CartContext.Provider>
  )
}
```

---

## 🎯 React 19 Specific Patterns

### 1. `use()` Hook for Promises

```tsx
// React 19: use() for reading promises in render
import { use, Suspense } from 'react'

async function fetchUser(id: string): Promise<User> {
  const res = await fetch(`/api/users/${id}`)
  return res.json()
}

function UserProfile({ userPromise }: { userPromise: Promise<User> }) {
  // use() suspends until promise resolves
  const user = use(userPromise)
  return <div>{user.name}</div>
}

// Usage with Suspense
function Page({ userId }: { userId: string }) {
  const userPromise = fetchUser(userId)
  
  return (
    <Suspense fallback={<Skeleton />}>
      <UserProfile userPromise={userPromise} />
    </Suspense>
  )
}
```

---

### 2. Server Actions Pattern

```tsx
// Direct form handling with Server Actions
'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { createProject } from '@/lib/actions/projects'

function CreateProjectForm() {
  const [state, action] = useFormState(createProject, { errors: {} })

  return (
    <form action={action} className="space-y-4">
      <div>
        <Label htmlFor="name">Project Name</Label>
        <Input id="name" name="name" required />
        {state.errors?.name && (
          <p className="text-sm text-destructive">{state.errors.name}</p>
        )}
      </div>
      
      <SubmitButton />
    </form>
  )
}

function SubmitButton() {
  const { pending } = useFormStatus()
  
  return (
    <Button type="submit" disabled={pending}>
      {pending ? (
        <>
          <Spinner className="mr-2 size-4" />
          Creating...
        </>
      ) : (
        'Create Project'
      )}
    </Button>
  )
}
```

---

## 📁 File Organization

```
components/
├── ui/                    # Primitives (from Shadcn)
│   ├── button.tsx
│   ├── input.tsx
│   └── card.tsx          # Compound component
├── patterns/              # Reusable patterns
│   ├── data-list.tsx     # Generic list with render prop
│   ├── form-field.tsx    # Label + Input + Error
│   └── async-boundary.tsx # Loading/Error/Success wrapper
└── features/
    └── [feature]/
        ├── components/    # Feature-specific components
        ├── hooks/         # Feature-specific hooks
        └── utils/         # Feature-specific utilities

hooks/
├── use-async.ts
├── use-debounced-value.ts
├── use-media-query.ts
├── use-optimistic-mutation.ts
└── use-query-state.ts
```

---

## 📋 React Checklist

- [ ] Components are composable (compound pattern when needed)
- [ ] Props are minimal, composition handles complexity
- [ ] Custom hooks follow the `use` prefix convention
- [ ] State is colocated (closest to where it's used)
- [ ] URL state for shareable/bookmarkable state
- [ ] Suspense boundaries for async components
- [ ] Error boundaries for fault isolation

---

*Skill Version: 2.0.0 | Compatible with React 19 & Next.js 16*

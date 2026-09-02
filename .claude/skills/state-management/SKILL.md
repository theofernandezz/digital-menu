---
name: State Management - Zustand & Context
description: |
  Client-side state management patterns. Decision matrix for Zustand vs Context vs URL state.
  Trigger: Activated when managing shared state, creating stores, or discussing global state.
license: MIT
metadata:
  author: ai-library
  version: "1.0"
  scope: [root, ui]
  auto_invoke:
    - "Managing global state"
    - "Creating Zustand stores"
    - "State management patterns"
    - "Shared state across components"
    - "Client-side state"
---

# State Management - Zustand & Context

> **Core Principle:** Start with the simplest state mechanism that works. Server state first, URL state second, local component state third, shared client state (Zustand/Context) only when truly needed.

---

## 🆕 What's New

> **Instruction for Claude:** When this skill is loaded, check this table and mention any entry relevant to what the developer is working on — before writing code.

| Version | Change | Affects |
|---------|--------|---------|
| React 19 | `useOptimistic()` is now stable — prefer it over manual optimistic state patterns | Like, vote, toggle, reorder interactions |
| React 19 | `use()` hook reads a Context or Promise synchronously — replaces `useContext` for many cases | Global state reads in deeply nested components |
| Zustand 5 | `create` no longer requires wrapping in `immer` for nested updates — use `set` with draft directly | Any Zustand store with nested objects |

---

## 🧭 Decision Matrix

```
┌─────────────────────────────────────────────────────────────────┐
│                  Where does the state live?                      │
├───────────────┬─────────────────────────────────────────────────┤
│  SERVER DATA  │  → Server Components + React cache()            │
│  (DB, API)    │     Never duplicate server data in client state  │
├───────────────┼─────────────────────────────────────────────────┤
│  SHAREABLE/   │  → URL search params (useQueryState hook)        │
│  BOOKMARKABLE │     Filters, pagination, tabs, sort order        │
├───────────────┼─────────────────────────────────────────────────┤
│  LOCAL TO     │  → useState / useReducer                         │
│  ONE COMPONENT│     Toggle, form field, hover state              │
├───────────────┼─────────────────────────────────────────────────┤
│  SHARED, SMALL│  → React Context + useReducer                    │
│  INFREQUENT   │     Theme, locale, auth user (rarely changes)    │
├───────────────┼─────────────────────────────────────────────────┤
│  SHARED,      │  → Zustand                                       │
│  COMPLEX, OR  │     Shopping cart, UI preferences, multi-step    │
│  HIGH-FREQ    │     wizard, notifications, realtime sync         │
└───────────────┴─────────────────────────────────────────────────┘
```

### Quick Reference

| Situation | Solution |
|-----------|----------|
| Data from Supabase / API | Server Component + `cache()` |
| Filters in URL | `useQueryState` (react-patterns skill) |
| Component toggle | `useState` |
| Theme / locale | React Context (changes infrequently) |
| Auth user object | React Context (populated once) |
| Shopping cart | **Zustand** |
| Notification queue | **Zustand** |
| Multi-step form wizard | **Zustand** |
| Realtime data (WebSocket) | **Zustand** |
| Any state shared across 3+ component trees | **Zustand** |

---

## 🚫 FORBIDDEN PATTERNS

### 1. Never Put Server Data in Zustand

```typescript
// ❌ FORBIDDEN - Duplicating server data in client store
const useUserStore = create<UserState>((set) => ({
  user: null,
  fetchUser: async (id: string) => {
    const user = await fetch(`/api/users/${id}`).then(r => r.json())
    set({ user })
  },
}))

// ✅ CORRECT - Fetch once on the server, pass as props
// app/dashboard/page.tsx (Server Component)
export default async function DashboardPage() {
  const user = await getUser()  // Cached server fetch
  return <Dashboard user={user} />
}
```

### 2. Never Create One Giant Store

```typescript
// ❌ FORBIDDEN - Monolithic store (causes unnecessary re-renders)
const useAppStore = create<AppState>((set) => ({
  user: null,
  cart: [],
  notifications: [],
  theme: 'dark',
  // ... 50 more fields
}))

// ✅ CORRECT - Separate stores per domain
const useCartStore = create<CartState>(...)
const useNotificationStore = create<NotificationState>(...)
const useUIStore = create<UIState>(...)
```

### 3. Never Access Whole Store (Causes Re-renders)

```typescript
// ❌ FORBIDDEN - Re-renders on ANY state change
function CartIcon() {
  const store = useCartStore() // Subscribes to all fields!
  return <span>{store.items.length}</span>
}

// ✅ CORRECT - Subscribe to only what you need
function CartIcon() {
  const itemCount = useCartStore((state) => state.items.length)
  return <span>{itemCount}</span>
}
```

### 4. Never Mutate State Outside of Actions

```typescript
// ❌ FORBIDDEN - Direct mutation from component
function Component() {
  const store = useCartStore.getState()
  store.items.push(newItem) // Direct mutation!
}

// ✅ CORRECT - Use store actions
function Component() {
  const addItem = useCartStore((state) => state.addItem)
  addItem(newItem)
}
```

---

## ✅ REQUIRED PATTERNS

### 1. Basic Zustand Store

```typescript
// store/cart.ts
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
}

interface CartState {
  items: CartItem[]
  total: number
  // Actions
  addItem: (item: Omit<CartItem, 'quantity'>) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
}

export const useCartStore = create<CartState>()(
  devtools(
    (set, get) => ({
      items: [],
      total: 0,

      addItem: (item) => set((state) => {
        const existing = state.items.find((i) => i.id === item.id)

        const items = existing
          ? state.items.map((i) =>
              i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
            )
          : [...state.items, { ...item, quantity: 1 }]

        return {
          items,
          total: items.reduce((sum, i) => sum + i.price * i.quantity, 0),
        }
      }),

      removeItem: (id) => set((state) => {
        const items = state.items.filter((i) => i.id !== id)
        return {
          items,
          total: items.reduce((sum, i) => sum + i.price * i.quantity, 0),
        }
      }),

      updateQuantity: (id, quantity) => set((state) => {
        const items = state.items.map((i) =>
          i.id === id ? { ...i, quantity } : i
        )
        return {
          items,
          total: items.reduce((sum, i) => sum + i.price * i.quantity, 0),
        }
      }),

      clearCart: () => set({ items: [], total: 0 }),
    }),
    { name: 'cart-store' } // Name shown in Redux DevTools
  )
)
```

### 2. Slice Pattern (Large Stores)

For complex domains, split with slices then compose:

```typescript
// store/slices/notifications.ts
import type { StateCreator } from 'zustand'

export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  duration?: number
}

export interface NotificationSlice {
  notifications: Notification[]
  addNotification: (n: Omit<Notification, 'id'>) => void
  removeNotification: (id: string) => void
  clearNotifications: () => void
}

export const createNotificationSlice: StateCreator<
  NotificationSlice,
  [],
  [],
  NotificationSlice
> = (set) => ({
  notifications: [],

  addNotification: (n) => set((state) => ({
    notifications: [
      ...state.notifications,
      { ...n, id: crypto.randomUUID() },
    ],
  })),

  removeNotification: (id) => set((state) => ({
    notifications: state.notifications.filter((n) => n.id !== id),
  })),

  clearNotifications: () => set({ notifications: [] }),
})

// store/slices/ui.ts
import type { StateCreator } from 'zustand'

export interface UISlice {
  sidebarOpen: boolean
  theme: 'light' | 'dark' | 'system'
  toggleSidebar: () => void
  setTheme: (theme: UISlice['theme']) => void
}

export const createUISlice: StateCreator<UISlice, [], [], UISlice> = (set) => ({
  sidebarOpen: true,
  theme: 'system',
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setTheme: (theme) => set({ theme }),
})

// store/app.ts - Composed store
import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { createNotificationSlice, type NotificationSlice } from './slices/notifications'
import { createUISlice, type UISlice } from './slices/ui'

type AppStore = NotificationSlice & UISlice

export const useAppStore = create<AppStore>()(
  devtools(
    persist(
      (...a) => ({
        ...createNotificationSlice(...a),
        ...createUISlice(...a),
      }),
      {
        name: 'app-store',
        partialize: (state) => ({ theme: state.theme, sidebarOpen: state.sidebarOpen }),
        // Only persist UI preferences, not notifications
      }
    ),
    { name: 'app-store' }
  )
)
```

### 3. Persisted Store (localStorage)

```typescript
// store/preferences.ts
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface PreferencesState {
  language: string
  timezone: string
  emailNotifications: boolean
  setLanguage: (lang: string) => void
  setTimezone: (tz: string) => void
  toggleEmailNotifications: () => void
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      language: 'en',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      emailNotifications: true,

      setLanguage: (language) => set({ language }),
      setTimezone: (timezone) => set({ timezone }),
      toggleEmailNotifications: () =>
        set((state) => ({ emailNotifications: !state.emailNotifications })),
    }),
    {
      name: 'user-preferences',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
```

### 4. Zustand with Immer (Complex Nested Updates)

```typescript
// store/editor.ts
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

interface EditorState {
  blocks: Block[]
  selectedBlockId: string | null
  updateBlock: (id: string, updates: Partial<Block>) => void
  reorderBlocks: (fromIndex: number, toIndex: number) => void
}

export const useEditorStore = create<EditorState>()(
  immer((set) => ({
    blocks: [],
    selectedBlockId: null,

    updateBlock: (id, updates) => set((state) => {
      const block = state.blocks.find((b) => b.id === id)
      if (block) {
        Object.assign(block, updates) // Safe mutation with Immer
      }
    }),

    reorderBlocks: (fromIndex, toIndex) => set((state) => {
      const [removed] = state.blocks.splice(fromIndex, 1)
      state.blocks.splice(toIndex, 0, removed)
    }),
  }))
)
```

### 5. Selectors for Performance

Extract shared selectors to prevent duplicate logic and improve performance:

```typescript
// store/cart.ts
export const useCartStore = create<CartState>()(...)

// Selectors - co-locate with the store
export const cartSelectors = {
  itemCount: (state: CartState) => state.items.length,
  total: (state: CartState) => state.total,
  isEmpty: (state: CartState) => state.items.length === 0,
  itemById: (id: string) => (state: CartState) =>
    state.items.find((i) => i.id === id),
}

// Usage - stable, memoized subscriptions
function CartIcon() {
  const itemCount = useCartStore(cartSelectors.itemCount)
  return <span>{itemCount}</span>
}

function CartTotal() {
  const total = useCartStore(cartSelectors.total)
  return <span>${total.toFixed(2)}</span>
}
```

### 6. Reading State Outside React (Server Actions)

```typescript
// Accessing Zustand state outside of React components
// (e.g., in utility functions or event handlers)

import { useCartStore } from '@/store/cart'

// ✅ CORRECT - Use getState() for one-time reads outside React
async function checkoutAction() {
  const { items, total, clearCart } = useCartStore.getState()

  if (items.length === 0) {
    return { error: 'Cart is empty' }
  }

  // Process payment...
  clearCart()
  return { success: true }
}

// ✅ CORRECT - Subscribe to changes outside React
const unsubscribe = useCartStore.subscribe(
  (state) => state.items.length,
  (itemCount) => {
    console.log('Cart item count changed:', itemCount)
  }
)
// Call unsubscribe() when done
```

---

## 🔄 Context vs. Zustand

Use **React Context** when:
- Data changes rarely (theme, auth user, locale)
- It's naturally scoped to a part of the tree (e.g., a single form, a modal)
- You need React's built-in lifecycle integration

Use **Zustand** when:
- State is accessed from many unrelated parts of the tree
- State changes frequently (re-render performance matters)
- You need persistence (`localStorage`/`sessionStorage`)
- You need state outside of React (event handlers, utilities)
- You need time-travel debugging via Redux DevTools

```typescript
// ✅ Context: auth user (set once, rarely changes)
const UserContext = createContext<User | null>(null)

function UserProvider({ children, user }: { children: ReactNode; user: User }) {
  return <UserContext.Provider value={user}>{children}</UserContext.Provider>
}

// ✅ Zustand: shopping cart (frequent mutations, accessed everywhere)
export const useCartStore = create<CartState>()(...)
```

---

## 📁 File Structure

```
store/
├── cart.ts               # Domain-specific stores
├── notifications.ts
├── preferences.ts        # Persisted preferences
├── slices/               # Slices for composed stores
│   ├── ui.ts
│   └── notifications.ts
└── app.ts                # Composed store (if needed)
```

### Import Convention

```typescript
// 1. Import store hook
import { useCartStore } from '@/store/cart'

// 2. Import selectors alongside hook
import { useCartStore, cartSelectors } from '@/store/cart'

// Usage in components
function Component() {
  const addItem = useCartStore((s) => s.addItem)
  const itemCount = useCartStore(cartSelectors.itemCount)
}
```

---

## 📋 Checklist Before Commit

- [ ] Store is domain-specific (not one giant store)
- [ ] Components subscribe with selectors (not whole store)
- [ ] State that belongs on server stays on server
- [ ] Shareable state uses URL params instead
- [ ] `devtools` middleware added for debugging  
- [ ] Persisted stores use `partialize` to limit what's saved
- [ ] Actions are pure (no side effects outside `set`)

---

*Skill Version: 1.0.0 | Compatible with Zustand 5.x & React 19*

---
name: Hexagonal Architecture - Modules, Ports & Adapters
description: |
  Modular hexagonal architecture for Next.js: the app is split into modules that talk to the outside
  only through one public interface (index.ts) and never import each other. Inside a module,
  domain/application depend on ports (interfaces); adapters implement them. Boundaries are enforced
  by ESLint, not by convention. No DI container.
  Trigger: Activated when asked for hexagonal/ports-adapters/clean/modular architecture, when creating
  a module, or when integrating an external service (payments, email, storage) that must be swappable.
license: MIT
metadata:
  author: ai-library
  version: "2.0"
  scope: [root, backend]
  auto_invoke:
    - "Applying hexagonal architecture"
    - "Applying ports and adapters"
    - "Applying clean architecture"
    - "Creating a new module or bounded context"
    - "Integrating a payment gateway or external service"
    - "Making a module swappable between providers"
    - "Isolating business logic from an SDK"
---

# Hexagonal Architecture - Modules, Ports & Adapters

> **Core Principle:** A module is reachable only through its public interface, and it knows nothing about any other module. Changing the inside of one module can never force a change in another — and the linter, not memory, is what guarantees it.

---

## 🆕 What's New

> **Instruction for Claude:** When this skill is loaded, check this table and mention any entry relevant to what the developer is working on — before writing code.

| Version | Change | Affects |
|---------|--------|---------|
| 2.0 | Module-first layout (`modules/<name>/`) replaces `lib/core` + `lib/adapters` + `lib/composition.ts`. Full hexagonal scope, not only external integrations. Modules never import each other; the consumer owns the port. | Projects on the 1.0 layout |
| 1.0 | Initial skill | — |

---

## 🏗️ When to Use This

**This skill sets the layout only for projects that adopt it** — declared in the project's `CLAUDE.md` (Project Context) or requested by the user. Otherwise `nextjs-core`/`database` layouts apply.

**Is it a module?** Yes if it has business rules of its own **and** could change without the rest changing (cart, payments, inventory, bookings). No if it is plain CRUD with no rules of its own (menu categories, settings): keep it colocated in `app/` with a plain service — ports there are ceremony without a payoff.

A single swappable integration (Stripe ↔ Mercado Pago) is just one module (`modules/payments/`); you don't need to modularize the whole app to use it.

**No DI container.** It solves wiring convenience, not isolation. Wire by hand in `composition/`.

---

## 📁 Layout

```
modules/
  <name>/
    index.ts          # the ONLY public file: a factory + public types
    domain/           # entities, value objects, business rules — imports nothing outside domain/
    application/      # use cases + the ports this module needs (it owns them)
    adapters/         # implementations of those ports: DB repository, SDK clients
app/                  # delivery: pages + colocated actions.ts — reach modules via composition/
composition/          # the only place that wires adapters to ports and modules to each other
components/, lib/     # shared UI and pure utilities — no business rules, never import module internals
```

Using `src/`? Prefix every path (`src/modules/...`) in the layout and in the ESLint patterns below.

---

## 🚫 FORBIDDEN PATTERNS

### 1. Never Import One Module from Another

```typescript
// ❌ FORBIDDEN - cart now depends on payments existing, even through its public api
// modules/cart/application/checkout.ts
import { createPaymentsModule } from '@/modules/payments'

// ✅ CORRECT - cart depends on a port it owns; composition/ decides who fulfils it
// modules/cart/application/checkout.ts
import type { ChargePort } from './ports'
```

### 2. Never Reach Into a Module's Internals

Everything outside `modules/<name>/` imports only `modules/<name>/index.ts` (composition/ also imports its `adapters/`, to wire them).

```typescript
// ❌ FORBIDDEN - bypasses the public interface; any refactor of application/ now breaks this file
import { checkout } from '@/modules/cart/application/checkout'

// ✅ CORRECT
import { cart } from '@/composition'
```

### 3. Never Import a Concrete Adapter or SDK from domain/application

```typescript
// ❌ FORBIDDEN
// modules/payments/application/charge.ts
import Stripe from 'stripe'

// ✅ CORRECT - depend on the port; the adapter is the only file that knows Stripe
import type { PaymentProviderPort } from './ports'
```

### 4. Never Leak Adapter-Specific Types Through a Port

```typescript
// ❌ FORBIDDEN
interface PaymentProviderPort { charge(input: Stripe.PaymentIntentCreateParams): Promise<Stripe.PaymentIntent> }

// ✅ CORRECT - ports speak the module's language, not an SDK's
interface PaymentProviderPort { charge(input: { reference: string; amount: number }): Promise<{ id: string; approved: boolean }> }
```

### 5. Never Touch Another Module's Data

Each module owns its tables/models; only its own `adapters/` read or write them. Need another module's data? Ask through composition/ (a port), never a query on its table.

> **Known limit:** with one Prisma client/schema this is **not** enforceable by ESLint — it is a rule enforced by review and `verifier`. // TODO: revisit if a module ever needs its own database.

### 6. Never Wire Adapters Outside composition/

Two places that `new` an adapter drift out of sync. Everyone else imports the wired instance from `@/composition`.

---

## ✅ REQUIRED PATTERNS

### 1. Public Interface — index.ts

```typescript
// modules/cart/index.ts
import { checkout } from './application/checkout'
import type { CartDeps } from './application/ports'

export type { CartDeps, ChargePort } from './application/ports'
export type { Cart } from './domain/cart'

export function createCartModule(deps: CartDeps) {
  return { checkout: (cartId: string) => checkout(deps, cartId) }
}
```

Export a factory and public types only — never entities, repositories or use-case files.

### 2. The Consumer Owns the Port

```typescript
// modules/cart/application/ports.ts — cart says what IT needs, in its own words
export interface ChargePort {
  charge(input: { orderId: string; amountCents: number }): Promise<{ transactionId: string; approved: boolean }>
}
export interface CartRepositoryPort { findById(id: string): Promise<Cart | null> }
export interface CartDeps { repo: CartRepositoryPort; charge: ChargePort }
```

```typescript
// modules/cart/application/checkout.ts — knows the port, not payments
export async function checkout({ repo, charge }: CartDeps, cartId: string) {
  const cart = await repo.findById(cartId)
  if (!cart) throw new CartNotFoundError(cartId)
  return charge.charge({ orderId: cart.id, amountCents: cart.totalCents })
}
```

`payments` is built the same way: its own `PaymentProviderPort` in `application/ports.ts`, `StripeProviderAdapter` in `adapters/`, a `createPaymentsModule({ provider })` factory in `index.ts`. It never mentions carts.

### 3. Composition Root — the Only File That Knows Both Sides

```typescript
// composition/index.ts
import { env } from '@/lib/env'
import { createCartModule } from '@/modules/cart'
import { PrismaCartRepository } from '@/modules/cart/adapters/prisma-cart.repository'
import { createPaymentsModule } from '@/modules/payments'
import { StripeProviderAdapter } from '@/modules/payments/adapters/stripe-provider.adapter'

const payments = createPaymentsModule({ provider: new StripeProviderAdapter(env.STRIPE_SECRET_KEY) })

export const cart = createCartModule({
  repo: new PrismaCartRepository(),
  // The translation between the two vocabularies lives here — in neither module
  charge: {
    async charge({ orderId, amountCents }) {
      const result = await payments.charge({ reference: orderId, amount: amountCents })
      return { transactionId: result.id, approved: result.approved }
    },
  },
})
```

Swapping Stripe for Mercado Pago, or changing how `payments` works internally, touches this file and `payments/` — never `cart/`.

### 4. Delivery Layer — Thin Entry Points

```typescript
// app/checkout/actions.ts — colocated with the route, calls the module through composition/
'use server'
import { z } from 'zod'
import { cart } from '@/composition'
import type { ActionResult } from '@/lib/action-result'

const checkoutSchema = z.object({ cartId: z.string().uuid() })

export async function checkoutAction(input: unknown): Promise<ActionResult<{ transactionId: string }>> {
  const parsed = checkoutSchema.safeParse(input)
  if (!parsed.success) {
    return {
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Invalid input', fields: parsed.error.flatten().fieldErrors },
    }
  }
  const { transactionId } = await cart.checkout(parsed.data.cartId)
  return { success: true, data: { transactionId } }
}
```

Server Actions are entry points, not business logic: validate, authenticate, call the module, return an `ActionResult` (`error-handling`). See `nextjs-core` + `security` for the full action pattern.

### 5. Testing — Fakes, No Mocking Library

```typescript
// modules/cart/application/checkout.test.ts
class FakeCharge implements ChargePort {
  async charge() { return { transactionId: 'fake-1', approved: true } }
}

it('should approve checkout when the charge is approved', async () => {
  const repo = { findById: async () => ({ id: 'c1', totalCents: 500 }) }
  const result = await checkout({ repo, charge: new FakeCharge() }, 'c1')
  expect(result.approved).toBe(true)
})
```

### 6. Enforce the Boundaries with ESLint

Tested with `eslint` 10.11 + `eslint-plugin-boundaries` 7.2 + `eslint-import-resolver-typescript` (needed for `@/` aliases). A written rule is guidance the agent can still miss under pressure — this makes it a build error.

```bash
npm install --save-dev eslint-plugin-boundaries eslint-import-resolver-typescript
```

```javascript
// eslint.config.mjs
import boundaries from 'eslint-plugin-boundaries'

const MODULE_LAYERS = ['module', 'domain', 'application', 'adapters']

export default [
  {
    plugins: { boundaries },
    settings: {
      'import/resolver': { typescript: { project: './tsconfig.json' } },
      // ORDER MATTERS: the first matching element wins — most specific first, catch-all last.
      'boundaries/elements': [
        { type: 'domain', pattern: 'modules/*/domain', capture: ['module'], partialMatch: false },
        { type: 'application', pattern: 'modules/*/application', capture: ['module'], partialMatch: false },
        { type: 'adapters', pattern: 'modules/*/adapters', capture: ['module'], partialMatch: false },
        { type: 'module', pattern: 'modules/*', capture: ['module'], partialMatch: false }, // index.ts
        { type: 'composition', pattern: 'composition', partialMatch: false },
        { type: 'app', pattern: 'app', partialMatch: false },
        { type: 'shared', pattern: '*', partialMatch: false }, // components/, lib/, hooks/ ...
      ],
    },
    rules: {
      'boundaries/dependencies': ['error', {
        default: 'allow',
        policies: [
          {
            from: { element: { types: { anyOf: MODULE_LAYERS } } },
            disallow: { to: { element: { types: { anyOf: MODULE_LAYERS }, captured: { module: '!{{ from.element.captured.module }}' } } } },
            message: 'A module must not import another module. Depend on a port you own; composition/ wires it.',
          },
          {
            from: { element: { types: { anyOf: ['domain', 'application', 'module'] } } },
            disallow: { to: { element: { type: 'adapters' } } },
            message: 'domain/, application/ and index.ts must not import adapters/ — depend on a port.',
          },
          {
            from: { element: { types: { noneOf: [...MODULE_LAYERS, 'composition'] } } },
            disallow: { to: { element: { types: { anyOf: ['domain', 'application', 'adapters'] } } } },
            message: 'Import a module only through modules/<name>/index.ts.',
          },
        ],
      }],
    },
  },
]
```

Run it in CI. Verified against a fixture: cross-module imports, `domain`→`adapters`, and `app/`/`components/` reaching into internals (relative and `@/` imports) all fail the build; composition, `app` → `@/composition` and public `index.ts` imports pass.

**Not covered:** a `domain/`/`application/` file importing an SDK package directly (`stripe`) is not caught — add a policy with `to: { module: { origin: 'external', source: 'stripe' } }` (syntax from the plugin README, untested here).

---

## 📋 Checklist Before Commit

- [ ] Every module has one `index.ts` exporting a factory + public types; nothing else is imported from outside
- [ ] No module imports another module — cross-module needs go through a port the consumer owns, wired in `composition/`
- [ ] `domain/`/`application/` import no adapter and no SDK; ports use the module's language, no leaked SDK types
- [ ] Exactly one `composition/` wires adapters and modules — no `new XAdapter(...)` elsewhere
- [ ] Only a module's own `adapters/` touch its tables
- [ ] Use cases tested against fakes, no real SDK calls
- [ ] `eslint-plugin-boundaries` configured and passing in CI
- [ ] Plain CRUD with no rules of its own was NOT turned into a module

---

*Skill Version: 2.0.0 | Compatible with Next.js 16.x, eslint 10.x, eslint-plugin-boundaries 7.x*

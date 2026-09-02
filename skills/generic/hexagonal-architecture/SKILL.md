---
name: Hexagonal Architecture - Ports & Adapters
description: |
  Pragmatic ports & adapters for Next.js: isolate external integrations (payment gateways, email,
  storage, data access) behind interfaces the core never breaks out of, enforced by ESLint — not by
  convention. No DI container, no domain/persistence mapping unless real business logic needs it.
  Trigger: Activated when integrating an external service/gateway, when asked for hexagonal/ports-adapters/
  clean architecture, or when a module needs to be swappable (e.g. Stripe ↔ Mercado Pago).
license: MIT
metadata:
  author: ai-library
  version: "1.0"
  scope: [root, backend]
  auto_invoke:
    - "Integrating a payment gateway or external service"
    - "Applying hexagonal architecture"
    - "Applying ports and adapters"
    - "Applying clean architecture"
    - "Making a module swappable between providers"
    - "Isolating business logic from an SDK"
---

# Hexagonal Architecture - Ports & Adapters

> **Core Principle:** The core never imports a concrete implementation — only the interface (port) it needs. Isolation is enforced by the compiler and the linter, not by hoping the next change respects a convention.

---

## 🆕 What's New

> **Instruction for Claude:** When this skill is loaded, check this table and mention any entry relevant to what the developer is working on — before writing code.

| Version | Change | Affects |
|---------|--------|---------|
| 1.0 | Initial skill | — |

---

## 🏗️ When to Use This

```
┌──────────────────────────────────────────────────────────────────┐
│         Does this touch an external service/SDK, or could         │
│         the implementation plausibly be swapped later?             │
│                                                                     │
│         NO                                        YES              │
│          │                                          │              │
│          ▼                                          ▼              │
│   Plain service layer                    Port + Adapter            │
│   (see `backend`/`database`/                                       │
│    `prisma` skills — no port)                                      │
│                                                                     │
│   • Internal CRUD                        • Payment gateways        │
│   • Business rules with                  • Email/notification      │
│     one obvious implementation             providers               │
│   • No swap ever planned                 • File/object storage     │
│                                           • Data access layer       │
│                                           • Any third-party API     │
│                                             you might replace       │
└──────────────────────────────────────────────────────────────────┘
```

Don't reach for this on a module that only ever talks to your own database with no real alternative implementation in sight — that's what the plain `Service Layer` pattern in `backend`/`data` agents already covers. Adding ports there is ceremony without a payoff.

**No DI container.** A container solves *wiring convenience*, not isolation — the interface plus the ESLint rule below is what actually stops hidden coupling. A container adds a dependency and a layer of indirection an AI has to reason about for no isolation gain in a Next.js-sized app. Wire adapters by hand in a single composition root (see below).

---

## 🚫 FORBIDDEN PATTERNS

### 1. Never Import a Concrete Adapter from Core/Application Code

```typescript
// ❌ FORBIDDEN - core service knows about Stripe directly
// lib/core/services/checkout.service.ts
import Stripe from 'stripe'

export async function checkout(orderId: string, amount: number) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  await stripe.paymentIntents.create({ amount, currency: 'usd' })
}

// ✅ CORRECT - core depends only on the port
// lib/core/services/checkout.service.ts
import type { PaymentGatewayPort } from '@/lib/core/ports/payment-gateway.port'

export async function checkout(
  gateway: PaymentGatewayPort,
  orderId: string,
  amount: number,
) {
  await gateway.charge({ orderId, amount })
}
```

### 2. Never Leak Adapter-Specific Types Through a Port

```typescript
// ❌ FORBIDDEN - the port signature forces every caller/adapter to know Stripe's shape
interface PaymentGatewayPort {
  charge(input: Stripe.PaymentIntentCreateParams): Promise<Stripe.PaymentIntent>
}

// ✅ CORRECT - the port speaks your domain's language, not any SDK's
interface PaymentGatewayPort {
  charge(input: ChargeInput): Promise<ChargeResult>
}

interface ChargeInput { orderId: string; amount: number; currency: string }
interface ChargeResult { transactionId: string; status: 'approved' | 'declined' }
```

### 3. Never Wire Adapters in More Than One Place

```typescript
// ❌ FORBIDDEN - two composition roots drift out of sync
// app/api/checkout/route.ts
const gateway = new StripePaymentAdapter(process.env.STRIPE_KEY!)

// lib/actions/checkout.ts
const gateway = new StripePaymentAdapter(process.env.STRIPE_KEY!) // duplicated, easy to fork

// ✅ CORRECT - one composition root, everyone imports the wired instance
// lib/composition.ts
export const paymentGateway: PaymentGatewayPort = new StripePaymentAdapter(process.env.STRIPE_KEY!)

// everywhere else
import { paymentGateway } from '@/lib/composition'
```

---

## ✅ REQUIRED PATTERNS

### 1. Define the Port

```typescript
// lib/core/ports/payment-gateway.port.ts
export interface ChargeInput {
  orderId: string
  amount: number
  currency: string
}

export interface ChargeResult {
  transactionId: string
  status: 'approved' | 'declined'
}

export interface PaymentGatewayPort {
  charge(input: ChargeInput): Promise<ChargeResult>
}
```

### 2. Implement Interchangeable Adapters

```typescript
// lib/adapters/stripe-payment.adapter.ts
import Stripe from 'stripe'
import type { PaymentGatewayPort, ChargeInput, ChargeResult } from '@/lib/core/ports/payment-gateway.port'

export class StripePaymentAdapter implements PaymentGatewayPort {
  private stripe: Stripe
  constructor(secretKey: string) {
    this.stripe = new Stripe(secretKey)
  }

  async charge({ orderId, amount, currency }: ChargeInput): Promise<ChargeResult> {
    const intent = await this.stripe.paymentIntents.create({
      amount, currency, metadata: { orderId },
    })
    return {
      transactionId: intent.id,
      status: intent.status === 'succeeded' ? 'approved' : 'declined',
    }
  }
}
```

```typescript
// lib/adapters/mercadopago-payment.adapter.ts
import { MercadoPagoConfig, Payment } from 'mercadopago'
import type { PaymentGatewayPort, ChargeInput, ChargeResult } from '@/lib/core/ports/payment-gateway.port'

export class MercadoPagoPaymentAdapter implements PaymentGatewayPort {
  private client: Payment
  constructor(accessToken: string) {
    this.client = new Payment(new MercadoPagoConfig({ accessToken }))
  }

  async charge({ orderId, amount, currency }: ChargeInput): Promise<ChargeResult> {
    const payment = await this.client.create({
      body: { transaction_amount: amount, description: orderId, payment_method_id: 'pix' },
      requestOptions: { idempotencyKey: `order-${orderId}` },
    })
    return {
      transactionId: String(payment.id),
      status: payment.status === 'approved' ? 'approved' : 'declined',
    }
  }
}
```

The core service (`checkout.service.ts` above) never changes when you add, remove, or swap a payment provider — only the composition root does.

### 3. Composition Root — the Only File Allowed to Know Both Sides

```typescript
// lib/composition.ts
import type { PaymentGatewayPort } from '@/lib/core/ports/payment-gateway.port'
import { StripePaymentAdapter } from '@/lib/adapters/stripe-payment.adapter'
import { MercadoPagoPaymentAdapter } from '@/lib/adapters/mercadopago-payment.adapter'

export const paymentGateway: PaymentGatewayPort =
  process.env.PAYMENT_PROVIDER === 'mercadopago'
    ? new MercadoPagoPaymentAdapter(process.env.MERCADOPAGO_ACCESS_TOKEN!)
    : new StripePaymentAdapter(process.env.STRIPE_SECRET_KEY!)
```

### 4. Testing — Fake Adapters, No Real API Calls

```typescript
// lib/core/services/checkout.service.test.ts
import type { PaymentGatewayPort } from '@/lib/core/ports/payment-gateway.port'
import { checkout } from './checkout.service'

class FakePaymentGateway implements PaymentGatewayPort {
  async charge() {
    return { transactionId: 'fake-txn-1', status: 'approved' as const }
  }
}

it('should approve checkout when gateway approves', async () => {
  const result = await checkout(new FakePaymentGateway(), 'order-1', 100)
  expect(result.status).toBe('approved')
})
```

No mocking library, no test doubles wired into an SDK, no network calls — the fake just implements the same port.

### 5. Enforce the Boundary with ESLint (`eslint-plugin-boundaries`)

Writing "core must not import adapters" in a skill is guidance the AI can still miss under pressure. This turns it into a build error.

```bash
npm install --save-dev eslint-plugin-boundaries
```

```javascript
// eslint.config.mjs
import boundaries from 'eslint-plugin-boundaries'

export default [
  {
    plugins: { boundaries },
    settings: {
      'boundaries/elements': [
        { type: 'core', pattern: 'lib/core/**' },
        { type: 'adapters', pattern: 'lib/adapters/**' },
        { type: 'composition', pattern: 'lib/composition.ts' },
      ],
    },
    rules: {
      'boundaries/dependencies': ['error', {
        default: 'allow',
        policies: [
          {
            from: { element: { type: 'core' } },
            disallow: { to: { element: { type: 'adapters' } } },
            message: 'core/ must depend on ports (interfaces), never on a concrete adapter.',
          },
        ],
      }],
    },
  },
]
```

Run this in CI. A PR that has the core importing `stripe` directly fails the build — the isolation guarantee doesn't depend on anyone remembering the rule.

---

## 📁 File Structure

```
lib/
├── core/                              # Domain + application services — zero imports from adapters/
│   ├── ports/
│   │   ├── payment-gateway.port.ts
│   │   └── notifier.port.ts
│   └── services/
│       └── checkout.service.ts        # depends only on ports, receives them as arguments
│
├── adapters/                          # Concrete implementations — the only files that know SDKs
│   ├── stripe-payment.adapter.ts
│   ├── mercadopago-payment.adapter.ts
│   └── resend-notifier.adapter.ts     # see `email` skill for the Resend specifics
│
├── composition.ts                     # Single wiring point — imports both core/ and adapters/
│
├── actions/                           # Server Actions import from composition.ts, never adapters/ directly
│   └── checkout.ts
└── services/                          # Existing plain service layer (database/prisma) — unaffected
```

**Relationship to existing skills:**
- `database`/`prisma` repositories are natural adapters behind a `Repository` port when a data source might change; leave them as-is (plain service layer) when it won't.
- `api-design`'s Mercado Pago webhook section and `email`'s Resend service layer are the two adapters most likely to sit behind `PaymentGatewayPort`/`NotifierPort` in practice — read those skills for the SDK-specific details, this skill only owns the boundary.

---

## 📋 Checklist Before Commit

- [ ] `core/` has zero imports from `adapters/` — only from `core/ports/`
- [ ] Port interfaces use domain language, no leaked SDK types (`Stripe.*`, `mercadopago.*`, etc.)
- [ ] Every adapter implements its port fully — no partial implementations with `as any`
- [ ] Exactly one composition root wires adapters to ports — no duplicated `new XAdapter(...)` elsewhere
- [ ] `eslint-plugin-boundaries` (or equivalent) configured and passing in CI
- [ ] Core services tested against a fake/in-memory adapter, no real SDK calls in unit tests
- [ ] No DI container introduced unless the app has outgrown manual composition (many adapters, per-request scoping needs)

---

*Skill Version: 1.0.0 | Compatible with Next.js 16.x, eslint-plugin-boundaries 7.x*

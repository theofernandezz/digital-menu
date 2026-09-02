---
name: API Design - Next.js 16
description: |
  REST API patterns for Next.js 16 with App Router. Server Actions first, API Routes for external integrations.
  Trigger: Activated when creating API endpoints, webhooks, or external integrations.
license: MIT
metadata:
  author: ai-library
  version: "2.1"
  scope: [root, backend]
  auto_invoke:
    - "Creating API endpoints"
    - "Designing REST APIs"
    - "Webhook handlers"
    - "External API integrations"
    - "Working with app/api/ directory"
    - "Mercado Pago payment integration"
    - "Payment webhook notifications"
---

# API Design - Next.js 16

> **Core Principle:** Server Actions for internal operations, API Routes only for external integrations. Minimize the API surface.

---

## 🆕 What's New

> **Instruction for Claude:** When this skill is loaded, check this table and mention any entry relevant to what the developer is working on — before writing code.

| Version | Change | Affects |
|---------|--------|---------|
| 2.1 | Added Mercado Pago webhook signature verification + idempotency section | `app/api/webhooks/mercadopago/route.ts` |
| Next.js 16.2 | `javascript:` URLs blocked automatically in `redirect()` and `router.push()` | Any API route that redirects based on user input |
| Next.js 15+ | Route handler `params` is now `Promise<{...}>` — must be `await`-ed | All dynamic route handlers `[id]/route.ts` |

---

## 🏗️ Decision Matrix

```
┌─────────────────────────────────────────────────────────────────┐
│                    Is it called externally?                      │
│                                                                  │
│         NO                                    YES                │
│          │                                     │                 │
│          ▼                                     ▼                 │
│   ┌─────────────┐                    ┌─────────────────┐        │
│   │   Server    │                    │   API Route     │        │
│   │   Action    │                    │   app/api/...   │        │
│   └─────────────┘                    └─────────────────┘        │
│                                                                  │
│   • Form submissions                  • Webhooks (Stripe, etc.) │
│   • Data mutations                    • OAuth callbacks         │
│   • Internal CRUD                     • Public APIs             │
│   • Revalidation                      • Third-party integrations│
└─────────────────────────────────────────────────────────────────┘
```

---

## 🚫 FORBIDDEN PATTERNS

### 1. Never Create API Routes for Internal Operations

```typescript
// ❌ FORBIDDEN - API Route for internal form submission
// app/api/posts/create/route.ts
export async function POST(request: Request) {
  const body = await request.json()
  // create post...
}

// ❌ FORBIDDEN - Fetching your own API from client
const response = await fetch('/api/posts/create', {
  method: 'POST',
  body: JSON.stringify(data)
})

// ✅ CORRECT - Use Server Action
// lib/actions/posts.ts
'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'

const createPostSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
})

export async function createPost(formData: FormData) {
  const validated = createPostSchema.safeParse({
    title: formData.get('title'),
    content: formData.get('content'),
  })
  
  if (!validated.success) {
    return { error: validated.error.flatten() }
  }
  
  // Create post in database
  await db.posts.create(validated.data)
  
  revalidatePath('/posts')
  return { success: true }
}
```

### 2. Never Skip Input Validation

```typescript
// ❌ FORBIDDEN - No validation
export async function POST(request: Request) {
  const body = await request.json()
  await db.insert(body) // Dangerous!
}

// ✅ CORRECT - Always validate with Zod
import { z } from 'zod'

const webhookSchema = z.object({
  type: z.enum(['payment.succeeded', 'payment.failed']),
  data: z.object({
    id: z.string(),
    amount: z.number(),
  }),
})

export async function POST(request: Request) {
  const body = await request.json()
  const validated = webhookSchema.safeParse(body)
  
  if (!validated.success) {
    return Response.json(
      { error: 'Invalid payload' },
      { status: 400 }
    )
  }
  
  // Process validated.data safely
}
```

### 3. Never Expose Internal Errors

```typescript
// ❌ FORBIDDEN - Leaks internal details
export async function GET() {
  try {
    const data = await db.query()
    return Response.json(data)
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}

// ✅ CORRECT - Generic error response
export async function GET() {
  try {
    const data = await db.query()
    return Response.json(data)
  } catch (error) {
    console.error('API Error:', error) // Log internally
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

---

## ✅ REQUIRED PATTERNS

### 1. Webhook Handler Template

```typescript
// app/api/webhooks/stripe/route.ts
import { headers } from 'next/headers'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: Request) {
  const body = await request.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (error) {
    console.error('Webhook signature verification failed:', error)
    return Response.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // Handle event types
  switch (event.type) {
    case 'payment_intent.succeeded':
      await handlePaymentSuccess(event.data.object)
      break
    case 'payment_intent.payment_failed':
      await handlePaymentFailed(event.data.object)
      break
    default:
      console.log(`Unhandled event type: ${event.type}`)
  }

  return Response.json({ received: true })
}

// Disable body parsing for raw body access
export const config = {
  api: { bodyParser: false }
}
```

### 2. Public API Endpoint Template

```typescript
// app/api/v1/products/route.ts
import { z } from 'zod'
import { NextRequest } from 'next/server'

const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  category: z.string().optional(),
})

export async function GET(request: NextRequest) {
  // Parse query params
  const searchParams = request.nextUrl.searchParams
  const query = querySchema.safeParse({
    page: searchParams.get('page'),
    limit: searchParams.get('limit'),
    category: searchParams.get('category'),
  })

  if (!query.success) {
    return Response.json(
      { error: 'Invalid parameters', details: query.error.flatten() },
      { status: 400 }
    )
  }

  const { page, limit, category } = query.data

  // Fetch data
  const products = await getProducts({ page, limit, category })
  const total = await getProductsCount({ category })

  // Return paginated response
  return Response.json({
    data: products,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  })
}
```

### 3. API Response Types

```typescript
// types/api.ts

// Success response
interface ApiSuccess<T> {
  data: T
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Error response
interface ApiError {
  error: string
  code?: string
  details?: Record<string, string[]>
}

// Union type for responses
type ApiResponse<T> = ApiSuccess<T> | ApiError

// Helper functions
export function successResponse<T>(data: T, pagination?: ApiSuccess<T>['pagination']) {
  return Response.json({ data, pagination })
}

export function errorResponse(error: string, status: number, code?: string) {
  return Response.json({ error, code }, { status })
}
```

### 4. Rate Limiting

```typescript
// lib/api/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'), // 10 requests per 10 seconds
  analytics: true,
})

export async function checkRateLimit(identifier: string) {
  const { success, limit, remaining, reset } = await ratelimit.limit(identifier)
  
  return {
    success,
    headers: {
      'X-RateLimit-Limit': limit.toString(),
      'X-RateLimit-Remaining': remaining.toString(),
      'X-RateLimit-Reset': reset.toString(),
    },
  }
}

// Usage in API Route
export async function GET(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') ?? 'anonymous'
  const { success, headers } = await checkRateLimit(ip)
  
  if (!success) {
    return Response.json(
      { error: 'Too many requests' },
      { status: 429, headers }
    )
  }
  
  // Process request...
  return Response.json({ data }, { headers })
}
```

### 5. API Authentication

```typescript
// lib/api/auth.ts
import { createClient } from '@/lib/supabase/server'

export async function requireApiAuth(request: Request) {
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader?.startsWith('Bearer ')) {
    return { error: 'Missing authorization header', status: 401 }
  }
  
  const token = authHeader.replace('Bearer ', '')
  const supabase = await createClient()
  
  const { data: { user }, error } = await supabase.auth.getUser(token)
  
  if (error || !user) {
    return { error: 'Invalid token', status: 401 }
  }
  
  return { user }
}

// Usage
export async function GET(request: Request) {
  const auth = await requireApiAuth(request)
  
  if ('error' in auth) {
    return Response.json({ error: auth.error }, { status: auth.status })
  }
  
  // auth.user is available
  const data = await getUserData(auth.user.id)
  return Response.json({ data })
}
```

### 6. Streaming Responses (AI / Long-running)

For AI text generation or long-running operations, stream responses instead of waiting for full completion.

```typescript
// app/api/chat/route.ts
import { OpenAI } from 'openai'

const openai = new OpenAI()

export async function POST(request: Request) {
  const { messages } = await request.json()

  // Create a readable stream from OpenAI
  const stream = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages,
    stream: true,
  })

  // Return a streaming response
  const readableStream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()

      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content ?? ''
        if (text) {
          // Server-Sent Events format
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`))
        }
      }

      controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'))
      controller.close()
    },
  })

  return new Response(readableStream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
```

```typescript
// Client-side consumption with EventSource / fetch
'use client'

export async function streamChat(messages: Message[]) {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
  })

  if (!response.body) throw new Error('No response body')

  const reader = response.body.getReader()
  const decoder = new TextDecoder()

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    const lines = decoder.decode(value).split('\n\n').filter(Boolean)
    for (const line of lines) {
      if (line === 'data: [DONE]') return
      if (line.startsWith('data: ')) {
        const { text } = JSON.parse(line.slice(6))
        // Process each chunk (e.g., append to UI)
        yield text
      }
    }
  }
}
```

---

## 💳 Payment Webhooks — Mercado Pago

Mercado Pago notifications only carry a `topic` and an `id` — never trust the amount/status from the notification payload itself. Always re-fetch the resource from the API before updating your database.

### 1. Verify the Signature

```typescript
// app/api/webhooks/mercadopago/route.ts
import { WebhookSignatureValidator, InvalidWebhookSignatureError } from 'mercadopago'

export async function POST(request: Request) {
  const url = new URL(request.url)
  const dataId = url.searchParams.get('data.id')
  const xSignature = request.headers.get('x-signature')
  const xRequestId = request.headers.get('x-request-id')

  if (!dataId || !xSignature || !xRequestId) {
    return Response.json({ error: 'Missing headers' }, { status: 400 })
  }

  try {
    WebhookSignatureValidator.validate({
      xSignature,
      xRequestId,
      dataId,
      secret: process.env.MERCADOPAGO_WEBHOOK_SECRET!,
    })
  } catch (error) {
    if (error instanceof InvalidWebhookSignatureError) {
      return Response.json({ error: 'Invalid signature' }, { status: 401 })
    }
    throw error
  }

  // Signature valid — safe to process
  return await handleNotification(dataId, request)
}
```

### 2. Re-fetch Before Trusting

```typescript
// ❌ FORBIDDEN - trusting amount/status from the notification body
async function handleNotification(dataId: string) {
  const body = await request.json()
  await markOrderPaid(body.data.id, body.transaction_amount) // body is unverified
}

// ✅ CORRECT - fetch the real payment from the API
import { MercadoPagoConfig, Payment } from 'mercadopago'

const client = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN! })
const paymentClient = new Payment(client)

async function handleNotification(dataId: string) {
  const payment = await paymentClient.get({ id: dataId })

  if (payment.status !== 'approved') return

  // idempotent: use payment.id as the idempotency boundary, not the webhook delivery
  await markOrderPaid(payment.external_reference!, payment.transaction_amount!)
}
```

### 3. Idempotency on Creation

```typescript
// REQUIRED - pass an idempotency key on every payment creation call
await paymentClient.create({
  body: {
    transaction_amount: 100,
    description: 'Order #1234',
    payment_method_id: 'pix',
    payer: { email: user.email },
    external_reference: orderId, // your own ID, returned unmodified in the payment object
  },
  requestOptions: { idempotencyKey: `order-${orderId}` },
})
```

### Checklist

- [ ] Signature verified with `WebhookSignatureValidator` before any processing
- [ ] Notification body never trusted directly — always re-fetch via `Payment.get()`
- [ ] `idempotencyKey` set on every payment creation, keyed by your own order ID
- [ ] `external_reference` used to map back to your order — never rely on payment ID alone
- [ ] Handler returns `200` even for ignored/duplicate notifications (Mercado Pago retries on non-2xx)

---

## 📁 File Structure

```
app/
├── api/
│   ├── v1/                    # Versioned public APIs
│   │   ├── products/
│   │   │   └── route.ts
│   │   └── users/
│   │       └── route.ts
│   ├── webhooks/              # External webhooks
│   │   ├── stripe/
│   │   │   └── route.ts
│   │   └── supabase/
│   │       └── route.ts
│   └── auth/                  # OAuth callbacks
│       └── callback/
│           └── route.ts

lib/
├── actions/                   # Server Actions (internal)
│   ├── posts.ts
│   └── users.ts
├── api/                       # API utilities
│   ├── rate-limit.ts
│   └── auth.ts
└── validations/               # Shared Zod schemas
    └── api.ts

types/
└── api.ts                     # API response types
```

---

## 📊 HTTP Status Codes

| Code | When to Use |
|------|-------------|
| `200` | Success (GET, PUT, PATCH) |
| `201` | Resource created (POST) |
| `204` | Success, no content (DELETE) |
| `400` | Bad request (validation error) |
| `401` | Unauthorized (no/invalid token) |
| `403` | Forbidden (valid token, no permission) |
| `404` | Resource not found |
| `429` | Rate limit exceeded |
| `500` | Internal server error |

---

## 📋 Checklist Before Commit

- [ ] Using Server Actions for internal operations
- [ ] API Routes only for external integrations
- [ ] All inputs validated with Zod
- [ ] Rate limiting on public endpoints
- [ ] Authentication on protected endpoints
- [ ] Generic error messages (no internal leaks)
- [ ] Proper HTTP status codes
- [ ] Response types defined

---

*Skill Version: 2.1.0 | Compatible with Next.js 16.x, Mercado Pago Node.js SDK 2.x*

# Skills Changelog

> Read this file at the start of each session alongside `skills/improvements.md`.
> Before writing code, mention any entry relevant to the developer's current task.
> Only skills with tracked changes are listed — omitted skills have no breaking changes.

---

## security — v2.2 (2026-09-23)

| Change | Affects |
|--------|---------|
| Next.js 16 renamed `middleware.ts` → `proxy.ts` (export `proxy`, Node.js runtime) — security-headers example updated | `proxy.ts` |
| `X-XSS-Protection` removed — OWASP 2025 recommends omitting it (can introduce XSS in IE/Chrome <78) | `middleware.ts` |
| In-memory rate limiter is serverless-unsafe — use Upstash/Redis in production | `lib/security/rate-limit.ts` |
| CSP `unsafe-eval` + `unsafe-inline` flagged by OWASP 2025 — prefer nonce-based CSP | `middleware.ts` |
| `headers()` in Next.js 15+ must be `await`-ed — CSRF helper updated | `lib/security/csrf.ts` |
| `javascript:` URLs blocked automatically in Next.js 16.2.1 for `router.push`, `redirect`, `<Link>` | navigation code |

---

## nextjs-core — v2.0

| Change | Affects |
|--------|---------|
| `experimental.strictRouteTypes: true` now available — type-checks page props at build time | `page.tsx`, `layout.tsx` |
| `logging.serverFunctions: true` — server action calls logged with timing by default | Server Actions |
| `javascript:` URLs blocked automatically in `router.push`, `redirect`, `<Link>` | redirect/navigation code |
| `params` and `searchParams` are now `Promise<{...}>` — must be `await`-ed | all dynamic routes `[id]` |
| `useFormState` removed (React 19) — use `useActionState` from `react` (returns `[state, action, isPending]`) | forms wired to Server Actions |
| `middleware.ts` deprecated in Next.js 16 — renamed `proxy.ts`, export `proxy` (Node.js runtime only; codemod: `middleware-to-proxy`) | `middleware.ts` |
| Server Actions return `ActionResult<T>` (from `error-handling`) instead of `{ errors?, success? }` — forms read `state.error.fields` / `state.error.message` | Server Actions, `useActionState` forms |

---

## react-patterns — v2.0

| Change | Affects |
|--------|---------|
| `useFormState` removed — use `useActionState` from `react` (returns `[state, action, isPending]`) | any form wired to a Server Action |
| `use()` hook — read a Promise or Context directly in render without `useEffect` | data fetching in Client Components |
| `useOptimistic()` — optimistic UI updates while an async action is pending | forms, like/vote buttons |

---

## prisma — v1.0 (2026-03-31)

| Change | Affects |
|--------|---------|
| `prisma generate --no-engine` — lightweight client without query engine binary (for edge runtimes) | Vercel Edge, Cloudflare Workers |
| `omit` in queries — exclude specific fields instead of listing all included. Example: `omit: { passwordHash: true }` | queries hiding sensitive columns |
| `$transaction` now supports `isolation level` option | critical write operations |
| `driverAdapters` is GA — remove from `previewFeatures` in `schema.prisma` (causes deprecation warning in Prisma 6) | projects using Neon/PlanetScale adapters |

---

## testing — v3.0

| Change | Affects |
|--------|---------|
| `maxThreads`/`maxForks` removed — use `maxWorkers` | `vitest.config.ts` |
| `coverage.all` removed — `coverage.include` is now required | coverage config |
| `vi.restoreAllMocks()` no longer resets automocks — use `vi.resetAllMocks()` + `vi.restoreAllMocks()` together in `afterEach` | any test using `vi.mock()` |

---

## typescript — v2.0

| Change | Affects |
|--------|---------|
| Inferred type predicates (TS 5.5) — `arr.filter(Boolean)` now correctly narrows to non-nullable | array filtering patterns |
| `NoInfer<T>` utility type (TS 5.4) — prevents inference from a specific type parameter | generic utility functions |
| `using` / `await using` (TS 5.2) — explicit resource disposal | DB connections, file handles |

---

## ui-engineering — v3.3

| Change | Affects |
|--------|---------|
| Tailwind v4: CSS-first config — `tailwind.config.js` replaced by `@import "tailwindcss"` + CSS variables | projects upgrading from Tailwind v3 |
| Tailwind v4: `@theme` directive — define design tokens directly in CSS | custom colors, spacing, fonts |
| Tailwind v4: `@utility` directive — create custom utilities without a plugin | one-off utility classes |
| shadcn/ui (2025): components now use CSS variables from Tailwind v4 theme by default | new shadcn component installs |

---

## state-management — v1.0

| Change | Affects |
|--------|---------|
| `useOptimistic()` is now stable (React 19) — prefer it over manual optimistic state patterns | like, vote, toggle, reorder interactions |
| `use()` hook reads a Context or Promise synchronously — replaces `useContext` for many cases | global state reads in deeply nested components |
| Zustand 5: `create` no longer requires `immer` for nested updates — use `set` with draft directly | Zustand stores with nested objects |

---

## hexagonal-architecture — v2.0 (2026-09-23)

| Change | Affects |
|--------|---------|
| Module-first layout `modules/<name>/{domain,application,adapters}` + public `index.ts` replaces `lib/core`, `lib/adapters`, `lib/composition.ts` | projects on the 1.0 layout |
| Modules never import each other — the consumer owns the port, wiring lives in `composition/` | cross-module calls |
| Full hexagonal scope for projects that adopt it (not only external integrations); plain CRUD stays a colocated service | new modules |
| ESLint boundaries config rewritten for modules — element order matters (first match wins) | `eslint.config.mjs` |

---

## skill-sync — v2.0 (2026-09-23)

| Change | Affects |
|--------|---------|
| `sync.sh` is now a registration check (exit 1 if a `skills/generic/` skill is missing from `_index.md`, README, AGENTS, CLAUDE or GEMINI); the `--dry-run`/`--scope` generator is removed | `skills/skill-sync/assets/sync.sh` |

---

## docker — v1.0 (2026-09-23)

> New skill.

| Change | Affects |
|--------|---------|
| Multi-stage Next.js Dockerfile (standalone output, non-root, `HOSTNAME=0.0.0.0`) with dev and prod targets | `Dockerfile` |
| Dev containers use Compose Watch; never bind-mount the project over `node_modules` | `docker-compose.yml` |
| No secrets in `ARG`/`ENV` — only `NEXT_PUBLIC_*` are build args | `Dockerfile`, CI builds |
| Turbopack file-watching fallback is `watchOptions.pollIntervalMs` (webpack: `WATCHPACK_POLLING`) | `next.config.ts` |

---

## ci-cd — v1.0 (2026-09-23)

> New skill.

| Change | Affects |
|--------|---------|
| `concurrency` group required when tests hit shared external state (`cancel-in-progress: false` for deploys) | `.github/workflows/*.yml` |
| Least-privilege `permissions`, third-party actions pinned to a full commit SHA, no `pull_request_target` with PR code | `.github/workflows/*.yml` |
| Debug CI-only failures from logs and the upstream tracker before adding retries or workarounds | failing CI runs |

---

## email — v1.0 (2026-08-06)

> New skill.

| Change | Affects |
|--------|---------|
| Typed React Email templates styled via the `Tailwind` wrapper (not `<style>` blocks) | `emails/**/*.tsx` |
| Sends go through a `lib/email/send.ts` service layer, never inline in Server Actions | `lib/actions/**/*.ts` |
| Every send uses an `idempotencyKey` (`<event-type>/<entity-id>` convention) | `resend.emails.send(...)` calls |
| Bounce/complaint webhooks verified with `resend.webhooks.verify` (Svix headers) before processing | `app/api/webhooks/resend/route.ts` |

---

## api-design — v2.1 (2026-08-06)

| Change | Affects |
|--------|---------|
| New "Payment Webhooks — Mercado Pago" section: signature verification with `WebhookSignatureValidator`, re-fetch-before-trust, idempotency keys | `app/api/webhooks/mercadopago/route.ts` |
| Next.js 16.2: `javascript:` URLs blocked in `redirect()` and `router.push()` | API routes that redirect based on user input |
| Next.js 15+: route handler `params` is now `Promise<{...}>` — must be `await`-ed | dynamic route handlers `[id]/route.ts` |

---

## error-handling — v2.0

| Change | Affects |
|--------|---------|
| One canonical Server Action return shape: `ActionResult<T>` in `lib/action-result.ts`; `fields` values may be `undefined` (matches Zod's `flatten()`) | Server Actions in any skill |
| Next.js 16.2: `unstable_retry()` — user-triggered retry inside `error.tsx` (unstable, watch for stable) | `error.tsx` boundary components |
| Next.js 16.2: `unstable_catchError()` — component-level error handling without a full boundary (unstable) | granular error handling in Server Components |

---

## performance — v2.0

| Change | Affects |
|--------|---------|
| Next.js 16.2: Cache Components architecture replaces PPR — static segments cached in segment cache | pages mixing static and dynamic content |
| Next.js 16.2: `experimental.prefetchInlining` — bundles segment prefetches into a single response | navigation-heavy apps |
| Next.js 16.2: `images.maximumDiskCacheSize` — LRU disk cache limit for `next/image` (was unbounded) | apps with large image sets |

---

## accessibility — v2.0

| Change | Affects |
|--------|---------|
| WCAG 2.2 criterion 2.5.7 — dragging movements must have a single-pointer alternative | drag-and-drop UI |
| WCAG 2.2 criterion 2.5.8 — touch targets minimum 24×24 CSS pixels | mobile/touch UIs |
| WCAG 2.2 criterion 4.1.3 (Status Messages) now broadly enforced — `role="status"` on dynamic feedback | toast notifications, form feedback |

---

*Last updated: 2026-03-31 | Skills with no tracked changes omitted (database, seo, i18n, env-config)*

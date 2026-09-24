# Spec (incremental): F1-3 place-order application layer

Mode: incremental (reversible, single domain). Pilot of `skills/spec-driven`. Persisted because it is delegated to `backend` and checked by `verifier`.

Vision: a customer at `/t/[token]` can send an order from their phone and see what was stored (F1-6). This step builds the server side of that, and nothing visible.

Outcome: `placeOrderAction(input)` can be called from a client component and returns either the order as stored by the `place_order` RPC or a typed business error. No UI, no cart, no admin.

Criteria:
- [ ] **Happy path.** With valid input, the action returns `{ ok: true, data }` where `data` holds `orderId`, `placedAt`, `menuSubtotal` and the stored `items` (name, unitPrice, quantity, notes). The word `total` (the RPC's key) appears only inside the Supabase adapter and its tests; domain, use case, schema and action use `menuSubtotal`. A test pins the `total` → `menuSubtotal` translation.
- [ ] **Errors.** Each RPC error code (`invalid_table`, `table_closed`, `too_many_open_orders`, `items_unavailable` with `itemIds`, `invalid_items`) becomes a `DomainError` subclass and then `{ ok: false, error: { code, ... } }`. Anything else (including Postgres `22P05`, `22003`, `57014`, network failure, malformed RPC response) becomes `unexpected`, is logged server-side, and never leaks its message to the result. One test per code, plus tests for the unknown cases.
- [ ] **Input.** The Zod schema rejects bad input before the port is called (quantity 0 and 21, notes over 200 after trim, 0 and 31 lines, duplicate ids, non-uuid id, empty and over-64 token). Existing gates stay green: typecheck, lint (hexagonal boundaries), unit, integration.

## Scope
- `domain/errors/`: new order errors, as `DomainError` subclasses, same style as the existing ones.
- `application/ports/order-repository.ts`, `application/schemas/order.ts`, `application/use-cases/place-order.ts` (+ tests), an in-memory fake in `application/__tests__/fakes.ts`.
- `adapters/driven/supabase/`: order repository calling `place_order`, plus tests (unit for the mapping, integration against the local Supabase for the RPC round trip).
- `composition/request-scope.ts`: expose the use case through `getUseCases()`.
- `app/`: `placeOrderAction` (Server Action) and the small function that maps the use-case outcome to the result union.
- Docs: `docs/build-plan.md` (6b) and `docs/customer-ordering.md` (see decisions below).

## Out of scope
- `get_table_status` (port method, use case, adapter): its only consumer is the `/t/[token]` page in F1-6, so it is built there. Building it now is unused code.
- Cart, pages, admin tables page, any UI or copy (F1-4 to F1-6).
- Any migration or change to `orders.total` or the RPC's JSON keys. Production already has them; the rename is done in the adapter only.
- Payments, tips, service charges, order status (Features 2-3).

## Decisions already made (do not re-open)
- **Naming.** The RPC's `total` is the sum of menu items only, not what the restaurant charges (service, cover, tip are handled outside the system). The domain calls it `menuSubtotal`; only the adapter knows `total`.
- **No generic `publicAction` wrapper.** It would have one use. Use a small function that maps the use-case result to `PlaceOrderResult`. `authedAction` does not exist in the code; the doc line is stale, fix it.
- **Never throw business errors from the action**; return the discriminated union from `docs/customer-ordering.md` (section 5), with `total` replaced by `menuSubtotal`.
- **Zod parses inside the use case**, per the repo's style. Schema shape: `docs/customer-ordering.md` section 5.
- Style: follow the existing use cases, ports, fakes and adapters (kebab-case files, ports in `application/ports`, no enums, no `any`). Boundaries in `eslint.config.mjs` must keep passing; `app/` reaches use cases only through `getUseCases()`.
- The adapter must catch every unknown error. Documented raw failures the RPC can produce outside its contract: `22P05` (a `\u0000` in token/ids/notes, rejected by PostgREST), `22003` (numeric overflow), `57014` (anon's ~3 s `statement_timeout`).
- Anything questionable that is not covered here: stop and report, do not guess.

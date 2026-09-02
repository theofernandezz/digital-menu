# Architecture: Hexagonal (Ports & Adapters), full version

## The rule

Dependency direction points inward only: `adapters` depend on `application`, `application` depends on `domain` and its own `ports`. Nothing in `domain` or `application` imports Next.js or Supabase.

**Enforceable checkpoint:** only files under `adapters/driven/supabase/` may *construct or call* a Supabase client — **no exceptions**. There is no `lib/supabase/*.ts` in this project; that's where the `nextjs-core`/`database` skills' default convention would put it, and it's deliberately overridden here so the checkpoint stays a single, literal grep instead of "adapters/driven/supabase/, plus lib/supabase/, unless...". `composition/container.ts` is the one documented exception, and only for the **type**: its factory functions take a `SupabaseClient` parameter (see the worked example below), so it imports `type { SupabaseClient } from '@supabase/supabase-js'` — it never imports `createClient`/`createServerClient` and never constructs one. If a lint rule or code review ever finds a Supabase client *constructed* outside `adapters/driven/supabase/`, that's the boundary being violated; a bare type import in `composition/container.ts` is not.

Root `middleware.ts` is the one place Next.js forces a file outside this tree to touch Supabase session refresh indirectly — it imports a thin `updateSession()` helper from `adapters/driven/supabase/middleware-client.ts` and calls it; `middleware.ts` itself never imports the SDK directly.

**Env vars:** every file in `adapters/driven/supabase/` reads config through `lib/env.ts` (Zod-validated, per the `env-config` skill), never raw `process.env`. This overrides `skills/generic/database/SKILL.md`'s own example, which uses `process.env.NEXT_PUBLIC_SUPABASE_URL!` — that pattern is forbidden here; treat `env-config` as authoritative wherever the two skills disagree on this project.

## Why ports are outbound-only here

A use case's own method signature already functions as its inbound port — nothing else calls into it, so a dedicated interface with exactly one implementation adds a file without adding a real seam. Outbound ports (repositories, auth, storage) get real interfaces because they have two implementations in practice: the Supabase adapter for real usage, and an in-memory fake for use-case unit tests. That's the actual return on this layering — keep it, don't dilute it by adding symmetrical inbound interfaces nothing ever swaps.

## Folder structure

Matches this project's actual convention: `app/` is the Next.js App Router root (routes + colocated Server Actions), `components/` is the Atomic Design tree — neither moves under a custom adapters folder, since the App Router only resolves routes from `app/`. No `src/` wrapper, per the project's existing layout.

```
domain/
  entities/            # entity classes + invariants, zero framework imports
    menu-item.ts
    category.ts
    tag.ts
    restaurant.ts
  errors/
    domain-errors.ts   # InvalidPriceError, CategoryMismatchError, ...

application/
  ports/                # outbound interfaces only
    menu-item-repository.ts
    category-repository.ts
    auth-provider.ts
    image-storage.ts
  use-cases/
    create-menu-item.ts
    update-menu-item.ts
    toggle-item-availability.ts
    list-published-menu.ts

adapters/
  driven/supabase/       # the ONLY place @supabase/supabase-js or @supabase/ssr is imported
    client.ts               # createServerSupabaseClient() — server components & actions, cookie-based
    browser-client.ts       # createBrowserSupabaseClient() — client components only (e.g. login form)
    middleware-client.ts    # updateSession() — called by root middleware.ts to refresh the session cookie
    supabase-menu-item-repository.ts
    supabase-category-repository.ts
    supabase-auth-provider.ts

composition/
  container.ts             # ONLY file that imports both a use case and adapters/driven/supabase

app/                        # Next.js App Router root — routes + colocated Server Actions
  admin/items/
    page.tsx                 # Server Component, reads via a use case through composition/container.ts
    actions.ts                # 'use server' — the driving adapter, calls use cases only
  page.tsx                   # public menu route

middleware.ts                # root-level, required by Next.js — calls adapters/driven/supabase/middleware-client.ts, imports no SDK directly

lib/
  env.ts                      # Zod-validated env vars (env-config skill) — imported by adapters/driven/supabase/*

components/                 # Atomic Design: atoms/ molecules/ organisms/ templates/, presentation only, no data access
```

Server Actions in `app/**/actions.ts` are the driving adapter — they live where Next.js requires them, but the rule still holds: they call `composition/container.ts` → a use case, never Supabase directly.

## Vertical slice example: create a menu item

```ts
// domain/entities/menu-item.ts
export type MenuItemProps = {
  id: string;
  restaurantId: string;
  categoryId: string;
  name: string;
  price: number;
};

export class MenuItem {
  private constructor(private readonly props: MenuItemProps) {}

  static create(props: MenuItemProps): MenuItem {
    if (props.price < 0) throw new InvalidPriceError(props.price);
    return new MenuItem(props);
  }

  get id(): string { return this.props.id; }
  // ...remaining getters
}

// application/ports/menu-item-repository.ts
export interface MenuItemRepository {
  save(item: MenuItem): Promise<void>;
  findById(id: string): Promise<MenuItem | null>;
}

// application/use-cases/create-menu-item.ts
import { z } from "zod";

export const createMenuItemSchema = z.object({
  restaurantId: z.string().uuid(),
  categoryId: z.string().uuid(),
  name: z.string().min(1),
  price: z.number().nonnegative(),
});
export type CreateMenuItemInput = z.infer<typeof createMenuItemSchema>;

export class CreateMenuItemUseCase {
  constructor(private repo: MenuItemRepository, private auth: AuthProvider) {}

  async execute(ownerId: string, rawInput: CreateMenuItemInput): Promise<MenuItem> {
    const input = createMenuItemSchema.parse(rawInput);
    await this.auth.assertOwnsRestaurant(ownerId, input.restaurantId);
    const item = MenuItem.create({ id: crypto.randomUUID(), ...input });
    await this.repo.save(item);
    return item;
  }
}

// adapters/driven/supabase/client.ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "@/lib/env";

export async function createServerSupabaseClient(): Promise<SupabaseClient> {
  const cookieStore = await cookies();
  return createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: { getAll: () => cookieStore.getAll() /* ...setAll, see @supabase/ssr docs */ },
  });
}

// adapters/driven/supabase/supabase-menu-item-repository.ts
export class SupabaseMenuItemRepository implements MenuItemRepository {
  constructor(private client: SupabaseClient) {}
  async save(item: MenuItem): Promise<void> { /* insert/update via this.client */ }
  async findById(id: string): Promise<MenuItem | null> { /* select via this.client */ return null; }
}

// composition/container.ts
export function createMenuItemUseCase(client: SupabaseClient): CreateMenuItemUseCase {
  return new CreateMenuItemUseCase(
    new SupabaseMenuItemRepository(client),
    new SupabaseAuthProvider(client),
  );
}

// app/admin/items/actions.ts — the driving adapter, lives where Next.js requires it
'use server';
export async function createMenuItemAction(formData: FormData): Promise<void> {
  const useCase = createMenuItemUseCase(createServerSupabaseClient());
  await useCase.execute(getOwnerId(), parseFormData(formData));
  revalidatePath('/admin/items');
}
```

## Payoff this is meant to buy (check these hold true when reviewing PRs)

- Swapping Supabase Storage for another image host touches only `adapters/driven/supabase/*` (or a new `adapters/driven/<provider>/`) — `domain/`, `application/`, and `components/` don't change.
- Unit tests for use cases inject an in-memory fake implementing `MenuItemRepository` — no network, no test database, fast and deterministic. This is step 5's foundation, not a separate concern.
- Business rules (price validation, ownership checks) live in exactly one place (`domain/` and `application/`), never duplicated inside a Server Action or a component.
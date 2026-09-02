// Integration tests against the real Supabase project — ported from
// scripts/verify-categories-slice.ts (now retired). Run with:
//   docker compose exec app pnpm test:integration
import { beforeAll, describe, expect, it } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";
import {
  getMyRestaurantUseCase,
  createCategoryUseCase,
  listCategoriesUseCase,
  updateCategoryUseCase,
  deleteCategoryUseCase,
} from "@/composition/container";
import type { Category } from "@/domain/entities/category";

describe("categories (integration)", () => {
  let adminClient: SupabaseClient;
  let restaurantId: string;
  let created: Category;
  let created2: Category;

  beforeAll(async () => {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminEmail || !adminPassword) throw new Error("ADMIN_EMAIL / ADMIN_PASSWORD must be set in .env.local");

    adminClient = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    const { error, data } = await adminClient.auth.signInWithPassword({ email: adminEmail, password: adminPassword });
    if (error || !data.session) throw error ?? new Error("Sign-in produced no session");

    restaurantId = (await getMyRestaurantUseCase(adminClient).execute()).id;
  });

  it("creates a category with displayOrder 0", async () => {
    created = await createCategoryUseCase(adminClient).execute({
      restaurantId,
      name: "Starters",
      description: "Small plates to start",
    });
    expect(created.name).toBe("Starters");
    expect(created.displayOrder).toBe(0);
  });

  it("computes displayOrder as max + 1 for the second category", async () => {
    created2 = await createCategoryUseCase(adminClient).execute({ restaurantId, name: "Mains", description: null });
    expect(created2.displayOrder).toBe(1);
  });

  it("lists categories ordered by displayOrder", async () => {
    const listed = await listCategoriesUseCase(adminClient).execute({ restaurantId });
    expect(listed.length).toBeGreaterThanOrEqual(2);
    expect(listed[0]!.displayOrder).toBeLessThanOrEqual(listed[listed.length - 1]!.displayOrder);
  });

  it("updates a category's name", async () => {
    const updated = await updateCategoryUseCase(adminClient).execute({
      id: created.id,
      restaurantId,
      name: "Starters & Small Plates",
      description: created.description,
    });
    expect(updated.name).toBe("Starters & Small Plates");
  });

  it("deletes categories and they no longer appear in the list", async () => {
    await deleteCategoryUseCase(adminClient).execute({ id: created.id, restaurantId });
    await deleteCategoryUseCase(adminClient).execute({ id: created2.id, restaurantId });

    const afterDelete = await listCategoriesUseCase(adminClient).execute({ restaurantId });
    expect(afterDelete.some((c) => c.id === created.id || c.id === created2.id)).toBe(false);
  });

  it("rejects an anonymous client's create — auth check fires before RLS is even reached", async () => {
    const anonClient = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    await expect(
      createCategoryUseCase(anonClient).execute({ restaurantId, name: "Should not be created", description: null }),
    ).rejects.toThrow();
  });
});

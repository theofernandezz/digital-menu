// Ported from scripts/verify-tags-slice.ts (now retired).
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";
import {
  getMyRestaurantUseCase,
  createCategoryUseCase,
  deleteCategoryUseCase,
  createMenuItemUseCase,
  deleteMenuItemUseCase,
  syncMenuItemTagsUseCase,
  listMenuItemTagsUseCase,
} from "@/composition/container";
import type { Restaurant } from "@/domain/entities/restaurant";
import type { Category } from "@/domain/entities/category";
import type { MenuItem } from "@/domain/entities/menu-item";
import type { Tag } from "@/domain/entities/tag";

describe("tags (integration)", () => {
  let adminClient: SupabaseClient;
  let restaurant: Restaurant;
  let category: Category;
  let item: MenuItem;
  let firstSync: Tag[];

  beforeAll(async () => {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminEmail || !adminPassword) throw new Error("ADMIN_EMAIL / ADMIN_PASSWORD must be set in .env.local");

    adminClient = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    const { error } = await adminClient.auth.signInWithPassword({ email: adminEmail, password: adminPassword });
    if (error) throw error;

    restaurant = await getMyRestaurantUseCase(adminClient).execute();
    category = await createCategoryUseCase(adminClient).execute({
      restaurantId: restaurant.id,
      name: "Tags verification category",
      description: null,
    });
    item = await createMenuItemUseCase(adminClient).execute({
      restaurantId: restaurant.id,
      categoryId: category.id,
      name: "Tags Test Item",
      description: null,
      price: 5,
      imageUrl: null,
    });
  });

  afterAll(async () => {
    // Categories/menu_items cascade menu_item_tags, but the tags rows
    // themselves are restaurant-scoped and outlive this test on purpose
    // (reusable across items) — leaving them is correct, not a leak.
    await deleteMenuItemUseCase(adminClient).execute({ id: item.id, restaurantId: restaurant.id });
    await deleteCategoryUseCase(adminClient).execute({ id: category.id, restaurantId: restaurant.id });
  });

  it("collapses 'Vegan' and 'vegan' into one tag, case-insensitively", async () => {
    firstSync = await syncMenuItemTagsUseCase(adminClient).execute({
      restaurantId: restaurant.id,
      menuItemId: item.id,
      tagNames: ["Vegan", "Spicy", "vegan"],
    });
    expect(firstSync).toHaveLength(2);
    expect(new Set(firstSync.map((t) => t.name)).size).toBe(2);
  });

  it("reuses an existing tag on re-sync instead of recreating it", async () => {
    const secondSync = await syncMenuItemTagsUseCase(adminClient).execute({
      restaurantId: restaurant.id,
      menuItemId: item.id,
      tagNames: ["Vegan", "Gluten-Free"],
    });
    expect(secondSync).toHaveLength(2);
    const veganTagId = firstSync.find((t) => t.name === "Vegan")?.id;
    expect(secondSync.some((t) => t.id === veganTagId)).toBe(true);
  });

  it("actually replaces — the dropped tag disappears, the new one appears", async () => {
    const listed = await listMenuItemTagsUseCase(adminClient).execute({
      restaurantId: restaurant.id,
      menuItemId: item.id,
    });
    expect(listed).toHaveLength(2);
    expect(listed.some((t) => t.name === "Spicy")).toBe(false);
    expect(listed.some((t) => t.name === "Gluten-Free")).toBe(true);
  });

  it("clears all tags when synced with an empty list", async () => {
    await syncMenuItemTagsUseCase(adminClient).execute({ restaurantId: restaurant.id, menuItemId: item.id, tagNames: [] });
    const afterClear = await listMenuItemTagsUseCase(adminClient).execute({
      restaurantId: restaurant.id,
      menuItemId: item.id,
    });
    expect(afterClear).toHaveLength(0);
  });
});

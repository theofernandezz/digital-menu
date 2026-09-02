// Ported from scripts/verify-menu-restaurant-slice.ts (now retired).
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";
import {
  getMyRestaurantUseCase,
  updateRestaurantUseCase,
  createCategoryUseCase,
  deleteCategoryUseCase,
  createMenuItemUseCase,
  listMenuItemsUseCase,
  updateMenuItemUseCase,
  deleteMenuItemUseCase,
} from "@/composition/container";
import type { Restaurant } from "@/domain/entities/restaurant";
import type { Category } from "@/domain/entities/category";
import type { MenuItem } from "@/domain/entities/menu-item";

describe("menu_items + restaurant (integration)", () => {
  let adminClient: SupabaseClient;
  let serviceClient: SupabaseClient;
  let restaurant: Restaurant;
  let category: Category;
  let item: MenuItem;
  let otherRestaurantId: string;

  beforeAll(async () => {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminEmail || !adminPassword) throw new Error("ADMIN_EMAIL / ADMIN_PASSWORD must be set in .env.local");

    adminClient = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    serviceClient = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
    const { error } = await adminClient.auth.signInWithPassword({ email: adminEmail, password: adminPassword });
    if (error) throw error;

    restaurant = await getMyRestaurantUseCase(adminClient).execute();
    category = await createCategoryUseCase(adminClient).execute({
      restaurantId: restaurant.id,
      name: "Verification category",
      description: null,
    });
  });

  afterAll(async () => {
    if (otherRestaurantId) await serviceClient.from("restaurants").delete().eq("id", otherRestaurantId);
    if (item) await deleteMenuItemUseCase(adminClient).execute({ id: item.id, restaurantId: restaurant.id });
    if (category) await deleteCategoryUseCase(adminClient).execute({ id: category.id, restaurantId: restaurant.id });
  });

  it("returns the seeded Demo Restaurant", () => {
    expect(restaurant.slug).toBe("demo-restaurant");
  });

  it("updates the restaurant and round-trips the description", async () => {
    const updated = await updateRestaurantUseCase(adminClient).execute({
      restaurantId: restaurant.id,
      name: restaurant.name,
      slug: restaurant.slug,
      description: "Updated by the integration test",
      isPublished: restaurant.isPublished,
    });
    expect(updated.description).toBe("Updated by the integration test");

    // Restore, since this is the shared seeded restaurant.
    await updateRestaurantUseCase(adminClient).execute({
      restaurantId: restaurant.id,
      name: restaurant.name,
      slug: restaurant.slug,
      description: restaurant.description,
      isPublished: restaurant.isPublished,
    });
  });

  it("creates a menu item with price round-tripping exactly (no float drift) and defaults", async () => {
    item = await createMenuItemUseCase(adminClient).execute({
      restaurantId: restaurant.id,
      categoryId: category.id,
      name: "Test Burger",
      description: "For verification only",
      price: 12.99,
      imageUrl: null,
    });
    expect(item.price).toBe(12.99);
    expect(item.isAvailable).toBe(true);
    expect(item.displayOrder).toBe(0);
  });

  it("lists the created item", async () => {
    const listed = await listMenuItemsUseCase(adminClient).execute({ restaurantId: restaurant.id });
    expect(listed.some((i) => i.id === item.id)).toBe(true);
  });

  it("toggles isAvailable via the same update call, no separate action", async () => {
    const toggled = await updateMenuItemUseCase(adminClient).execute({
      id: item.id,
      restaurantId: restaurant.id,
      categoryId: category.id,
      name: item.name,
      description: item.description,
      price: item.price,
      imageUrl: item.imageUrl,
      isAvailable: false,
    });
    expect(toggled.isAvailable).toBe(false);
  });

  it("throws CategoryMismatchError for a menu item whose category belongs to a different restaurant", async () => {
    const { data: otherRestaurant, error: otherRestaurantError } = await serviceClient
      .from("restaurants")
      .insert({ owner_id: restaurant.ownerId, name: "Other Restaurant", slug: `other-${Date.now()}`, is_published: true })
      .select("id")
      .single();
    if (otherRestaurantError) throw otherRestaurantError;
    otherRestaurantId = otherRestaurant.id as string;

    const { data: otherCategory, error: otherCategoryError } = await serviceClient
      .from("categories")
      .insert({ restaurant_id: otherRestaurantId, name: "Other category" })
      .select("id")
      .single();
    if (otherCategoryError) throw otherCategoryError;

    await expect(
      createMenuItemUseCase(adminClient).execute({
        restaurantId: restaurant.id, // the real restaurant
        categoryId: otherCategory.id as string, // category from a DIFFERENT restaurant
        name: "Should not be created",
        description: null,
        price: 1,
        imageUrl: null,
      }),
    ).rejects.toThrow("Category does not belong to this restaurant");
  });
});

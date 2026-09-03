// Ported from scripts/verify-published-menu-slice.ts (now retired).
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";
import {
  getMyRestaurantUseCase,
  updateRestaurantUseCase,
  createCategoryUseCase,
  deleteCategoryUseCase,
  createMenuItemUseCase,
  updateMenuItemUseCase,
  deleteMenuItemUseCase,
  syncMenuItemTagsUseCase,
  getPublishedMenuUseCase,
} from "@/composition/container";
import type { Restaurant } from "@/domain/entities/restaurant";
import type { PublishedMenu } from "@/application/use-cases/get-published-menu";

describe("published menu (integration)", () => {
  let adminClient: SupabaseClient;
  let anonClient: SupabaseClient;
  let restaurant: Restaurant;
  let starters: { id: string };
  let mains: { id: string };
  let empanadas: { id: string };
  let milanesa: { id: string };
  let soldOutItem: { id: string };
  let menu: PublishedMenu | null;

  beforeAll(async () => {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminEmail || !adminPassword) throw new Error("ADMIN_EMAIL / ADMIN_PASSWORD must be set in .env.local");

    adminClient = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    anonClient = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    const { error } = await adminClient.auth.signInWithPassword({ email: adminEmail, password: adminPassword });
    if (error) throw error;

    restaurant = await getMyRestaurantUseCase(adminClient).execute();

    // Fixture: 2 categories, 3 items (1 sold out, tagged) across them.
    starters = await createCategoryUseCase(adminClient).execute({ restaurantId: restaurant.id, name: "Starters", description: "To share" });
    mains = await createCategoryUseCase(adminClient).execute({ restaurantId: restaurant.id, name: "Mains", description: null });
    empanadas = await createMenuItemUseCase(adminClient).execute({
      restaurantId: restaurant.id,
      categoryId: starters.id,
      name: "Empanadas",
      description: "Beef, x6",
      price: 8.5,
      imageUrl: null,
    });
    await syncMenuItemTagsUseCase(adminClient).execute({
      restaurantId: restaurant.id,
      menuItemId: empanadas.id,
      tagNames: ["Spicy", "Popular"],
    });
    milanesa = await createMenuItemUseCase(adminClient).execute({
      restaurantId: restaurant.id,
      categoryId: mains.id,
      name: "Milanesa",
      description: null,
      price: 14,
      imageUrl: null,
    });
    soldOutItem = await createMenuItemUseCase(adminClient).execute({
      restaurantId: restaurant.id,
      categoryId: mains.id,
      name: "Sold Out Special",
      description: null,
      price: 20,
      imageUrl: null,
    });
    await updateMenuItemUseCase(adminClient).execute({
      id: soldOutItem.id,
      restaurantId: restaurant.id,
      categoryId: mains.id,
      name: "Sold Out Special",
      description: null,
      price: 20,
      imageUrl: null,
      isAvailable: false,
    });

    menu = await getPublishedMenuUseCase(anonClient).execute();
  });

  afterAll(async () => {
    await deleteMenuItemUseCase(adminClient).execute({ id: empanadas.id, restaurantId: restaurant.id });
    await deleteMenuItemUseCase(adminClient).execute({ id: milanesa.id, restaurantId: restaurant.id });
    await deleteMenuItemUseCase(adminClient).execute({ id: soldOutItem.id, restaurantId: restaurant.id });
    await deleteCategoryUseCase(adminClient).execute({ id: starters.id, restaurantId: restaurant.id });
    await deleteCategoryUseCase(adminClient).execute({ id: mains.id, restaurantId: restaurant.id });
  });

  it("is readable by an anonymous client — no auth needed", () => {
    expect(menu).not.toBeNull();
    expect(menu?.restaurantName).toBe(restaurant.name);
  });

  it("nests items under their category, both ordered by displayOrder", () => {
    expect(menu?.categories).toHaveLength(2);
    expect(menu?.categories[0]?.name).toBe("Starters");
    expect(menu?.categories[1]?.name).toBe("Mains");
    expect(menu?.categories[0]?.items).toHaveLength(1);
    expect(menu?.categories[1]?.items).toHaveLength(2);
    expect(menu?.categories[1]?.items[0]?.name).toBe("Milanesa");
  });

  it("still shows a sold-out item — isAvailable does not gate visibility", () => {
    const soldOutInMenu = menu?.categories[1]?.items.find((i) => i.name === "Sold Out Special");
    expect(soldOutInMenu).toBeDefined();
    expect(soldOutInMenu?.isAvailable).toBe(false);
  });

  it("nests tags per item, and gives untagged items an empty array, not undefined", () => {
    const empanadasInMenu = menu?.categories[0]?.items[0];
    expect(new Set(empanadasInMenu?.tags).size).toBe(2);
    expect(empanadasInMenu?.tags).toEqual(expect.arrayContaining(["Spicy", "Popular"]));
    expect(menu?.categories[1]?.items[0]?.tags).toEqual([]);
  });

  it("returns null, not a partial menu, once the restaurant is unpublished", async () => {
    await updateRestaurantUseCase(adminClient).execute({
      restaurantId: restaurant.id,
      name: restaurant.name,
      slug: restaurant.slug,
      description: restaurant.description,
      isPublished: false,
    });

    const menuAfterUnpublish = await getPublishedMenuUseCase(anonClient).execute();
    expect(menuAfterUnpublish).toBeNull();

    await updateRestaurantUseCase(adminClient).execute({
      restaurantId: restaurant.id,
      name: restaurant.name,
      slug: restaurant.slug,
      description: restaurant.description,
      isPublished: true,
    });
  });
});

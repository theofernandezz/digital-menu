import { describe, expect, it } from "vitest";
import { Category } from "@/domain/entities/category";
import { MenuItem } from "@/domain/entities/menu-item";
import { UpdateMenuItemUseCase } from "@/application/use-cases/update-menu-item";
import { NotFoundError, UnauthorizedError, CategoryMismatchError } from "@/domain/errors/domain-errors";
import {
  FakeAuthProvider,
  FakeCategoryRepository,
  FakeMenuItemRepository,
  FAKE_RESTAURANT_ID,
} from "@/application/__tests__/fakes";

const CATEGORY_ID = "11111111-1111-4111-8111-111111111111";
const ITEM_ID = "22222222-2222-4222-8222-222222222222";
const OTHER_RESTAURANT_ID = "99999999-9999-4999-8999-999999999999";

function makeUseCase() {
  const menuItemRepo = new FakeMenuItemRepository();
  const categoryRepo = new FakeCategoryRepository();
  const auth = new FakeAuthProvider();
  categoryRepo.seed(
    Category.create({ id: CATEGORY_ID, restaurantId: FAKE_RESTAURANT_ID, name: "Starters", description: null, displayOrder: 0 }),
  );
  menuItemRepo.seed(
    MenuItem.create({
      id: ITEM_ID,
      restaurantId: FAKE_RESTAURANT_ID,
      categoryId: CATEGORY_ID,
      name: "Empanadas",
      description: null,
      price: 8.5,
      imageUrl: null,
      isAvailable: true,
      displayOrder: 0,
    }),
  );
  return { useCase: new UpdateMenuItemUseCase(menuItemRepo, categoryRepo, auth), menuItemRepo, categoryRepo, auth };
}

describe("UpdateMenuItemUseCase", () => {
  it("toggles isAvailable via the same call — no separate action needed", async () => {
    const { useCase } = makeUseCase();
    const updated = await useCase.execute({
      id: ITEM_ID,
      restaurantId: FAKE_RESTAURANT_ID,
      categoryId: CATEGORY_ID,
      name: "Empanadas",
      description: null,
      price: 8.5,
      imageUrl: null,
      isAvailable: false,
    });
    expect(updated.isAvailable).toBe(false);
  });

  it("throws NotFoundError for a menu item that doesn't exist", async () => {
    const { useCase } = makeUseCase();
    await expect(
      useCase.execute({
        id: "33333333-3333-4333-8333-333333333333",
        restaurantId: FAKE_RESTAURANT_ID,
        categoryId: CATEGORY_ID,
        name: "Ghost",
        description: null,
        price: 1,
        imageUrl: null,
        isAvailable: true,
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("throws CategoryMismatchError when reassigning to a category from another restaurant", async () => {
    const { useCase, categoryRepo, auth } = makeUseCase();
    auth.ownedRestaurantIds.add(OTHER_RESTAURANT_ID);
    categoryRepo.seed(
      Category.create({
        id: "44444444-4444-4444-8444-444444444444",
        restaurantId: OTHER_RESTAURANT_ID,
        name: "Other",
        description: null,
        displayOrder: 0,
      }),
    );

    await expect(
      useCase.execute({
        id: ITEM_ID,
        restaurantId: FAKE_RESTAURANT_ID,
        categoryId: "44444444-4444-4444-8444-444444444444",
        name: "Empanadas",
        description: null,
        price: 8.5,
        imageUrl: null,
        isAvailable: true,
      }),
    ).rejects.toThrow(CategoryMismatchError);
  });

  it("rejects updating a menu item that belongs to a different restaurant than claimed", async () => {
    const { useCase, categoryRepo, auth } = makeUseCase();
    auth.ownedRestaurantIds.add(OTHER_RESTAURANT_ID);
    categoryRepo.seed(
      Category.create({
        id: "55555555-5555-4555-8555-555555555555",
        restaurantId: OTHER_RESTAURANT_ID,
        name: "Other",
        description: null,
        displayOrder: 0,
      }),
    );

    await expect(
      useCase.execute({
        id: ITEM_ID, // actually belongs to FAKE_RESTAURANT_ID
        restaurantId: OTHER_RESTAURANT_ID,
        categoryId: "55555555-5555-4555-8555-555555555555",
        name: "Hijacked",
        description: null,
        price: 1,
        imageUrl: null,
        isAvailable: true,
      }),
    ).rejects.toThrow(UnauthorizedError);
  });
});

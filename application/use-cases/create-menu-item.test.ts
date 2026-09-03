import { describe, expect, it } from "vitest";
import { ZodError } from "zod";
import { Category } from "@/domain/entities/category";
import { CreateMenuItemUseCase } from "@/application/use-cases/create-menu-item";
import { NotFoundError, CategoryMismatchError } from "@/domain/errors/domain-errors";
import {
  FakeAuthProvider,
  FakeCategoryRepository,
  FakeMenuItemRepository,
  FAKE_RESTAURANT_ID,
} from "@/application/__tests__/fakes";

const CATEGORY_ID = "11111111-1111-4111-8111-111111111111";
const OTHER_RESTAURANT_ID = "99999999-9999-4999-8999-999999999999";

function makeUseCase() {
  const menuItemRepo = new FakeMenuItemRepository();
  const categoryRepo = new FakeCategoryRepository();
  const auth = new FakeAuthProvider();
  categoryRepo.seed(
    Category.create({ id: CATEGORY_ID, restaurantId: FAKE_RESTAURANT_ID, name: "Starters", description: null, displayOrder: 0 }),
  );
  return { useCase: new CreateMenuItemUseCase(menuItemRepo, categoryRepo, auth), menuItemRepo, categoryRepo, auth };
}

describe("CreateMenuItemUseCase", () => {
  it("creates a menu item, available by default", async () => {
    const { useCase } = makeUseCase();
    const item = await useCase.execute({
      restaurantId: FAKE_RESTAURANT_ID,
      categoryId: CATEGORY_ID,
      name: "Empanadas",
      description: null,
      price: 8.5,
      imageUrl: null,
    });

    expect(item.isAvailable).toBe(true);
    expect(item.price).toBe(8.5);
  });

  it("rejects a price with more than 2 decimal places", async () => {
    const { useCase } = makeUseCase();
    await expect(
      useCase.execute({
        restaurantId: FAKE_RESTAURANT_ID,
        categoryId: CATEGORY_ID,
        name: "Empanadas",
        description: null,
        price: 8.999,
        imageUrl: null,
      }),
    ).rejects.toThrow(ZodError);
  });

  it("accepts a price like 19.99 despite IEEE 754 float drift (19.99 * 100 !== 1999 exactly)", async () => {
    const { useCase } = makeUseCase();
    const item = await useCase.execute({
      restaurantId: FAKE_RESTAURANT_ID,
      categoryId: CATEGORY_ID,
      name: "Steak",
      description: null,
      price: 19.99,
      imageUrl: null,
    });
    expect(item.price).toBe(19.99);
  });

  it("throws NotFoundError when the category doesn't exist", async () => {
    const { useCase } = makeUseCase();
    await expect(
      useCase.execute({
        restaurantId: FAKE_RESTAURANT_ID,
        categoryId: "22222222-2222-4222-8222-222222222222",
        name: "Empanadas",
        description: null,
        price: 1,
        imageUrl: null,
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("throws CategoryMismatchError when the category belongs to a different restaurant", async () => {
    const { useCase, categoryRepo, auth } = makeUseCase();
    auth.ownedRestaurantIds.add(OTHER_RESTAURANT_ID);
    categoryRepo.seed(
      Category.create({
        id: "33333333-3333-4333-8333-333333333333",
        restaurantId: OTHER_RESTAURANT_ID,
        name: "Other restaurant's category",
        description: null,
        displayOrder: 0,
      }),
    );

    await expect(
      useCase.execute({
        restaurantId: FAKE_RESTAURANT_ID, // the real restaurant
        categoryId: "33333333-3333-4333-8333-333333333333", // category from a DIFFERENT one
        name: "Should not be created",
        description: null,
        price: 1,
        imageUrl: null,
      }),
    ).rejects.toThrow(CategoryMismatchError);
  });
});

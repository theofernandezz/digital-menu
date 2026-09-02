import { describe, expect, it } from "vitest";
import { Category } from "@/domain/entities/category";
import { MenuItem } from "@/domain/entities/menu-item";
import { Restaurant } from "@/domain/entities/restaurant";
import { GetPublishedMenuUseCase } from "@/application/use-cases/get-published-menu";
import {
  FakeCategoryRepository,
  FakeMenuItemRepository,
  FakeRestaurantRepository,
  FakeTagRepository,
  FAKE_RESTAURANT_ID,
  FAKE_USER_ID,
} from "@/application/__tests__/fakes";

function makeUseCase() {
  const restaurantRepo = new FakeRestaurantRepository();
  const categoryRepo = new FakeCategoryRepository();
  const menuItemRepo = new FakeMenuItemRepository();
  const tagRepo = new FakeTagRepository();
  return {
    useCase: new GetPublishedMenuUseCase(restaurantRepo, categoryRepo, menuItemRepo, tagRepo),
    restaurantRepo,
    categoryRepo,
    menuItemRepo,
    tagRepo,
  };
}

describe("GetPublishedMenuUseCase", () => {
  it("returns null when there's no published restaurant", async () => {
    const { useCase } = makeUseCase();
    expect(await useCase.execute()).toBeNull();
  });

  it("nests items under their category and tags under their item, ordered by displayOrder", async () => {
    const { useCase, restaurantRepo, categoryRepo, menuItemRepo, tagRepo } = makeUseCase();
    restaurantRepo.seed(
      Restaurant.create({
        id: FAKE_RESTAURANT_ID,
        ownerId: FAKE_USER_ID,
        name: "Demo Restaurant",
        slug: "demo-restaurant",
        description: null,
        isPublished: true,
      }),
    );
    categoryRepo.seed(
      Category.create({ id: "cat-1", restaurantId: FAKE_RESTAURANT_ID, name: "Starters", description: null, displayOrder: 0 }),
    );
    menuItemRepo.seed(
      MenuItem.create({
        id: "item-1",
        restaurantId: FAKE_RESTAURANT_ID,
        categoryId: "cat-1",
        name: "Empanadas",
        description: null,
        price: 8.5,
        imageUrl: null,
        isAvailable: false, // sold out
        displayOrder: 0,
      }),
    );
    const [spicy] = await tagRepo.findOrCreateByNames(FAKE_RESTAURANT_ID, ["Spicy"]);
    await tagRepo.replaceMenuItemTags("item-1", [spicy!.id]);

    const menu = await useCase.execute();

    expect(menu?.restaurantName).toBe("Demo Restaurant");
    expect(menu?.categories).toHaveLength(1);
    expect(menu?.categories[0]?.items).toHaveLength(1);
    const item = menu?.categories[0]?.items[0];
    expect(item?.isAvailable).toBe(false); // still shows, just flagged
    expect(item?.tags).toEqual(["Spicy"]);
  });

  it("gives every menu item an empty tags array, never undefined, when it has no tags", async () => {
    const { useCase, restaurantRepo, categoryRepo, menuItemRepo } = makeUseCase();
    restaurantRepo.seed(
      Restaurant.create({
        id: FAKE_RESTAURANT_ID,
        ownerId: FAKE_USER_ID,
        name: "Demo Restaurant",
        slug: "demo-restaurant",
        description: null,
        isPublished: true,
      }),
    );
    categoryRepo.seed(
      Category.create({ id: "cat-1", restaurantId: FAKE_RESTAURANT_ID, name: "Mains", description: null, displayOrder: 0 }),
    );
    menuItemRepo.seed(
      MenuItem.create({
        id: "item-1",
        restaurantId: FAKE_RESTAURANT_ID,
        categoryId: "cat-1",
        name: "Milanesa",
        description: null,
        price: 14,
        imageUrl: null,
        isAvailable: true,
        displayOrder: 0,
      }),
    );

    const menu = await useCase.execute();

    expect(menu?.categories[0]?.items[0]?.tags).toEqual([]);
  });
});

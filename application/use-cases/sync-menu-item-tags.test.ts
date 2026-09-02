import { describe, expect, it } from "vitest";
import { MenuItem } from "@/domain/entities/menu-item";
import { SyncMenuItemTagsUseCase } from "@/application/use-cases/sync-menu-item-tags";
import { NotFoundError, UnauthorizedError } from "@/domain/errors/domain-errors";
import {
  FakeAuthProvider,
  FakeMenuItemRepository,
  FakeTagRepository,
  FAKE_RESTAURANT_ID,
} from "@/application/__tests__/fakes";

const ITEM_ID = "11111111-1111-4111-8111-111111111111";

function makeUseCase() {
  const tagRepo = new FakeTagRepository();
  const menuItemRepo = new FakeMenuItemRepository();
  const auth = new FakeAuthProvider();
  menuItemRepo.seed(
    MenuItem.create({
      id: ITEM_ID,
      restaurantId: FAKE_RESTAURANT_ID,
      categoryId: "cat-1",
      name: "Empanadas",
      description: null,
      price: 8.5,
      imageUrl: null,
      isAvailable: true,
      displayOrder: 0,
    }),
  );
  return { useCase: new SyncMenuItemTagsUseCase(tagRepo, menuItemRepo, auth), tagRepo, menuItemRepo, auth };
}

describe("SyncMenuItemTagsUseCase", () => {
  it("creates and attaches new tags", async () => {
    const { useCase } = makeUseCase();
    const tags = await useCase.execute({
      restaurantId: FAKE_RESTAURANT_ID,
      menuItemId: ITEM_ID,
      tagNames: ["Spicy", "Popular"],
    });
    expect(tags.map((t) => t.name).sort()).toEqual(["Popular", "Spicy"]);
  });

  it("passes tag names straight through without its own dedup — that's the repository's job", async () => {
    const { useCase, tagRepo } = makeUseCase();
    let received: string[] = [];
    const originalFindOrCreate = tagRepo.findOrCreateByNames.bind(tagRepo);
    tagRepo.findOrCreateByNames = async (restaurantId, names) => {
      received = names;
      return originalFindOrCreate(restaurantId, names);
    };

    await useCase.execute({ restaurantId: FAKE_RESTAURANT_ID, menuItemId: ITEM_ID, tagNames: ["Vegan", "vegan"] });

    expect(received).toEqual(["Vegan", "vegan"]);
  });

  it("throws NotFoundError for a menu item that doesn't exist", async () => {
    const { useCase } = makeUseCase();
    await expect(
      useCase.execute({
        restaurantId: FAKE_RESTAURANT_ID,
        menuItemId: "22222222-2222-4222-8222-222222222222",
        tagNames: ["Spicy"],
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("rejects syncing tags on a menu item that belongs to a different restaurant than claimed", async () => {
    const { useCase, auth } = makeUseCase();
    const otherRestaurantId = "99999999-9999-4999-8999-999999999999";
    auth.ownedRestaurantIds.add(otherRestaurantId);

    await expect(
      useCase.execute({ restaurantId: otherRestaurantId, menuItemId: ITEM_ID, tagNames: ["Spicy"] }),
    ).rejects.toThrow(UnauthorizedError);
  });
});

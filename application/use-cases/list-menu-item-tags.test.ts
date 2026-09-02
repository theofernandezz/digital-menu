import { describe, expect, it } from "vitest";
import { MenuItem } from "@/domain/entities/menu-item";
import { ListMenuItemTagsUseCase } from "@/application/use-cases/list-menu-item-tags";
import { SyncMenuItemTagsUseCase } from "@/application/use-cases/sync-menu-item-tags";
import { NotFoundError, UnauthorizedError } from "@/domain/errors/domain-errors";
import {
  FakeAuthProvider,
  FakeMenuItemRepository,
  FakeTagRepository,
  FAKE_RESTAURANT_ID,
} from "@/application/__tests__/fakes";

const ITEM_ID = "11111111-1111-4111-8111-111111111111";

function makeUseCases() {
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
  return {
    listUseCase: new ListMenuItemTagsUseCase(tagRepo, menuItemRepo, auth),
    syncUseCase: new SyncMenuItemTagsUseCase(tagRepo, menuItemRepo, auth),
    auth,
  };
}

describe("ListMenuItemTagsUseCase", () => {
  it("returns the tags currently attached to a menu item (pre-populates the edit form)", async () => {
    const { listUseCase, syncUseCase } = makeUseCases();
    await syncUseCase.execute({ restaurantId: FAKE_RESTAURANT_ID, menuItemId: ITEM_ID, tagNames: ["Spicy"] });

    const tags = await listUseCase.execute({ restaurantId: FAKE_RESTAURANT_ID, menuItemId: ITEM_ID });

    expect(tags.map((t) => t.name)).toEqual(["Spicy"]);
  });

  it("returns an empty array for a menu item with no tags", async () => {
    const { listUseCase } = makeUseCases();
    const tags = await listUseCase.execute({ restaurantId: FAKE_RESTAURANT_ID, menuItemId: ITEM_ID });
    expect(tags).toEqual([]);
  });

  it("throws NotFoundError for a menu item that doesn't exist", async () => {
    const { listUseCase } = makeUseCases();
    await expect(
      listUseCase.execute({ restaurantId: FAKE_RESTAURANT_ID, menuItemId: "22222222-2222-4222-8222-222222222222" }),
    ).rejects.toThrow(NotFoundError);
  });

  it("rejects listing tags for a menu item that belongs to a different restaurant than claimed", async () => {
    const { listUseCase, auth } = makeUseCases();
    const otherRestaurantId = "99999999-9999-4999-8999-999999999999";
    auth.ownedRestaurantIds.add(otherRestaurantId);

    await expect(listUseCase.execute({ restaurantId: otherRestaurantId, menuItemId: ITEM_ID })).rejects.toThrow(
      UnauthorizedError,
    );
  });
});

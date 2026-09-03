import { describe, expect, it } from "vitest";
import { MenuItem } from "@/domain/entities/menu-item";
import { DeleteMenuItemUseCase } from "@/application/use-cases/delete-menu-item";
import { NotFoundError, UnauthorizedError } from "@/domain/errors/domain-errors";
import { FakeAuthProvider, FakeMenuItemRepository, FAKE_RESTAURANT_ID } from "@/application/__tests__/fakes";

const ITEM_ID = "11111111-1111-4111-8111-111111111111";

function seedItem(repo: FakeMenuItemRepository, restaurantId = FAKE_RESTAURANT_ID) {
  repo.seed(
    MenuItem.create({
      id: ITEM_ID,
      restaurantId,
      categoryId: "cat-1",
      name: "Empanadas",
      description: null,
      price: 8.5,
      imageUrl: null,
      isAvailable: true,
      displayOrder: 0,
    }),
  );
}

describe("DeleteMenuItemUseCase", () => {
  it("deletes an owned menu item", async () => {
    const repo = new FakeMenuItemRepository();
    seedItem(repo);
    const useCase = new DeleteMenuItemUseCase(repo, new FakeAuthProvider());

    await useCase.execute({ id: ITEM_ID, restaurantId: FAKE_RESTAURANT_ID });

    expect(await repo.findById(ITEM_ID)).toBeNull();
  });

  it("throws NotFoundError for a menu item that doesn't exist", async () => {
    const useCase = new DeleteMenuItemUseCase(new FakeMenuItemRepository(), new FakeAuthProvider());
    await expect(
      useCase.execute({ id: "22222222-2222-4222-8222-222222222222", restaurantId: FAKE_RESTAURANT_ID }),
    ).rejects.toThrow(NotFoundError);
  });

  it("rejects deleting a menu item that belongs to a different restaurant than claimed", async () => {
    const repo = new FakeMenuItemRepository();
    const auth = new FakeAuthProvider();
    const otherRestaurantId = "99999999-9999-4999-8999-999999999999";
    auth.ownedRestaurantIds.add(otherRestaurantId);
    seedItem(repo, FAKE_RESTAURANT_ID);
    const useCase = new DeleteMenuItemUseCase(repo, auth);

    await expect(useCase.execute({ id: ITEM_ID, restaurantId: otherRestaurantId })).rejects.toThrow(UnauthorizedError);
  });
});

import { describe, expect, it } from "vitest";
import { MenuItem } from "@/domain/entities/menu-item";
import { ListMenuItemsUseCase } from "@/application/use-cases/list-menu-items";
import { UnauthorizedError } from "@/domain/errors/domain-errors";
import {
  FakeAuthProvider,
  FakeMenuItemRepository,
  FAKE_RESTAURANT_ID,
} from "@/application/__tests__/fakes";

describe("ListMenuItemsUseCase", () => {
  it("returns items ordered by displayOrder", async () => {
    const repo = new FakeMenuItemRepository();
    repo.seed(
      MenuItem.create({
        id: "a",
        restaurantId: FAKE_RESTAURANT_ID,
        categoryId: "cat-1",
        name: "Milanesa",
        description: null,
        price: 14,
        imageUrl: null,
        isAvailable: true,
        displayOrder: 1,
      }),
    );
    repo.seed(
      MenuItem.create({
        id: "b",
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
    const useCase = new ListMenuItemsUseCase(repo, new FakeAuthProvider());

    const result = await useCase.execute({ restaurantId: FAKE_RESTAURANT_ID });

    expect(result.map((i) => i.name)).toEqual(["Empanadas", "Milanesa"]);
  });

  it("rejects listing another restaurant's menu items", async () => {
    const useCase = new ListMenuItemsUseCase(new FakeMenuItemRepository(), new FakeAuthProvider());
    await expect(useCase.execute({ restaurantId: "99999999-9999-4999-8999-999999999999" })).rejects.toThrow(
      UnauthorizedError,
    );
  });
});

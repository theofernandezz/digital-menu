import { describe, expect, it } from "vitest";
import { Category } from "@/domain/entities/category";
import { DeleteCategoryUseCase } from "@/application/use-cases/delete-category";
import { NotFoundError, UnauthorizedError } from "@/domain/errors/domain-errors";
import {
  FakeAuthProvider,
  FakeCategoryRepository,
  FAKE_RESTAURANT_ID,
} from "@/application/__tests__/fakes";

describe("DeleteCategoryUseCase", () => {
  it("deletes an owned category", async () => {
    const repo = new FakeCategoryRepository();
    repo.seed(
      Category.create({
        id: "11111111-1111-4111-8111-111111111111",
        restaurantId: FAKE_RESTAURANT_ID,
        name: "Starters",
        description: null,
        displayOrder: 0,
      }),
    );
    const useCase = new DeleteCategoryUseCase(repo, new FakeAuthProvider());

    await useCase.execute({ id: "11111111-1111-4111-8111-111111111111", restaurantId: FAKE_RESTAURANT_ID });

    expect(await repo.findById("11111111-1111-4111-8111-111111111111")).toBeNull();
  });

  it("throws NotFoundError deleting a category that doesn't exist", async () => {
    const useCase = new DeleteCategoryUseCase(new FakeCategoryRepository(), new FakeAuthProvider());
    await expect(
      useCase.execute({ id: "22222222-2222-4222-8222-222222222222", restaurantId: FAKE_RESTAURANT_ID }),
    ).rejects.toThrow(NotFoundError);
  });

  it("rejects deleting a category that belongs to a different restaurant than claimed", async () => {
    const repo = new FakeCategoryRepository();
    const auth = new FakeAuthProvider();
    const otherRestaurantId = "99999999-9999-4999-8999-999999999999";
    auth.ownedRestaurantIds.add(otherRestaurantId);
    repo.seed(
      Category.create({
        id: "11111111-1111-4111-8111-111111111111",
        restaurantId: FAKE_RESTAURANT_ID,
        name: "Starters",
        description: null,
        displayOrder: 0,
      }),
    );
    const useCase = new DeleteCategoryUseCase(repo, auth);

    await expect(
      useCase.execute({ id: "11111111-1111-4111-8111-111111111111", restaurantId: otherRestaurantId }),
    ).rejects.toThrow(UnauthorizedError);
  });
});

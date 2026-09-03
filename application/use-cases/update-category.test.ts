import { describe, expect, it } from "vitest";
import { Category } from "@/domain/entities/category";
import { UpdateCategoryUseCase } from "@/application/use-cases/update-category";
import { NotFoundError, UnauthorizedError } from "@/domain/errors/domain-errors";
import {
  FakeAuthProvider,
  FakeCategoryRepository,
  FAKE_RESTAURANT_ID,
} from "@/application/__tests__/fakes";

const OTHER_RESTAURANT_ID = "99999999-9999-4999-8999-999999999999";

function seedCategory(repo: FakeCategoryRepository, restaurantId = FAKE_RESTAURANT_ID) {
  const category = Category.create({
    id: "11111111-1111-4111-8111-111111111111",
    restaurantId,
    name: "Starters",
    description: null,
    displayOrder: 0,
  });
  repo.seed(category);
  return category;
}

describe("UpdateCategoryUseCase", () => {
  it("updates name/description, preserving id and displayOrder", async () => {
    const repo = new FakeCategoryRepository();
    const auth = new FakeAuthProvider();
    seedCategory(repo);
    const useCase = new UpdateCategoryUseCase(repo, auth);

    const updated = await useCase.execute({
      id: "11111111-1111-4111-8111-111111111111",
      restaurantId: FAKE_RESTAURANT_ID,
      name: "Small Plates",
      description: "Updated",
    });

    expect(updated.name).toBe("Small Plates");
    expect(updated.displayOrder).toBe(0);
  });

  it("throws NotFoundError for a category that doesn't exist", async () => {
    const repo = new FakeCategoryRepository();
    const useCase = new UpdateCategoryUseCase(repo, new FakeAuthProvider());

    await expect(
      useCase.execute({
        id: "22222222-2222-4222-8222-222222222222",
        restaurantId: FAKE_RESTAURANT_ID,
        name: "Ghost",
        description: null,
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("rejects reassigning a category to a restaurant it doesn't belong to", async () => {
    const repo = new FakeCategoryRepository();
    const auth = new FakeAuthProvider();
    auth.ownedRestaurantIds.add(OTHER_RESTAURANT_ID);
    seedCategory(repo, FAKE_RESTAURANT_ID); // category actually belongs to FAKE_RESTAURANT_ID
    const useCase = new UpdateCategoryUseCase(repo, auth);

    // Caller claims it belongs to a DIFFERENT restaurant they also own —
    // existing.restaurantId !== input.restaurantId must still be rejected.
    await expect(
      useCase.execute({
        id: "11111111-1111-4111-8111-111111111111",
        restaurantId: OTHER_RESTAURANT_ID,
        name: "Hijacked",
        description: null,
      }),
    ).rejects.toThrow(UnauthorizedError);
  });
});

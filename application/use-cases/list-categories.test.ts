import { describe, expect, it } from "vitest";
import { Category } from "@/domain/entities/category";
import { ListCategoriesUseCase } from "@/application/use-cases/list-categories";
import { UnauthorizedError } from "@/domain/errors/domain-errors";
import {
  FakeAuthProvider,
  FakeCategoryRepository,
  FAKE_RESTAURANT_ID,
} from "@/application/__tests__/fakes";

describe("ListCategoriesUseCase", () => {
  it("returns categories ordered by displayOrder", async () => {
    const repo = new FakeCategoryRepository();
    repo.seed(
      Category.create({ id: "a", restaurantId: FAKE_RESTAURANT_ID, name: "Mains", description: null, displayOrder: 1 }),
    );
    repo.seed(
      Category.create({
        id: "b",
        restaurantId: FAKE_RESTAURANT_ID,
        name: "Starters",
        description: null,
        displayOrder: 0,
      }),
    );
    const useCase = new ListCategoriesUseCase(repo, new FakeAuthProvider());

    const result = await useCase.execute({ restaurantId: FAKE_RESTAURANT_ID });

    expect(result.map((c) => c.name)).toEqual(["Starters", "Mains"]);
  });

  it("rejects listing another restaurant's categories", async () => {
    const useCase = new ListCategoriesUseCase(new FakeCategoryRepository(), new FakeAuthProvider());
    await expect(useCase.execute({ restaurantId: "99999999-9999-4999-8999-999999999999" })).rejects.toThrow(
      UnauthorizedError,
    );
  });
});

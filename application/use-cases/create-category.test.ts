import { describe, expect, it } from "vitest";
import { ZodError } from "zod";
import { CreateCategoryUseCase } from "@/application/use-cases/create-category";
import { UnauthorizedError } from "@/domain/errors/domain-errors";
import {
  FakeAuthProvider,
  FakeCategoryRepository,
  FAKE_RESTAURANT_ID,
} from "@/application/__tests__/fakes";

function makeUseCase() {
  const repo = new FakeCategoryRepository();
  const auth = new FakeAuthProvider();
  return { useCase: new CreateCategoryUseCase(repo, auth), repo, auth };
}

describe("CreateCategoryUseCase", () => {
  it("creates a category with displayOrder 0 when the restaurant has none yet", async () => {
    const { useCase } = makeUseCase();
    const category = await useCase.execute({ restaurantId: FAKE_RESTAURANT_ID, name: "Starters" });
    expect(category.name).toBe("Starters");
    expect(category.displayOrder).toBe(0);
  });

  it("computes displayOrder as max + 1, not the schema default of 0", async () => {
    const { useCase } = makeUseCase();
    await useCase.execute({ restaurantId: FAKE_RESTAURANT_ID, name: "Starters" });
    const second = await useCase.execute({ restaurantId: FAKE_RESTAURANT_ID, name: "Mains" });
    expect(second.displayOrder).toBe(1);
  });

  it("checks auth before validating input (auth-first ordering)", async () => {
    const { useCase, auth } = makeUseCase();
    auth.currentUserId = null;
    await expect(useCase.execute({ restaurantId: "not-a-uuid", name: "" })).rejects.toThrow(UnauthorizedError);
  });

  it("rejects input that fails Zod validation", async () => {
    const { useCase } = makeUseCase();
    await expect(useCase.execute({ restaurantId: FAKE_RESTAURANT_ID, name: "" })).rejects.toThrow(ZodError);
  });

  it("rejects creating a category in a restaurant the user doesn't own", async () => {
    const { useCase } = makeUseCase();
    const otherRestaurantId = "99999999-9999-4999-8999-999999999999";
    await expect(useCase.execute({ restaurantId: otherRestaurantId, name: "Starters" })).rejects.toThrow(
      UnauthorizedError,
    );
  });
});

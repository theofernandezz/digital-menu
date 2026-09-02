import { describe, expect, it } from "vitest";
import { ZodError } from "zod";
import { UpdateRestaurantUseCase } from "@/application/use-cases/update-restaurant";
import { UnauthorizedError } from "@/domain/errors/domain-errors";
import { FakeAuthProvider, FakeRestaurantRepository, FAKE_RESTAURANT_ID } from "@/application/__tests__/fakes";

describe("UpdateRestaurantUseCase", () => {
  it("updates and returns the restaurant", async () => {
    const useCase = new UpdateRestaurantUseCase(new FakeRestaurantRepository(), new FakeAuthProvider());

    const updated = await useCase.execute({
      restaurantId: FAKE_RESTAURANT_ID,
      name: "Demo Restaurant",
      slug: "demo-restaurant",
      description: "Now with a description",
      isPublished: false,
    });

    expect(updated.description).toBe("Now with a description");
    expect(updated.isPublished).toBe(false);
  });

  it("rejects an invalid slug", async () => {
    const useCase = new UpdateRestaurantUseCase(new FakeRestaurantRepository(), new FakeAuthProvider());
    await expect(
      useCase.execute({
        restaurantId: FAKE_RESTAURANT_ID,
        name: "Demo Restaurant",
        slug: "Not A Valid Slug",
        description: null,
        isPublished: true,
      }),
    ).rejects.toThrow(ZodError);
  });

  it("rejects updating a restaurant the user doesn't own", async () => {
    const useCase = new UpdateRestaurantUseCase(new FakeRestaurantRepository(), new FakeAuthProvider());
    await expect(
      useCase.execute({
        restaurantId: "99999999-9999-4999-8999-999999999999",
        name: "Demo Restaurant",
        slug: "demo-restaurant",
        description: null,
        isPublished: true,
      }),
    ).rejects.toThrow(UnauthorizedError);
  });
});

import { describe, expect, it } from "vitest";
import { Restaurant } from "@/domain/entities/restaurant";
import { GetMyRestaurantUseCase } from "@/application/use-cases/get-my-restaurant";
import { NotFoundError } from "@/domain/errors/domain-errors";
import {
  FakeAuthProvider,
  FakeRestaurantRepository,
  FAKE_USER_ID,
  FAKE_RESTAURANT_ID,
} from "@/application/__tests__/fakes";

describe("GetMyRestaurantUseCase", () => {
  it("returns the restaurant owned by the current user", async () => {
    const repo = new FakeRestaurantRepository();
    repo.seed(
      Restaurant.create({
        id: FAKE_RESTAURANT_ID,
        ownerId: FAKE_USER_ID,
        name: "Demo Restaurant",
        slug: "demo-restaurant",
        description: null,
        isPublished: true,
        instagram: null,
        whatsapp: null,
      }),
    );
    const useCase = new GetMyRestaurantUseCase(repo, new FakeAuthProvider());

    const restaurant = await useCase.execute();

    expect(restaurant.slug).toBe("demo-restaurant");
  });

  it("throws NotFoundError if the current user owns no restaurant", async () => {
    const useCase = new GetMyRestaurantUseCase(new FakeRestaurantRepository(), new FakeAuthProvider());
    await expect(useCase.execute()).rejects.toThrow(NotFoundError);
  });
});

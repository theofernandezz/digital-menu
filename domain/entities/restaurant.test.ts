import { describe, expect, it } from "vitest";
import { Restaurant } from "@/domain/entities/restaurant";
import { InvalidRestaurantNameError, InvalidSlugError } from "@/domain/errors/domain-errors";

const validProps = {
  id: "11111111-1111-1111-1111-111111111111",
  ownerId: "22222222-2222-2222-2222-222222222222",
  name: "Demo Restaurant",
  slug: "demo-restaurant",
  description: null,
  isPublished: true,
};

describe("Restaurant", () => {
  it("creates a valid restaurant", () => {
    const restaurant = Restaurant.create(validProps);
    expect(restaurant.name).toBe("Demo Restaurant");
    expect(restaurant.slug).toBe("demo-restaurant");
  });

  it("rejects an empty name", () => {
    expect(() => Restaurant.create({ ...validProps, name: "" })).toThrow(InvalidRestaurantNameError);
  });

  it.each(["Demo Restaurant", "demo_restaurant", "-demo-restaurant", "demo-restaurant-", "DEMO"])(
    "rejects an invalid slug: %s",
    (slug) => {
      expect(() => Restaurant.create({ ...validProps, slug })).toThrow(InvalidSlugError);
    },
  );

  it.each(["demo-restaurant", "a", "restaurant-2"])("accepts a valid slug: %s", (slug) => {
    expect(() => Restaurant.create({ ...validProps, slug })).not.toThrow();
  });

  it("withUpdate can toggle isPublished", () => {
    const restaurant = Restaurant.create(validProps);
    const unpublished = restaurant.withUpdate({ isPublished: false });
    expect(unpublished.isPublished).toBe(false);
  });
});

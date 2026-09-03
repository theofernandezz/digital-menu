import { describe, expect, it } from "vitest";
import { Tag } from "@/domain/entities/tag";
import { InvalidTagNameError } from "@/domain/errors/domain-errors";

describe("Tag", () => {
  it("creates a valid tag", () => {
    const tag = Tag.create({
      id: "11111111-1111-1111-1111-111111111111",
      restaurantId: "22222222-2222-2222-2222-222222222222",
      name: "Vegan",
    });
    expect(tag.name).toBe("Vegan");
  });

  it("rejects an empty name", () => {
    expect(() =>
      Tag.create({
        id: "11111111-1111-1111-1111-111111111111",
        restaurantId: "22222222-2222-2222-2222-222222222222",
        name: "   ",
      }),
    ).toThrow(InvalidTagNameError);
  });
});

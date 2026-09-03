import { describe, expect, it } from "vitest";
import { Category } from "@/domain/entities/category";
import { InvalidCategoryNameError, InvalidDisplayOrderError } from "@/domain/errors/domain-errors";

const validProps = {
  id: "11111111-1111-1111-1111-111111111111",
  restaurantId: "22222222-2222-2222-2222-222222222222",
  name: "Starters",
  description: "To share",
  displayOrder: 0,
};

describe("Category", () => {
  it("creates a valid category", () => {
    const category = Category.create(validProps);
    expect(category.name).toBe("Starters");
    expect(category.description).toBe("To share");
    expect(category.displayOrder).toBe(0);
  });

  it("rejects an empty name", () => {
    expect(() => Category.create({ ...validProps, name: "" })).toThrow(InvalidCategoryNameError);
  });

  it("rejects a whitespace-only name", () => {
    expect(() => Category.create({ ...validProps, name: "   " })).toThrow(InvalidCategoryNameError);
  });

  it("rejects a negative displayOrder", () => {
    expect(() => Category.create({ ...validProps, displayOrder: -1 })).toThrow(InvalidDisplayOrderError);
  });

  it("withUpdate returns a new validated instance with the patch applied", () => {
    const category = Category.create(validProps);
    const updated = category.withUpdate({ name: "Small Plates" });

    expect(updated.name).toBe("Small Plates");
    expect(updated.id).toBe(category.id);
    expect(category.name).toBe("Starters"); // original is untouched
  });

  it("withUpdate still enforces invariants", () => {
    const category = Category.create(validProps);
    expect(() => category.withUpdate({ name: "" })).toThrow(InvalidCategoryNameError);
  });
});

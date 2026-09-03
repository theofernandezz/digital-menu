import { describe, expect, it } from "vitest";
import { MenuItem } from "@/domain/entities/menu-item";
import {
  InvalidMenuItemNameError,
  InvalidPriceError,
  InvalidDisplayOrderError,
} from "@/domain/errors/domain-errors";

const validProps = {
  id: "11111111-1111-1111-1111-111111111111",
  restaurantId: "22222222-2222-2222-2222-222222222222",
  categoryId: "33333333-3333-3333-3333-333333333333",
  name: "Empanadas",
  description: "Beef, x6",
  price: 8.5,
  imageUrl: null,
  isAvailable: true,
  displayOrder: 0,
};

describe("MenuItem", () => {
  it("creates a valid menu item", () => {
    const item = MenuItem.create(validProps);
    expect(item.name).toBe("Empanadas");
    expect(item.price).toBe(8.5);
    expect(item.isAvailable).toBe(true);
  });

  it("rejects an empty name", () => {
    expect(() => MenuItem.create({ ...validProps, name: "" })).toThrow(InvalidMenuItemNameError);
  });

  it("rejects a negative price", () => {
    expect(() => MenuItem.create({ ...validProps, price: -1 })).toThrow(InvalidPriceError);
  });

  it("accepts a price of exactly 0 (e.g. a free sample item)", () => {
    expect(() => MenuItem.create({ ...validProps, price: 0 })).not.toThrow();
  });

  it("rejects a negative displayOrder", () => {
    expect(() => MenuItem.create({ ...validProps, displayOrder: -1 })).toThrow(InvalidDisplayOrderError);
  });

  it("withUpdate can toggle isAvailable without touching other fields", () => {
    const item = MenuItem.create(validProps);
    const soldOut = item.withUpdate({ isAvailable: false });

    expect(soldOut.isAvailable).toBe(false);
    expect(soldOut.name).toBe(item.name);
    expect(soldOut.price).toBe(item.price);
  });

  it("withUpdate can move the item to a different category", () => {
    const item = MenuItem.create(validProps);
    const moved = item.withUpdate({ categoryId: "44444444-4444-4444-4444-444444444444" });
    expect(moved.categoryId).toBe("44444444-4444-4444-4444-444444444444");
  });
});

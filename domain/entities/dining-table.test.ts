import { describe, expect, it } from "vitest";
import { DiningTable } from "@/domain/entities/dining-table";
import { InvalidTableNumberError } from "@/domain/errors/table-errors";

const validProps = {
  id: "11111111-1111-4111-8111-111111111111",
  restaurantId: "22222222-2222-4222-8222-222222222222",
  tableNumber: 12,
  qrToken: "abc123",
  isOpen: false,
};

describe("DiningTable", () => {
  it("creates a valid table", () => {
    const table = DiningTable.create(validProps);
    expect(table.id).toBe(validProps.id);
    expect(table.restaurantId).toBe(validProps.restaurantId);
    expect(table.tableNumber).toBe(12);
    expect(table.qrToken).toBe("abc123");
    expect(table.isOpen).toBe(false);
  });

  it.each([1, 999])("accepts the boundary number %i", (tableNumber) => {
    expect(DiningTable.create({ ...validProps, tableNumber }).tableNumber).toBe(tableNumber);
  });

  it.each([0, 1000, 1.5, -1, Number.NaN])("rejects the number %s", (tableNumber) => {
    expect(() => DiningTable.create({ ...validProps, tableNumber })).toThrow(InvalidTableNumberError);
  });
});

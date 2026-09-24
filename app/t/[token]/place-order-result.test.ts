import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { toPlaceOrderError } from "@/app/t/[token]/place-order-result";
import { placeOrderSchema } from "@/application/schemas/order";
import {
  InvalidItemsError,
  InvalidTableError,
  ItemsUnavailableError,
  TableClosedError,
  TooManyOpenOrdersError,
} from "@/domain/errors/order-errors";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("toPlaceOrderError", () => {
  it.each([
    ["invalid_table", new InvalidTableError()],
    ["table_closed", new TableClosedError()],
    ["too_many_open_orders", new TooManyOpenOrdersError()],
    ["invalid_items", new InvalidItemsError()],
  ])("maps the %s business error to its code", (code, error) => {
    expect(toPlaceOrderError(error)).toEqual({ ok: false, error: { code } });
  });

  it("maps items_unavailable and keeps the item ids", () => {
    const result = toPlaceOrderError(new ItemsUnavailableError(["a", "b"]));

    expect(result).toEqual({ ok: false, error: { code: "items_unavailable", itemIds: ["a", "b"] } });
  });

  it("maps a validation failure on the token to invalid_table", () => {
    const parsed = placeOrderSchema.safeParse({ tableToken: "", items: [] });
    if (parsed.success) throw new Error("expected the input to fail validation");

    expect(toPlaceOrderError(parsed.error)).toEqual({ ok: false, error: { code: "invalid_table" } });
  });

  it("maps a validation failure on the items to invalid_items", () => {
    const parsed = placeOrderSchema.safeParse({ tableToken: "t", items: [] });
    if (parsed.success) throw new Error("expected the input to fail validation");

    expect(toPlaceOrderError(parsed.error)).toEqual({ ok: false, error: { code: "invalid_items" } });
  });

  it("maps a bare ZodError with no token issue to invalid_items", () => {
    expect(toPlaceOrderError(new z.ZodError([]))).toEqual({ ok: false, error: { code: "invalid_items" } });
  });

  it("turns anything else into unexpected, logs it, and never leaks its message", () => {
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});
    const failure = new Error("password authentication failed for user postgres");

    const result = toPlaceOrderError(failure);

    expect(result).toEqual({ ok: false, error: { code: "unexpected" } });
    expect(JSON.stringify(result)).not.toContain("password");
    expect(logged).toHaveBeenCalledWith(failure);
  });
});

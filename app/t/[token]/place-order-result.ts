import { z } from "zod";
import type { PlacedOrder } from "@/domain/entities/placed-order";
import {
  InvalidItemsError,
  InvalidTableError,
  ItemsUnavailableError,
  TableClosedError,
  TooManyOpenOrdersError,
} from "@/domain/errors/order-errors";

// What the customer UI receives: business outcomes are values, never thrown
// (docs/customer-ordering.md, section 5). Nothing but the codes (and the
// offending item ids) crosses to the client.
export type PlaceOrderResult =
  | { ok: true; data: PlacedOrder }
  | {
      ok: false;
      error:
        | { code: "invalid_table" }
        | { code: "table_closed" }
        | { code: "too_many_open_orders" }
        | { code: "items_unavailable"; itemIds: string[] }
        | { code: "invalid_items" }
        | { code: "unexpected" };
    };

export function toPlaceOrderError(error: unknown): Extract<PlaceOrderResult, { ok: false }> {
  if (error instanceof InvalidTableError) return { ok: false, error: { code: "invalid_table" } };
  if (error instanceof TableClosedError) return { ok: false, error: { code: "table_closed" } };
  if (error instanceof TooManyOpenOrdersError) return { ok: false, error: { code: "too_many_open_orders" } };
  if (error instanceof InvalidItemsError) return { ok: false, error: { code: "invalid_items" } };
  if (error instanceof ItemsUnavailableError) {
    return { ok: false, error: { code: "items_unavailable", itemIds: error.itemIds } };
  }
  // Input that fails validation gets the same answer the database would give:
  // a bad token is an invalid table, anything else is an invalid cart.
  if (error instanceof z.ZodError) {
    const badToken = error.issues.some((issue) => issue.path[0] === "tableToken");
    return { ok: false, error: { code: badToken ? "invalid_table" : "invalid_items" } };
  }
  console.error(error);
  return { ok: false, error: { code: "unexpected" } };
}

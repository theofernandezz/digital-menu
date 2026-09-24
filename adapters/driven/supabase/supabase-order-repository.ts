import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { PlacedOrder } from "@/domain/entities/placed-order";
import {
  InvalidItemsError,
  InvalidTableError,
  ItemsUnavailableError,
  TableClosedError,
  TooManyOpenOrdersError,
} from "@/domain/errors/order-errors";
import type { OrderRepository, PlaceOrderCommand } from "@/application/ports/order-repository";
import { SupabaseAdapterError } from "@/adapters/driven/supabase/errors";

// The RPC contract (supabase/migrations/20260921130000_ordering_rpcs.sql).
// This file is the only place that knows the RPC calls the sum of the menu
// items `total`; the domain calls it `menuSubtotal`.
const rpcResponseSchema = z.object({
  orderId: z.string(),
  total: z.number(),
  placedAt: z.string(),
  items: z.array(
    z.object({
      name: z.string(),
      unitPrice: z.number(),
      quantity: z.number(),
      notes: z.string().nullable(),
    }),
  ),
});

const itemsUnavailableDetailsSchema = z.object({ itemIds: z.array(z.string()) });

// `raise exception '<code>'` in plpgsql: SQLSTATE P0001, the code is the message.
const RAISE_EXCEPTION_SQLSTATE = "P0001";

type RpcError = { code?: string; message?: string; details?: string | null };

export class SupabaseOrderRepository implements OrderRepository {
  constructor(private readonly client: SupabaseClient) {}

  async place(command: PlaceOrderCommand): Promise<PlacedOrder> {
    let data: unknown;
    let error: RpcError | null;
    try {
      ({ data, error } = await this.client.rpc("place_order", {
        p_qr_token: command.tableToken,
        p_items: command.items,
      }));
    } catch (thrown) {
      throw new SupabaseAdapterError("Failed to place order", thrown);
    }

    if (error) throw toOrderError(error);

    const parsed = rpcResponseSchema.safeParse(data);
    if (!parsed.success) throw new SupabaseAdapterError("place_order returned an unexpected response", parsed.error);

    const { total, ...rest } = parsed.data;
    return { ...rest, menuSubtotal: total };
  }
}

// Known business codes become domain errors; everything else (including
// 22P05, 22003, 57014 and network failures) stays an adapter error whose
// message never reaches the customer.
function toOrderError(error: RpcError): Error {
  if (error.code === RAISE_EXCEPTION_SQLSTATE) {
    switch (error.message) {
      case "invalid_table":
        return new InvalidTableError();
      case "table_closed":
        return new TableClosedError();
      case "too_many_open_orders":
        return new TooManyOpenOrdersError();
      case "invalid_items":
        return new InvalidItemsError();
      case "items_unavailable": {
        const details = parseItemsUnavailableDetails(error.details);
        if (details) return new ItemsUnavailableError(details.itemIds);
      }
    }
  }
  return new SupabaseAdapterError("Failed to place order", error);
}

function parseItemsUnavailableDetails(details: string | null | undefined): { itemIds: string[] } | null {
  if (!details) return null;
  try {
    const parsed = itemsUnavailableDetailsSchema.safeParse(JSON.parse(details));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

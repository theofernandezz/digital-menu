// Ordering module: customer orders. Wiring only — no logic lives here.
import type { SupabaseClient } from "@supabase/supabase-js";
import { SupabaseOrderRepository } from "@/adapters/driven/supabase/supabase-order-repository";
import { PlaceOrderUseCase } from "@/application/use-cases/place-order";

export function placeOrderUseCase(client: SupabaseClient): PlaceOrderUseCase {
  return new PlaceOrderUseCase(new SupabaseOrderRepository(client));
}

// The ordering module's public surface, as seen from app/.
export type OrderingUseCases = {
  placeOrder: PlaceOrderUseCase;
};

export function orderingUseCases(client: SupabaseClient): OrderingUseCases {
  return {
    placeOrder: placeOrderUseCase(client),
  };
}

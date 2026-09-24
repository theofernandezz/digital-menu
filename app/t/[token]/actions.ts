"use server";

import { getUseCases } from "@/composition/request-scope";
import { toPlaceOrderError, type PlaceOrderResult } from "@/app/t/[token]/place-order-result";

// Callable from a client component with a plain object. Public: no session, the
// table token in `input` is the credential. Never throws business errors.
export async function placeOrderAction(input: unknown): Promise<PlaceOrderResult> {
  try {
    const { ordering } = await getUseCases();
    const data = await ordering.placeOrder.execute(input);
    return { ok: true, data };
  } catch (error) {
    return toPlaceOrderError(error);
  }
}

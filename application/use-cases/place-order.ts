import type { PlacedOrder } from "@/domain/entities/placed-order";
import type { OrderRepository } from "@/application/ports/order-repository";
import { placeOrderSchema } from "@/application/schemas/order";

// Public on purpose: customers have no account, so there is no auth check. The
// table token is the credential, and the database re-validates everything.
export class PlaceOrderUseCase {
  constructor(private readonly repo: OrderRepository) {}

  async execute(rawInput: unknown): Promise<PlacedOrder> {
    const input = placeOrderSchema.parse(rawInput);
    return this.repo.place(input);
  }
}

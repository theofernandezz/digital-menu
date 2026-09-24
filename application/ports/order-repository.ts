import type { PlacedOrder } from "@/domain/entities/placed-order";

export type PlaceOrderCommand = {
  tableToken: string;
  items: { menuItemId: string; quantity: number; notes?: string }[];
};

export interface OrderRepository {
  // Business rejections surface as the order errors in domain/errors/order-errors.ts.
  // Any other failure is an infrastructure failure and propagates as any other error.
  place(command: PlaceOrderCommand): Promise<PlacedOrder>;
}

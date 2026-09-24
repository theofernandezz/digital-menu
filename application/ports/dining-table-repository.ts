import type { DiningTable } from "@/domain/entities/dining-table";

// Errors the adapter must translate (domain/errors/table-errors.ts):
// create -> DuplicateTableNumberError, openSession -> AlreadyOpenError.
export interface DiningTableRepository {
  // Ordered by table number; isOpen reflects an open session.
  findByRestaurant(restaurantId: string): Promise<DiningTable[]>;
  findById(id: string): Promise<DiningTable | null>;
  create(input: { restaurantId: string; tableNumber: number }): Promise<DiningTable>;
  openSession(input: { tableId: string; restaurantId: string }): Promise<void>;
  // Idempotent: nothing to close is not an error.
  closeSession(tableId: string): Promise<void>;
}

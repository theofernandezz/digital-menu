import type { MenuItem } from "@/domain/entities/menu-item";

export interface MenuItemRepository {
  findByRestaurant(restaurantId: string): Promise<MenuItem[]>;
  findByCategory(categoryId: string): Promise<MenuItem[]>;
  findById(id: string): Promise<MenuItem | null>;
  save(item: MenuItem): Promise<MenuItem>;
  delete(id: string): Promise<void>;
  // Scoped per category, not per restaurant — items are displayed grouped
  // under their category, so ties matter within that group.
  nextDisplayOrder(categoryId: string): Promise<number>;
}

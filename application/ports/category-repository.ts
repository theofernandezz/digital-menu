import type { Category } from "@/domain/entities/category";

export interface CategoryRepository {
  findByRestaurant(restaurantId: string): Promise<Category[]>;
  findById(id: string): Promise<Category | null>;
  save(category: Category): Promise<Category>;
  delete(id: string): Promise<void>;
  nextDisplayOrder(restaurantId: string): Promise<number>;
}

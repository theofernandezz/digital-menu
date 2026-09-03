import { z } from "zod";
import type { Category } from "@/domain/entities/category";
import type { CategoryRepository } from "@/application/ports/category-repository";
import type { AuthProvider } from "@/application/ports/auth-provider";

const listCategoriesSchema = z.object({ restaurantId: z.string().uuid() });

export class ListCategoriesUseCase {
  constructor(
    private readonly repo: CategoryRepository,
    private readonly auth: AuthProvider,
  ) {}

  async execute(rawInput: unknown): Promise<Category[]> {
    const userId = await this.auth.getCurrentUserId();
    const { restaurantId } = listCategoriesSchema.parse(rawInput);
    await this.auth.assertOwnsRestaurant(userId, restaurantId);

    return this.repo.findByRestaurant(restaurantId);
  }
}

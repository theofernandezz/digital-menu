import { z } from "zod";
import { Category } from "@/domain/entities/category";
import type { CategoryRepository } from "@/application/ports/category-repository";
import type { AuthProvider } from "@/application/ports/auth-provider";

// Shared by create and update — this project requires the same fields on
// both (docs/crud-auth.md), so there's no .pick()/.partial() variant.
export const categorySchema = z.object({
  restaurantId: z.string().uuid(),
  name: z.string().min(1).max(100).trim(),
  description: z.string().max(500).trim().nullable().optional(),
});
export type CategoryInput = z.infer<typeof categorySchema>;

export class CreateCategoryUseCase {
  constructor(
    private readonly repo: CategoryRepository,
    private readonly auth: AuthProvider,
  ) {}

  async execute(rawInput: unknown): Promise<Category> {
    const userId = await this.auth.getCurrentUserId();
    const input = categorySchema.parse(rawInput);
    await this.auth.assertOwnsRestaurant(userId, input.restaurantId);

    const displayOrder = await this.repo.nextDisplayOrder(input.restaurantId);
    const category = Category.create({
      id: crypto.randomUUID(),
      restaurantId: input.restaurantId,
      name: input.name,
      description: input.description ?? null,
      displayOrder,
    });

    return this.repo.save(category);
  }
}

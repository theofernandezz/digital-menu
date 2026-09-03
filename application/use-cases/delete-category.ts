import { z } from "zod";
import { NotFoundError, UnauthorizedError } from "@/domain/errors/domain-errors";
import type { CategoryRepository } from "@/application/ports/category-repository";
import type { AuthProvider } from "@/application/ports/auth-provider";

const deleteCategorySchema = z.object({
  id: z.string().uuid(),
  restaurantId: z.string().uuid(),
});

export class DeleteCategoryUseCase {
  constructor(
    private readonly repo: CategoryRepository,
    private readonly auth: AuthProvider,
  ) {}

  async execute(rawInput: unknown): Promise<void> {
    const userId = await this.auth.getCurrentUserId();
    const { id, restaurantId } = deleteCategorySchema.parse(rawInput);
    await this.auth.assertOwnsRestaurant(userId, restaurantId);

    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundError("Category");
    if (existing.restaurantId !== restaurantId) throw new UnauthorizedError();

    await this.repo.delete(id);
  }
}

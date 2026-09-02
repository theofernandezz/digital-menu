import { z } from "zod";
import { Category } from "@/domain/entities/category";
import { NotFoundError, UnauthorizedError } from "@/domain/errors/domain-errors";
import type { CategoryRepository } from "@/application/ports/category-repository";
import type { AuthProvider } from "@/application/ports/auth-provider";
import { categorySchema } from "@/application/use-cases/create-category";

const updateCategorySchema = categorySchema.extend({ id: z.string().uuid() });

export class UpdateCategoryUseCase {
  constructor(
    private readonly repo: CategoryRepository,
    private readonly auth: AuthProvider,
  ) {}

  async execute(rawInput: unknown): Promise<Category> {
    const userId = await this.auth.getCurrentUserId();
    const input = updateCategorySchema.parse(rawInput);
    await this.auth.assertOwnsRestaurant(userId, input.restaurantId);

    const existing = await this.repo.findById(input.id);
    if (!existing) throw new NotFoundError("Category");
    // Guards against reassigning a category to a restaurant that wasn't
    // just proven owned above (restaurant_id is denormalized, see structure.sql).
    if (existing.restaurantId !== input.restaurantId) throw new UnauthorizedError();

    const updated = Category.create({
      id: existing.id,
      restaurantId: existing.restaurantId,
      displayOrder: existing.displayOrder,
      name: input.name,
      description: input.description ?? null,
    });

    return this.repo.save(updated);
  }
}

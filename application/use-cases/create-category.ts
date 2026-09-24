import { Category } from "@/domain/entities/category";
import type { CategoryRepository } from "@/application/ports/category-repository";
import type { AuthProvider } from "@/application/ports/auth-provider";
import { categorySchema } from "@/application/schemas/category";

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

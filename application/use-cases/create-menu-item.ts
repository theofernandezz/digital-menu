import { MenuItem } from "@/domain/entities/menu-item";
import { NotFoundError, CategoryMismatchError } from "@/domain/errors/domain-errors";
import type { MenuItemRepository } from "@/application/ports/menu-item-repository";
import type { CategoryRepository } from "@/application/ports/category-repository";
import type { AuthProvider } from "@/application/ports/auth-provider";
import { menuItemSchema } from "@/application/schemas/menu-item";

export class CreateMenuItemUseCase {
  constructor(
    private readonly repo: MenuItemRepository,
    private readonly categoryRepo: CategoryRepository,
    private readonly auth: AuthProvider,
  ) {}

  async execute(rawInput: unknown): Promise<MenuItem> {
    const userId = await this.auth.getCurrentUserId();
    const input = menuItemSchema.parse(rawInput);
    await this.auth.assertOwnsRestaurant(userId, input.restaurantId);

    // Both IDs come from the caller explicitly (matches why restaurant_id is
    // denormalized on menu_items in the first place — skip the join at write
    // time too), but nothing stops them disagreeing, so it's checked here.
    const category = await this.categoryRepo.findById(input.categoryId);
    if (!category) throw new NotFoundError("Category");
    if (category.restaurantId !== input.restaurantId) throw new CategoryMismatchError();

    const displayOrder = await this.repo.nextDisplayOrder(input.categoryId);
    const item = MenuItem.create({
      id: crypto.randomUUID(),
      restaurantId: input.restaurantId,
      categoryId: input.categoryId,
      name: input.name,
      description: input.description ?? null,
      price: input.price,
      imageUrl: input.imageUrl ?? null,
      isAvailable: true,
      displayOrder,
    });

    return this.repo.save(item);
  }
}

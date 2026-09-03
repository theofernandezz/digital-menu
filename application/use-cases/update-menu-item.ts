import { z } from "zod";
import { MenuItem } from "@/domain/entities/menu-item";
import { NotFoundError, UnauthorizedError, CategoryMismatchError } from "@/domain/errors/domain-errors";
import type { MenuItemRepository } from "@/application/ports/menu-item-repository";
import type { CategoryRepository } from "@/application/ports/category-repository";
import type { AuthProvider } from "@/application/ports/auth-provider";
import { menuItemSchema } from "@/application/use-cases/create-menu-item";

// isAvailable is a real z.boolean() here, not z.coerce.boolean() — an
// unchecked HTML checkbox sends no key at all in FormData, and
// z.coerce.boolean() would treat the string "false" as truthy anyway. The
// driving adapter (Server Action) is responsible for translating checkbox
// presence into an actual boolean before calling this use case — this use
// case stays framework-agnostic and only sees the real domain value. This
// same call covers the availability toggle — no separate use case for it.
const updateMenuItemSchema = menuItemSchema.extend({
  id: z.string().uuid(),
  isAvailable: z.boolean(),
});

export class UpdateMenuItemUseCase {
  constructor(
    private readonly repo: MenuItemRepository,
    private readonly categoryRepo: CategoryRepository,
    private readonly auth: AuthProvider,
  ) {}

  async execute(rawInput: unknown): Promise<MenuItem> {
    const userId = await this.auth.getCurrentUserId();
    const input = updateMenuItemSchema.parse(rawInput);
    await this.auth.assertOwnsRestaurant(userId, input.restaurantId);

    const category = await this.categoryRepo.findById(input.categoryId);
    if (!category) throw new NotFoundError("Category");
    if (category.restaurantId !== input.restaurantId) throw new CategoryMismatchError();

    const existing = await this.repo.findById(input.id);
    if (!existing) throw new NotFoundError("Menu item");
    if (existing.restaurantId !== input.restaurantId) throw new UnauthorizedError();

    const updated = existing.withUpdate({
      categoryId: input.categoryId,
      name: input.name,
      description: input.description ?? null,
      price: input.price,
      imageUrl: input.imageUrl ?? null,
      isAvailable: input.isAvailable,
    });

    return this.repo.save(updated);
  }
}

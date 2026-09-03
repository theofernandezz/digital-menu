import { z } from "zod";
import { MenuItem } from "@/domain/entities/menu-item";
import { NotFoundError, CategoryMismatchError } from "@/domain/errors/domain-errors";
import type { MenuItemRepository } from "@/application/ports/menu-item-repository";
import type { CategoryRepository } from "@/application/ports/category-repository";
import type { AuthProvider } from "@/application/ports/auth-provider";

// numeric(10,2) in structure.sql — z.coerce.number() per project convention
// (FormData gives strings), with a float-drift-tolerant 2-decimal check
// instead of .multipleOf(0.01), which false-rejects values like 19.99
// (19.99 * 100 !== 1999 exactly in IEEE 754).
function hasAtMostTwoDecimals(value: number): boolean {
  return Math.abs(Math.round(value * 100) - value * 100) < 1e-6;
}

// Shared by create and update — same fields required on both (docs/crud-auth.md).
export const menuItemSchema = z.object({
  restaurantId: z.string().uuid(),
  categoryId: z.string().uuid(),
  name: z.string().min(1).max(150).trim(),
  description: z.string().max(1000).trim().nullable().optional(),
  price: z.coerce.number().nonnegative().refine(hasAtMostTwoDecimals, "Price must have at most 2 decimal places"),
  imageUrl: z.string().url().nullable().optional(),
});
export type MenuItemInput = z.infer<typeof menuItemSchema>;

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

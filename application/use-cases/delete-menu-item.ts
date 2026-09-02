import { z } from "zod";
import { NotFoundError, UnauthorizedError } from "@/domain/errors/domain-errors";
import type { MenuItemRepository } from "@/application/ports/menu-item-repository";
import type { AuthProvider } from "@/application/ports/auth-provider";

const deleteMenuItemSchema = z.object({
  id: z.string().uuid(),
  restaurantId: z.string().uuid(),
});

export class DeleteMenuItemUseCase {
  constructor(
    private readonly repo: MenuItemRepository,
    private readonly auth: AuthProvider,
  ) {}

  async execute(rawInput: unknown): Promise<void> {
    const userId = await this.auth.getCurrentUserId();
    const { id, restaurantId } = deleteMenuItemSchema.parse(rawInput);
    await this.auth.assertOwnsRestaurant(userId, restaurantId);

    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundError("Menu item");
    if (existing.restaurantId !== restaurantId) throw new UnauthorizedError();

    await this.repo.delete(id);
  }
}

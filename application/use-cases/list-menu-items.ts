import { z } from "zod";
import type { MenuItem } from "@/domain/entities/menu-item";
import type { MenuItemRepository } from "@/application/ports/menu-item-repository";
import type { AuthProvider } from "@/application/ports/auth-provider";

const listMenuItemsSchema = z.object({ restaurantId: z.string().uuid() });

export class ListMenuItemsUseCase {
  constructor(
    private readonly repo: MenuItemRepository,
    private readonly auth: AuthProvider,
  ) {}

  async execute(rawInput: unknown): Promise<MenuItem[]> {
    const userId = await this.auth.getCurrentUserId();
    const { restaurantId } = listMenuItemsSchema.parse(rawInput);
    await this.auth.assertOwnsRestaurant(userId, restaurantId);

    return this.repo.findByRestaurant(restaurantId);
  }
}

import { z } from "zod";
import type { Tag } from "@/domain/entities/tag";
import { NotFoundError, UnauthorizedError } from "@/domain/errors/domain-errors";
import type { TagRepository } from "@/application/ports/tag-repository";
import type { MenuItemRepository } from "@/application/ports/menu-item-repository";
import type { AuthProvider } from "@/application/ports/auth-provider";

const listMenuItemTagsSchema = z.object({
  restaurantId: z.string().uuid(),
  menuItemId: z.string().uuid(),
});

// Used to pre-populate the tag list when opening a menu item's edit form.
export class ListMenuItemTagsUseCase {
  constructor(
    private readonly tagRepo: TagRepository,
    private readonly menuItemRepo: MenuItemRepository,
    private readonly auth: AuthProvider,
  ) {}

  async execute(rawInput: unknown): Promise<Tag[]> {
    const userId = await this.auth.getCurrentUserId();
    const { restaurantId, menuItemId } = listMenuItemTagsSchema.parse(rawInput);
    await this.auth.assertOwnsRestaurant(userId, restaurantId);

    const item = await this.menuItemRepo.findById(menuItemId);
    if (!item) throw new NotFoundError("Menu item");
    if (item.restaurantId !== restaurantId) throw new UnauthorizedError();

    return this.tagRepo.findByMenuItem(menuItemId);
  }
}

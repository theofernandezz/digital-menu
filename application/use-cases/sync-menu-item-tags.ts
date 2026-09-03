import { z } from "zod";
import type { Tag } from "@/domain/entities/tag";
import { NotFoundError, UnauthorizedError } from "@/domain/errors/domain-errors";
import type { TagRepository } from "@/application/ports/tag-repository";
import type { MenuItemRepository } from "@/application/ports/menu-item-repository";
import type { AuthProvider } from "@/application/ports/auth-provider";

export const syncMenuItemTagsSchema = z.object({
  restaurantId: z.string().uuid(),
  menuItemId: z.string().uuid(),
  tagNames: z.array(z.string().min(1).max(50).trim()).max(20),
});

// Tags are created on-the-fly from inside the menu item form, not a
// standalone tags CRUD page — see docs/crud-auth.md's scope cuts.
export class SyncMenuItemTagsUseCase {
  constructor(
    private readonly tagRepo: TagRepository,
    private readonly menuItemRepo: MenuItemRepository,
    private readonly auth: AuthProvider,
  ) {}

  async execute(rawInput: unknown): Promise<Tag[]> {
    const userId = await this.auth.getCurrentUserId();
    const input = syncMenuItemTagsSchema.parse(rawInput);
    await this.auth.assertOwnsRestaurant(userId, input.restaurantId);

    const item = await this.menuItemRepo.findById(input.menuItemId);
    if (!item) throw new NotFoundError("Menu item");
    if (item.restaurantId !== input.restaurantId) throw new UnauthorizedError();

    // No dedup here — findOrCreateByNames does it case-insensitively (see
    // its comment), which a plain exact-string Set here can't match, so it'd
    // just be redundant, duplicated logic that could drift out of sync.
    const tags = await this.tagRepo.findOrCreateByNames(input.restaurantId, input.tagNames);
    await this.tagRepo.replaceMenuItemTags(
      input.menuItemId,
      tags.map((t) => t.id),
    );

    return tags;
  }
}

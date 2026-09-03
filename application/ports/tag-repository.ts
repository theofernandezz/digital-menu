import type { Tag } from "@/domain/entities/tag";

export interface TagRepository {
  // Matches existing rows by (restaurant_id, name) and creates the rest —
  // the find-or-create half of the sync. Returns both, in no particular order.
  findOrCreateByNames(restaurantId: string, names: string[]): Promise<Tag[]>;
  findByMenuItem(menuItemId: string): Promise<Tag[]>;
  // Bulk variant for the public menu read — one query instead of N, grouped
  // by menu_item_id.
  findByMenuItems(menuItemIds: string[]): Promise<Map<string, Tag[]>>;
  // Deletes all menu_item_tags rows for menuItemId, then inserts tagIds —
  // not one atomic statement (PostgREST doesn't support that here, see
  // docs/crud-auth.md's accepted gap), sequential delete-then-insert.
  replaceMenuItemTags(menuItemId: string, tagIds: string[]): Promise<void>;
}

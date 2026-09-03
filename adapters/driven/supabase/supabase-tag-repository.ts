import type { SupabaseClient } from "@supabase/supabase-js";
import { Tag } from "@/domain/entities/tag";
import type { TagRepository } from "@/application/ports/tag-repository";
import { SupabaseAdapterError } from "@/adapters/driven/supabase/errors";

// TODO: hand-written row type until `supabase gen types typescript` is wired
// up — same gap as the other repositories.
type TagRow = {
  id: string;
  restaurant_id: string;
  name: string;
};

function toEntity(row: TagRow): Tag {
  return Tag.create({ id: row.id, restaurantId: row.restaurant_id, name: row.name });
}

export class SupabaseTagRepository implements TagRepository {
  constructor(private readonly client: SupabaseClient) {}

  async findOrCreateByNames(restaurantId: string, names: string[]): Promise<Tag[]> {
    if (names.length === 0) return [];

    // Case-insensitive matching is a business rule, not a storage detail —
    // "Vegan" and "vegan" are the same tag to a restaurant owner. The DB's
    // unique(restaurant_id, name) is case-sensitive, so this has to be
    // enforced here. Dedupe the request itself first-seen-casing-wins, then
    // match against existing tags the same way. Fetches all of the
    // restaurant's tags rather than `.in("name", names)` since PostgREST
    // can't do a case-insensitive IN-list in one call; a restaurant's tag
    // vocabulary is small, this is cheap.
    const requestedByLowerName = new Map<string, string>();
    for (const name of names) {
      const key = name.toLowerCase();
      if (!requestedByLowerName.has(key)) requestedByLowerName.set(key, name);
    }

    const { data: existing, error: findError } = await this.client
      .from("tags")
      .select("*")
      .eq("restaurant_id", restaurantId);
    if (findError) throw new SupabaseAdapterError("Failed to look up tags", findError);

    const existingByLowerName = new Map((existing as TagRow[]).map((row) => [row.name.toLowerCase(), row]));

    const matched: TagRow[] = [];
    const namesToCreate: string[] = [];
    for (const [key, originalCasing] of requestedByLowerName) {
      const found = existingByLowerName.get(key);
      if (found) matched.push(found);
      else namesToCreate.push(originalCasing);
    }

    let createdRows: TagRow[] = [];
    if (namesToCreate.length > 0) {
      const { data: created, error: createError } = await this.client
        .from("tags")
        .insert(namesToCreate.map((name) => ({ restaurant_id: restaurantId, name })))
        .select("*");
      if (createError) throw new SupabaseAdapterError("Failed to create tags", createError);
      createdRows = created as TagRow[];
    }

    return [...matched, ...createdRows].map(toEntity);
  }

  async findByMenuItem(menuItemId: string): Promise<Tag[]> {
    const { data, error } = await this.client
      .from("menu_item_tags")
      .select("tags(*)")
      .eq("menu_item_id", menuItemId);

    if (error) throw new SupabaseAdapterError("Failed to fetch menu item tags", error);
    // Without generated types, the client can't tell this FK embed (tag_id ->
    // tags.id) is to-one, not to-many — the runtime shape is one object per
    // row; cast through unknown since the inferred type doesn't overlap.
    return (data as unknown as { tags: TagRow }[]).map((row) => toEntity(row.tags));
  }

  async findByMenuItems(menuItemIds: string[]): Promise<Map<string, Tag[]>> {
    if (menuItemIds.length === 0) return new Map();

    const { data, error } = await this.client
      .from("menu_item_tags")
      .select("menu_item_id, tags(*)")
      .in("menu_item_id", menuItemIds);
    if (error) throw new SupabaseAdapterError("Failed to fetch menu item tags", error);

    const result = new Map<string, Tag[]>();
    // Same to-one-embed cast note as findByMenuItem above.
    for (const row of data as unknown as { menu_item_id: string; tags: TagRow }[]) {
      const tagsForItem = result.get(row.menu_item_id) ?? [];
      tagsForItem.push(toEntity(row.tags));
      result.set(row.menu_item_id, tagsForItem);
    }
    return result;
  }

  async replaceMenuItemTags(menuItemId: string, tagIds: string[]): Promise<void> {
    const { error: deleteError } = await this.client.from("menu_item_tags").delete().eq("menu_item_id", menuItemId);
    if (deleteError) throw new SupabaseAdapterError("Failed to clear menu item tags", deleteError);

    if (tagIds.length === 0) return;

    const { error: insertError } = await this.client
      .from("menu_item_tags")
      .insert(tagIds.map((tagId) => ({ menu_item_id: menuItemId, tag_id: tagId })));
    if (insertError) throw new SupabaseAdapterError("Failed to attach menu item tags", insertError);
  }
}

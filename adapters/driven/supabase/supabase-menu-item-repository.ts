import type { SupabaseClient } from "@supabase/supabase-js";
import { MenuItem } from "@/domain/entities/menu-item";
import type { MenuItemRepository } from "@/application/ports/menu-item-repository";
import { SupabaseAdapterError } from "@/adapters/driven/supabase/errors";

// TODO: hand-written row type until `supabase gen types typescript` is wired
// up — same gap as supabase-category-repository.ts.
type MenuItemRow = {
  id: string;
  restaurant_id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean;
  display_order: number;
};

function toEntity(row: MenuItemRow): MenuItem {
  return MenuItem.create({
    id: row.id,
    restaurantId: row.restaurant_id,
    categoryId: row.category_id,
    name: row.name,
    description: row.description,
    price: row.price,
    imageUrl: row.image_url,
    isAvailable: row.is_available,
    displayOrder: row.display_order,
  });
}

export class SupabaseMenuItemRepository implements MenuItemRepository {
  constructor(private readonly client: SupabaseClient) {}

  async findByRestaurant(restaurantId: string): Promise<MenuItem[]> {
    const { data, error } = await this.client
      .from("menu_items")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .order("display_order", { ascending: true });

    if (error) throw new SupabaseAdapterError("Failed to list menu items", error);
    return (data as MenuItemRow[]).map(toEntity);
  }

  async findByCategory(categoryId: string): Promise<MenuItem[]> {
    const { data, error } = await this.client
      .from("menu_items")
      .select("*")
      .eq("category_id", categoryId)
      .order("display_order", { ascending: true });

    if (error) throw new SupabaseAdapterError("Failed to list menu items", error);
    return (data as MenuItemRow[]).map(toEntity);
  }

  async findById(id: string): Promise<MenuItem | null> {
    const { data, error } = await this.client.from("menu_items").select("*").eq("id", id).maybeSingle();

    if (error) throw new SupabaseAdapterError("Failed to fetch menu item", error);
    return data ? toEntity(data as MenuItemRow) : null;
  }

  async save(item: MenuItem): Promise<MenuItem> {
    const row = {
      id: item.id,
      restaurant_id: item.restaurantId,
      category_id: item.categoryId,
      name: item.name,
      description: item.description,
      price: item.price,
      image_url: item.imageUrl,
      is_available: item.isAvailable,
      display_order: item.displayOrder,
    };

    const { data, error } = await this.client.from("menu_items").upsert(row).select("*").single();

    if (error) throw new SupabaseAdapterError("Failed to save menu item", error);
    return toEntity(data as MenuItemRow);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.client.from("menu_items").delete().eq("id", id);
    if (error) throw new SupabaseAdapterError("Failed to delete menu item", error);
  }

  async nextDisplayOrder(categoryId: string): Promise<number> {
    const { data, error } = await this.client
      .from("menu_items")
      .select("display_order")
      .eq("category_id", categoryId)
      .order("display_order", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw new SupabaseAdapterError("Failed to compute next display order", error);
    return data ? (data as { display_order: number }).display_order + 1 : 0;
  }
}

import type { SupabaseClient } from "@supabase/supabase-js";
import { Category } from "@/domain/entities/category";
import type { CategoryRepository } from "@/application/ports/category-repository";
import { SupabaseAdapterError } from "@/adapters/driven/supabase/errors";

// TODO: hand-written row type until `supabase gen types typescript` is wired
// up (needs the Supabase CLI + a project access token, not set up yet).
type CategoryRow = {
  id: string;
  restaurant_id: string;
  name: string;
  description: string | null;
  display_order: number;
};

function toEntity(row: CategoryRow): Category {
  return Category.create({
    id: row.id,
    restaurantId: row.restaurant_id,
    name: row.name,
    description: row.description,
    displayOrder: row.display_order,
  });
}

export class SupabaseCategoryRepository implements CategoryRepository {
  constructor(private readonly client: SupabaseClient) {}

  async findByRestaurant(restaurantId: string): Promise<Category[]> {
    const { data, error } = await this.client
      .from("categories")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .order("display_order", { ascending: true });

    if (error) throw new SupabaseAdapterError("Failed to list categories", error);
    return (data as CategoryRow[]).map(toEntity);
  }

  async findById(id: string): Promise<Category | null> {
    const { data, error } = await this.client.from("categories").select("*").eq("id", id).maybeSingle();

    if (error) throw new SupabaseAdapterError("Failed to fetch category", error);
    return data ? toEntity(data as CategoryRow) : null;
  }

  async save(category: Category): Promise<Category> {
    const row = {
      id: category.id,
      restaurant_id: category.restaurantId,
      name: category.name,
      description: category.description,
      display_order: category.displayOrder,
    };

    const { data, error } = await this.client.from("categories").upsert(row).select("*").single();

    if (error) throw new SupabaseAdapterError("Failed to save category", error);
    return toEntity(data as CategoryRow);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.client.from("categories").delete().eq("id", id);
    if (error) throw new SupabaseAdapterError("Failed to delete category", error);
  }

  async nextDisplayOrder(restaurantId: string): Promise<number> {
    const { data, error } = await this.client
      .from("categories")
      .select("display_order")
      .eq("restaurant_id", restaurantId)
      .order("display_order", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw new SupabaseAdapterError("Failed to compute next display order", error);
    return data ? (data as { display_order: number }).display_order + 1 : 0;
  }
}

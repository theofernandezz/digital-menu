import type { SupabaseClient } from "@supabase/supabase-js";
import { Restaurant } from "@/domain/entities/restaurant";
import type { RestaurantRepository } from "@/application/ports/restaurant-repository";
import { SupabaseAdapterError } from "@/adapters/driven/supabase/errors";

// TODO: hand-written row type until `supabase gen types typescript` is wired
// up — same gap as the other repositories.
type RestaurantRow = {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  description: string | null;
  is_published: boolean;
  instagram: string | null;
  whatsapp: string | null;
  created_at: string;
};

function toEntity(row: RestaurantRow): Restaurant {
  return Restaurant.create({
    id: row.id,
    ownerId: row.owner_id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    isPublished: row.is_published,
    instagram: row.instagram ?? null,
    whatsapp: row.whatsapp ?? null,
  });
}

export class SupabaseRestaurantRepository implements RestaurantRepository {
  constructor(private readonly client: SupabaseClient) {}

  async findByOwnerId(ownerId: string): Promise<Restaurant | null> {
    const { data, error } = await this.client
      .from("restaurants")
      .select("*")
      .eq("owner_id", ownerId)
      .maybeSingle();

    if (error) throw new SupabaseAdapterError("Failed to fetch restaurant", error);
    return data ? toEntity(data as RestaurantRow) : null;
  }

  async findPublished(): Promise<Restaurant | null> {
    // Oldest first — arbitrary but stable single-tenant tiebreak. Not meant
    // to survive multi-tenant; that adds a slug lookup, doesn't extend this.
    const { data, error } = await this.client
      .from("restaurants")
      .select("*")
      .eq("is_published", true)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) throw new SupabaseAdapterError("Failed to fetch published restaurant", error);
    return data ? toEntity(data as RestaurantRow) : null;
  }

  async save(restaurant: Restaurant): Promise<Restaurant> {
    const row = {
      id: restaurant.id,
      owner_id: restaurant.ownerId,
      name: restaurant.name,
      slug: restaurant.slug,
      description: restaurant.description,
      is_published: restaurant.isPublished,
      instagram: restaurant.instagram,
      whatsapp: restaurant.whatsapp,
    };

    const { data, error } = await this.client.from("restaurants").upsert(row).select("*").single();

    if (error) throw new SupabaseAdapterError("Failed to save restaurant", error);
    return toEntity(data as RestaurantRow);
  }
}

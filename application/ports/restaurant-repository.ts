import type { Restaurant } from "@/domain/entities/restaurant";

export interface RestaurantRepository {
  // Filters explicitly by owner_id, not just "the one row" — once multi-tenant
  // lands, an unfiltered select as an authenticated owner would return the OR
  // of both RLS policies (own row + any published row). See docs/crud-auth.md.
  findByOwnerId(ownerId: string): Promise<Restaurant | null>;
  // Single-tenant v1: "the" published restaurant, no slug. Multi-tenant will
  // add a slug-based lookup alongside this, not replace it with filter tweaks.
  findPublished(): Promise<Restaurant | null>;
  save(restaurant: Restaurant): Promise<Restaurant>;
}

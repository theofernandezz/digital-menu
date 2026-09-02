import { cache } from "react";
import { createServerSupabaseClient } from "@/adapters/driven/supabase/client";
import { getMyRestaurantUseCase } from "@/composition/container";
import type { Restaurant } from "@/domain/entities/restaurant";

// React cache() dedupes this within a single request render — the layout
// and the page both need the restaurant, this way it's fetched once.
export const getMyRestaurant = cache(async (): Promise<Restaurant> => {
  const client = await createServerSupabaseClient();
  return getMyRestaurantUseCase(client).execute();
});

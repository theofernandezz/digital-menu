import { cache } from "react";
import { getUseCases } from "@/composition/request-scope";
import type { Restaurant } from "@/domain/entities/restaurant";

// React cache() dedupes this within a single request render — the layout
// and the page both need the restaurant, this way it's fetched once.
export const getMyRestaurant = cache(async (): Promise<Restaurant> => {
  const { catalog } = await getUseCases();
  return catalog.getMyRestaurant.execute();
});

import type { Restaurant } from "@/domain/entities/restaurant";
import { NotFoundError } from "@/domain/errors/domain-errors";
import type { RestaurantRepository } from "@/application/ports/restaurant-repository";
import type { AuthProvider } from "@/application/ports/auth-provider";

// No input — single-tenant v1, "my restaurant" means the one row owned by
// the current user. Returns the full entity (not just the id): feeds the
// /admin index header and the restaurant-settings form from one call.
export class GetMyRestaurantUseCase {
  constructor(
    private readonly repo: RestaurantRepository,
    private readonly auth: AuthProvider,
  ) {}

  async execute(): Promise<Restaurant> {
    const userId = await this.auth.getCurrentUserId();
    const restaurant = await this.repo.findByOwnerId(userId);
    if (!restaurant) throw new NotFoundError("Restaurant");
    return restaurant;
  }
}

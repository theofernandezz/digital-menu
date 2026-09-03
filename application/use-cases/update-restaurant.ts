import { z } from "zod";
import { Restaurant } from "@/domain/entities/restaurant";
import type { RestaurantRepository } from "@/application/ports/restaurant-repository";
import type { AuthProvider } from "@/application/ports/auth-provider";

// isPublished is a real z.boolean(), not z.coerce.boolean() — same checkbox
// gotcha as menu-items' isAvailable; the Server Action translates presence
// into an actual boolean before calling this use case.
export const restaurantSchema = z.object({
  restaurantId: z.string().uuid(),
  name: z.string().min(1).max(100).trim(),
  slug: z
    .string()
    .min(1)
    .max(100)
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase letters, numbers, and hyphens"),
  description: z.string().max(1000).trim().nullable().optional(),
  isPublished: z.boolean(),
  instagram: z.string().max(200).trim().nullable().optional(),
  whatsapp: z.string().max(50).trim().nullable().optional(),
});
export type RestaurantInput = z.infer<typeof restaurantSchema>;

export class UpdateRestaurantUseCase {
  constructor(
    private readonly repo: RestaurantRepository,
    private readonly auth: AuthProvider,
  ) {}

  async execute(rawInput: unknown): Promise<Restaurant> {
    const userId = await this.auth.getCurrentUserId();
    const input = restaurantSchema.parse(rawInput);
    // assertOwnsRestaurant already filters by id AND owner_id, so ownership
    // of restaurantId is proven here — no separate findById round-trip
    // needed before constructing the updated entity.
    await this.auth.assertOwnsRestaurant(userId, input.restaurantId);

    const restaurant = Restaurant.create({
      id: input.restaurantId,
      ownerId: userId,
      name: input.name,
      slug: input.slug,
      description: input.description ?? null,
      isPublished: input.isPublished,
      instagram: input.instagram ?? null,
      whatsapp: input.whatsapp ?? null,
    });

    return this.repo.save(restaurant);
  }
}

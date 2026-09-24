import { z } from "zod";
import type { DiningTable } from "@/domain/entities/dining-table";
import type { DiningTableRepository } from "@/application/ports/dining-table-repository";
import type { AuthProvider } from "@/application/ports/auth-provider";

const listTablesSchema = z.object({ restaurantId: z.string().uuid() });

export class ListTablesUseCase {
  constructor(
    private readonly repo: DiningTableRepository,
    private readonly auth: AuthProvider,
  ) {}

  async execute(rawInput: unknown): Promise<DiningTable[]> {
    const userId = await this.auth.getCurrentUserId();
    const { restaurantId } = listTablesSchema.parse(rawInput);
    await this.auth.assertOwnsRestaurant(userId, restaurantId);

    return this.repo.findByRestaurant(restaurantId);
  }
}

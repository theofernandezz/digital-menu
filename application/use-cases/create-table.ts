import type { DiningTable } from "@/domain/entities/dining-table";
import type { DiningTableRepository } from "@/application/ports/dining-table-repository";
import type { AuthProvider } from "@/application/ports/auth-provider";
import { createTableSchema } from "@/application/schemas/table";

export class CreateTableUseCase {
  constructor(
    private readonly repo: DiningTableRepository,
    private readonly auth: AuthProvider,
  ) {}

  async execute(rawInput: unknown): Promise<DiningTable> {
    const userId = await this.auth.getCurrentUserId();
    const input = createTableSchema.parse(rawInput);
    await this.auth.assertOwnsRestaurant(userId, input.restaurantId);

    return this.repo.create({ restaurantId: input.restaurantId, tableNumber: input.tableNumber });
  }
}

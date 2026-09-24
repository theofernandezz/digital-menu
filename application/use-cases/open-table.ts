import { NotFoundError } from "@/domain/errors/domain-errors";
import type { DiningTableRepository } from "@/application/ports/dining-table-repository";
import type { AuthProvider } from "@/application/ports/auth-provider";
import { tableIdSchema } from "@/application/schemas/table";

export class OpenTableUseCase {
  constructor(
    private readonly repo: DiningTableRepository,
    private readonly auth: AuthProvider,
  ) {}

  async execute(rawInput: unknown): Promise<void> {
    const userId = await this.auth.getCurrentUserId();
    const { id } = tableIdSchema.parse(rawInput);

    // The restaurant comes from the table itself, never from the caller.
    const table = await this.repo.findById(id);
    if (!table) throw new NotFoundError("Table");
    await this.auth.assertOwnsRestaurant(userId, table.restaurantId);

    await this.repo.openSession({ tableId: table.id, restaurantId: table.restaurantId });
  }
}

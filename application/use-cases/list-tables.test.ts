import { describe, expect, it } from "vitest";
import { ZodError } from "zod";
import { DiningTable } from "@/domain/entities/dining-table";
import { UnauthorizedError } from "@/domain/errors/domain-errors";
import { ListTablesUseCase } from "@/application/use-cases/list-tables";
import { FakeAuthProvider, FakeDiningTableRepository, FAKE_RESTAURANT_ID } from "@/application/__tests__/fakes";

const OTHER_RESTAURANT_ID = "99999999-9999-4999-8999-999999999999";

function table(id: string, restaurantId: string, tableNumber: number, isOpen = false): DiningTable {
  return DiningTable.create({ id, restaurantId, tableNumber, qrToken: `token-${tableNumber}`, isOpen });
}

describe("ListTablesUseCase", () => {
  it("returns the restaurant's tables ordered by number, with their open state", async () => {
    const repo = new FakeDiningTableRepository();
    repo.seed(table("11111111-1111-4111-8111-111111111112", FAKE_RESTAURANT_ID, 5, true));
    repo.seed(table("11111111-1111-4111-8111-111111111111", FAKE_RESTAURANT_ID, 2));
    repo.seed(table("11111111-1111-4111-8111-111111111113", OTHER_RESTAURANT_ID, 1));
    const useCase = new ListTablesUseCase(repo, new FakeAuthProvider());

    const tables = await useCase.execute({ restaurantId: FAKE_RESTAURANT_ID });

    expect(tables.map((t) => [t.tableNumber, t.isOpen])).toEqual([
      [2, false],
      [5, true],
    ]);
  });

  it("fails as unauthorized without touching the repository when nobody is signed in", async () => {
    const repo = new FakeDiningTableRepository();
    const auth = new FakeAuthProvider();
    auth.currentUserId = null;

    await expect(new ListTablesUseCase(repo, auth).execute({ restaurantId: FAKE_RESTAURANT_ID })).rejects.toThrow(
      UnauthorizedError,
    );
    expect(repo.calls).toEqual([]);
  });

  it("rejects a restaurant the user does not own without touching the repository", async () => {
    const repo = new FakeDiningTableRepository();
    const useCase = new ListTablesUseCase(repo, new FakeAuthProvider());

    await expect(useCase.execute({ restaurantId: OTHER_RESTAURANT_ID })).rejects.toThrow(UnauthorizedError);
    expect(repo.calls).toEqual([]);
  });

  it("rejects input that fails Zod validation", async () => {
    const useCase = new ListTablesUseCase(new FakeDiningTableRepository(), new FakeAuthProvider());
    await expect(useCase.execute({ restaurantId: "nope" })).rejects.toThrow(ZodError);
  });
});

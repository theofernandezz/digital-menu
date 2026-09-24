import { describe, expect, it } from "vitest";
import { ZodError } from "zod";
import { DiningTable } from "@/domain/entities/dining-table";
import { NotFoundError, UnauthorizedError } from "@/domain/errors/domain-errors";
import { CloseTableUseCase } from "@/application/use-cases/close-table";
import { FakeAuthProvider, FakeDiningTableRepository, FAKE_RESTAURANT_ID } from "@/application/__tests__/fakes";

const TABLE_ID = "11111111-1111-4111-8111-111111111111";
const FOREIGN_RESTAURANT_ID = "99999999-9999-4999-8999-999999999999";

function seeded(restaurantId = FAKE_RESTAURANT_ID, isOpen = true) {
  const repo = new FakeDiningTableRepository();
  repo.seed(DiningTable.create({ id: TABLE_ID, restaurantId, tableNumber: 7, qrToken: "t", isOpen }));
  const auth = new FakeAuthProvider();
  return { repo, auth, useCase: new CloseTableUseCase(repo, auth) };
}

describe("CloseTableUseCase", () => {
  it("closes an open table", async () => {
    const { repo, useCase } = seeded();
    await useCase.execute({ id: TABLE_ID });
    expect((await repo.findById(TABLE_ID))?.isOpen).toBe(false);
  });

  it("succeeds and changes nothing on a table that is already closed", async () => {
    const { repo, useCase } = seeded(FAKE_RESTAURANT_ID, false);
    await expect(useCase.execute({ id: TABLE_ID })).resolves.toBeUndefined();
    expect((await repo.findById(TABLE_ID))?.isOpen).toBe(false);
  });

  it("checks ownership against the table's restaurant and ignores a caller-supplied one", async () => {
    const { repo, useCase } = seeded(FOREIGN_RESTAURANT_ID);

    await expect(useCase.execute({ id: TABLE_ID, restaurantId: FAKE_RESTAURANT_ID })).rejects.toThrow(
      UnauthorizedError,
    );
    expect(repo.calls).not.toContain("closeSession");
  });

  it("throws NotFoundError for a table that does not exist", async () => {
    const { useCase } = seeded();
    await expect(useCase.execute({ id: "22222222-2222-4222-8222-222222222222" })).rejects.toThrow(NotFoundError);
  });

  it("fails as unauthorized without touching the repository when nobody is signed in", async () => {
    const { repo, auth, useCase } = seeded();
    auth.currentUserId = null;
    await expect(useCase.execute({ id: TABLE_ID })).rejects.toThrow(UnauthorizedError);
    expect(repo.calls).toEqual([]);
  });

  it("rejects an id that is not a uuid", async () => {
    const { useCase } = seeded();
    await expect(useCase.execute({ id: "nope" })).rejects.toThrow(ZodError);
  });
});

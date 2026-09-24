import { describe, expect, it } from "vitest";
import { ZodError } from "zod";
import { DiningTable } from "@/domain/entities/dining-table";
import { NotFoundError, UnauthorizedError } from "@/domain/errors/domain-errors";
import { AlreadyOpenError } from "@/domain/errors/table-errors";
import { OpenTableUseCase } from "@/application/use-cases/open-table";
import { FakeAuthProvider, FakeDiningTableRepository, FAKE_RESTAURANT_ID } from "@/application/__tests__/fakes";

const TABLE_ID = "11111111-1111-4111-8111-111111111111";
const FOREIGN_RESTAURANT_ID = "99999999-9999-4999-8999-999999999999";

function seeded(restaurantId = FAKE_RESTAURANT_ID, isOpen = false) {
  const repo = new FakeDiningTableRepository();
  repo.seed(DiningTable.create({ id: TABLE_ID, restaurantId, tableNumber: 7, qrToken: "t", isOpen }));
  const auth = new FakeAuthProvider();
  return { repo, auth, useCase: new OpenTableUseCase(repo, auth) };
}

describe("OpenTableUseCase", () => {
  it("opens a closed table", async () => {
    const { repo, useCase } = seeded();
    await useCase.execute({ id: TABLE_ID });
    expect((await repo.findById(TABLE_ID))?.isOpen).toBe(true);
  });

  it("fails with AlreadyOpenError when the table is already open", async () => {
    const { useCase } = seeded();
    await useCase.execute({ id: TABLE_ID });
    await expect(useCase.execute({ id: TABLE_ID })).rejects.toThrow(AlreadyOpenError);
  });

  it("uses the table's own restaurant for the session and ignores a caller-supplied one", async () => {
    const { repo, auth, useCase } = seeded();
    auth.ownedRestaurantIds.add(FOREIGN_RESTAURANT_ID);

    await useCase.execute({ id: TABLE_ID, restaurantId: FOREIGN_RESTAURANT_ID });

    expect(repo.openedFor).toEqual([{ tableId: TABLE_ID, restaurantId: FAKE_RESTAURANT_ID }]);
  });

  it("checks ownership against the table's restaurant, not a caller-supplied one", async () => {
    // The caller owns FAKE_RESTAURANT_ID and claims it, but the table belongs to another one.
    const { repo, useCase } = seeded(FOREIGN_RESTAURANT_ID);

    await expect(useCase.execute({ id: TABLE_ID, restaurantId: FAKE_RESTAURANT_ID })).rejects.toThrow(
      UnauthorizedError,
    );
    expect(repo.calls).not.toContain("openSession");
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

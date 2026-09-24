import { describe, expect, it } from "vitest";
import { ZodError } from "zod";
import { UnauthorizedError } from "@/domain/errors/domain-errors";
import { DuplicateTableNumberError } from "@/domain/errors/table-errors";
import { CreateTableUseCase } from "@/application/use-cases/create-table";
import { FakeAuthProvider, FakeDiningTableRepository, FAKE_RESTAURANT_ID } from "@/application/__tests__/fakes";

function makeUseCase() {
  const repo = new FakeDiningTableRepository();
  const auth = new FakeAuthProvider();
  return { useCase: new CreateTableUseCase(repo, auth), repo, auth };
}

describe("CreateTableUseCase", () => {
  it.each([
    [1, 1],
    [999, 999],
    ["12", 12],
  ])("accepts the number %s", async (input, expected) => {
    const { useCase } = makeUseCase();
    const table = await useCase.execute({ restaurantId: FAKE_RESTAURANT_ID, tableNumber: input });
    expect(table.tableNumber).toBe(expected);
    expect(table.restaurantId).toBe(FAKE_RESTAURANT_ID);
    expect(table.isOpen).toBe(false);
  });

  it.each([0, 1000, 1.5, "abc", "", null, undefined, "1.5", -3])(
    "rejects %j before the repository is called",
    async (tableNumber) => {
      const { useCase, repo } = makeUseCase();
      await expect(useCase.execute({ restaurantId: FAKE_RESTAURANT_ID, tableNumber })).rejects.toThrow(ZodError);
      expect(repo.calls).toEqual([]);
    },
  );

  it("propagates DuplicateTableNumberError from the repository", async () => {
    const { useCase } = makeUseCase();
    await useCase.execute({ restaurantId: FAKE_RESTAURANT_ID, tableNumber: 4 });
    await expect(useCase.execute({ restaurantId: FAKE_RESTAURANT_ID, tableNumber: 4 })).rejects.toThrow(
      DuplicateTableNumberError,
    );
  });

  it("fails as unauthorized before validating or touching the repository when nobody is signed in", async () => {
    const { useCase, repo, auth } = makeUseCase();
    auth.currentUserId = null;
    await expect(useCase.execute({ restaurantId: "not-a-uuid", tableNumber: 0 })).rejects.toThrow(UnauthorizedError);
    expect(repo.calls).toEqual([]);
  });

  it("rejects a restaurant the user does not own without touching the repository", async () => {
    const { useCase, repo } = makeUseCase();
    await expect(
      useCase.execute({ restaurantId: "99999999-9999-4999-8999-999999999999", tableNumber: 3 }),
    ).rejects.toThrow(UnauthorizedError);
    expect(repo.calls).toEqual([]);
  });
});

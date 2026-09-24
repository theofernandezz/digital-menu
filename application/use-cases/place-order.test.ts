import { describe, expect, it } from "vitest";
import { ZodError } from "zod";
import { PlaceOrderUseCase } from "@/application/use-cases/place-order";
import {
  InvalidItemsError,
  InvalidTableError,
  ItemsUnavailableError,
  TableClosedError,
  TooManyOpenOrdersError,
} from "@/domain/errors/order-errors";
import { FakeOrderRepository } from "@/application/__tests__/fakes";

const ITEM_A = "00000000-0000-4000-8000-0000000000b1";
const ITEM_B = "00000000-0000-4000-8000-0000000000b2";

function makeUseCase() {
  const repo = new FakeOrderRepository();
  return { useCase: new PlaceOrderUseCase(repo), repo };
}

const validInput = () => ({ tableToken: "abc123", items: [{ menuItemId: ITEM_A, quantity: 2 }] });

describe("PlaceOrderUseCase", () => {
  it("returns the order as stored, with menuSubtotal", async () => {
    const { useCase, repo } = makeUseCase();
    repo.result = {
      orderId: "00000000-0000-4000-8000-0000000000a9",
      placedAt: "2026-09-24T12:00:00.000Z",
      menuSubtotal: 7,
      items: [{ name: "Latte", unitPrice: 3.5, quantity: 2, notes: null }],
    };

    const order = await useCase.execute(validInput());

    expect(order).toEqual(repo.result);
  });

  it("passes the validated command to the port, with notes trimmed", async () => {
    const { useCase, repo } = makeUseCase();

    await useCase.execute({
      tableToken: "abc123",
      items: [{ menuItemId: ITEM_A, quantity: 1, notes: "  no ice  " }, { menuItemId: ITEM_B, quantity: 3 }],
    });

    expect(repo.placed).toEqual([
      {
        tableToken: "abc123",
        items: [{ menuItemId: ITEM_A, quantity: 1, notes: "no ice" }, { menuItemId: ITEM_B, quantity: 3 }],
      },
    ]);
  });

  it.each([
    ["invalid_table", new InvalidTableError()],
    ["table_closed", new TableClosedError()],
    ["too_many_open_orders", new TooManyOpenOrdersError()],
    ["items_unavailable", new ItemsUnavailableError([ITEM_A])],
    ["invalid_items", new InvalidItemsError()],
  ])("lets the %s business error from the port through", async (_code, error) => {
    const { useCase, repo } = makeUseCase();
    repo.failWith = error;

    await expect(useCase.execute(validInput())).rejects.toBe(error);
  });

  it("lets an infrastructure failure through untouched", async () => {
    const { useCase, repo } = makeUseCase();
    const failure = new Error("connection reset");
    repo.failWith = failure;

    await expect(useCase.execute(validInput())).rejects.toBe(failure);
  });

  describe("input validation (the port is never called)", () => {
    const line = (overrides: Record<string, unknown> = {}) => ({ menuItemId: ITEM_A, quantity: 1, ...overrides });
    const lines = (count: number) =>
      Array.from({ length: count }, (_, i) => ({
        menuItemId: `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`,
        quantity: 1,
      }));

    it.each([
      ["quantity 0", { tableToken: "t", items: [line({ quantity: 0 })] }],
      ["quantity 21", { tableToken: "t", items: [line({ quantity: 21 })] }],
      ["fractional quantity", { tableToken: "t", items: [line({ quantity: 1.5 })] }],
      ["notes over 200 chars", { tableToken: "t", items: [line({ notes: "x".repeat(201) })] }],
      ["notes over 200 chars after trim", { tableToken: "t", items: [line({ notes: ` ${"x".repeat(201)} ` })] }],
      ["0 lines", { tableToken: "t", items: [] }],
      ["31 lines", { tableToken: "t", items: lines(31) }],
      ["duplicate ids", { tableToken: "t", items: [line(), line({ quantity: 2 })] }],
      ["non-uuid id", { tableToken: "t", items: [line({ menuItemId: "not-a-uuid" })] }],
      ["empty token", { tableToken: "", items: [line()] }],
      ["65-char token", { tableToken: "x".repeat(65), items: [line()] }],
      ["missing items", { tableToken: "t" }],
      ["not an object", "hello"],
    ])("rejects %s", async (_label, input) => {
      const { useCase, repo } = makeUseCase();

      await expect(useCase.execute(input)).rejects.toThrow(ZodError);
      expect(repo.placed).toHaveLength(0);
    });

    it.each([
      ["quantity 1 and 20", { tableToken: "t", items: [line(), line({ menuItemId: ITEM_B, quantity: 20 })] }],
      ["notes of exactly 200 chars", { tableToken: "t", items: [line({ notes: "x".repeat(200) })] }],
      ["30 lines", { tableToken: "t", items: lines(30) }],
      ["a 64-char token", { tableToken: "x".repeat(64), items: [line()] }],
    ])("accepts %s", async (_label, input) => {
      const { useCase, repo } = makeUseCase();

      await useCase.execute(input);

      expect(repo.placed).toHaveLength(1);
    });
  });
});

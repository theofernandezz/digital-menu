import { afterEach, describe, expect, it, vi } from "vitest";
import { placeOrderAction } from "@/app/t/[token]/actions";
import { PlaceOrderUseCase } from "@/application/use-cases/place-order";
import { InvalidTableError } from "@/domain/errors/order-errors";
import { FakeOrderRepository } from "@/application/__tests__/fakes";

const getUseCases = vi.hoisted(() => vi.fn());
vi.mock("@/composition/request-scope", () => ({ getUseCases }));

const ITEM_A = "00000000-0000-4000-8000-0000000000b1";

function useFakeRepository(): FakeOrderRepository {
  const repo = new FakeOrderRepository();
  getUseCases.mockResolvedValue({ ordering: { placeOrder: new PlaceOrderUseCase(repo) } });
  return repo;
}

afterEach(() => {
  getUseCases.mockReset();
  vi.restoreAllMocks();
});

describe("placeOrderAction", () => {
  it("returns ok with the stored order and menuSubtotal for valid input", async () => {
    const repo = useFakeRepository();
    repo.result = {
      orderId: "00000000-0000-4000-8000-0000000000a9",
      placedAt: "2026-09-24T12:00:00.000Z",
      menuSubtotal: 7,
      items: [{ name: "Latte", unitPrice: 3.5, quantity: 2, notes: null }],
    };

    const result = await placeOrderAction({ tableToken: "abc", items: [{ menuItemId: ITEM_A, quantity: 2 }] });

    expect(result).toEqual({ ok: true, data: repo.result });
  });

  it("returns a business error as a value instead of throwing", async () => {
    const repo = useFakeRepository();
    repo.failWith = new InvalidTableError();

    const result = await placeOrderAction({ tableToken: "abc", items: [{ menuItemId: ITEM_A, quantity: 1 }] });

    expect(result).toEqual({ ok: false, error: { code: "invalid_table" } });
  });

  it("rejects bad input without calling the port", async () => {
    const repo = useFakeRepository();

    const result = await placeOrderAction({ tableToken: "abc", items: [{ menuItemId: ITEM_A, quantity: 0 }] });

    expect(result).toEqual({ ok: false, error: { code: "invalid_items" } });
    expect(repo.placed).toHaveLength(0);
  });

  it("returns unexpected, without the message, when building the use cases fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    getUseCases.mockRejectedValue(new Error("cookies() outside a request scope"));

    const result = await placeOrderAction({});

    expect(result).toEqual({ ok: false, error: { code: "unexpected" } });
  });
});

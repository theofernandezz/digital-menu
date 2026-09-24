// Round trip of SupabaseOrderRepository against the local Supabase, with the
// public anon key, the way the app calls it. The RPC's own rules are covered in
// place-order.integration.test.ts; this proves the adapter's translation of the
// real responses and errors.
// Run with: docker compose run --rm --no-deps app pnpm test:integration
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { type SupabaseClient } from "@supabase/supabase-js";
import { SupabaseOrderRepository } from "@/adapters/driven/supabase/supabase-order-repository";
import { SupabaseAdapterError } from "@/adapters/driven/supabase/errors";
import {
  InvalidItemsError,
  InvalidTableError,
  ItemsUnavailableError,
  TableClosedError,
  TooManyOpenOrdersError,
} from "@/domain/errors/order-errors";
import {
  createAnonClient,
  createDish,
  createRestaurant,
  createServiceClient,
  createTable,
  removeRestaurant,
  type TestDish,
  type TestRestaurant,
} from "./support/ordering-fixtures";

describe("SupabaseOrderRepository (integration)", () => {
  let service: SupabaseClient;
  let repo: SupabaseOrderRepository;
  let shop: TestRestaurant;
  let latte: TestDish;
  let cake: TestDish;
  let soldOut: TestDish;

  beforeAll(async () => {
    service = createServiceClient();
    repo = new SupabaseOrderRepository(createAnonClient());
    shop = await createRestaurant(service, { published: true });
    latte = await createDish(service, shop, { price: 3.5 });
    cake = await createDish(service, shop, { price: 4.25 });
    soldOut = await createDish(service, shop, { price: 1, isAvailable: false });
  });

  afterAll(async () => {
    await removeRestaurant(service, shop);
  });

  it("stores the order and returns it with menuSubtotal, name and price snapshots, and trimmed notes", async () => {
    const table = await createTable(service, shop.id);

    const order = await repo.place({
      tableToken: table.token,
      items: [
        { menuItemId: latte.id, quantity: 2, notes: "  no ice  " },
        { menuItemId: cake.id, quantity: 1 },
      ],
    });

    expect(order.menuSubtotal).toBe(11.25);
    expect(order).not.toHaveProperty("total");
    expect(order.items).toEqual([
      { name: latte.name, unitPrice: 3.5, quantity: 2, notes: "no ice" },
      { name: cake.name, unitPrice: 4.25, quantity: 1, notes: null },
    ]);

    const stored = await service.from("orders").select("total").eq("id", order.orderId).single();
    expect(stored.error).toBeNull();
    expect(Number(stored.data?.total)).toBe(11.25);
    expect(Number.isNaN(Date.parse(order.placedAt))).toBe(false);
  });

  it("maps an unknown token to InvalidTableError", async () => {
    await expect(
      repo.place({ tableToken: "no-such-token", items: [{ menuItemId: latte.id, quantity: 1 }] }),
    ).rejects.toBeInstanceOf(InvalidTableError);
  });

  it("maps a table without an open session to TableClosedError", async () => {
    const table = await createTable(service, shop.id, { open: false });

    await expect(
      repo.place({ tableToken: table.token, items: [{ menuItemId: latte.id, quantity: 1 }] }),
    ).rejects.toBeInstanceOf(TableClosedError);
  });

  it("maps a sold-out dish to ItemsUnavailableError carrying its id", async () => {
    const table = await createTable(service, shop.id);

    const failure = await repo
      .place({
        tableToken: table.token,
        items: [
          { menuItemId: latte.id, quantity: 1 },
          { menuItemId: soldOut.id, quantity: 1 },
        ],
      })
      .catch((e: unknown) => e);

    expect(failure).toBeInstanceOf(ItemsUnavailableError);
    expect((failure as ItemsUnavailableError).itemIds).toEqual([soldOut.id]);
  });

  it("maps a payload the RPC rejects (duplicate dish) to InvalidItemsError", async () => {
    const table = await createTable(service, shop.id);

    await expect(
      repo.place({
        tableToken: table.token,
        items: [
          { menuItemId: latte.id, quantity: 1 },
          { menuItemId: latte.id, quantity: 2 },
        ],
      }),
    ).rejects.toBeInstanceOf(InvalidItemsError);
  });

  it("maps the sixth order in flight to TooManyOpenOrdersError", async () => {
    const table = await createTable(service, shop.id);
    const command = { tableToken: table.token, items: [{ menuItemId: latte.id, quantity: 1 }] };

    for (let i = 0; i < 5; i += 1) await repo.place(command);

    await expect(repo.place(command)).rejects.toBeInstanceOf(TooManyOpenOrdersError);
  });

  it("turns a raw failure outside the RPC's contract (a NUL byte, 22P05) into an adapter error", async () => {
    const table = await createTable(service, shop.id);

    const failure = await repo
      .place({ tableToken: table.token, items: [{ menuItemId: latte.id, quantity: 1, notes: "a\u0000b" }] })
      .catch((e: unknown) => e);

    expect(failure).toBeInstanceOf(SupabaseAdapterError);
  });
});

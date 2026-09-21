// Integration tests for the place_order RPC (docs/customer-ordering.md, section 4),
// called the way the app calls it: through the REST API with the public anon key.
// Direct SQL (pg) is used only where the API can't reach: a temporary trigger to
// prove atomicity, and a second transaction holding a row lock.
// Run with: docker compose run --rm --no-deps app pnpm test:integration
//
// Numbering follows the design doc's testing plan (tests 12 and 15 live in
// table-access.integration.test.ts). Test 2 differs on purpose: menu_items has no
// is_published column, so an unpublished RESTAURANT answers table_closed.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { type SupabaseClient } from "@supabase/supabase-js";
import {
  createAnonClient,
  createDish,
  createRestaurant,
  createServiceClient,
  createTable,
  removeRestaurant,
  type TestDish,
  type TestRestaurant,
  type TestTable,
} from "./support/ordering-fixtures";
import { connectTestDb, waitUntil, withTestDb } from "./support/test-db";

type PlacedOrder = {
  orderId: string;
  total: number;
  placedAt: string;
  items: { name: string; unitPrice: number; quantity: number; notes: string | null }[];
};
type RpcOutcome = { data: unknown; error: { message: string; details: string } | null };

const shortId = (): string => crypto.randomUUID().slice(0, 8);

describe("place_order (integration)", () => {
  let service: SupabaseClient;
  let anon: SupabaseClient;
  let shop: TestRestaurant;
  let otherShop: TestRestaurant;
  let closedShop: TestRestaurant;
  let latte: TestDish;
  let cake: TestDish;
  let soldOut: TestDish;
  let foreignDish: TestDish;
  let closedShopDish: TestDish;

  beforeAll(async () => {
    service = createServiceClient();
    anon = createAnonClient();

    shop = await createRestaurant(service, { published: true });
    otherShop = await createRestaurant(service, { published: true });
    closedShop = await createRestaurant(service, { published: false });

    latte = await createDish(service, shop, { price: 3.5 });
    cake = await createDish(service, shop, { price: 4.25 });
    soldOut = await createDish(service, shop, { price: 1, isAvailable: false });
    foreignDish = await createDish(service, otherShop, { price: 2 });
    closedShopDish = await createDish(service, closedShop, { price: 2 });
  });

  afterAll(async () => {
    for (const restaurant of [shop, otherShop, closedShop]) await removeRestaurant(service, restaurant);
  });

  async function place(token: string | null, items: unknown): Promise<RpcOutcome> {
    return anon.rpc("place_order", { p_qr_token: token, p_items: items });
  }

  const line = (dish: TestDish, quantity = 1, notes?: string): Record<string, unknown> => ({
    menuItemId: dish.id,
    quantity,
    ...(notes === undefined ? {} : { notes }),
  });

  const sessionOf = (table: TestTable): string => {
    if (!table.sessionId) throw new Error("fixture table has no open session");
    return table.sessionId;
  };

  async function ordersOf(table: TestTable): Promise<{ id: string; status: string; total: number }[]> {
    const { data, error } = await service.from("orders").select("id, status, total").eq("session_id", sessionOf(table));
    if (error) throw error;
    return data;
  }

  async function setStatus(orderId: string, status: string): Promise<void> {
    const { error } = await service.from("orders").update({ status }).eq("id", orderId);
    if (error) throw error;
  }

  function expectRejected(result: RpcOutcome, code: string): void {
    expect(result.data).toBeNull();
    expect(result.error?.message).toBe(code);
  }

  // 1
  it("stores the order with name and price snapshots and returns exactly what was stored", async () => {
    const table = await createTable(service, shop.id);

    const result = await place(table.token, [line(latte, 2, "  oat milk  "), line(cake, 1)]);

    expect(result.error).toBeNull();
    const placed = result.data as PlacedOrder;
    expect(Object.keys(placed).sort()).toEqual(["items", "orderId", "placedAt", "total"]);
    expect(placed.total).toBe(11.25); // 2 x 3.50 + 4.25, from the database's prices
    expect(placed.items).toEqual([
      { name: latte.name, unitPrice: 3.5, quantity: 2, notes: "oat milk" }, // trimmed
      { name: cake.name, unitPrice: 4.25, quantity: 1, notes: null },
    ]);

    const orders = await service.from("orders").select("*").eq("id", placed.orderId).single();
    expect(orders.data).toMatchObject({ session_id: sessionOf(table), restaurant_id: shop.id, status: "placed", total: 11.25 });
    expect(new Date(placed.placedAt).getTime()).toBe(new Date(orders.data?.placed_at).getTime());

    const lines = await service.from("order_items").select("*").eq("order_id", placed.orderId);
    expect(lines.data).toHaveLength(2);
    expect(lines.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ menu_item_id: latte.id, restaurant_id: shop.id, name: latte.name, unit_price: 3.5, quantity: 2, notes: "oat milk" }),
        expect.objectContaining({ menu_item_id: cake.id, name: cake.name, unit_price: 4.25, quantity: 1, notes: null }),
      ]),
    );
  });

  // 2 (adapted)
  it("answers table_closed for an unpublished restaurant and stores nothing", async () => {
    const table = await createTable(service, closedShop.id);

    expectRejected(await place(table.token, [line(closedShopDish)]), "table_closed");
    expect(await ordersOf(table)).toEqual([]);
  });

  // 3
  it("rejects an unavailable item, naming it, and stores nothing", async () => {
    const table = await createTable(service, shop.id);

    const result = await place(table.token, [line(latte), line(soldOut)]);

    expectRejected(result, "items_unavailable");
    expect(JSON.parse(result.error?.details ?? "{}")).toEqual({ itemIds: [soldOut.id] });
    expect(await ordersOf(table)).toEqual([]);
  });

  // 4
  it("rejects an unknown item and another restaurant's item, listing both in request order", async () => {
    const table = await createTable(service, shop.id);
    const unknownId = crypto.randomUUID();

    const result = await place(table.token, [line(foreignDish), line(latte), { menuItemId: unknownId, quantity: 1 }]);

    expectRejected(result, "items_unavailable");
    expect(JSON.parse(result.error?.details ?? "{}")).toEqual({ itemIds: [foreignDish.id, unknownId] });
    expect(await ordersOf(table)).toEqual([]);
  });

  // 5
  it.each([
    ["an unknown token", "no-such-token"],
    ["an empty token", ""],
    ["a null token", null],
  ])("answers invalid_table for %s", async (_label, token) => {
    expectRejected(await place(token, [line(latte)]), "invalid_table");
  });

  // 6
  it("answers table_closed when the table has no open session, or its session was closed", async () => {
    const neverOpened = await createTable(service, shop.id, { open: false });
    expectRejected(await place(neverOpened.token, [line(latte)]), "table_closed");

    const closedLater = await createTable(service, shop.id);
    const closed = await service
      .from("table_sessions")
      .update({ closed_at: new Date().toISOString() })
      .eq("id", sessionOf(closedLater));
    expect(closed.error).toBeNull();
    expectRejected(await place(closedLater.token, [line(latte)]), "table_closed");
  });

  // 7
  it("allows at most 5 orders in flight per session; served and cancelled ones don't count", async () => {
    const table = await createTable(service, shop.id);
    const placedIds: string[] = [];

    for (let i = 0; i < 5; i++) {
      const result = await place(table.token, [line(latte)]);
      expect(result.error).toBeNull();
      placedIds.push((result.data as PlacedOrder).orderId);
    }
    expectRejected(await place(table.token, [line(latte)]), "too_many_open_orders");

    await setStatus(placedIds[0]!, "served");
    expect((await place(table.token, [line(latte)])).error).toBeNull();
    expectRejected(await place(table.token, [line(latte)]), "too_many_open_orders");

    await setStatus(placedIds[1]!, "cancelled");
    expect((await place(table.token, [line(latte)])).error).toBeNull();

    // preparing and ready are still "in flight"
    await setStatus(placedIds[2]!, "preparing");
    await setStatus(placedIds[3]!, "ready");
    expectRejected(await place(table.token, [line(latte)]), "too_many_open_orders");
  });

  // 8
  it("never exceeds the cap under concurrent orders (the session row lock)", async () => {
    const table = await createTable(service, shop.id);
    const dish = await createDish(service, shop, { price: 2 });
    const existing = await service
      .from("orders")
      .insert(Array.from({ length: 3 }, () => ({ restaurant_id: shop.id, session_id: sessionOf(table), total: 1 })));
    expect(existing.error).toBeNull();

    const editor = await connectTestDb();
    const observer = await connectTestDb(); // separate connection: pg_stat_* is frozen per transaction
    try {
      // Deterministic race: an uncommitted edit of the dish stalls every caller at the dish
      // lock, which comes AFTER the cap check. Without the session row lock all 10 callers
      // would count 3 open orders and all 10 would then insert; with it they queue up.
      await editor.query("begin");
      await editor.query("update public.menu_items set price = price where id = $1", [dish.id]);

      const calls = Array.from({ length: 10 }, () => place(table.token, [line(dish)]));
      await waitUntil(async () => {
        const blocked = await observer.query<{ n: number }>(
          "select count(*)::int as n from pg_stat_activity where usename = 'authenticator' and wait_event_type = 'Lock'",
        );
        return (blocked.rows[0]?.n ?? 0) >= 10;
      }, "all 10 callers to be blocked");
      await editor.query("commit");
      const results = await Promise.all(calls);

      expect(results.filter((r) => r.error === null)).toHaveLength(2);
      expect(results.filter((r) => r.error?.message === "too_many_open_orders")).toHaveLength(8);
      const inFlight = (await ordersOf(table)).filter((o) => ["placed", "preparing", "ready"].includes(o.status));
      expect(inFlight).toHaveLength(5);
    } finally {
      await editor.query("rollback").catch(() => undefined);
      await editor.end();
      await observer.end();
    }
  });

  // 9
  it("is all-or-nothing: a failure while storing the lines leaves no order behind", async () => {
    const table = await createTable(service, shop.id);
    const probeName = `atomicity-probe-${shortId()}`;
    const probe = await createDish(service, shop, { price: 1, name: probeName });
    const trigger = `test_fail_order_items_${shortId()}`; // hex only, safe to interpolate

    const result = await withTestDb(async (db) => {
      await db.query(`
        create function public.${trigger}() returns trigger language plpgsql as $$
        begin
          if new.name = '${probeName}' then raise exception 'atomicity_probe'; end if;
          return new;
        end $$`);
      await db.query(
        `create trigger ${trigger} before insert on public.order_items for each row execute function public.${trigger}()`,
      );
      try {
        return await place(table.token, [line(probe)]);
      } finally {
        await db.query(`drop trigger if exists ${trigger} on public.order_items`);
        await db.query(`drop function if exists public.${trigger}()`);
      }
    });

    expectRejected(result, "atomicity_probe"); // the order row WAS inserted first...
    expect(await ordersOf(table)).toEqual([]); // ...and rolled back with the failure
  });

  // 10
  it("keeps past orders unchanged when the dish is later renamed or repriced", async () => {
    const table = await createTable(service, shop.id);
    const dish = await createDish(service, shop, { price: 5 });
    const placed = (await place(table.token, [line(dish, 3)])).data as PlacedOrder;

    const edit = await service.from("menu_items").update({ name: "renamed", price: 99 }).eq("id", dish.id);
    expect(edit.error).toBeNull();

    const lines = await service.from("order_items").select("name, unit_price, quantity").eq("order_id", placed.orderId);
    expect(lines.data).toEqual([{ name: dish.name, unit_price: 5, quantity: 3 }]);
    expect((await ordersOf(table))[0]?.total).toBe(15);
  });

  // 11
  describe("payload validation", () => {
    const invalidPayloads: [string, () => unknown][] = [
      ["not an array (object)", () => ({})],
      ["not an array (string)", () => "x"],
      ["null", () => null],
      ["an empty array", () => []],
      ["31 lines", () => Array.from({ length: 31 }, () => ({ menuItemId: crypto.randomUUID(), quantity: 1 }))],
      ["duplicate ids", () => [line(latte), line(latte)]],
      ["duplicate ids that differ only by letter case", () => [{ menuItemId: latte.id.toUpperCase(), quantity: 1 }, line(latte)]],
      ["quantity 0", () => [line(latte, 0)]],
      ["quantity 21", () => [line(latte, 21)]],
      ["a fractional quantity", () => [line(latte, 1.5)]],
      ["a quantity sent as a string", () => [{ menuItemId: latte.id, quantity: "2" }]],
      ["a missing quantity", () => [{ menuItemId: latte.id }]],
      ["an id that is not a uuid", () => [{ menuItemId: "not-a-uuid", quantity: 1 }]],
      ["a missing id", () => [{ quantity: 1 }]],
      ["an id sent as a number", () => [{ menuItemId: 5, quantity: 1 }]],
      ["a line that is not an object", () => [5]],
      ["notes over 200 characters", () => [line(latte, 1, "x".repeat(201))]],
      ["notes of the wrong type", () => [{ menuItemId: latte.id, quantity: 1, notes: 5 }]],
    ];

    // A fresh table per case: if one check regressed and let an order through, only its own
    // test fails instead of every later "stores nothing" assertion on a shared table.
    it.each(invalidPayloads)("rejects %s with invalid_items and stores nothing", async (_label, payload) => {
      const table = await createTable(service, shop.id);

      expectRejected(await place(table.token, payload()), "invalid_items");
      expect(await ordersOf(table)).toEqual([]);
    });

    it("accepts the boundaries: quantity 20 and notes of exactly 200 characters", async () => {
      const boundaryTable = await createTable(service, shop.id);

      const result = await place(boundaryTable.token, [line(latte, 20, "x".repeat(200))]);

      expect(result.error).toBeNull();
      expect((result.data as PlacedOrder).total).toBe(70);
    });

    it("accepts exactly 30 lines", async () => {
      const bulk = await service
        .from("menu_items")
        .insert(
          Array.from({ length: 30 }, (_, i) => ({
            restaurant_id: shop.id,
            category_id: shop.categoryId,
            name: `bulk-${i}-${shortId()}`,
            price: 1,
          })),
        )
        .select("id");
      expect(bulk.error).toBeNull();
      const thirtyTable = await createTable(service, shop.id);

      const result = await place(
        thirtyTable.token,
        (bulk.data ?? []).map((dish) => ({ menuItemId: dish.id, quantity: 1 })),
      );

      expect(result.error).toBeNull();
      expect((result.data as PlacedOrder).total).toBe(30);
    });

    it.each([
      ["spaces", "   "],
      ["tabs and line breaks", " \t\r\n "],
      ["an empty string", ""],
    ])("stores blank notes (%s) as null", async (_label, blank) => {
      const blankTable = await createTable(service, shop.id);

      const result = await place(blankTable.token, [line(latte, 1, blank)]);

      expect((result.data as PlacedOrder).items[0]?.notes).toBeNull();
    });
  });

  // beyond the doc: the FOR SHARE lock on the ordered dishes
  it("waits for a concurrent price edit to commit and then uses the new price", async () => {
    const table = await createTable(service, shop.id);
    const dish = await createDish(service, shop, { price: 5 });
    const editor = await connectTestDb();
    // A SEPARATE connection observes: pg_stat_* views are frozen per transaction,
    // so polling from inside `editor`'s transaction would only ever see the first snapshot.
    const observer = await connectTestDb();

    try {
      await editor.query("begin");
      await editor.query("update public.menu_items set price = 9.99 where id = $1", [dish.id]);

      const pending = place(table.token, [line(dish, 2)]);
      // PostgREST connects as `authenticator`: wait until its backend is blocked on our row lock.
      await waitUntil(async () => {
        const waiting = await observer.query(
          "select 1 from pg_stat_activity where usename = 'authenticator' and wait_event_type = 'Lock'",
        );
        return (waiting.rowCount ?? 0) > 0;
      }, "place_order to block on the locked dish");
      await editor.query("commit");

      const placed = (await pending).data as PlacedOrder;
      expect(placed.total).toBe(19.98);
      expect(placed.items[0]?.unitPrice).toBe(9.99);
    } finally {
      await editor.query("rollback").catch(() => undefined);
      await editor.end();
      await observer.end();
    }
  });

  // beyond the doc: a caller can't stall another restaurant's menu
  it("does not lock dishes of other restaurants, so it answers even while one is being edited", async () => {
    const table = await createTable(service, shop.id);
    const editor = await connectTestDb();

    try {
      await editor.query("begin");
      await editor.query("update public.menu_items set price = price where id = $1", [foreignDish.id]);

      // If place_order took a lock on this dish it would queue behind the edit above
      // (and be cancelled by anon's statement_timeout with a different error).
      const result = await place(table.token, [line(foreignDish)]);

      expectRejected(result, "items_unavailable");
    } finally {
      await editor.query("rollback").catch(() => undefined);
      await editor.end();
    }
  });

  // 13
  it("can also be called by a signed-in user (the authenticated role)", async () => {
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;
    if (!email || !password) throw new Error("ADMIN_EMAIL / ADMIN_PASSWORD must be set in .env.local");
    const signedIn = createAnonClient();
    const auth = await signedIn.auth.signInWithPassword({ email, password });
    expect(auth.error).toBeNull();
    const table = await createTable(service, shop.id);

    const result: RpcOutcome = await signedIn.rpc("place_order", { p_qr_token: table.token, p_items: [line(latte)] });

    expect(result.error).toBeNull();
  });
});

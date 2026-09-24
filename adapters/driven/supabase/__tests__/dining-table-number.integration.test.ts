// F1-4a: a dining table is identified by table_number (1-999, unique per restaurant),
// not a free-text label. Checked against the local Supabase stack through the service
// role (constraints apply to it too), plus the public get_table_status RPC through anon.
// Each run builds its own restaurants, so nothing depends on the seeded tables.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { type SupabaseClient } from "@supabase/supabase-js";
import {
  createAnonClient,
  createRestaurant,
  createServiceClient,
  createTable,
  removeRestaurant,
  type TestRestaurant,
} from "./support/ordering-fixtures";

const PG_CHECK_VIOLATION = "23514";
const PG_UNIQUE_VIOLATION = "23505";

describe("dining table numbers (integration)", () => {
  let service: SupabaseClient;
  let anon: SupabaseClient;
  let shop: TestRestaurant;
  // The constraint tests insert explicit numbers, so they get restaurants of their own:
  // createTable numbers a restaurant's tables from 1 and would collide with them.
  let numbered: TestRestaurant;
  let otherNumbered: TestRestaurant;
  let closedShop: TestRestaurant;

  beforeAll(async () => {
    service = createServiceClient();
    anon = createAnonClient();
    shop = await createRestaurant(service, { published: true });
    numbered = await createRestaurant(service, { published: true });
    otherNumbered = await createRestaurant(service, { published: true });
    closedShop = await createRestaurant(service, { published: false });
  });

  afterAll(async () => {
    for (const restaurant of [shop, numbered, otherNumbered, closedShop]) await removeRestaurant(service, restaurant);
  });

  function insertTable(restaurantId: string, tableNumber: number) {
    return service.from("dining_tables").insert({ restaurant_id: restaurantId, table_number: tableNumber });
  }

  describe("the table_number column", () => {
    it.each([0, 1000, -1])("rejects %s", async (tableNumber) => {
      const { error } = await insertTable(numbered.id, tableNumber);

      expect(error?.code).toBe(PG_CHECK_VIOLATION);
    });

    it.each([1, 999])("accepts the boundary %s", async (tableNumber) => {
      const { error } = await insertTable(numbered.id, tableNumber);

      expect(error).toBeNull();
    });

    it("rejects a row without a number", async () => {
      const { error } = await service.from("dining_tables").insert({ restaurant_id: numbered.id });

      expect(error?.code).toBe("23502"); // not_null_violation
    });

    it("rejects a duplicate number in the same restaurant", async () => {
      expect((await insertTable(numbered.id, 500)).error).toBeNull();

      const { error } = await insertTable(numbered.id, 500);

      expect(error?.code).toBe(PG_UNIQUE_VIOLATION);
    });

    it("accepts the same number in a second restaurant", async () => {
      expect((await insertTable(numbered.id, 501)).error).toBeNull();

      const { error } = await insertTable(otherNumbered.id, 501);

      expect(error).toBeNull();
    });

    it("no longer has a label column", async () => {
      const { error } = await service.from("dining_tables").select("label").limit(1);

      expect(error).not.toBeNull();
    });
  });

  describe("get_table_status", () => {
    async function statusOf(token: string): Promise<Record<string, unknown>[]> {
      const { data, error } = await anon.rpc("get_table_status", { p_qr_token: token });
      expect(error).toBeNull();
      return data as Record<string, unknown>[];
    }

    async function tableNumberOf(tableId: string): Promise<number> {
      const { data, error } = await service.from("dining_tables").select("table_number").eq("id", tableId).single();
      if (error) throw error;
      return data.table_number;
    }

    it("returns exactly table_number and is_open for an open table", async () => {
      const table = await createTable(service, shop.id);

      const rows = await statusOf(table.token);

      expect(rows).toEqual([{ table_number: await tableNumberOf(table.id), is_open: true }]);
      expect(Object.keys(rows[0] ?? {}).sort()).toEqual(["is_open", "table_number"]);
    });

    it("returns exactly table_number and is_open for a closed table", async () => {
      const table = await createTable(service, shop.id, { open: false });

      const rows = await statusOf(table.token);

      expect(rows).toEqual([{ table_number: await tableNumberOf(table.id), is_open: false }]);
      expect(Object.keys(rows[0] ?? {}).sort()).toEqual(["is_open", "table_number"]);
    });

    it("returns exactly table_number and is_open for a table of an unpublished restaurant", async () => {
      const table = await createTable(service, closedShop.id);

      const rows = await statusOf(table.token);

      expect(rows).toEqual([{ table_number: await tableNumberOf(table.id), is_open: false }]);
      expect(Object.keys(rows[0] ?? {}).sort()).toEqual(["is_open", "table_number"]);
    });

    it("returns zero rows for an unknown token", async () => {
      expect(await statusOf("no-such-token")).toEqual([]);
    });
  });
});

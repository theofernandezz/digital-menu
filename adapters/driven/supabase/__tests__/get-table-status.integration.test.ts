// Integration tests for the get_table_status RPC (docs/customer-ordering.md,
// section 4, test 14), called through the REST API with the public anon key.
// Run with: docker compose run --rm --no-deps app pnpm test:integration
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

type StatusRow = { label: string; is_open: boolean };

describe("get_table_status (integration)", () => {
  let service: SupabaseClient;
  let anon: SupabaseClient;
  let shop: TestRestaurant;
  let closedShop: TestRestaurant;

  beforeAll(async () => {
    service = createServiceClient();
    anon = createAnonClient();
    shop = await createRestaurant(service, { published: true });
    closedShop = await createRestaurant(service, { published: false });
  });

  afterAll(async () => {
    for (const restaurant of [shop, closedShop]) await removeRestaurant(service, restaurant);
  });

  async function statusOf(token: string | null): Promise<StatusRow[]> {
    const { data, error } = await anon.rpc("get_table_status", { p_qr_token: token });
    expect(error).toBeNull();
    return data as StatusRow[];
  }

  async function labelOf(tableId: string): Promise<string> {
    const { data, error } = await service.from("dining_tables").select("label").eq("id", tableId).single();
    if (error) throw error;
    return data.label;
  }

  it("reports a table with an open session as open, and exposes only its label and state", async () => {
    const table = await createTable(service, shop.id);

    const rows = await statusOf(table.token);

    expect(rows).toEqual([{ label: await labelOf(table.id), is_open: true }]);
    expect(Object.keys(rows[0] ?? {}).sort()).toEqual(["is_open", "label"]); // never the token
  });

  it("reports a table without an open session as closed", async () => {
    const neverOpened = await createTable(service, shop.id, { open: false });
    expect((await statusOf(neverOpened.token))[0]?.is_open).toBe(false);

    const closedLater = await createTable(service, shop.id);
    const closed = await service
      .from("table_sessions")
      .update({ closed_at: new Date().toISOString() })
      .eq("id", closedLater.sessionId ?? "");
    expect(closed.error).toBeNull();
    expect((await statusOf(closedLater.token))[0]?.is_open).toBe(false);
  });

  it("reports a table of an unpublished restaurant as closed even with an open session", async () => {
    const table = await createTable(service, closedShop.id);

    expect((await statusOf(table.token))[0]?.is_open).toBe(false);
  });

  it.each([
    ["an unknown token", "no-such-token"],
    ["an empty token", ""],
    ["a null token", null],
  ])("returns no rows for %s", async (_label, token) => {
    expect(await statusOf(token)).toEqual([]);
  });
});

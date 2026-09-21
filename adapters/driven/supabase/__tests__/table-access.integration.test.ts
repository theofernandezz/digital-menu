// Integration tests for the customer-ordering schema's access model
// (docs/customer-ordering.md, section 3) against the local Supabase stack. Run with:
//   docker compose run --rm --no-deps app pnpm test:integration
//
// Two layers protect these tables and each needs its own test:
//   - GRANTs (anon has none; authenticated only what the model allows), checked
//     through the 42501 "permission denied for table" error;
//   - RLS (an authenticated user who does NOT own the restaurant sees and
//     touches nothing), checked with a second, unrelated user. Without that
//     second user, disabling RLS or dropping a policy would go unnoticed.
// Each run creates its own table, order and second user, so nothing here
// depends on the seeded dev-table-* rows.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";
import { getMyRestaurantUseCase } from "@/composition/container";

const PG_INSUFFICIENT_PRIVILEGE = "42501";
const PG_UNIQUE_VIOLATION = "23505";

const ORDERING_TABLES = ["dining_tables", "table_sessions", "orders", "order_items"] as const;

function newAnonKeyClient(): SupabaseClient {
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

describe("customer ordering tables (integration)", () => {
  let anonClient: SupabaseClient;
  let adminClient: SupabaseClient;
  let otherOwnerClient: SupabaseClient;
  let serviceClient: SupabaseClient;
  let restaurantId: string;
  let otherOwnerId: string;
  let diningTableId: string;
  let firstSessionId: string;
  let orderId: string;

  beforeAll(async () => {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminEmail || !adminPassword) throw new Error("ADMIN_EMAIL / ADMIN_PASSWORD must be set in .env.local");

    anonClient = newAnonKeyClient();

    adminClient = newAnonKeyClient();
    const adminSignIn = await adminClient.auth.signInWithPassword({ email: adminEmail, password: adminPassword });
    if (adminSignIn.error || !adminSignIn.data.session) throw adminSignIn.error ?? new Error("Sign-in produced no session");

    restaurantId = (await getMyRestaurantUseCase(adminClient).execute()).id;

    // A second, authenticated user who owns no restaurant.
    serviceClient = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
    const otherEmail = `other-owner-${crypto.randomUUID().slice(0, 8)}@local.test`;
    const otherPassword = `pw-${crypto.randomUUID()}`;
    const created = await serviceClient.auth.admin.createUser({ email: otherEmail, password: otherPassword, email_confirm: true });
    if (created.error) throw created.error;
    otherOwnerId = created.data.user.id;

    otherOwnerClient = newAnonKeyClient();
    const otherSignIn = await otherOwnerClient.auth.signInWithPassword({ email: otherEmail, password: otherPassword });
    if (otherSignIn.error) throw otherSignIn.error;

    const table = await adminClient
      .from("dining_tables")
      .insert({ restaurant_id: restaurantId, label: `test-${crypto.randomUUID().slice(0, 8)}` })
      .select("id")
      .single();
    if (table.error) throw table.error;
    diningTableId = table.data.id;

    const session = await adminClient
      .from("table_sessions")
      .insert({ restaurant_id: restaurantId, dining_table_id: diningTableId })
      .select("id")
      .single();
    if (session.error) throw session.error;
    firstSessionId = session.data.id;

    // Nobody but place_order (F1-2) may create orders, so the fixture goes in
    // through the service role, which bypasses grants and RLS.
    const order = await serviceClient
      .from("orders")
      .insert({ restaurant_id: restaurantId, session_id: firstSessionId, total: 5 })
      .select("id")
      .single();
    if (order.error) throw order.error;
    orderId = order.data.id;

    const line = await serviceClient
      .from("order_items")
      .insert({ order_id: orderId, restaurant_id: restaurantId, name: "Test item", unit_price: 5, quantity: 1 });
    if (line.error) throw line.error;
  });

  afterAll(async () => {
    // orders.session_id has no cascade, so the order (and its lines) must go
    // before the table (which cascades to its sessions). Deleting the table as
    // the owner also proves the owner's DELETE grant still works.
    const removedOrder = await serviceClient.from("orders").delete().eq("id", orderId);
    const removedTable = await adminClient.from("dining_tables").delete().eq("id", diningTableId);
    const removedUser = await serviceClient.auth.admin.deleteUser(otherOwnerId);

    if (removedOrder.error) throw removedOrder.error;
    if (removedTable.error) throw removedTable.error;
    if (removedUser.error) throw removedUser.error;
  });

  describe.each(ORDERING_TABLES)("anon on %s", (table) => {
    it("cannot select", async () => {
      const { data, error } = await anonClient.from(table).select("*");

      expect(error?.code).toBe(PG_INSUFFICIENT_PRIVILEGE);
      expect(data).toBeNull();
    });

    it("cannot insert", async () => {
      const { error } = await anonClient.from(table).insert({});

      // A missing grant and an RLS rejection share code 42501; only the
      // grant layer says "permission denied for table". Asserting on it keeps
      // this test from passing merely because RLS happened to block the row.
      expect(error?.code).toBe(PG_INSUFFICIENT_PRIVILEGE);
      expect(error?.message).toMatch(/permission denied for table/);
    });
  });

  describe("the owner", () => {
    it("reads its own dining table, whose default token is random", async () => {
      const { data, error } = await adminClient.from("dining_tables").select("id, qr_token").eq("id", diningTableId);

      expect(error).toBeNull();
      expect(data).toHaveLength(1);
      expect(data?.[0]?.qr_token).toMatch(/^[0-9a-f]{32}$/);
    });

    it("reads its own sessions", async () => {
      const { data, error } = await adminClient.from("table_sessions").select("id").eq("id", firstSessionId);

      expect(error).toBeNull();
      expect(data).toHaveLength(1);
    });

    it("reads its own orders and order lines", async () => {
      const orders = await adminClient.from("orders").select("id, total").eq("id", orderId);
      const lines = await adminClient.from("order_items").select("name").eq("order_id", orderId);

      expect(orders.error).toBeNull();
      expect(orders.data).toHaveLength(1);
      expect(lines.error).toBeNull();
      expect(lines.data).toHaveLength(1);
    });

    it("updates its own dining table", async () => {
      const renamed = `renamed-${crypto.randomUUID().slice(0, 8)}`;

      const { data, error } = await adminClient
        .from("dining_tables")
        .update({ label: renamed })
        .eq("id", diningTableId)
        .select("label")
        .single();

      expect(error).toBeNull();
      expect(data?.label).toBe(renamed);
    });

    it("cannot insert orders directly (they are created through place_order only)", async () => {
      const { error } = await adminClient
        .from("orders")
        .insert({ restaurant_id: restaurantId, session_id: firstSessionId, total: 1 });

      expect(error?.code).toBe(PG_INSUFFICIENT_PRIVILEGE);
      expect(error?.message).toMatch(/permission denied for table/);
    });
  });

  describe("an authenticated user who owns no restaurant", () => {
    it.each(ORDERING_TABLES)("sees no rows of %s", async (table) => {
      const { data, error } = await otherOwnerClient.from(table).select("*").eq("restaurant_id", restaurantId);

      expect(error).toBeNull();
      expect(data).toEqual([]);
    });

    it("cannot create a dining table under someone else's restaurant", async () => {
      const { error } = await otherOwnerClient
        .from("dining_tables")
        .insert({ restaurant_id: restaurantId, label: `intruder-${crypto.randomUUID().slice(0, 8)}` });

      expect(error?.code).toBe(PG_INSUFFICIENT_PRIVILEGE);
      expect(error?.message).toMatch(/row-level security/);
    });

    it("cannot open a session on someone else's table", async () => {
      // The first session is still open at this point, so the unique index
      // would also reject a duplicate; the RLS check must fire first.
      const { error } = await otherOwnerClient
        .from("table_sessions")
        .insert({ restaurant_id: restaurantId, dining_table_id: diningTableId });

      expect(error?.code).toBe(PG_INSUFFICIENT_PRIVILEGE);
      expect(error?.message).toMatch(/row-level security/);
    });

    it("cannot update or delete someone else's dining table", async () => {
      const updated = await otherOwnerClient
        .from("dining_tables")
        .update({ label: "hijacked" })
        .eq("id", diningTableId)
        .select("id");
      const deleted = await otherOwnerClient.from("dining_tables").delete().eq("id", diningTableId).select("id");

      // RLS filters the row out instead of raising: no error, zero rows touched.
      expect(updated.data).toEqual([]);
      expect(deleted.data).toEqual([]);

      const still = await adminClient.from("dining_tables").select("label").eq("id", diningTableId).single();
      expect(still.data?.label).not.toBe("hijacked");
    });
  });

  describe("table sessions", () => {
    it("allow only one open session per table", async () => {
      const { error } = await adminClient
        .from("table_sessions")
        .insert({ restaurant_id: restaurantId, dining_table_id: diningTableId });

      expect(error?.code).toBe(PG_UNIQUE_VIOLATION);
    });

    it("allow a new session once the previous one is closed", async () => {
      const closed = await adminClient
        .from("table_sessions")
        .update({ closed_at: new Date().toISOString() })
        .eq("id", firstSessionId);
      expect(closed.error).toBeNull();

      const reopened = await adminClient
        .from("table_sessions")
        .insert({ restaurant_id: restaurantId, dining_table_id: diningTableId });

      expect(reopened.error).toBeNull();
    });
  });
});

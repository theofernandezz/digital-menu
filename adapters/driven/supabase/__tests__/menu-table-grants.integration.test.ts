// The five menu tables must not carry more privileges than the baseline
// intended: anon reads, only the owner writes (through RLS). Checked at the
// GRANT layer — "permission denied for table" — not just "RLS blocked the row".
// See supabase/migrations/20260921120000_tighten_existing_grants.sql. Run with:
//   docker compose run --rm --no-deps app pnpm test:integration
//
// Limit: PostgREST only exposes select/insert/update/delete, so the other
// privileges (TRUNCATE, REFERENCES, TRIGGER, MAINTAIN) cannot be probed here.
// db-catalog.integration.test.ts checks those (and PUBLIC) through the catalog.
import { beforeAll, describe, expect, it } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

const PG_INSUFFICIENT_PRIVILEGE = "42501";
const ANY_UUID = "00000000-0000-4000-8000-00000000ffff";

// Per table: a column to filter on (menu_item_tags has no id) and a payload
// for update that names a column the table really has, so the request reaches
// the privilege check instead of failing on an unknown column.
const MENU_TABLES = [
  ["restaurants", "id", { name: "x" }],
  ["categories", "id", { name: "x" }],
  ["menu_items", "id", { name: "x" }],
  ["tags", "id", { name: "x" }],
  ["menu_item_tags", "menu_item_id", { tag_id: ANY_UUID }],
] as const;

describe("anon on the menu tables (integration)", () => {
  let anonClient: SupabaseClient;

  beforeAll(() => {
    anonClient = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  });

  describe.each(MENU_TABLES)("%s", (table, filterColumn, updatePayload) => {
    it("can still read (the public menu depends on it)", async () => {
      const { error } = await anonClient.from(table).select("*").limit(1);

      expect(error).toBeNull();
    });

    it("cannot insert", async () => {
      const { error } = await anonClient.from(table).insert({});

      expect(error?.code).toBe(PG_INSUFFICIENT_PRIVILEGE);
      expect(error?.message).toMatch(/permission denied for table/);
    });

    it("cannot update", async () => {
      const { error } = await anonClient.from(table).update(updatePayload).eq(filterColumn, ANY_UUID);

      // With the grant present but no RLS policy this would be a silent
      // zero-row update, not an error — so the error itself proves the grant is gone.
      expect(error?.code).toBe(PG_INSUFFICIENT_PRIVILEGE);
      expect(error?.message).toMatch(/permission denied for table/);
    });

    it("cannot delete", async () => {
      const { error } = await anonClient.from(table).delete().eq(filterColumn, ANY_UUID);

      expect(error?.code).toBe(PG_INSUFFICIENT_PRIVILEGE);
      expect(error?.message).toMatch(/permission denied for table/);
    });
  });
});

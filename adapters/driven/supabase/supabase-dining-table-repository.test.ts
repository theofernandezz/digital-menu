// Unit test of the adapter's translation layer: Postgres error codes in, domain
// errors out, and row shape to entity. The client is a stub — no network. The
// real round trip is in __tests__/dining-tables.integration.test.ts.
import { describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SupabaseDiningTableRepository } from "@/adapters/driven/supabase/supabase-dining-table-repository";
import { SupabaseAdapterError } from "@/adapters/driven/supabase/errors";
import { AlreadyOpenError, DuplicateTableNumberError } from "@/domain/errors/table-errors";

type Outcome = { data: unknown; error: { code?: string; message: string } | null };

// A chainable, awaitable stand-in for the PostgREST query builder.
function repoReturning(outcome: Outcome | Error): SupabaseDiningTableRepository {
  const builder: Record<string, unknown> = {};
  const chain = () => builder;
  for (const method of ["select", "insert", "update", "eq", "is", "order", "single", "maybeSingle"]) {
    builder[method] = chain;
  }
  builder.then = (resolve: (value: Outcome) => unknown, reject: (reason: unknown) => unknown) =>
    outcome instanceof Error ? reject(outcome) : resolve(outcome);
  const client = { from: () => builder } as unknown as SupabaseClient;
  return new SupabaseDiningTableRepository(client);
}

const row = (sessions: { id: string }[] | undefined) => ({
  id: "11111111-1111-4111-8111-111111111111",
  restaurant_id: "22222222-2222-4222-8222-222222222222",
  table_number: 8,
  qr_token: "tok",
  table_sessions: sessions,
});

const unique = { data: null, error: { code: "23505", message: 'duplicate key value violates unique constraint "x"' } };
const other = { data: null, error: { code: "42501", message: "permission denied for table dining_tables" } };
const ARGS = { restaurantId: "22222222-2222-4222-8222-222222222222", tableNumber: 8 };
const OPEN_ARGS = { tableId: "11111111-1111-4111-8111-111111111111", restaurantId: ARGS.restaurantId };

describe("SupabaseDiningTableRepository", () => {
  it("maps rows to entities: an open session means isOpen, none or missing means closed", async () => {
    const tables = await repoReturning({ data: [row([{ id: "s" }]), row([]), row(undefined)], error: null }).findByRestaurant(
      ARGS.restaurantId,
    );

    expect(tables.map((t) => t.isOpen)).toEqual([true, false, false]);
    expect(tables[0]).toMatchObject({ tableNumber: 8, qrToken: "tok", restaurantId: ARGS.restaurantId });
  });

  it("returns null when findById finds nothing (missing or hidden by RLS)", async () => {
    expect(await repoReturning({ data: null, error: null }).findById(OPEN_ARGS.tableId)).toBeNull();
  });

  it("maps 23505 on create to DuplicateTableNumberError", async () => {
    await expect(repoReturning(unique).create(ARGS)).rejects.toBeInstanceOf(DuplicateTableNumberError);
  });

  it("maps 23505 on openSession to AlreadyOpenError", async () => {
    await expect(repoReturning(unique).openSession(OPEN_ARGS)).rejects.toBeInstanceOf(AlreadyOpenError);
  });

  it.each([
    ["findByRestaurant", (r: SupabaseDiningTableRepository) => r.findByRestaurant(ARGS.restaurantId)],
    ["findById", (r: SupabaseDiningTableRepository) => r.findById(OPEN_ARGS.tableId)],
    ["create", (r: SupabaseDiningTableRepository) => r.create(ARGS)],
    ["openSession", (r: SupabaseDiningTableRepository) => r.openSession(OPEN_ARGS)],
    ["closeSession", (r: SupabaseDiningTableRepository) => r.closeSession(OPEN_ARGS.tableId)],
  ])("turns any other error in %s into a SupabaseAdapterError", async (_name, call) => {
    const failure = await call(repoReturning(other)).catch((e: unknown) => e);
    expect(failure).toBeInstanceOf(SupabaseAdapterError);
    expect(failure).not.toBeInstanceOf(DuplicateTableNumberError);
    expect(failure).not.toBeInstanceOf(AlreadyOpenError);
  });

  it("does not map 23505 outside create/openSession", async () => {
    await expect(repoReturning(unique).closeSession(OPEN_ARGS.tableId)).rejects.toBeInstanceOf(SupabaseAdapterError);
  });
});

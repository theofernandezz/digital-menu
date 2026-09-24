// Integration test of the admin tables use cases against the local Supabase
// stack, through the real adapter and the owner's RLS policies. Run with:
//   docker compose run --rm --no-deps app pnpm test:integration
//
// Two owners, each with a freshly created restaurant (support/ordering-fixtures),
// so nothing depends on the seeded tables and repeated runs cannot collide.
// afterAll removes both restaurants and users.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";
import {
  closeTableUseCase,
  createTableUseCase,
  listTablesUseCase,
  openTableUseCase,
} from "@/composition/container";
import { NotFoundError, UnauthorizedError } from "@/domain/errors/domain-errors";
import { AlreadyOpenError, DuplicateTableNumberError } from "@/domain/errors/table-errors";
import {
  createRestaurant,
  createServiceClient,
  removeRestaurant,
  type TestRestaurant,
} from "@/adapters/driven/supabase/__tests__/support/ordering-fixtures";

type Owner = { restaurant: TestRestaurant; client: SupabaseClient };

async function signedInOwner(service: SupabaseClient): Promise<Owner> {
  const restaurant = await createRestaurant(service, { published: false });
  const email = `tables-${crypto.randomUUID().slice(0, 8)}@local.test`;
  const password = `pw-${crypto.randomUUID()}`;
  const updated = await service.auth.admin.updateUserById(restaurant.ownerId, { email, password });
  if (updated.error) throw updated.error;

  const client = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const signIn = await client.auth.signInWithPassword({ email, password });
  if (signIn.error) throw signIn.error;
  return { restaurant, client };
}

describe("dining tables (integration)", () => {
  let service: SupabaseClient;
  let owner: Owner;
  let other: Owner;

  beforeAll(async () => {
    service = createServiceClient();
    owner = await signedInOwner(service);
    other = await signedInOwner(service);
  });

  afterAll(async () => {
    if (owner) await removeRestaurant(service, owner.restaurant);
    if (other) await removeRestaurant(service, other.restaurant);
  });

  const restaurantId = (): string => owner.restaurant.id;
  const openSessions = async (tableId: string) => {
    const { data, error } = await service
      .from("table_sessions")
      .select("id, restaurant_id")
      .eq("dining_table_id", tableId)
      .is("closed_at", null);
    if (error) throw error;
    return data;
  };

  it("creates tables (1, 999 and a string number) and lists them ordered by number, all closed", async () => {
    const create = createTableUseCase(owner.client);
    const t10 = await create.execute({ restaurantId: restaurantId(), tableNumber: "10" });
    await create.execute({ restaurantId: restaurantId(), tableNumber: 999 });
    await create.execute({ restaurantId: restaurantId(), tableNumber: 1 });

    const listed = await listTablesUseCase(owner.client).execute({ restaurantId: restaurantId() });

    expect(listed.map((t) => t.tableNumber)).toEqual([1, 10, 999]);
    expect(listed.every((t) => !t.isOpen)).toBe(true);
    expect(t10.tableNumber).toBe(10);
    expect(t10.qrToken.length).toBeGreaterThan(0);
  });

  it("rejects a duplicate number in the same restaurant, but not in another one", async () => {
    await expect(
      createTableUseCase(owner.client).execute({ restaurantId: restaurantId(), tableNumber: 10 }),
    ).rejects.toBeInstanceOf(DuplicateTableNumberError);

    const inOther = await createTableUseCase(other.client).execute({
      restaurantId: other.restaurant.id,
      tableNumber: 10,
    });
    expect(inOther.tableNumber).toBe(10);
  });

  it("opens a table, stores the table's own restaurant on the session, and rejects a second open", async () => {
    const [table] = await listTablesUseCase(owner.client).execute({ restaurantId: restaurantId() });
    // A foreign restaurantId from the caller is ignored.
    await openTableUseCase(owner.client).execute({ id: table!.id, restaurantId: other.restaurant.id });

    const sessions = await openSessions(table!.id);
    expect(sessions).toHaveLength(1);
    expect(sessions[0]!.restaurant_id).toBe(restaurantId());

    await expect(openTableUseCase(owner.client).execute({ id: table!.id })).rejects.toBeInstanceOf(AlreadyOpenError);
    expect(await openSessions(table!.id)).toHaveLength(1);

    const listed = await listTablesUseCase(owner.client).execute({ restaurantId: restaurantId() });
    expect(listed.map((t) => [t.tableNumber, t.isOpen])).toEqual([
      [1, true],
      [10, false],
      [999, false],
    ]);
  });

  it("closes an open table, is idempotent on a closed one, and lets it be reopened", async () => {
    const [table] = await listTablesUseCase(owner.client).execute({ restaurantId: restaurantId() });

    await closeTableUseCase(owner.client).execute({ id: table!.id });
    expect(await openSessions(table!.id)).toHaveLength(0);

    const before = await service.from("table_sessions").select("id, closed_at").eq("dining_table_id", table!.id);
    await closeTableUseCase(owner.client).execute({ id: table!.id });
    const after = await service.from("table_sessions").select("id, closed_at").eq("dining_table_id", table!.id);
    expect(after.data).toEqual(before.data);

    await openTableUseCase(owner.client).execute({ id: table!.id });
    expect(await openSessions(table!.id)).toHaveLength(1);
  });

  it("gives a second owner an empty view of the first owner's tables and NotFoundError on open and close", async () => {
    const [table] = await listTablesUseCase(owner.client).execute({ restaurantId: restaurantId() });
    // Precondition for the assertions below: this table is open, so a wrongly succeeding close would show.
    expect(table!.isOpen).toBe(true);

    // The other owner asking for the first restaurant's list is refused by the ownership check.
    await expect(listTablesUseCase(other.client).execute({ restaurantId: restaurantId() })).rejects.toBeInstanceOf(
      UnauthorizedError,
    );

    // Their own list only ever has their table.
    const theirs = await listTablesUseCase(other.client).execute({ restaurantId: other.restaurant.id });
    expect(theirs.map((t) => t.tableNumber)).toEqual([10]);

    await expect(openTableUseCase(other.client).execute({ id: table!.id })).rejects.toBeInstanceOf(NotFoundError);
    await expect(closeTableUseCase(other.client).execute({ id: table!.id })).rejects.toBeInstanceOf(NotFoundError);
    expect(await openSessions(table!.id)).toHaveLength(1);
  });

  it("rejects an anonymous client before touching the database", async () => {
    const anon = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    await expect(listTablesUseCase(anon).execute({ restaurantId: restaurantId() })).rejects.toBeInstanceOf(UnauthorizedError);
    await expect(createTableUseCase(anon).execute({ restaurantId: restaurantId(), tableNumber: 5 })).rejects.toBeInstanceOf(
      UnauthorizedError,
    );
  });
});

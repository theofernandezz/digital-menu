// Fixtures for the ordering integration tests. Every test file builds its own
// restaurants, owners, dishes and tables through the service role (which
// bypasses grants and RLS) and removes them afterwards, so nothing depends on
// the seeded data and nothing else depends on it.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

const shortId = (): string => crypto.randomUUID().slice(0, 8);

export function createServiceClient(): SupabaseClient {
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
}

export function createAnonClient(): SupabaseClient {
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export type TestRestaurant = { id: string; ownerId: string; categoryId: string };
export type TestDish = { id: string; name: string; price: number };
export type TestTable = { id: string; token: string; sessionId: string | null };

export async function createRestaurant(
  service: SupabaseClient,
  options: { published: boolean },
): Promise<TestRestaurant> {
  const user = await service.auth.admin.createUser({
    email: `owner-${shortId()}@local.test`,
    password: `pw-${crypto.randomUUID()}`,
    email_confirm: true,
  });
  if (user.error) throw user.error;

  const restaurant = await service
    .from("restaurants")
    .insert({
      owner_id: user.data.user.id,
      name: `Test restaurant ${shortId()}`,
      slug: `test-${shortId()}`,
      is_published: options.published,
    })
    .select("id")
    .single();
  if (restaurant.error) throw restaurant.error;

  const category = await service
    .from("categories")
    .insert({ restaurant_id: restaurant.data.id, name: "Test category" })
    .select("id")
    .single();
  if (category.error) throw category.error;

  return { id: restaurant.data.id, ownerId: user.data.user.id, categoryId: category.data.id };
}

// Deleting a restaurant cascades to its tables, sessions, orders and lines in one
// statement (checked), so this would work without the first delete. Deleting a single
// TABLE or SESSION that has orders does fail (orders.session_id has no cascade —
// history is kept), which is why orders are removed explicitly and first here.
export async function removeRestaurant(service: SupabaseClient, restaurant: TestRestaurant): Promise<void> {
  const orders = await service.from("orders").delete().eq("restaurant_id", restaurant.id);
  const restaurants = await service.from("restaurants").delete().eq("id", restaurant.id);
  const user = await service.auth.admin.deleteUser(restaurant.ownerId);

  if (orders.error) throw orders.error;
  if (restaurants.error) throw restaurants.error;
  if (user.error) throw user.error;
}

export async function createDish(
  service: SupabaseClient,
  restaurant: TestRestaurant,
  options: { price: number; name?: string; isAvailable?: boolean },
): Promise<TestDish> {
  const name = options.name ?? `dish-${shortId()}`;
  const dish = await service
    .from("menu_items")
    .insert({
      restaurant_id: restaurant.id,
      category_id: restaurant.categoryId,
      name,
      price: options.price,
      is_available: options.isAvailable ?? true,
    })
    .select("id")
    .single();
  if (dish.error) throw dish.error;

  return { id: dish.data.id, name, price: options.price };
}

// Table numbers are 1-999 and unique per restaurant. Every test file builds its own
// restaurants, so numbering each restaurant's tables from 1 cannot collide across
// files or across repeated runs, and never grows past a handful.
const nextTableNumber = new Map<string, number>();

// A table with a random token, and (by default) an open session.
export async function createTable(
  service: SupabaseClient,
  restaurantId: string,
  options: { open?: boolean } = {},
): Promise<TestTable> {
  const tableNumber = (nextTableNumber.get(restaurantId) ?? 0) + 1;
  nextTableNumber.set(restaurantId, tableNumber);

  const table = await service
    .from("dining_tables")
    .insert({ restaurant_id: restaurantId, table_number: tableNumber })
    .select("id, qr_token")
    .single();
  if (table.error) throw table.error;

  let sessionId: string | null = null;
  if (options.open ?? true) {
    const session = await service
      .from("table_sessions")
      .insert({ restaurant_id: restaurantId, dining_table_id: table.data.id })
      .select("id")
      .single();
    if (session.error) throw session.error;
    sessionId = session.data.id;
  }

  return { id: table.data.id, token: table.data.qr_token, sessionId };
}

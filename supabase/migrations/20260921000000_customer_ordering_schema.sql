-- Feature 1 (customer ordering): tables, table sessions, orders and order lines.
-- Design and rationale: docs/customer-ordering.md, section 3.
--
-- The RPCs (place_order, get_table_status) are a separate migration (F1-2).
-- Seed data for local dev lives in supabase/seed.sql, never here.

create type order_status as enum
  ('placed', 'preparing', 'ready', 'served', 'cancelled');
-- Feature 1 only ever writes 'placed'. The full set is created now so
-- Feature 2 doesn't need a type change.

create table dining_tables (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  label         text not null,
  qr_token      text not null unique
                default replace(gen_random_uuid()::text, '-', ''),
  created_at    timestamptz not null default now(),
  unique (restaurant_id, label)
);

-- TODO: restaurant_id is denormalized on table_sessions, orders and
-- order_items (same trade-off as menu_items) and nothing at the DB level
-- forces it to match the parent row's restaurant: an owner could insert
-- through PostgREST a session pointing at ANOTHER restaurant's table, since
-- FK checks bypass RLS. place_order (F1-2) derives restaurant_id from the
-- table and the openTable use case (F1-4) must too, but only composite FKs
-- such as (dining_table_id, restaurant_id) -> dining_tables(id, restaurant_id)
-- would enforce it in the database. Low risk in v1, so deferred: exploiting
-- it needs a second restaurant row (nothing at the DB level limits restaurants
-- to one, and the hosted project's sign-up setting was not checked) plus the
-- target table's UUID, which only its owner can read. Do it when multi-tenant
-- work starts.
create table table_sessions (
  id              uuid primary key default gen_random_uuid(),
  restaurant_id   uuid not null references restaurants(id) on delete cascade,
  dining_table_id uuid not null references dining_tables(id) on delete cascade,
  opened_at       timestamptz not null default now(),
  closed_at       timestamptz
);
create unique index one_open_session_per_table
  on table_sessions (dining_table_id) where closed_at is null;

create table orders (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  session_id    uuid not null references table_sessions(id),
  status        order_status not null default 'placed',
  total         numeric(10,2) not null check (total >= 0),
  placed_at     timestamptz not null default now()
);

-- name and unit_price are snapshots: an order is a historical record, so
-- editing or deleting a menu item must not rewrite past orders.
create table order_items (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references orders(id) on delete cascade,
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  menu_item_id  uuid references menu_items(id) on delete set null,
  name          text not null,
  unit_price    numeric(10,2) not null,
  quantity      int not null check (quantity between 1 and 20),
  notes         text check (char_length(notes) <= 200)
);

create index orders_session_status_idx on orders (session_id, status);
create index orders_restaurant_id_idx on orders (restaurant_id);
create index order_items_order_idx on order_items (order_id);
create index order_items_menu_item_id_idx on order_items (menu_item_id);
create index table_sessions_dining_table_id_idx on table_sessions (dining_table_id);

-- The QR token is a credential: anyone who can read dining_tables can read
-- every token. anon gets no direct access to any of these tables — customers
-- go through the RPCs only.
alter table dining_tables enable row level security;
alter table table_sessions enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;

-- Local Supabase auto-grants ALL on new public tables to anon and
-- authenticated (default privileges); newer hosted projects don't, but an
-- older one may still have them. Revoke first so every environment ends up
-- identical, then grant only what's needed.
revoke all on dining_tables, table_sessions, orders, order_items from anon, authenticated;
grant select, insert, update, delete on dining_tables, table_sessions to authenticated;
grant select on orders, order_items to authenticated;

create policy "owner manages dining_tables" on dining_tables
  for all using (auth.uid() = (select owner_id from restaurants where id = dining_tables.restaurant_id));

create policy "owner manages table_sessions" on table_sessions
  for all using (auth.uid() = (select owner_id from restaurants where id = table_sessions.restaurant_id));

create policy "owner reads orders" on orders
  for select using (auth.uid() = (select owner_id from restaurants where id = orders.restaurant_id));

create policy "owner reads order_items" on order_items
  for select using (auth.uid() = (select owner_id from restaurants where id = order_items.restaurant_id));

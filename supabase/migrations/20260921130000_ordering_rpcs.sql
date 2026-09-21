-- Feature 1 (customer ordering), F1-2: the two functions customers use.
-- Design and rationale: docs/customer-ordering.md, section 4.
--
-- Both run as their owner (security definer) and therefore bypass RLS on the
-- ordering tables, which anon cannot touch: each function does ALL its own
-- validation, because anyone holding the public anon key can call them directly.
-- search_path is pinned to empty and every object is schema-qualified, so
-- nothing can be hijacked through a look-alike object in another schema.
--
-- Errors are raised as `raise exception '<code>'`: the machine-readable code
-- is the message, extra data (item ids) goes in DETAIL as JSON. Any failure
-- rolls back the whole call, so an order and its lines are all-or-nothing.
--
-- Deviations from the design doc, on purpose:
--  * menu_items has no is_published column (it lives on restaurants), so
--    "orderable" is: item available AND belongs to the table's restaurant, and
--    the restaurant itself must be published.
--  * An unpublished restaurant answers `table_closed` (ordering unavailable),
--    not `items_unavailable`, which would make the UI flag every dish.
--  * The whole payload is validated up front (uuid shape, integer quantity,
--    notes type and length); otherwise a malformed value would surface as a
--    raw cast error instead of `invalid_items`. Notes are trimmed of spaces,
--    tabs and line breaks (not every Unicode space); blank becomes null.
--  * The menu_items rows being ordered are locked FOR SHARE, so a price or
--    availability edit cannot land between computing the total and storing
--    the lines.

create function public.get_table_status(p_qr_token text)
returns table (label text, is_open boolean)
language sql
stable
security definer
set search_path = ''
as $$
  -- "Open" means the waiter opened a session AND the restaurant is published.
  -- Zero rows means the token is unknown. The token itself is never returned.
  select t.label,
         (r.is_published
          and exists (
            select 1 from public.table_sessions s
            where s.dining_table_id = t.id and s.closed_at is null
          ))
  from public.dining_tables t
  join public.restaurants r on r.id = t.restaurant_id
  where t.qr_token = p_qr_token
$$;

create function public.place_order(p_qr_token text, p_items jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  c_max_lines constant int := 30;
  c_max_quantity constant int := 20;
  c_max_notes constant int := 200;
  c_trim_chars constant text := E' \t\r\n'; -- what "trimmed" means for notes: spaces, tabs, line breaks
  c_max_open_orders constant int := 5;

  v_elem jsonb;
  v_quantity numeric;
  v_lines jsonb;
  v_table public.dining_tables%rowtype;
  v_session public.table_sessions%rowtype;
  v_published boolean;
  v_open_orders int;
  v_bad uuid[];
  v_order_id uuid;
  v_total numeric(10,2);
  v_placed_at timestamptz;
  v_items jsonb;
begin
  -- 1. Validate the payload before touching any table.
  if p_items is null
     or jsonb_typeof(p_items) <> 'array'
     or jsonb_array_length(p_items) not between 1 and c_max_lines then
    raise exception 'invalid_items';
  end if;

  for v_elem in select value from jsonb_array_elements(p_items) loop
    if jsonb_typeof(v_elem) <> 'object' then
      raise exception 'invalid_items';
    end if;

    if jsonb_typeof(v_elem -> 'menuItemId') is distinct from 'string'
       or (v_elem ->> 'menuItemId') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
      raise exception 'invalid_items';
    end if;

    if jsonb_typeof(v_elem -> 'quantity') is distinct from 'number' then
      raise exception 'invalid_items';
    end if;
    v_quantity := (v_elem ->> 'quantity')::numeric;
    if v_quantity <> trunc(v_quantity) or v_quantity < 1 or v_quantity > c_max_quantity then
      raise exception 'invalid_items';
    end if;

    -- notes is optional; when present it must be a string (or null) that fits
    -- the column's limit once trimmed.
    if v_elem ? 'notes' then
      if jsonb_typeof(v_elem -> 'notes') not in ('string', 'null') then
        raise exception 'invalid_items';
      end if;
      if char_length(btrim(v_elem ->> 'notes', c_trim_chars)) > c_max_notes then
        raise exception 'invalid_items';
      end if;
    end if;
  end loop;

  if (select count(distinct (e.value ->> 'menuItemId')::uuid) from jsonb_array_elements(p_items) e)
     <> jsonb_array_length(p_items) then
    raise exception 'invalid_items';
  end if;

  -- One normalized copy, in request order, used by every statement below.
  select jsonb_agg(
           jsonb_build_object(
             'ord', e.ord,
             'menu_item_id', (e.value ->> 'menuItemId')::uuid,
             'quantity', (e.value ->> 'quantity')::numeric::int,
             'notes', nullif(btrim(e.value ->> 'notes', c_trim_chars), '')
           )
           order by e.ord
         )
    into v_lines
  from jsonb_array_elements(p_items) with ordinality as e(value, ord);

  -- 2. Resolve the token.
  select * into v_table from public.dining_tables where qr_token = p_qr_token;
  if not found then
    raise exception 'invalid_table';
  end if;

  -- An unpublished restaurant is closed for ordering, whatever its sessions say.
  select r.is_published into v_published from public.restaurants r where r.id = v_table.restaurant_id;
  if not coalesce(v_published, false) then
    raise exception 'table_closed';
  end if;

  -- 3. Find and lock the open session, so concurrent orders on the same table
  -- queue up and the cap below cannot be raced. If the session is closed while
  -- we wait, the row no longer matches and we answer table_closed.
  select * into v_session
  from public.table_sessions s
  where s.dining_table_id = v_table.id and s.closed_at is null
  for update;
  if not found then
    raise exception 'table_closed';
  end if;

  -- 4. At most c_max_open_orders orders in flight per session.
  select count(*) into v_open_orders
  from public.orders o
  where o.session_id = v_session.id and o.status in ('placed', 'preparing', 'ready');
  if v_open_orders >= c_max_open_orders then
    raise exception 'too_many_open_orders';
  end if;

  -- 5. Lock the requested dishes of THIS table's restaurant (in id order, to avoid
  -- lock-order deadlocks), then find the ones that cannot be ordered. Locked rows
  -- cannot change until this transaction ends, so the checks and the prices used
  -- below agree. Dishes of other restaurants are rejected below and never locked,
  -- so a caller can't hold locks on someone else's menu.
  perform 1
  from public.menu_items m
  where m.id in (select l.menu_item_id from jsonb_to_recordset(v_lines) as l(menu_item_id uuid))
    and m.restaurant_id = v_table.restaurant_id
  order by m.id
  for share;

  select array_agg(l.menu_item_id order by l.ord) into v_bad
  from jsonb_to_recordset(v_lines) as l(ord int, menu_item_id uuid)
  left join public.menu_items m on m.id = l.menu_item_id
  where m.id is null
     or not m.is_available
     or m.restaurant_id <> v_table.restaurant_id;
  if v_bad is not null then
    raise exception 'items_unavailable'
      using detail = jsonb_build_object('itemIds', to_jsonb(v_bad))::text;
  end if;

  -- 6. Store the order (total computed here from the database's prices, never
  -- from the client) and its lines with name and price snapshots.
  insert into public.orders (restaurant_id, session_id, total)
  select v_table.restaurant_id, v_session.id, sum(m.price * l.quantity)
  from jsonb_to_recordset(v_lines) as l(menu_item_id uuid, quantity int)
  join public.menu_items m on m.id = l.menu_item_id
  returning id, total, placed_at into v_order_id, v_total, v_placed_at;

  -- The response is built from what was actually stored (RETURNING), so the
  -- confirmation screen shows exactly the stored snapshot.
  with stored as (
    insert into public.order_items (order_id, restaurant_id, menu_item_id, name, unit_price, quantity, notes)
    select v_order_id, v_table.restaurant_id, m.id, m.name, m.price, l.quantity, l.notes
    from jsonb_to_recordset(v_lines) as l(menu_item_id uuid, quantity int, notes text)
    join public.menu_items m on m.id = l.menu_item_id
    returning menu_item_id, name, unit_price, quantity, notes
  )
  select jsonb_agg(
           jsonb_build_object(
             'name', s.name,
             'unitPrice', s.unit_price,
             'quantity', s.quantity,
             'notes', s.notes
           )
           order by l.ord
         )
    into v_items
  from stored s
  join jsonb_to_recordset(v_lines) as l(ord int, menu_item_id uuid) on l.menu_item_id = s.menu_item_id;

  -- 7.
  return jsonb_build_object(
    'orderId', v_order_id,
    'total', v_total,
    'placedAt', v_placed_at,
    'items', v_items
  );
end;
$$;

-- Postgres grants EXECUTE to PUBLIC by default, and local Supabase also grants
-- it to anon and authenticated explicitly: reset all of it, then give back
-- exactly what customers (anon) and the signed-in owner need.
revoke all on function public.get_table_status(text) from public, anon, authenticated;
grant execute on function public.get_table_status(text) to anon, authenticated;

revoke all on function public.place_order(text, jsonb) from public, anon, authenticated;
grant execute on function public.place_order(text, jsonb) to anon, authenticated;

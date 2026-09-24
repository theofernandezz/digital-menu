-- Feature 1, F1-4a: a dining table is identified by a number, not a free-text label.
--
-- Replaces dining_tables.label (and unique (restaurant_id, label), which goes
-- with the column) by table_number, 1 to 999, unique per restaurant. The same
-- number may exist in two different restaurants.
--
-- Adding a NOT NULL column with no default fails if dining_tables already has
-- rows, on purpose: there is nothing sensible to backfill, so this refuses
-- instead of guessing. Production has no tables.
--
-- RLS policies and table grants on dining_tables are untouched: dropping a
-- column does not drop them.

alter table dining_tables drop column label;

alter table dining_tables
  add column table_number int not null check (table_number between 1 and 999);

alter table dining_tables
  add unique (restaurant_id, table_number);

-- The return type changes, so the function cannot be replaced: it is dropped
-- and recreated, which also discards its grants, so they are re-applied below
-- exactly as in 20260921130000_ordering_rpcs.sql. Everything else is F1-2's:
-- security definer, empty search_path with every object schema-qualified,
-- stable, the token is never returned, zero rows for an unknown token.
drop function public.get_table_status(text);

create function public.get_table_status(p_qr_token text)
returns table (table_number int, is_open boolean)
language sql
stable
security definer
set search_path = ''
as $$
  -- "Open" means the waiter opened a session AND the restaurant is published.
  -- Zero rows means the token is unknown. The token itself is never returned.
  select t.table_number,
         (r.is_published
          and exists (
            select 1 from public.table_sessions s
            where s.dining_table_id = t.id and s.closed_at is null
          ))
  from public.dining_tables t
  join public.restaurants r on r.id = t.restaurant_id
  where t.qr_token = p_qr_token
$$;

revoke all on function public.get_table_status(text) from public, anon, authenticated;
grant execute on function public.get_table_status(text) to anon, authenticated;

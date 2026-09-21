-- The baseline intended: anon = SELECT, authenticated = SELECT/INSERT/UPDATE/
-- DELETE on the five menu tables. Projects created before Supabase stopped
-- auto-granting on new public tables (and every local Supabase) carry more:
-- INSERT/UPDATE/DELETE/TRUNCATE/REFERENCES/TRIGGER, plus MAINTAIN on
-- Postgres 17, for anon and authenticated — so RLS was the only thing
-- standing between anon and a write. Reset both roles to exactly the
-- intended set.
--
-- "revoke all" instead of naming each extra privilege: it does not depend on
-- the Postgres version (MAINTAIN does not exist before 17, and naming it would
-- error there) and cannot miss a privilege added later.
--
-- On the hosted project this is applied by hand in the SQL Editor; wrap it in
-- begin; ... commit; so anon never briefly loses SELECT. The owner already ran
-- an earlier, narrower version there (2026-09-21) that did not name MAINTAIN;
-- running this one is harmless and closes that gap if the project is on
-- Postgres 17.
revoke all on restaurants, categories, menu_items, tags, menu_item_tags from anon, authenticated;
grant select on restaurants, categories, menu_items, tags, menu_item_tags to anon;
grant select, insert, update, delete on restaurants, categories, menu_items, tags, menu_item_tags to authenticated;

-- Stop future tables created by `postgres` (migrations, SQL Editor) from being
-- auto-granted to anon/authenticated. Tables created by `supabase_admin` keep
-- Supabase's own defaults, and functions are handled per function (revoke
-- execute, then grant) — see the ordering RPC migration.
alter default privileges for role postgres in schema public
  revoke all on tables from anon, authenticated;

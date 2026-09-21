-- Local/CI only: applied by `supabase start` / `supabase db reset`, never to
-- production. The credentials below are public on purpose — this database is
-- disposable and only reachable from localhost. They match ADMIN_EMAIL /
-- ADMIN_PASSWORD in .env.example.

-- GoTrue expects the token columns to be '' (not NULL) or sign-in fails with
-- "Database error querying schema".
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change, email_change_token_new,
  email_change_token_current, phone_change, phone_change_token, reauthentication_token
) values (
  '00000000-0000-0000-0000-000000000000',
  '11111111-1111-4111-8111-111111111111',
  'authenticated', 'authenticated',
  'admin@local.test',
  extensions.crypt('local-admin-password', extensions.gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}', '{}', now(), now(),
  '', '', '', '', '', '', '', ''
);

insert into auth.identities (
  id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at
) values (
  gen_random_uuid(),
  '11111111-1111-4111-8111-111111111111',
  '11111111-1111-4111-8111-111111111111',
  'email',
  jsonb_build_object('sub', '11111111-1111-4111-8111-111111111111', 'email', 'admin@local.test'),
  now(), now(), now()
);

insert into restaurants (id, owner_id, name, slug, description, is_published)
values (
  '22222222-2222-4222-8222-222222222222',
  '11111111-1111-4111-8111-111111111111',
  'Demo Restaurant', 'demo-restaurant', 'Local development restaurant', true
);

insert into categories (id, restaurant_id, name, display_order) values
  ('33333333-3333-4333-8333-333333333331', '22222222-2222-4222-8222-222222222222', 'Entradas', 0),
  ('33333333-3333-4333-8333-333333333332', '22222222-2222-4222-8222-222222222222', 'Bebidas', 1);

insert into menu_items (restaurant_id, category_id, name, description, price, display_order) values
  ('22222222-2222-4222-8222-222222222222', '33333333-3333-4333-8333-333333333331', 'Provoleta', 'Queso provolone a la parrilla', 8.50, 0),
  ('22222222-2222-4222-8222-222222222222', '33333333-3333-4333-8333-333333333331', 'Empanadas x2', 'Carne cortada a cuchillo', 6.00, 1),
  ('22222222-2222-4222-8222-222222222222', '33333333-3333-4333-8333-333333333332', 'Agua', null, 2.50, 0);

-- Feature 1: three tables with readable tokens (http://localhost:3000/t/dev-table-1)
-- and an open session on each. Local/CI only — production tokens are random
-- (the column default), never these.
insert into dining_tables (restaurant_id, label, qr_token) values
  ('22222222-2222-4222-8222-222222222222', 'Mesa 1', 'dev-table-1'),
  ('22222222-2222-4222-8222-222222222222', 'Mesa 2', 'dev-table-2'),
  ('22222222-2222-4222-8222-222222222222', 'Mesa 3', 'dev-table-3');

insert into table_sessions (restaurant_id, dining_table_id)
select restaurant_id, id from dining_tables;

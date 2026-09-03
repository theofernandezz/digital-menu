create table restaurants (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  slug text not null unique,
  description text,
  is_published boolean not null default true,
  instagram text,
  whatsapp text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table categories (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  name text not null,
  description text,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table menu_items (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  category_id uuid not null references categories(id) on delete cascade,
  name text not null,
  description text,
  price numeric(10,2) not null check (price >= 0),
  image_url text,
  is_available boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table tags (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (restaurant_id, name)
);

create table menu_item_tags (
  menu_item_id uuid not null references menu_items(id) on delete cascade,
  tag_id uuid not null references tags(id) on delete cascade,
  primary key (menu_item_id, tag_id)
);

create extension if not exists moddatetime schema extensions;

create trigger set_updated_at before update on restaurants
  for each row execute procedure extensions.moddatetime(updated_at);
create trigger set_updated_at before update on categories
  for each row execute procedure extensions.moddatetime(updated_at);
create trigger set_updated_at before update on menu_items
  for each row execute procedure extensions.moddatetime(updated_at);

create index on categories (restaurant_id);
create index on menu_items (restaurant_id);
create index on menu_items (category_id);
create index on menu_item_tags (tag_id);

-- 1. Expose tables to the Data API roles
grant select on restaurants, categories, menu_items, tags, menu_item_tags to anon, authenticated;
grant insert, update, delete on restaurants, categories, menu_items, tags, menu_item_tags to authenticated;

-- 2. Turn on RLS
alter table restaurants enable row level security;
alter table categories enable row level security;
alter table menu_items enable row level security;
alter table tags enable row level security;
alter table menu_item_tags enable row level security;

-- 3. Public read (unauthenticated menu view)
create policy "public reads published restaurant" on restaurants
  for select using (is_published = true);

create policy "public reads categories of published restaurant" on categories
  for select using (
    exists (select 1 from restaurants r where r.id = categories.restaurant_id and r.is_published = true)
  );

create policy "public reads items of published restaurant" on menu_items
  for select using (
    exists (select 1 from restaurants r where r.id = menu_items.restaurant_id and r.is_published = true)
  );

create policy "public reads tags of published restaurant" on tags
  for select using (
    exists (select 1 from restaurants r where r.id = tags.restaurant_id and r.is_published = true)
  );

create policy "public reads menu_item_tags of published restaurant" on menu_item_tags
  for select using (
    exists (
      select 1 from menu_items mi
      join restaurants r on r.id = mi.restaurant_id
      where mi.id = menu_item_tags.menu_item_id and r.is_published = true
    )
  );

-- 4. Owner writes
create policy "owner manages restaurant" on restaurants
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy "owner manages categories" on categories
  for all using (
    exists (select 1 from restaurants r where r.id = categories.restaurant_id and r.owner_id = auth.uid())
  );

create policy "owner manages menu_items" on menu_items
  for all using (auth.uid() = (select owner_id from restaurants where id = menu_items.restaurant_id));

create policy "owner manages tags" on tags
  for all using (
    exists (select 1 from restaurants r where r.id = tags.restaurant_id and r.owner_id = auth.uid())
  );

create policy "owner manages menu_item_tags" on menu_item_tags
  for all using (
    exists (
      select 1 from menu_items mi
      join restaurants r on r.id = mi.restaurant_id
      where mi.id = menu_item_tags.menu_item_id and r.owner_id = auth.uid()
    )
  );


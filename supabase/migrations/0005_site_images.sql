-- Editable site imagery, two shapes:
--
-- 1. `site_images` — fixed named slots (logo, "why us" photo, per-product
--    photo, about-page hero photo, partners CTA photo) where an admin can
--    only ever replace the picture, never add/remove a slot.
--
-- 2. `site_image_items` — open-ended lists (hero banner slides, KOL partner
--    photos, about-page gallery) where an admin can add or remove entries,
--    not just swap a fixed slot's picture.
--
-- Both are public-read (they drive the public marketing site) with writes
-- going through the service-role client from admin server actions
-- (role-checked in the app layer via canPublish()) — mirrors avatars/news.

create table public.site_images (
  key text primary key,
  url text not null,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

alter table public.site_images enable row level security;

create policy "site_images_public_read" on public.site_images
  for select using (true);

create table public.site_image_items (
  id uuid primary key default gen_random_uuid(),
  list_key text not null,
  url text not null,
  label text,
  bright boolean not null default false,
  sort_order integer not null default 0,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.site_image_items enable row level security;

create policy "site_image_items_public_read" on public.site_image_items
  for select using (true);

create index site_image_items_list_key_idx on public.site_image_items (list_key, sort_order);

insert into storage.buckets (id, name, public)
values ('site-images', 'site-images', true)
on conflict (id) do nothing;

create policy "site_images_bucket_public_read" on storage.objects
  for select using (bucket_id = 'site-images');

-- Seed the open-ended lists with the images already hardcoded on the site
-- today, so the public pages keep showing the same content once the app
-- switches over to reading from this table instead of the static data files.
insert into public.site_image_items (list_key, url, bright, sort_order) values
  ('hero', '/images/banner-kitchen-bathroom.png', false, 1),
  ('hero', '/images/banner-product-closeup.png', false, 2),
  ('hero', '/images/banner-warehouse.png', false, 3),
  ('hero', '/images/banner-saiza-clean-promo.png', true, 4),
  ('hero', '/images/banner-silky-clean-promo.png', true, 5);

insert into public.site_image_items (list_key, url, label, sort_order) values
  ('kol', 'https://2sgroup.vn/wp-content/uploads/2025/04/thuy-ngan-game-show.jpg', 'Thúy Ngân', 1),
  (
    'kol',
    'https://2sgroup.vn/wp-content/uploads/2025/04/photo-5-16848433469011412549275-698x1024.jpg',
    'Lâm Vỹ Dạ',
    2
  ),
  (
    'kol',
    'https://2sgroup.vn/wp-content/uploads/2025/04/1652167246_267835400_1312852552487489_7742158771432333231_n.jpg',
    'Tun Phạm',
    3
  ),
  ('kol', 'https://2sgroup.vn/wp-content/uploads/2025/04/Ngoc-Trinh-2.jpg', 'Ngọc Trinh', 4),
  (
    'kol',
    'https://2sgroup.vn/wp-content/uploads/2025/04/photo-1-16547833659441151331453.jpeg',
    'Dương Lâm',
    5
  );

insert into public.site_image_items (list_key, url, sort_order) values
  ('gallery', 'https://2sgroup.vn/wp-content/uploads/2025/04/104764-1024x1024.jpg', 1),
  ('gallery', 'https://2sgroup.vn/wp-content/uploads/2025/04/25060-1024x561.jpg', 2),
  ('gallery', 'https://2sgroup.vn/wp-content/uploads/2025/04/33712.jpg', 3),
  ('gallery', 'https://2sgroup.vn/wp-content/uploads/2025/04/59126-e1743755072349.jpg', 4);

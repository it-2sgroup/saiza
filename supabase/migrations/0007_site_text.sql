-- Editable site copy: a key -> {vi, en} override table covering every leaf
-- string in the i18n Dictionary (src/lib/i18n/types.ts). Public read (drives
-- the public marketing site), writes go through the service-role client from
-- admin server actions (role-checked via canPublish()) — same pattern as
-- site_images/site_image_items/products.

create table public.site_text (
  key text primary key,
  value_vi text not null,
  value_en text not null,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

alter table public.site_text enable row level security;

create policy "site_text_public_read" on public.site_text
  for select using (true);

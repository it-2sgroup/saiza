-- Generic key -> value config store for contact info and external links that
-- were previously hardcoded in components (phone, email, office addresses +
-- map embeds, social links, the recruitment apply-form URL, homepage video
-- IDs). Locale-invariant (unlike site_text), so a single `value` column is
-- enough. Public read (drives the public site), writes go through the
-- service-role client from admin server actions (role-checked via
-- canPublish()) — same pattern as site_images/site_text/products.

create table public.site_config (
  key text primary key,
  value text not null,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

alter table public.site_config enable row level security;

create policy "site_config_public_read" on public.site_config
  for select using (true);

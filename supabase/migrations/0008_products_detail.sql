-- Expands `products` with the fields needed for a full product detail page
-- (features list, volume, price label, spec-sheet fields, usage steps,
-- notes) — all optional/nullable since existing seeded products don't have
-- them yet, and the detail page hides any section with no content.

alter table public.products
  add column if not exists brand text not null default 'SAIZA',
  add column if not exists features_vi text,
  add column if not exists features_en text,
  add column if not exists volume text,
  add column if not exists price_label_vi text,
  add column if not exists price_label_en text,
  add column if not exists product_type_vi text,
  add column if not exists product_type_en text,
  add column if not exists form_vi text,
  add column if not exists form_en text,
  add column if not exists shelf_life_vi text,
  add column if not exists shelf_life_en text,
  add column if not exists scent_vi text,
  add column if not exists scent_en text,
  add column if not exists ingredients_vi text,
  add column if not exists ingredients_en text,
  add column if not exists usage_vi text,
  add column if not exists usage_en text,
  add column if not exists notes_vi text,
  add column if not exists notes_en text;

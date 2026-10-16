-- Adds a capability for a new read-only "Phân tích doanh số" page that
-- reads from a separate Supabase project (order/sales data warehouse), not
-- from any table in this database. Deliberately its own boolean rather than
-- piggybacking on an existing capability (e.g. canViewLarkStats) — this is a
-- different trust boundary (cross-project sales data) that a role like
-- "shopee_reviewer" should hold on its own, without also picking up Lark
-- stats, staff management, or any other unrelated capability.

alter table public.roles
  add column can_view_sales_analytics boolean not null default false;

update public.roles set can_view_sales_analytics = true where code = 'admin';

-- Seed a minimal role for Shopee's ISV application reviewer: sees only the
-- sales analytics page, nothing else. Not deleted after review on purpose —
-- re-used if Shopee ever needs to re-verify the live product later.
-- can_access_lark defaults to true at the column level (preserves old
-- behavior for pre-existing roles) — explicitly turned off here so this role
-- doesn't pick up the unrelated "Tạo file Lark" feature by accident.
insert into public.roles
  (code, label, is_super_admin, can_manage_content, can_draft_content, can_access_lark, can_manage_lark_org_wide, can_view_lark_stats, can_view_inbox, can_manage_staff, can_view_sales_analytics, sort_order)
values
  ('shopee_reviewer', 'Shopee Reviewer (demo)', false, false, false, false, false, false, false, false, true, 99)
on conflict (code) do nothing;

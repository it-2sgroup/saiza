-- Splits Lark permissions into finer capabilities than the single
-- can_manage_lark_org_wide flag — an admin needs to be able to define a role
-- that ONLY creates/manages its own Lark files (no org-wide reach, no
-- company-wide stats), which the previous single toggle couldn't express.
--
-- can_access_lark: can open "Tạo file Lark" at all — create files, browse
--   Drive, manage files THEY created. This used to have no check anywhere
--   (any logged-in profile could use every Lark action), so it defaults to
--   true here to preserve that for every role that already exists — it only
--   becomes an opt-in gate for roles created from now on.
-- can_view_lark_stats: the "Thống kê" tab (company-wide analytics/overview)
--   — previously piggybacked on can_manage_staff, which conflated "can
--   administer staff accounts" with "can see company Lark stats". Split out
--   and backfilled to match its old behavior (only the super-admin tier had
--   can_manage_staff before this).
alter table public.roles add column if not exists can_access_lark boolean not null default true;
alter table public.roles add column if not exists can_view_lark_stats boolean not null default false;

update public.roles set can_view_lark_stats = true where is_super_admin;

-- get_my_role_caps() is DELIBERATELY left untouched: no RLS policy reads
-- can_access_lark/can_view_lark_stats (Lark's own authorization lives in
-- app-code checks — see permissions.ts — not Postgres RLS), and every one
-- of those policies (roles_super_admin_write, profiles_admin_write,
-- audit_log_admin_read, news/jobs_staff_*, contact_staff_*,
-- config_lists_admin_write) depends on this function's exact return type,
-- so widening it would require dropping and recreating all of them too.

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

-- Keep get_my_role_caps()'s shape mirroring the table, even though no RLS
-- policy reads these two yet — Lark's own authorization lives in app-code
-- checks (see permissions.ts), not Postgres RLS.
--
-- Postgres refuses "create or replace" when the OUT-parameter row type
-- changes (adding columns counts as a change) — has to be dropped first.
drop function if exists public.get_my_role_caps();

create function public.get_my_role_caps()
returns table (
  role_code text,
  is_super_admin boolean,
  can_manage_content boolean,
  can_draft_content boolean,
  can_manage_lark_org_wide boolean,
  can_view_inbox boolean,
  can_manage_staff boolean,
  can_access_lark boolean,
  can_view_lark_stats boolean
)
language sql
security definer
stable
set search_path = public
as $$
  select
    r.code, r.is_super_admin, r.can_manage_content, r.can_draft_content, r.can_manage_lark_org_wide,
    r.can_view_inbox, r.can_manage_staff, r.can_access_lark, r.can_view_lark_stats
  from public.roles r
  join public.profiles p on p.role = r.code
  where p.id = auth.uid();
$$;

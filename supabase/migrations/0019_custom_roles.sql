-- Replaces the hardcoded 3-role model (admin/editor/contributor) with a
-- `roles` table so an admin can add a new role (e.g. "Nhân sự") from the
-- admin UI instead of needing a code deploy. Every role is now a named
-- bundle of capability flags instead of a magic string every RLS policy and
-- permission function used to compare against literally.
--
-- Deliberately keeps `is_super_admin` as a distinct flag rather than folding
-- it into `can_manage_staff` — it gates things a capability bundle
-- shouldn't casually grant just by being "the staff-management role":
-- writing to config_lists/roles themselves, reading the full audit log, and
-- the "last admin" protection that stops the org from ever being left with
-- nobody who can administer it.

create table public.roles (
  code text primary key,
  label text not null,
  is_super_admin boolean not null default false,
  can_manage_content boolean not null default false,
  can_draft_content boolean not null default false,
  can_manage_lark_org_wide boolean not null default false,
  can_view_inbox boolean not null default false,
  can_manage_staff boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.roles enable row level security;

-- Seed with the exact 3 roles and capabilities that were hardcoded before —
-- nothing changes for existing staff until an admin edits/adds a role.
insert into public.roles
  (code, label, is_super_admin, can_manage_content, can_draft_content, can_manage_lark_org_wide, can_view_inbox, can_manage_staff, sort_order)
values
  ('admin', 'Quản trị', true, true, true, true, true, true, 0),
  ('editor', 'Biên tập viên', false, true, true, false, true, false, 1),
  ('contributor', 'Cộng tác viên', false, false, true, false, false, false, 2);

-- Reads the caller's role's capabilities in one shot — security definer so
-- it can see profiles/roles regardless of the caller's own RLS visibility,
-- same reasoning as get_my_role() below. Every RLS policy that used to
-- compare get_my_role() against a literal string now checks a capability
-- from here instead.
create function public.get_my_role_caps()
returns table (
  role_code text,
  is_super_admin boolean,
  can_manage_content boolean,
  can_draft_content boolean,
  can_manage_lark_org_wide boolean,
  can_view_inbox boolean,
  can_manage_staff boolean
)
language sql
security definer
stable
set search_path = public
as $$
  select r.code, r.is_super_admin, r.can_manage_content, r.can_draft_content, r.can_manage_lark_org_wide, r.can_view_inbox, r.can_manage_staff
  from public.roles r
  join public.profiles p on p.role = r.code
  where p.id = auth.uid();
$$;

create policy "roles_read" on public.roles
  for select using (auth.role() = 'authenticated');

create policy "roles_super_admin_write" on public.roles
  for all using (exists (select 1 from public.get_my_role_caps() c where c.is_super_admin))
  with check (exists (select 1 from public.get_my_role_caps() c where c.is_super_admin));

-- profiles.role can no longer be a fixed CHECK — it must reference whatever
-- roles currently exist, including ones added later through the admin UI.
-- No ON DELETE action specified on purpose: deleting a role that's still
-- assigned to someone must fail loudly (removeRole() in the app catches
-- this and shows "còn nhân viên đang dùng vai trò này"), not silently orphan
-- their profile.role or cascade-delete their account.
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_fkey foreign key (role) references public.roles (code);

-- Re-point every policy that used to compare get_my_role() against a
-- literal role string onto the equivalent capability instead.

drop policy if exists "profiles_admin_write" on public.profiles;
create policy "profiles_admin_write" on public.profiles
  for all using (exists (select 1 from public.get_my_role_caps() c where c.is_super_admin))
  with check (exists (select 1 from public.get_my_role_caps() c where c.is_super_admin));

drop policy if exists "audit_log_admin_read" on public.audit_log;
create policy "audit_log_admin_read" on public.audit_log
  for select using (exists (select 1 from public.get_my_role_caps() c where c.is_super_admin));

drop policy if exists "news_staff_insert" on public.news_posts;
create policy "news_staff_insert" on public.news_posts
  for insert with check (
    author_id = auth.uid()
    and (
      exists (select 1 from public.get_my_role_caps() c where c.can_manage_content)
      or (exists (select 1 from public.get_my_role_caps() c where c.can_draft_content) and status = 'draft')
    )
  );

drop policy if exists "news_staff_update" on public.news_posts;
create policy "news_staff_update" on public.news_posts
  for update using (
    exists (select 1 from public.get_my_role_caps() c where c.can_manage_content)
    or (exists (select 1 from public.get_my_role_caps() c where c.can_draft_content) and author_id = auth.uid())
  )
  with check (
    exists (select 1 from public.get_my_role_caps() c where c.can_manage_content)
    or (exists (select 1 from public.get_my_role_caps() c where c.can_draft_content) and author_id = auth.uid() and status = 'draft')
  );

drop policy if exists "news_staff_delete" on public.news_posts;
create policy "news_staff_delete" on public.news_posts
  for delete using (exists (select 1 from public.get_my_role_caps() c where c.can_manage_content));

drop policy if exists "jobs_staff_insert" on public.job_posts;
create policy "jobs_staff_insert" on public.job_posts
  for insert with check (
    author_id = auth.uid()
    and (
      exists (select 1 from public.get_my_role_caps() c where c.can_manage_content)
      or (exists (select 1 from public.get_my_role_caps() c where c.can_draft_content) and status = 'draft')
    )
  );

drop policy if exists "jobs_staff_update" on public.job_posts;
create policy "jobs_staff_update" on public.job_posts
  for update using (
    exists (select 1 from public.get_my_role_caps() c where c.can_manage_content)
    or (exists (select 1 from public.get_my_role_caps() c where c.can_draft_content) and author_id = auth.uid())
  )
  with check (
    exists (select 1 from public.get_my_role_caps() c where c.can_manage_content)
    or (exists (select 1 from public.get_my_role_caps() c where c.can_draft_content) and author_id = auth.uid() and status = 'draft')
  );

drop policy if exists "jobs_staff_delete" on public.job_posts;
create policy "jobs_staff_delete" on public.job_posts
  for delete using (exists (select 1 from public.get_my_role_caps() c where c.can_manage_content));

drop policy if exists "contact_staff_read" on public.contact_submissions;
create policy "contact_staff_read" on public.contact_submissions
  for select using (exists (select 1 from public.get_my_role_caps() c where c.can_view_inbox));

drop policy if exists "contact_staff_update" on public.contact_submissions;
create policy "contact_staff_update" on public.contact_submissions
  for update using (exists (select 1 from public.get_my_role_caps() c where c.can_view_inbox));

-- config_lists (0018) was written before roles became capability-based —
-- re-point its admin-write policy the same way.
drop policy if exists "config_lists_admin_write" on public.config_lists;
create policy "config_lists_admin_write" on public.config_lists
  for all using (exists (select 1 from public.get_my_role_caps() c where c.is_super_admin))
  with check (exists (select 1 from public.get_my_role_caps() c where c.is_super_admin));

-- One auto-provisioned Lark folder per staff member — see
-- src/lib/lark/personalFolders.ts. A "Nhân viên"-role account is confined
-- to creating files/subfolders only inside their own folder (enforced
-- server-side in lark/actions.ts, not just hidden in the UI); roles with
-- canManageLarkOrgWide are exempt and keep the free-pick folder behavior.
--
-- Deliberately its own table rather than reusing lark_folders (department
-- folders): that table's uniqueness is (app_key, org, department) — a
-- per-person row would need a fake "department" value to fit, and two
-- unrelated concepts (a shared department folder vs. one person's own root)
-- would end up modeled as the same shape for no reason.
create table public.lark_personal_folders (
  app_key text not null,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  lark_token text not null,
  lark_url text not null,
  created_at timestamptz not null default now(),
  primary key (app_key, profile_id)
);

-- Same posture as lark_folders/lark_trash: every access path goes through
-- createAdminClient() after the calling Server Action has already
-- authorized the request, so RLS-enabled-with-no-policies is correct here.
alter table public.lark_personal_folders enable row level security;

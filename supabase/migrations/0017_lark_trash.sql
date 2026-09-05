-- Soft-delete / Trash for Lark files & folders.
--
-- Lark's own DELETE /drive/v1/files/:token moves the item into Lark's OWN
-- recycle bin (confirmed against the Feishu Open Platform docs: "文件或文件夹
-- 被删除后，会进入回收站中" — deleted files/folders enter the recycle bin), but
-- there is no documented API to list or restore what's in it. So a delete
-- through this website used to be irreversible from here even though it
-- wasn't irreversible in Lark — recoverable only by asking whoever has
-- access to Lark's own trash UI, if they even know to look.
--
-- This implements our own trash instead of relying on Lark's: "delete" moves
-- the item into one hidden, auto-provisioned folder per Lark app (see
-- getOrCreateTrashFolder in src/lib/lark/trash.ts) and records it here.
-- Restoring moves it back. A background sweep permanently deletes (via the
-- real Lark delete API) anything past its retention window. Moving a folder
-- carries its children with it as one atomic unit — free correctness from
-- reusing the move API rather than modelling trash as per-row soft-delete.
create table public.lark_trash_folder (
  app_key text primary key,
  folder_token text not null,
  created_at timestamptz not null default now()
);

create table public.lark_trash (
  document_id text primary key,
  app_key text not null,
  file_type text not null,
  title text not null,
  -- Where to move it back to on restore. Null means "the app's Drive root"
  -- (nothing to fall back further to). The folder itself may no longer exist
  -- by the time of restore (e.g. it was trashed too, then purged) — the
  -- restore action handles that by falling back to the app root and telling
  -- the user, rather than failing the restore outright.
  original_parent_token text,
  deleted_by uuid references public.profiles (id) on delete set null,
  deleted_at timestamptz not null default now(),
  purge_at timestamptz not null
);

create index lark_trash_app_purge_idx on public.lark_trash (app_key, purge_at);
create index lark_trash_deleted_by_idx on public.lark_trash (deleted_by);

-- Same posture as the other Lark cache tables: every access path goes
-- through createAdminClient() after the calling Server Action has already
-- authorized the request, so RLS-enabled-with-no-policies is correct here —
-- it denies anon/authenticated entirely rather than needing per-row policies
-- that would just re-implement the same checks PostgREST can't express as
-- cleanly as the application code already does.
alter table public.lark_trash_folder enable row level security;
alter table public.lark_trash enable row level security;

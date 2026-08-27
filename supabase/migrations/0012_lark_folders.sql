-- Canonical, auto-provisioned Lark folder per (org, department) — the
-- "backbone" folder structure. Looked up/created on demand by
-- src/lib/lark/folderRegistry.ts the first time someone creates a file for
-- that org+department combo, so files land in a stable, predictable place
-- without anyone having to manually create/browse for a folder first.
--
-- org uses '' (not null) for "no org selected" so the unique constraint
-- below actually enforces one row per department in that case too —
-- Postgres treats NULL as distinct from NULL in unique constraints, which
-- would silently allow duplicate rows if org were nullable instead.
create table public.lark_folders (
  id uuid primary key default gen_random_uuid(),
  org text not null default '',
  department text not null,
  lark_token text not null,
  lark_url text not null,
  created_at timestamptz not null default now(),
  unique (org, department)
);

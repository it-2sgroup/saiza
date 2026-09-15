-- A free-form, Miro-style org chart: nodes you can drag anywhere on a
-- canvas, directed edges connecting them (drawn as elbow connectors client-
-- side), and a per-node member list. Deliberately a graph, not a strict
-- tree — real org charts have the odd shared/dotted-line reporting
-- relationship (e.g. one team feeding two departments), and modeling edges
-- as their own rows (rather than a single parent_id per node) supports that
-- without a special case.
--
-- Members are NOT profiles.id — most people on the real org chart never get
-- a website login at all (this app's own accounts are a small admin subset,
-- see nhan-su). Instead each membership is a snapshot of a Lark contact
-- (email/name/avatar) pulled live from the same cross-tenant directory the
-- Lark tab's share picker already uses (listAllTenantContactsMerged) —
-- assigned by hand per node, not auto-matched from name text, since real
-- naming conventions across 5 tenants are too inconsistent to parse
-- reliably ("Ms. Diễm", "-KT", "- Content tiktok", "- Học việc VHS", ...).
create table public.org_chart_nodes (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  color text not null default '#e0e7ff',
  position_x double precision not null default 0,
  position_y double precision not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.org_chart_edges (
  id uuid primary key default gen_random_uuid(),
  source_node_id uuid not null references public.org_chart_nodes (id) on delete cascade,
  target_node_id uuid not null references public.org_chart_nodes (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (source_node_id, target_node_id)
);

create table public.org_chart_node_members (
  id uuid primary key default gen_random_uuid(),
  node_id uuid not null references public.org_chart_nodes (id) on delete cascade,
  lark_email text not null,
  full_name text not null,
  avatar_url text,
  org_label text,
  created_at timestamptz not null default now(),
  unique (node_id, lark_email)
);

create index org_chart_edges_source_idx on public.org_chart_edges (source_node_id);
create index org_chart_edges_target_idx on public.org_chart_edges (target_node_id);
create index org_chart_node_members_node_idx on public.org_chart_node_members (node_id);

-- Same posture as every other Lark-adjacent table in this app: every access
-- path goes through createAdminClient() after the calling Server Action has
-- already checked canManageStaff (edit) — read access is also server-side
-- only (the page itself gates on being logged in), so RLS-enabled-with-no-
-- policies is correct here rather than reimplementing that check as a
-- PostgREST policy.
alter table public.org_chart_nodes enable row level security;
alter table public.org_chart_edges enable row level security;
alter table public.org_chart_node_members enable row level security;

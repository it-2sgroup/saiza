-- Security audit follow-up. Every table below is only ever read/written via
-- createAdminClient() (service-role key) — application code has already done
-- its own authorization by the time it touches these, so "RLS enabled, zero
-- policies" is the correct posture: it denies `anon`/`authenticated` (the
-- roles PostgREST actually uses) entirely, and the service-role key bypasses
-- RLS regardless. Three of these tables shipped across migrations 0012-0015
-- without this — Supabase's stock grants leave newly-created public tables
-- readable/writable by `anon` by default, so until this migration they were
-- a plain, unauthenticated `GET /rest/v1/<table>` away from anyone who loads
-- the site and reads NEXT_PUBLIC_SUPABASE_URL/PUBLISHABLE_KEY out of the
-- bundle — that's the entire Lark org directory (lark_contact_cache), every
-- cached Drive listing incl. file tokens (lark_drive_cache), and the
-- department folder registry (lark_folders).
alter table public.lark_folders enable row level security;
alter table public.lark_folder_cache enable row level security;
alter table public.lark_contact_cache enable row level security;
alter table public.lark_drive_cache enable row level security;

-- The move/delete/transfer authorization path (checkDocPermission,
-- resolveDocAppKey, resolveDocFolder in actions.ts) does 2-3 sequential
-- audit_log scans per action, filtered on (action, target_id) or
-- (action, created_at) — unindexed, this is a full table scan on every
-- single Lark mutation, and audit_log only grows.
create index if not exists audit_log_action_target_idx on public.audit_log (action, target_id);
create index if not exists audit_log_action_created_idx on public.audit_log (action, created_at desc);

-- count_recent_events was created SECURITY DEFINER without a matching revoke
-- (unlike custom_access_token_hook, which correctly revokes at 0002:86) —
-- authenticated/anon could call it via RPC to probe failed-login counts for
-- an arbitrary email. Harmless on its own, but there's no reason to leave it
-- callable from the client.
revoke all on function public.count_recent_events(text, text, int) from anon, authenticated;

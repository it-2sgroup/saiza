-- Security hardening: rate limiting (login brute-force + contact-form spam),
-- audit logging, and a Custom Access Token Hook that puts the caller's role
-- into the JWT itself.

-- Rate limiting ------------------------------------------------------------
-- One generic event log reused for both login-failure throttling and
-- contact-form spam throttling. RLS is enabled with NO policies at all —
-- only the service-role client (used exclusively from trusted Server
-- Actions) can read or write it; there is nothing for anon/authenticated
-- roles to see or tamper with here.

create table public.rate_limit_log (
  id uuid primary key default gen_random_uuid(),
  kind text not null,
  key text not null,
  created_at timestamptz not null default now()
);

alter table public.rate_limit_log enable row level security;

create index rate_limit_log_kind_key_created_idx on public.rate_limit_log (kind, key, created_at desc);

create or replace function public.count_recent_events(p_kind text, p_key text, p_minutes int)
returns integer
language sql
security definer
stable
set search_path = public
as $$
  select count(*)::int
  from public.rate_limit_log
  where kind = p_kind
    and key = p_key
    and created_at > now() - (p_minutes || ' minutes')::interval;
$$;

-- Audit log -----------------------------------------------------------------

create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles (id),
  action text not null,
  target_table text,
  target_id text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

alter table public.audit_log enable row level security;

create policy "audit_log_admin_read" on public.audit_log
  for select using (public.get_my_role() = 'admin');

-- Intentionally no insert/update/delete policy for anon/authenticated —
-- only the service-role client writes here (after the caller's own role has
-- already been checked in the Server Action), so the log itself can't be
-- forged or deleted through the public API surface.

-- JWT role claim (Custom Access Token Hook) ---------------------------------
-- Lets middleware/proxy read the caller's role straight out of the JWT
-- instead of round-tripping to `profiles` on every request. Enabling this as
-- the active hook is a Supabase Dashboard setting (Authentication > Hooks) —
-- the function just needs to exist and be grantable first.

create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  claims jsonb;
  caller_role text;
begin
  select role into caller_role from public.profiles where id = (event->>'user_id')::uuid;

  claims := coalesce(event->'claims', '{}'::jsonb);
  claims := jsonb_set(claims, '{user_role}', to_jsonb(coalesce(caller_role, 'none')));
  event := jsonb_set(event, '{claims}', claims);

  return event;
end;
$$;

grant execute on function public.custom_access_token_hook(jsonb) to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook(jsonb) from authenticated, anon, public;

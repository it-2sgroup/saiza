-- Three additions to cut down on redundant Lark API calls and fix a real
-- race condition in the existing folder-cache write-through:
--
-- 1. lark_contact_cache: the Lark org directory (used for share/transfer
--    people-picker suggestions) was re-fetched from Lark's Contact API on
--    every single /admin/lark page load, for every connected app — the
--    single most wasteful call in the page given contacts rarely change.
-- 2. lark_drive_cache: DriveExplorer re-fetches a folder's full listing
--    (files + folders) from Lark live every time a user opens it, including
--    on every page reload of the same folder — nothing about a folder's
--    contents was ever cached, unlike the folder-tree-only lark_folder_cache.
-- 3. merge_lark_folder_cache(): src/lib/lark/folders.ts's addFoldersToCache
--    did a plain SELECT then UPSERT from application code — two concurrent
--    write-throughs (e.g. two staff loading the page around the same time)
--    can both read the same old tree and then overwrite each other, silently
--    dropping whichever folder the losing write had discovered. Moving the
--    read-modify-write into a single Postgres function with `FOR UPDATE`
--    makes concurrent calls serialize on the row lock instead of racing.

create table public.lark_contact_cache (
  app_key text primary key,
  contacts jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create table public.lark_drive_cache (
  app_key text not null,
  folder_token text not null,
  items jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (app_key, folder_token)
);

create or replace function public.merge_lark_folder_cache(
  p_app_key text,
  p_org text,
  p_entries jsonb -- array of {token, name, parentToken}
) returns void
language plpgsql
as $$
declare
  v_known jsonb;
  v_entry jsonb;
  v_token text;
  v_parent text;
  v_depth int;
begin
  insert into public.lark_folder_cache (app_key, org, tree, updated_at)
  values (p_app_key, p_org, '[]'::jsonb, now())
  on conflict (app_key, org) do nothing;

  -- Row lock: a concurrent call for the same (app_key, org) blocks here
  -- until this transaction commits, then reads the already-merged tree —
  -- no lost updates, unlike the old read-then-write-from-application-code.
  select tree into v_known
  from public.lark_folder_cache
  where app_key = p_app_key and org = p_org
  for update;

  -- Reshape the existing array into an object keyed by token, so each new
  -- entry's parent depth can be looked up in O(1) instead of scanning the array.
  select coalesce(jsonb_object_agg(elem->>'token', elem), '{}'::jsonb)
  into v_known
  from jsonb_array_elements(coalesce(v_known, '[]'::jsonb)) elem;

  for v_entry in select * from jsonb_array_elements(coalesce(p_entries, '[]'::jsonb))
  loop
    v_token := v_entry->>'token';
    if v_token is null or v_token = '' then
      continue;
    end if;
    v_parent := v_entry->>'parentToken';
    v_depth := coalesce((v_known -> v_parent ->> 'depth')::int, 0) + 1;
    v_known := v_known || jsonb_build_object(
      v_token,
      jsonb_build_object('token', v_token, 'name', v_entry->>'name', 'depth', v_depth, 'parentToken', v_parent)
    );
  end loop;

  update public.lark_folder_cache
  set tree = coalesce((select jsonb_agg(value) from jsonb_each(v_known)), '[]'::jsonb),
      updated_at = now()
  where app_key = p_app_key and org = p_org;
end;
$$;

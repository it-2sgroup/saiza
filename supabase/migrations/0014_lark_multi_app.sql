-- Support multiple connected Lark apps (each with its own Drive/My Space,
-- see LARK_APPS env var and src/lib/lark/client.ts). Folder tokens and
-- cached trees are only meaningful within the app that owns them, so both
-- tables need an app_key column — otherwise switching apps would show a
-- folder tree that actually belongs to a different app's Drive space.
--
-- Existing rows default to '2sgroup' (the app that existed before this
-- migration), so nothing already provisioned needs to be re-created.
alter table public.lark_folders add column app_key text not null default '2sgroup';
alter table public.lark_folders drop constraint lark_folders_org_department_key;
alter table public.lark_folders add constraint lark_folders_app_org_department_key unique (app_key, org, department);

alter table public.lark_folder_cache add column app_key text not null default '2sgroup';
alter table public.lark_folder_cache drop constraint lark_folder_cache_pkey;
alter table public.lark_folder_cache add primary key (app_key, org);

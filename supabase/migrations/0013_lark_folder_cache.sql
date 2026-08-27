-- Caches the browsable folder tree per org root so /admin/lark doesn't have
-- to walk the Lark Drive API (BFS, up to 150 folders) on every single page
-- load. src/lib/lark/folders.ts reads this first, only re-crawling live when
-- the cache is missing or older than the TTL, and appends new folders here
-- directly (write-through) whenever the app itself creates one so they show
-- up immediately without waiting for the next crawl.
create table public.lark_folder_cache (
  org text primary key,
  tree jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

-- SAIZA admin/content management schema
-- Roles: admin, editor, contributor (contributor can only save drafts).

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  role text not null check (role in ('admin', 'editor', 'contributor')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Reads the caller's role. security definer so it can see profiles regardless
-- of the caller's own RLS visibility, avoiding recursive policy checks.
create function public.get_my_role()
returns text
language sql
security definer
stable
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create policy "profiles_select_own_or_admin" on public.profiles
  for select using (id = auth.uid() or public.get_my_role() = 'admin');

create policy "profiles_admin_write" on public.profiles
  for all using (public.get_my_role() = 'admin') with check (public.get_my_role() = 'admin');

create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- News posts -----------------------------------------------------------

create table public.news_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text not null default '',
  body text not null default '',
  cover_image text,
  tag text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  author_id uuid references public.profiles (id),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.news_posts enable row level security;

create trigger news_posts_set_updated_at
  before update on public.news_posts
  for each row execute function public.set_updated_at();

create policy "news_public_read_published" on public.news_posts
  for select using (status = 'published');

create policy "news_staff_read_all" on public.news_posts
  for select using (public.get_my_role() is not null);

create policy "news_staff_insert" on public.news_posts
  for insert with check (
    author_id = auth.uid()
    and (
      public.get_my_role() in ('admin', 'editor')
      or (public.get_my_role() = 'contributor' and status = 'draft')
    )
  );

create policy "news_staff_update" on public.news_posts
  for update using (
    public.get_my_role() in ('admin', 'editor')
    or (public.get_my_role() = 'contributor' and author_id = auth.uid())
  )
  with check (
    public.get_my_role() in ('admin', 'editor')
    or (public.get_my_role() = 'contributor' and author_id = auth.uid() and status = 'draft')
  );

create policy "news_staff_delete" on public.news_posts
  for delete using (public.get_my_role() in ('admin', 'editor'));

-- Job posts --------------------------------------------------------------

create table public.job_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  department text,
  location text,
  employment_type text,
  description text not null default '',
  requirements text not null default '',
  benefits text not null default '',
  salary_note text,
  status text not null default 'draft' check (status in ('draft', 'open', 'closed')),
  author_id uuid references public.profiles (id),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.job_posts enable row level security;

create trigger job_posts_set_updated_at
  before update on public.job_posts
  for each row execute function public.set_updated_at();

create policy "jobs_public_read_open" on public.job_posts
  for select using (status = 'open');

create policy "jobs_staff_read_all" on public.job_posts
  for select using (public.get_my_role() is not null);

create policy "jobs_staff_insert" on public.job_posts
  for insert with check (
    author_id = auth.uid()
    and (
      public.get_my_role() in ('admin', 'editor')
      or (public.get_my_role() = 'contributor' and status = 'draft')
    )
  );

create policy "jobs_staff_update" on public.job_posts
  for update using (
    public.get_my_role() in ('admin', 'editor')
    or (public.get_my_role() = 'contributor' and author_id = auth.uid())
  )
  with check (
    public.get_my_role() in ('admin', 'editor')
    or (public.get_my_role() = 'contributor' and author_id = auth.uid() and status = 'draft')
  );

create policy "jobs_staff_delete" on public.job_posts
  for delete using (public.get_my_role() in ('admin', 'editor'));

-- Contact submissions ------------------------------------------------------

create table public.contact_submissions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  email text,
  region text,
  message text,
  status text not null default 'new' check (status in ('new', 'contacted', 'archived')),
  created_at timestamptz not null default now()
);

alter table public.contact_submissions enable row level security;

create policy "contact_public_insert" on public.contact_submissions
  for insert with check (true);

create policy "contact_staff_read" on public.contact_submissions
  for select using (public.get_my_role() in ('admin', 'editor'));

create policy "contact_staff_update" on public.contact_submissions
  for update using (public.get_my_role() in ('admin', 'editor'));

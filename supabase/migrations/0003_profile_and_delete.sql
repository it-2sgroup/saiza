-- Supports self-service profile management and account deletion: once a
-- profile can be deleted (by its own owner or by an admin), the posts it
-- authored must survive the deletion instead of blocking it or vanishing.

alter table public.news_posts
  drop constraint if exists news_posts_author_id_fkey,
  add constraint news_posts_author_id_fkey
    foreign key (author_id) references public.profiles (id) on delete set null;

alter table public.job_posts
  drop constraint if exists job_posts_author_id_fkey,
  add constraint job_posts_author_id_fkey
    foreign key (author_id) references public.profiles (id) on delete set null;

alter table public.audit_log
  drop constraint if exists audit_log_actor_id_fkey,
  add constraint audit_log_actor_id_fkey
    foreign key (actor_id) references public.profiles (id) on delete set null;

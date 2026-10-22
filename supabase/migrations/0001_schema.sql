create extension if not exists pgcrypto;

-- Clerk session token helpers. 'o' is the organization claim in Clerk's v2 session token.
create or replace function public.requesting_user_id() returns text
language sql stable as $$ select nullif(auth.jwt()->>'sub', '') $$;

create or replace function public.requesting_org_id() returns text
language sql stable as $$ select nullif(coalesce(auth.jwt()->>'org_id', auth.jwt()->'o'->>'id'), '') $$;

create table public.profiles (
  id text primary key default public.requesting_user_id(),
  handle text not null unique,
  display_name text not null,
  avatar_url text,
  stack text check (stack in ('Next.js', 'React', 'Node.js', 'Python', 'Go', 'Any')),
  created_at timestamptz not null default now()
);

create table public.organizations (
  id text primary key,
  slug text not null unique,
  name text not null,
  image_url text,
  created_at timestamptz not null default now()
);

create table public.skills (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 80),
  title text not null check (char_length(title) between 3 and 60),
  description text not null check (char_length(description) between 10 and 160),
  content text not null check (char_length(content) between 80 and 20000),
  tags text[] not null default '{}',
  stack text not null check (stack in ('Next.js', 'React', 'Node.js', 'Python', 'Go', 'Any')),
  visibility text not null default 'public' check (visibility in ('public', 'private')),
  author_id text not null references public.profiles(id) on delete cascade,
  org_id text references public.organizations(id) on delete set null,
  forked_from_id uuid references public.skills(id) on delete set null,
  stars_count integer not null default 0 check (stars_count >= 0),
  created_at timestamptz not null default now()
);
create index skills_author_idx on public.skills(author_id);
create index skills_org_idx on public.skills(org_id);

create table public.stars (
  user_id text not null references public.profiles(id) on delete cascade,
  skill_id uuid not null references public.skills(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, skill_id)
);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  skill_id uuid not null references public.skills(id) on delete cascade,
  author_id text not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now()
);
create index comments_skill_idx on public.comments(skill_id, created_at);

create table public.follows (
  follower_id text not null references public.profiles(id) on delete cascade,
  following_id text not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id text not null references public.profiles(id) on delete cascade,
  actor_id text not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('fork', 'comment', 'follow')),
  skill_id uuid references public.skills(id) on delete set null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_recipient_idx on public.notifications(recipient_id, created_at desc);

create table public.activities (
  id uuid primary key default gen_random_uuid(),
  actor_id text not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('published', 'forked', 'starred', 'commented')),
  skill_id uuid not null references public.skills(id) on delete cascade,
  created_at timestamptz not null default now()
);
create index activities_created_idx on public.activities(created_at desc);

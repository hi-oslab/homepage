-- OSL CMS schema. Run this once in Supabase Dashboard > SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.works (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null default '제목 없음',
  subtitle text not null default '',
  description text not null default '',
  year integer not null default extract(year from now())::integer,
  project_date date,
  category text not null default '',
  tags text[] not null default '{}',
  thumbnail_url text,
  content text not null default '[]',
  published boolean not null default false,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sub_name text not null default '',
  description text not null default '',
  role text not null default '',
  fields text[] not null default '{}',
  email text not null default '',
  website text not null default '',
  cover_image_url text,
  published boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists works_set_updated_at on public.works;
create trigger works_set_updated_at before update on public.works
for each row execute function public.set_updated_at();

drop trigger if exists members_set_updated_at on public.members;
create trigger members_set_updated_at before update on public.members
for each row execute function public.set_updated_at();

alter table public.works enable row level security;
alter table public.members enable row level security;

drop policy if exists "Published works are public" on public.works;
create policy "Published works are public" on public.works
for select using (published = true);

drop policy if exists "Published members are public" on public.members;
create policy "Published members are public" on public.members
for select using (published = true);

create index if not exists works_published_date_idx
on public.works (published, project_date desc);

create index if not exists works_display_order_idx
on public.works (display_order, created_at desc);

create index if not exists members_display_order_idx
on public.members (display_order, created_at);


-- 어드민 계정: supabase/migrations/20260926_admin_accounts.sql 참고

-- 회원 소속 / 첫 로그인 안내: supabase/migrations/20261002_member_affiliation.sql 참고

-- 연결되지 않은 프로필 정리: supabase/migrations/20261003_remove_unlinked_profiles.sql 참고

-- 프로필 역할 목록: supabase/migrations/20261004_member_roles.sql 참고

-- 멤버 전공: supabase/migrations/20261005_member_major.sql 참고

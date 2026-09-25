-- 어드민 계정 (회원가입 / 승인 / 마스터 권한)
-- Supabase Dashboard > SQL Editor 에서 한 번 실행하세요.

create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text not null default '',
  password_hash text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  is_master boolean not null default false,
  member_id uuid unique references public.members(id) on delete set null,
  approved_at timestamptz,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists admin_users_set_updated_at on public.admin_users;
create trigger admin_users_set_updated_at before update on public.admin_users
for each row execute function public.set_updated_at();

-- 정책 없이 RLS만 켜서 공개 키로는 접근 불가 (서버의 secret key로만 접근)
alter table public.admin_users enable row level security;

-- 작품 작성자
alter table public.works add column if not exists author_id uuid references public.admin_users(id) on delete set null;
create index if not exists works_author_idx on public.works (author_id);

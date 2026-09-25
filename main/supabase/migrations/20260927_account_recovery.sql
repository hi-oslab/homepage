-- 가입 정보 추가 / 비밀번호 재설정 링크 / 관리자 문의
-- 20260926_admin_accounts.sql 실행 후, Supabase Dashboard > SQL Editor 에서 한 번 실행하세요.

-- 1) 가입 정보
alter table public.admin_users add column if not exists student_id text not null default '';
alter table public.admin_users add column if not exists is_hongik boolean not null default false;
alter table public.admin_users add column if not exists phone text not null default '';
alter table public.admin_users add column if not exists joined_year integer;
alter table public.admin_users add column if not exists joined_half text check (joined_half in ('H1', 'H2'));
-- 비밀번호가 바뀌면 +1 → 기존 로그인 세션이 모두 끊긴다
alter table public.admin_users add column if not exists session_version integer not null default 1;

-- 2) 비밀번호 재설정 링크 (마스터가 발급, 1회용)
create table if not exists public.admin_password_resets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.admin_users(id) on delete cascade,
  token_hash text not null unique,
  created_by uuid references public.admin_users(id) on delete set null,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists admin_password_resets_user_idx on public.admin_password_resets (user_id);
alter table public.admin_password_resets enable row level security;

-- 3) 관리자에게 문의 (비밀번호 / 이메일 찾기)
create table if not exists public.admin_help_requests (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('password', 'email')),
  email text not null default '',
  name text not null default '',
  phone text not null default '',
  message text not null default '',
  status text not null default 'open' check (status in ('open', 'resolved')),
  resolved_by uuid references public.admin_users(id) on delete set null,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);
create index if not exists admin_help_requests_status_idx on public.admin_help_requests (status, created_at desc);
alter table public.admin_help_requests enable row level security;

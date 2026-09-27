-- 프로필 역할 목록 (운영자가 관리하고, 멤버는 프로필에서 이 중 하나를 고른다)
-- Supabase Dashboard > SQL Editor 에서 한 번 실행하세요. (코드 배포 전에 먼저 실행)

create table if not exists public.member_roles (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (length(trim(name)) > 0),
  created_at timestamptz not null default now()
);

-- 서버 키로만 읽고 쓴다 (공개 정책 없음). 공개 페이지는 members.role 글자를 그대로 쓴다
alter table public.member_roles enable row level security;

-- 지금 프로필에 입력된 역할들로 처음 목록을 채운다
insert into public.member_roles (name)
select distinct trim(role) from public.members where trim(role) <> ''
on conflict (name) do nothing;

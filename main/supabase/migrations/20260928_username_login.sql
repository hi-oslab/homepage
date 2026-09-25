-- 로그인 아이디를 이메일에서 아이디(username)로 변경
-- 20260927_account_recovery.sql 실행 후, Supabase Dashboard > SQL Editor 에서 한 번 실행하세요.

-- 1) 계정: email → username (영문 소문자로 시작, 영문 소문자/숫자/_ 4~20자)
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'admin_users' and column_name = 'email'
  ) then
    alter table public.admin_users rename column email to username;
  end if;
end $$;

alter table public.admin_users drop constraint if exists admin_users_username_format;
alter table public.admin_users add constraint admin_users_username_format
  check (username ~ '^[a-z][a-z0-9_]{3,19}$');

-- 2) 문의: email → username
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'admin_help_requests' and column_name = 'email'
  ) then
    alter table public.admin_help_requests rename column email to username;
  end if;
end $$;

-- 문의 종류: 비밀번호 재설정 / 아이디 찾기
alter table public.admin_help_requests drop constraint if exists admin_help_requests_kind_check;
update public.admin_help_requests set kind = 'username' where kind = 'email';
alter table public.admin_help_requests add constraint admin_help_requests_kind_check
  check (kind in ('password', 'username'));

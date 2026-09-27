-- 회원 소속(학교 소모임 / 외부 활동) + 첫 로그인 프로필 연결 안내
-- Supabase Dashboard > SQL Editor 에서 한 번 실행하세요. (코드 배포 전에 먼저 실행)

-- club: 현재 학교 소모임 소속 / external: 외부 활동 멤버
-- 기존 계정은 비어 있고(null), 본인이 내 계정에서 고르거나 관리자가 회원 관리에서 지정한다
alter table public.admin_users add column if not exists affiliation text;
alter table public.admin_users drop constraint if exists admin_users_affiliation_check;
alter table public.admin_users add constraint admin_users_affiliation_check
  check (affiliation is null or affiliation in ('club', 'external'));

-- 첫 로그인 때 멤버 프로필 연결(기존 프로필 선택 / 새로 만들기 / 나중에)을 마친 시각
alter table public.admin_users add column if not exists onboarded_at timestamptz;
-- 이미 프로필이 연결된 계정은 안내를 건너뛴다
update public.admin_users set onboarded_at = now() where member_id is not null and onboarded_at is null;

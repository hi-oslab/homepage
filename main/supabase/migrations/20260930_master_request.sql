-- 가입 시 관리자 권한 신청 여부
-- Supabase Dashboard > SQL Editor 에서 한 번 실행하세요. (코드 배포 전에 먼저 실행)

alter table public.admin_users add column if not exists master_requested boolean not null default false;

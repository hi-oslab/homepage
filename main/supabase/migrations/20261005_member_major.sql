-- 멤버 전공 (가입 · 계정 설정에서 입력, 멤버 관리 표에 표시)
-- Supabase Dashboard > SQL Editor 에서 한 번 실행하세요. (코드 배포 전에 먼저 실행)

alter table public.admin_users add column if not exists major text not null default '';

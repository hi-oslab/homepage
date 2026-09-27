-- 프로필은 항상 멤버(계정)와 연결돼 있어야 한다: 어떤 계정에도 연결되지 않은 프로필을 삭제
-- 프로필 내용은 각 멤버가 '내 프로필'에서 직접 관리하고, 운영자는 공개 여부·삭제·순서만 정한다.
-- Supabase Dashboard > SQL Editor 에서 한 번 실행하세요. 되돌릴 수 없습니다.

-- 1) 먼저 지워질 프로필을 확인하세요 (이 줄만 선택해서 실행)
-- select id, name, published from public.members m
-- where not exists (select 1 from public.admin_users u where u.member_id = m.id);

-- 2) 삭제
delete from public.members m
where not exists (select 1 from public.admin_users u where u.member_id = m.id);

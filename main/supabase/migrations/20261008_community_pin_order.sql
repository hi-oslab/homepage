-- 고정 공지 순서 (운영자가 라운지에서 '순서 바꾸기'로 정한다)
-- 작을수록 앞. 비어 있으면(새로 고정된 공지) 순서를 정한 공지들보다 앞에 최신순으로 온다.
alter table public.community_posts add column if not exists pin_order integer;

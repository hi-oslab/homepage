-- Lab Space 더미 데이터 지우기 (lab_space_dummy.sql로 넣은 것만)
-- 조회 기록은 글이 지워질 때 함께 지워진다
delete from public.lab_articles where slug like 'dummy-%';
delete from public.lab_issues
where id in (
  '00000000-0000-4000-a000-000000000001',
  '00000000-0000-4000-a000-000000000002',
  '00000000-0000-4000-a000-000000000003',
  '00000000-0000-4000-a000-000000000004',
  '00000000-0000-4000-a000-000000000005'
)
and not exists (select 1 from public.lab_articles a where a.issue_id = lab_issues.id);

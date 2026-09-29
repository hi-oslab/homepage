-- Lab Space 주차 순서 (리드 멤버가 멤버 공간 주차 표에서 끌어서 정한다)
-- 작을수록 위. 지금 순서(최근에 만든 주차가 위)로 처음 값을 채운다.
alter table public.lab_issues add column if not exists display_order integer;

update public.lab_issues as issue
set display_order = ranked.position
from (
  select id, row_number() over (order by created_at desc) - 1 as position
  from public.lab_issues
) as ranked
where issue.id = ranked.id and issue.display_order is null;

create index if not exists lab_issues_order_idx on public.lab_issues (display_order);

-- Lab Space 주차 작성 기간
-- opens_at: 이때부터 새 글을 쓸 수 있다 (기본: 만든 순간)
-- closes_at: 이때까지 (비어 있으면 마감 없음)
alter table public.lab_issues add column if not exists opens_at timestamptz;
alter table public.lab_issues add column if not exists closes_at timestamptz;

-- 이미 있는 주차는 만든 순간부터 · 마감 없음
update public.lab_issues set opens_at = created_at where opens_at is null;
alter table public.lab_issues alter column opens_at set default now();
alter table public.lab_issues alter column opens_at set not null;

alter table public.lab_issues drop constraint if exists lab_issues_period_check;
alter table public.lab_issues add constraint lab_issues_period_check check (closes_at is null or closes_at > opens_at);

-- Lab Space 공개 페이지 섹션 설정 (리드 멤버가 멤버 공간에서 정한다). 한 줄짜리 표
create table if not exists public.lab_settings (
  id boolean primary key default true check (id),
  best_enabled boolean not null default true,
  best_limit integer not null default 6 check (best_limit between 1 and 24),
  -- BEST 기준 기간(일). 비어 있으면 전체 기간
  best_period_days integer check (best_period_days is null or best_period_days > 0),
  recommend_enabled boolean not null default true,
  -- manual: 리드 멤버가 고른 글 / recent: 최근 공개 글 / random: 공개 글 중 무작위
  recommend_mode text not null default 'manual' check (recommend_mode in ('manual', 'recent', 'random')),
  recommend_limit integer not null default 6 check (recommend_limit between 1 and 24),
  updated_at timestamptz not null default now()
);

insert into public.lab_settings (id) values (true) on conflict (id) do nothing;
alter table public.lab_settings enable row level security;

-- 기간 안의 조회수 (BEST 기준 기간용). 하루 한 번씩 센 기록을 모은다
create or replace function public.lab_view_counts(p_since date)
returns table (article_id uuid, views bigint)
language sql
stable
security definer
set search_path = public
as $$
  select v.article_id, count(*) from public.lab_article_views v where v.viewed_on >= p_since group by v.article_id
$$;

revoke execute on function public.lab_view_counts(date) from public, anon, authenticated;
grant execute on function public.lab_view_counts(date) to service_role;

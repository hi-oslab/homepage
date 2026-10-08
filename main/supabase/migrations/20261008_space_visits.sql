-- 멤버 공간 방문 통계. 새로고침 및 10분 heartbeat가 이 함수를 호출한다.
create table if not exists public.space_daily_visits (
  user_id uuid not null references public.admin_users(id) on delete cascade,
  visited_on date not null,
  visit_count integer not null default 1 check (visit_count > 0),
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  primary key (user_id, visited_on)
);

create index if not exists space_daily_visits_last_seen_idx
  on public.space_daily_visits (last_seen_at desc);
create index if not exists space_daily_visits_date_idx
  on public.space_daily_visits (visited_on desc);

alter table public.space_daily_visits enable row level security;

create or replace function public.record_space_visit(p_user_id uuid)
returns table (
  today_visitors bigint,
  current_visitors bigint,
  average_visitors numeric,
  my_average_visits numeric
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := now();
  v_today date := (v_now at time zone 'Asia/Seoul')::date;
begin
  insert into public.space_daily_visits (user_id, visited_on, visit_count, first_seen_at, last_seen_at)
  values (p_user_id, v_today, 1, v_now, v_now)
  on conflict (user_id, visited_on) do update
  set visit_count = public.space_daily_visits.visit_count
      + case when public.space_daily_visits.last_seen_at < v_now - interval '10 minutes' then 1 else 0 end,
      last_seen_at = v_now;

  return query
  with days as (
    select generate_series(v_today - 6, v_today, interval '1 day')::date as day
  ), daily as (
    select d.day, count(v.user_id)::numeric as visitors
    from days d
    left join public.space_daily_visits v on v.visited_on = d.day
    group by d.day
  )
  select
    (select count(*) from public.space_daily_visits where visited_on = v_today),
    (select count(distinct user_id) from public.space_daily_visits where last_seen_at >= v_now - interval '10 minutes'),
    round((select avg(visitors) from daily), 1),
    -- 같은 날 여러 번 접속해도 내 평균에는 하루 한 번만 반영한다.
    round(coalesce((select count(*)::numeric / 7 from public.space_daily_visits
      where user_id = p_user_id and visited_on between v_today - 6 and v_today), 0), 1);
end;
$$;

revoke execute on function public.record_space_visit(uuid) from public, anon, authenticated;
grant execute on function public.record_space_visit(uuid) to service_role;

-- System 페이지에서 무료 플랜의 500MB DB 한도를 확인한다.
create or replace function public.system_database_size()
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select pg_database_size(current_database());
$$;

revoke execute on function public.system_database_size() from public, anon, authenticated;
grant execute on function public.system_database_size() to service_role;

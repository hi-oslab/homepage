-- About 페이지 연혁(CV) — 마스터 계정만 관리
-- Supabase Dashboard > SQL Editor 에서 한 번 실행하세요.

create table if not exists public.history_items (
  id uuid primary key default gen_random_uuid(),
  year integer not null check (year between 2000 and 2100),
  month integer check (month between 1 and 12),
  -- 전시 / 공연 / 수상 / 워크숍 / 강연 / 프로젝트 등 (자유 입력)
  category text not null default '',
  title text not null default '',
  -- 장소, 주최, 협업 기관 등
  detail text not null default '',
  link text not null default '',
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists history_items_set_updated_at on public.history_items;
create trigger history_items_set_updated_at before update on public.history_items
for each row execute function public.set_updated_at();

alter table public.history_items enable row level security;

drop policy if exists "Published history is public" on public.history_items;
create policy "Published history is public" on public.history_items
for select using (published = true);

create index if not exists history_items_date_idx on public.history_items (year desc, month desc nulls last);

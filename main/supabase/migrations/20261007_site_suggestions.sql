-- 웹사이트 건의사항: 멤버 누구나 적고, 운영자가 상태(요청 · 확인중 · 완료 · 보류 · 불가)를 바꾼다
-- 완료되고 3일이 지나면 보관함으로 옮겨 보인다 (따로 옮기지 않고 resolved_at으로 화면이 나눈다)
-- Supabase Dashboard > SQL Editor 에서 한 번 실행하세요. (코드 배포 전에 먼저 실행)

create table if not exists public.site_suggestions (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references public.admin_users(id) on delete set null,
  body text not null check (char_length(body) between 1 and 500),
  status text not null default 'requested'
    check (status in ('requested', 'reviewing', 'done', 'on_hold', 'rejected')),
  -- 마지막으로 상태를 바꾼 운영자 (완료면 해결한 사람)
  handler_id uuid references public.admin_users(id) on delete set null,
  -- 완료된 시각 (완료가 아니게 되면 비운다)
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.site_suggestion_comments (
  id uuid primary key default gen_random_uuid(),
  suggestion_id uuid not null references public.site_suggestions(id) on delete cascade,
  author_id uuid references public.admin_users(id) on delete set null,
  body text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now()
);

drop trigger if exists site_suggestions_set_updated_at on public.site_suggestions;
create trigger site_suggestions_set_updated_at before update on public.site_suggestions
for each row execute function public.set_updated_at();

create index if not exists site_suggestions_created_idx on public.site_suggestions (created_at desc);
create index if not exists site_suggestion_comments_idx on public.site_suggestion_comments (suggestion_id, created_at);

-- 정책 없이 RLS만 켜서 공개 키로는 접근 불가 (서버의 secret key로만 접근)
alter table public.site_suggestions enable row level security;
alter table public.site_suggestion_comments enable row level security;

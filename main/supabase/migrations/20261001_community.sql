-- 어드민 대시보드 커뮤니티 (공지 / 자유글 + 댓글)
-- Supabase Dashboard > SQL Editor 에서 한 번 실행하세요. (코드 배포 전에 먼저 실행)

create table if not exists public.community_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references public.admin_users(id) on delete set null,
  kind text not null default 'talk' check (kind in ('notice', 'talk')),
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.community_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts(id) on delete cascade,
  author_id uuid references public.admin_users(id) on delete set null,
  body text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now()
);

drop trigger if exists community_posts_set_updated_at on public.community_posts;
create trigger community_posts_set_updated_at before update on public.community_posts
for each row execute function public.set_updated_at();

create index if not exists community_posts_created_idx on public.community_posts (kind, created_at desc);
create index if not exists community_comments_post_idx on public.community_comments (post_id, created_at);

-- 정책 없이 RLS만 켜서 공개 키로는 접근 불가 (서버의 secret key로만 접근)
alter table public.community_posts enable row level security;
alter table public.community_comments enable row level security;

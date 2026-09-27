-- 게시판 개편: 공지 · 자유 · 협업 · 정보공유, 제목 · 블록 본문 · 공지 고정 기한 · 반응 이모지
-- Supabase Dashboard > SQL Editor 에서 한 번 실행하세요. (코드 배포 전에 먼저 실행)

-- 1) 게시판 종류: notice(공지) · talk(자유) · collab(협업) · info(정보공유)
alter table public.community_posts drop constraint if exists community_posts_kind_check;
alter table public.community_posts add constraint community_posts_kind_check
  check (kind in ('notice', 'talk', 'collab', 'info'));

-- 2) 제목 · 블록 본문(Block[] JSON, 프로젝트 본문과 같은 형식)
alter table public.community_posts add column if not exists title text not null default '';
alter table public.community_posts add column if not exists content text not null default '';
-- body는 이제 미리보기 · 알림용 글자 요약이라 비어 있을 수 있다 (예전 글은 body만 있다)
alter table public.community_posts drop constraint if exists community_posts_body_check;
alter table public.community_posts add constraint community_posts_body_check check (char_length(body) <= 2000);

-- 3) 공지 고정: 이 시각까지 맨 위에 고정 (기본 일주일, 작성자 · 운영자가 풀거나 다시 고정)
alter table public.community_posts add column if not exists pinned_until timestamptz;
update public.community_posts
  set pinned_until = created_at + interval '7 days'
  where kind = 'notice' and pinned_until is null;

-- 4) 반응 이모지: 한 사람이 한 글에 같은 이모지는 한 번
create table if not exists public.community_reactions (
  post_id uuid not null references public.community_posts(id) on delete cascade,
  user_id uuid not null references public.admin_users(id) on delete cascade,
  emoji text not null check (char_length(emoji) between 1 and 16),
  created_at timestamptz not null default now(),
  primary key (post_id, user_id, emoji)
);
alter table public.community_reactions enable row level security;

create index if not exists community_posts_pinned_idx on public.community_posts (pinned_until desc) where pinned_until is not null;

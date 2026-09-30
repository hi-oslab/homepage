-- Lab Space 글 댓글 · 좋아요
-- Supabase Dashboard > SQL Editor 에서 한 번 실행하세요. (코드 배포 전에 먼저 실행)

-- 댓글: 멤버(author_id) 또는 게스트(guest_name + 4자리 비밀번호 해시)
-- 비밀 댓글은 에디터와 댓글 작성자에게만 보인다 (서버에서 가린다)
create table if not exists public.lab_comments (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.lab_articles(id) on delete cascade,
  -- 계정이 지워지면 댓글은 남고 작성자만 비운다 ('탈퇴한 멤버')
  author_id uuid references public.admin_users(id) on delete set null,
  guest_name text check (guest_name is null or char_length(guest_name) between 1 and 20),
  -- 게스트 댓글의 비밀번호 (salt:hash). 지우기 · 비밀 댓글 보기에 쓴다
  pin_hash text,
  -- 비밀번호를 틀린 횟수 (너무 많이 틀리면 막는다)
  pin_failures integer not null default 0,
  secret boolean not null default false,
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now(),
  constraint lab_comments_guest_pin check (guest_name is null or pin_hash is not null)
);

-- 도배 방지: 누가 썼는지 (멤버는 'user:계정id', 게스트는 'ip:IP 해시'). 원래 IP는 저장하지 않는다
-- (이 파일을 이미 실행했어도 다시 실행하면 이 칸만 더해진다)
alter table public.lab_comments add column if not exists writer text;
create index if not exists lab_comments_writer_idx on public.lab_comments (writer, created_at desc);

create index if not exists lab_comments_article_idx on public.lab_comments (article_id, created_at);
create index if not exists lab_comments_created_idx on public.lab_comments (created_at desc);

-- 좋아요: 글마다 한 사람(멤버는 'user:계정id', 게스트는 'guest:브라우저 쿠키id') 한 번
create table if not exists public.lab_article_likes (
  article_id uuid not null references public.lab_articles(id) on delete cascade,
  liker text not null check (char_length(liker) <= 80),
  created_at timestamptz not null default now(),
  primary key (article_id, liker)
);

-- 정책 없이 RLS만 켜서 공개 키로는 접근 불가 (서버의 secret key로만 접근)
alter table public.lab_comments enable row level security;
alter table public.lab_article_likes enable row level security;

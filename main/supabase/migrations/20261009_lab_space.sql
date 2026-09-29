-- Lab Space: 리드 멤버가 만드는 주차(호) + 멤버 각자가 쓰는 글 (매거진 · 블로그)
-- Supabase Dashboard > SQL Editor 에서 한 번 실행하세요. (코드 배포 전에 먼저 실행)

-- 주차(호): 이름은 리드 멤버가 정하는 대로 (예: '1주차', 'Issue 03 — Sound')
create table if not exists public.lab_issues (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 80),
  description text not null default '',
  created_by uuid references public.admin_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 글: 프로젝트(works)와 같은 구조 + 작성자(필수) · 주차 · 조회수 · 추천
create table if not exists public.lab_articles (
  id uuid primary key default gen_random_uuid(),
  -- 글이 있는 주차는 지울 수 없다 (멤버 글이 함께 사라지지 않게)
  issue_id uuid not null references public.lab_issues(id) on delete restrict,
  -- 글은 작성자의 것: 계정이 지워지면 글도 함께 지운다
  author_id uuid not null references public.admin_users(id) on delete cascade,
  slug text not null unique,
  title text not null default '',
  subtitle text not null default '',
  description text not null default '',
  thumbnail_url text,
  content text not null default '[]',
  published boolean not null default false,
  view_count integer not null default 0,
  -- 리드 멤버의 추천 (비어 있으면 추천 아님)
  recommended_at timestamptz,
  recommended_by uuid references public.admin_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 조회 기록: 같은 방문자(해시)는 하루 한 번만 센다
create table if not exists public.lab_article_views (
  article_id uuid not null references public.lab_articles(id) on delete cascade,
  viewer text not null,
  viewed_on date not null default current_date,
  primary key (article_id, viewer, viewed_on)
);

drop trigger if exists lab_issues_set_updated_at on public.lab_issues;
create trigger lab_issues_set_updated_at before update on public.lab_issues
for each row execute function public.set_updated_at();

drop trigger if exists lab_articles_set_updated_at on public.lab_articles;
create trigger lab_articles_set_updated_at before update on public.lab_articles
for each row execute function public.set_updated_at();

create index if not exists lab_articles_issue_idx on public.lab_articles (issue_id, created_at desc);
create index if not exists lab_articles_author_idx on public.lab_articles (author_id, updated_at desc);
create index if not exists lab_articles_views_idx on public.lab_articles (view_count desc) where published;
create index if not exists lab_articles_recommended_idx on public.lab_articles (recommended_at desc) where recommended_at is not null;

-- 조회 1회 기록: 오늘 처음 본 방문자일 때만 조회수를 올린다. 새로 셌으면 true
create or replace function public.lab_record_view(p_article uuid, p_viewer text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.lab_article_views (article_id, viewer) values (p_article, p_viewer)
  on conflict do nothing;
  if not found then
    return false;
  end if;
  update public.lab_articles set view_count = view_count + 1 where id = p_article and published;
  return true;
end;
$$;

-- 정책 없이 RLS만 켜서 공개 키로는 접근 불가 (서버의 secret key로만 접근)
alter table public.lab_issues enable row level security;
alter table public.lab_articles enable row level security;
alter table public.lab_article_views enable row level security;
revoke execute on function public.lab_record_view(uuid, text) from public, anon, authenticated;

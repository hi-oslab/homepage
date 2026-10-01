-- Lab Space 글 공동 편집 권한
-- 기존 글은 현재 정책을 유지해 작성자만 편집할 수 있다.

alter table public.lab_articles
  add column if not exists edit_scope text not null default 'owner',
  add column if not exists editor_ids uuid[] not null default '{}';

alter table public.lab_articles
  drop constraint if exists lab_articles_edit_scope_check;
alter table public.lab_articles
  add constraint lab_articles_edit_scope_check
  check (edit_scope in ('all', 'owner', 'selected'));

create index if not exists lab_articles_editor_ids_idx
  on public.lab_articles using gin (editor_ids);

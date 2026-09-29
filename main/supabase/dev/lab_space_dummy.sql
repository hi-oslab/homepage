-- Lab Space 더미 데이터 (공개 페이지 디자인 확인용). 마이그레이션이 아니라 필요할 때 SQL Editor에서 한 번 실행한다
-- 필요: 20261009 · 20261010 · 20261011 마이그레이션
-- 지우기: 아래 lab_space_dummy_cleanup.sql
-- 표시: 토픽은 고정 id(00000000-0000-4000-a000-0000000000xx), 글은 slug가 'dummy-'로 시작
-- 글쓴이는 지금 있는 계정들에 돌아가며 붙인다. 이미지는 picsum.photos

do $$
declare
  authors uuid[];
  master uuid;
  topic record;
  article record;
  n integer := 0;
  author uuid;
  new_id uuid;
  created timestamptz;
  views integer;
  day integer;
begin
  select array_agg(id order by created_at) into authors from public.admin_users;
  if authors is null then
    raise exception '계정이 하나도 없어요';
  end if;
  select id into master from public.admin_users where is_master order by created_at limit 1;

  -- 토픽: 예정 1 · 작성 중 1 · 마감 3
  insert into public.lab_issues (id, title, description, created_by, display_order, opens_at, closes_at, created_at)
  values
    ('00000000-0000-4000-a000-000000000005', 'Night Walks', '밤에 걸으며 발견한 것들. 도시의 조명, 소리, 사람들.', master, 0,
      now() + interval '6 days', now() + interval '13 days', now() - interval '1 day'),
    ('00000000-0000-4000-a000-000000000004', 'Open Data', '공공 데이터를 하나 골라 들여다보고, 작게라도 무언가 만들어 보기.', master, 1,
      now() - interval '2 days', now() + interval '5 days', now() - interval '2 days'),
    ('00000000-0000-4000-a000-000000000003', 'Failure Log', '이번 달에 망한 실험과, 망하면서 배운 것.', master, 2,
      now() - interval '16 days', now() - interval '9 days', now() - interval '16 days'),
    ('00000000-0000-4000-a000-000000000002', 'Tools We Love', '매일 손에 쥐는 도구 하나를 골라 소개해요. 소프트웨어든 연필이든.', master, 3,
      now() - interval '30 days', now() - interval '23 days', now() - interval '30 days'),
    ('00000000-0000-4000-a000-000000000001', 'Sound', '소리를 만들고, 모으고, 시각화한 경험.', master, 4,
      now() - interval '44 days', now() - interval '37 days', now() - interval '44 days')
  on conflict (id) do nothing;

  for article in
    select * from (values
      -- (토픽 번호, slug, 제목, 부제, 공개, 추천, 조회수)
      (4, 'dummy-seoul-bike', '따릉이 대여 기록으로 본 출퇴근 지도', '한 달치 대여 데이터를 지도 위에 올려 봤더니', true, true, 128),
      (4, 'dummy-air-quality', '미세먼지 데이터를 소리로 듣기', 'PM2.5 수치를 음높이로 바꾸는 작은 실험', true, false, 64),
      (4, 'dummy-library-books', '도서관 대출 순위 10년', '가장 오래 사랑받은 책은 무엇일까', true, false, 21),
      (4, 'dummy-open-data-draft', '공공 와이파이 위치 정리 (작성 중)', '', false, false, 0),
      (3, 'dummy-broken-printer', '3D 프린터를 세 번 고장 낸 이야기', '노즐 온도 하나 때문에 일주일을 날렸다', true, true, 342),
      (3, 'dummy-failed-shader', '셰이더가 검은 화면만 보여줄 때', '디버깅 도구 없이 GPU와 대화하는 법', true, false, 187),
      (3, 'dummy-too-big-scope', '범위를 너무 크게 잡았다', '3주짜리 프로젝트가 3개월이 되기까지', true, true, 256),
      (3, 'dummy-lost-data', '백업하지 않은 날', '외장 하드와 함께 사라진 두 달', true, false, 98),
      (2, 'dummy-figma-plugins', '매일 쓰는 피그마 플러그인 다섯 개', '반복 작업을 줄여 준 작은 도구들', true, false, 410),
      (2, 'dummy-mechanical-pencil', '0.3mm 샤프 하나로 버틴 1년', '스케치 도구에 대한 아주 개인적인 기록', true, true, 175),
      (2, 'dummy-terminal', '터미널을 좋아하게 된 이유', '검은 화면이 무섭지 않게 되기까지', true, false, 233),
      (2, 'dummy-notion-vs-obsidian', '노트 앱을 여섯 번 옮긴 사람의 결론', '결국 도구보다 습관이 중요했다', true, false, 89),
      (2, 'dummy-soldering-iron', '인두기 추천과 첫 납땜', '손 떨림을 이기는 작은 요령들', true, false, 52),
      (1, 'dummy-field-recording', '동네 소리 채집', '휴대폰 하나로 시작하는 필드 레코딩', true, true, 520),
      (1, 'dummy-sound-visualizer', '웹 오디오로 만든 소리 시각화', 'Web Audio API와 캔버스로 파형 그리기', true, false, 298),
      (1, 'dummy-synth-diy', '처음 만든 신시사이저', '오실레이터 두 개와 필터 하나', true, false, 144),
      (1, 'dummy-silence', '조용한 방의 소리', '무향실에 가 보지 못한 사람이 상상한 무음', true, false, 36)
    ) as t(topic_no, slug, title, subtitle, published, recommended, view_count)
  loop
    n := n + 1;
    author := authors[1 + (n % array_length(authors, 1))];
    -- 토픽 작성 기간 안에서 글마다 조금씩 다른 날
    select opens_at into created from public.lab_issues
      where id = ('00000000-0000-4000-a000-00000000000' || article.topic_no)::uuid;
    created := created + (n % 5) * interval '1 day' + (n * 37 % 600) * interval '1 minute';

    insert into public.lab_articles (
      issue_id, author_id, slug, title, subtitle, description, thumbnail_url, content,
      published, view_count, recommended_at, recommended_by, created_at, updated_at
    ) values (
      ('00000000-0000-4000-a000-00000000000' || article.topic_no)::uuid,
      author,
      article.slug,
      article.title,
      article.subtitle,
      article.subtitle,
      'https://picsum.photos/seed/' || article.slug || '/1600/1200',
      jsonb_build_array(
        jsonb_build_object('id', gen_random_uuid()::text, 'type', 'section-index', 'number', '01', 'title', '시작'),
        jsonb_build_object('id', gen_random_uuid()::text, 'type', 'paragraph', 'text',
          article.subtitle || '. 이 글은 공개 페이지 디자인을 확인하기 위한 더미 글이에요. 실제 멤버의 글처럼 문단이 몇 개 이어지고, 중간에 이미지와 인용이 들어가요.'),
        jsonb_build_object('id', gen_random_uuid()::text, 'type', 'media', 'mediaType', 'image',
          'url', 'https://picsum.photos/seed/' || article.slug || '-body/1600/1000', 'caption', '작업 과정의 한 장면'),
        jsonb_build_object('id', gen_random_uuid()::text, 'type', 'heading', 'level', 2, 'text', '무엇을 했나'),
        jsonb_build_object('id', gen_random_uuid()::text, 'type', 'paragraph', 'text',
          '처음에는 간단해 보였어요. 자료를 모으고, 정리하고, 눈에 보이게 만드는 것까지 하루면 될 줄 알았죠. 하지만 막상 해 보니 생각하지 못한 문제가 계속 나왔어요.'),
        jsonb_build_object('id', gen_random_uuid()::text, 'type', 'list', 'style', 'bullet', 'items',
          jsonb_build_array('자료를 모으는 데 가장 오래 걸렸어요', '작게 만들어 보고 자주 보여 주는 게 도움이 됐어요', '다음에는 기록을 더 꼼꼼히 남길 거예요')),
        jsonb_build_object('id', gen_random_uuid()::text, 'type', 'quote', 'text', '완벽하게 하려다 아무것도 못 하는 것보다, 엉성하게라도 끝내는 게 낫다.', 'cite', '작업 노트에서'),
        jsonb_build_object('id', gen_random_uuid()::text, 'type', 'section-index', 'number', '02', 'title', '돌아보며'),
        jsonb_build_object('id', gen_random_uuid()::text, 'type', 'paragraph', 'text',
          '다음 토픽에서도 비슷한 방식으로 작게 시작해 보려고 해요. 궁금한 점이 있으면 라운지에서 이야기해 주세요.')
      )::text,
      article.published,
      article.view_count,
      case when article.recommended then created + interval '2 days' end,
      case when article.recommended then master end,
      created,
      created + interval '3 hours'
    )
    on conflict (slug) do nothing
    returning id into new_id;

    -- 기간별 BEST 확인용 조회 기록: 조회수의 일부를 최근 60일에 흩어 둔다
    if new_id is not null and article.published then
      views := least(article.view_count, 60);
      for day in 0 .. views - 1 loop
        insert into public.lab_article_views (article_id, viewer, viewed_on)
        values (new_id, 'dummy-' || day, current_date - ((day * 7 + n) % 60))
        on conflict do nothing;
      end loop;
    end if;
  end loop;
end $$;

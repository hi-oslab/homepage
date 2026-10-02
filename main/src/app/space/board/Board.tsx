'use client'

import classNames from 'classnames'
import { AnimatePresence, motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { GoComment, GoPin, GoPlus, GoSearch } from 'react-icons/go'
import { buttonClass, useServerState, useToast } from '@/components/admin/ui'
import { INSET_HOVER, fieldClass } from '@/components/admin/styles'
import { ProfileImage } from '@/components/ProfileImage'
import { MentionText } from '@/components/mentions/MentionText'
import { parseBlocks } from '@/lib/blocks'
import {
  BOARDS,
  BOARD_ORDER,
  byPinOrder,
  isPinned,
  type CommunityKind,
  type CommunityPost,
} from '@/lib/community-types'
import { RelativeTime } from '../DashboardActions'
import { BoardChip, type Viewer } from './shared'
import { PostComposer } from './PostComposer'
import { PinOrderModal } from './PinOrderModal'
import { PostModal } from './PostModal'

type Tab = 'all' | CommunityKind
type Sort = 'latest' | 'oldest'
const SORTS: Record<Sort, string> = { latest: '최신순', oldest: '오래된순' }

/** 벽돌 열 수: 모바일도 2열, 넓은 화면일수록 늘린다 (xl 3 · 3xl 4 · 4xl 5, globals.css 기준점과 같게) */
const COLUMN_BREAKPOINTS: [query: string, columns: number][] = [
  ['(min-width: 160rem)', 5],
  ['(min-width: 120rem)', 4],
  ['(min-width: 80rem)', 3],
]
function useColumnCount() {
  const [columns, setColumns] = useState(2)
  useEffect(() => {
    const lists = COLUMN_BREAKPOINTS.map(([query, count]) => [window.matchMedia(query), count] as const)
    const update = () => setColumns(lists.find(([list]) => list.matches)?.[1] ?? 2)
    update()
    lists.forEach(([list]) => list.addEventListener('change', update))
    return () => lists.forEach(([list]) => list.removeEventListener('change', update))
  }, [])
  return columns
}

/** 카드에 보여줄 첫 이미지 (이미지 · 갤러리 블록) */
function firstImage(post: CommunityPost) {
  if (!post.content) return null
  for (const block of parseBlocks(post.content)) {
    if (block.type === 'media' && block.mediaType === 'image') return block.urls?.[0] || block.url || null
    if (block.type === 'gallery' && block.items[0]?.url) return block.items[0].url
  }
  return null
}

/**
 * 게시판: 공지 · 자유 · 협업 · 정보공유를 탭으로 나누고, 기본은 모두 모아 최신순.
 * 고정된 공지(기본 일주일)는 맨 위 줄에 따로 두고, 나머지 글은 벽돌처럼 쌓는다.
 * 카드를 누르면 모달로 본문 · 반응 · 댓글.
 */
export function Board({ initialPosts, viewer }: { initialPosts: CommunityPost[] | null; viewer: Viewer }) {
  const router = useRouter()
  const toast = useToast()
  const [serverPosts, setPosts] = useServerState(initialPosts)
  const posts = useMemo(() => serverPosts ?? [], [serverPosts])
  const [tab, setTab] = useState<Tab>('all')
  const [openId, setOpenId] = useState<string | null>(null)
  const [composer, setComposer] = useState<{ post: CommunityPost | null; kind?: CommunityKind } | null>(null)

  const open = (post: CommunityPost) => setOpenId(post.id)

  const [ordering, setOrdering] = useState(false)

  /*
   * 탭을 바꾸면 글 목록 길이가 달라져 페이지 높이가 바뀌고, 브라우저가 스크롤을 끌어올려 화면이 튄다.
   * 탭 줄을 기준으로 자리를 지킨다: 보이던 자리 그대로 두고, 목록을 내려가 탭 줄이 헤더 위로
   * 지나가 있었다면 새 카테고리를 처음부터 보도록 탭 줄을 헤더 바로 아래로 가져온다.
   */
  const tabsRef = useRef<HTMLDivElement>(null)
  const tabsTop = useRef<number | null>(null)
  const changeTab = (value: Tab) => {
    if (value === tab) return
    tabsTop.current = tabsRef.current?.getBoundingClientRect().top ?? null
    setTab(value)
  }
  useLayoutEffect(() => {
    const element = tabsRef.current
    const before = tabsTop.current
    tabsTop.current = null
    if (!element || before === null) return
    const headerOffset = parseFloat(getComputedStyle(element).scrollMarginTop) || 0
    if (before < headerOffset) element.scrollIntoView({ block: 'start' })
    else window.scrollBy(0, element.getBoundingClientRect().top - before)
  }, [tab])

  const [sort, setSort] = useState<Sort>('latest')
  const [query, setQuery] = useState('')
  const columns = useColumnCount()

  const inTab = posts.filter((post) => tab === 'all' || post.kind === tab)
  // 검색: 제목 · 본문 · 작성자 이름 (띄어쓰기로 나눈 낱말이 모두 들어 있어야)
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
  const matched = words.length
    ? inTab.filter((post) => {
        const haystack = `${post.title}\n${post.body}\n${post.author_name}`.toLowerCase()
        return words.every((word) => haystack.includes(word))
      })
    : inTab
  // 고정 공지가 늘 맨 앞(운영자가 정한 순서), 그 뒤는 고른 시간순
  const pinned = matched.filter(isPinned).sort(byPinOrder)
  const rest = matched
    .filter((post) => !isPinned(post))
    .sort((a, b) =>
      sort === 'latest' ? b.created_at.localeCompare(a.created_at) : a.created_at.localeCompare(b.created_at),
    )
  const ordered = [...pinned, ...rest]
  // 벽돌 배치를 열마다 번갈아 나눠 담는다: 첫 줄이 곧 맨 앞 순서 (CSS columns는 한 열을 먼저 채워 순서가 섞인다)
  const stacks = Array.from({ length: columns }, (_, column) =>
    ordered.filter((_, index) => index % columns === column),
  )
  const openPost = posts.find((post) => post.id === openId) ?? null

  // 표가 아직 없으면(마이그레이션 전)
  if (serverPosts === null) {
    return (
      <section className='rounded-block bg-surface p-4 text-sm text-mute'>
        게시판을 쓰려면 DB 마이그레이션(supabase/migrations/20261006_community_boards.sql)이 필요해요.
      </section>
    )
  }

  const update = (next: CommunityPost) =>
    setPosts((current) => (current ?? []).map((item) => (item.id === next.id ? next : item)))

  return (
    <section className='flex flex-col gap-4'>
      {/* 탭 + 글쓰기 */}
      {/* scroll-mt: 탭을 바꿀 때 헤더 바로 아래로 가져오는 위치 */}
      <div
        ref={tabsRef}
        className='flex scroll-mt-[calc(var(--spacing-header)+0.75rem)] flex-wrap items-center justify-between gap-3'
      >
        <div className='flex max-w-full items-center gap-1 overflow-x-auto rounded-full bg-paper/80 p-1 [scrollbar-width:none]'>
          {(['all', ...BOARD_ORDER] as Tab[]).map((value) => (
            <button
              key={value}
              type='button'
              onClick={() => changeTab(value)}
              className={classNames(
                'relative flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm transition-colors',
                tab === value ? 'text-ink' : 'text-mute hover:text-ink',
              )}
            >
              {tab === value && (
                <motion.span
                  layoutId='board-tab'
                  className='absolute inset-0 rounded-full bg-surface shadow-[0_1px_3px_rgb(var(--shadow-rgb)/0.12)]'
                  transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                />
              )}
              {value !== 'all' && <span className={classNames('relative size-1.5 rounded-full', BOARDS[value].dot)} />}
              <span className='relative'>{value === 'all' ? '전체' : BOARDS[value].label}</span>
            </button>
          ))}
        </div>
        <button
          type='button'
          onClick={() => setComposer({ post: null, kind: tab === 'all' ? undefined : tab })}
          className={buttonClass('primary', 'md', 'rounded-full')}
        >
          <GoPlus size={14} />
          글쓰기
        </button>
      </div>
      {tab !== 'all' && <p className='-mt-1 px-1 text-xs text-mute'>{BOARDS[tab].hint}</p>}

      {/* 검색 · 정렬 · (운영자) 고정 순서 */}
      <div className='-mt-1 flex flex-wrap items-center gap-2'>
        <label className='relative flex min-w-0 flex-1 basis-48 items-center'>
          <GoSearch size={14} className='pointer-events-none absolute left-3 text-mute' />
          <input
            type='search'
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder='제목 · 내용 · 작성자 검색'
            aria-label='글 검색'
            className={fieldClass('bg-ink/[0.05] pl-9')}
          />
        </label>
        <div className='flex shrink-0 rounded-lg bg-ink/[0.05] p-0.5 text-sm'>
          {(Object.keys(SORTS) as Sort[]).map((value) => (
            <button
              key={value}
              type='button'
              aria-pressed={sort === value}
              onClick={() => setSort(value)}
              className={classNames(
                'rounded-md px-3 py-1.5 transition-colors',
                sort === value
                  ? 'bg-surface text-ink shadow-[0_1px_3px_rgb(var(--shadow-rgb)/0.12)]'
                  : 'text-mute hover:text-ink',
              )}
            >
              {SORTS[value]}
            </button>
          ))}
        </div>
        {viewer.isMaster && pinned.length > 1 && (
          <button type='button' onClick={() => setOrdering(true)} className={buttonClass('ghost', 'sm', 'shrink-0')}>
            <GoPin size={12} />
            고정 순서
          </button>
        )}
      </div>

      {/* 글: 고정 공지가 맨 앞, 그 뒤는 고른 순서. 열마다 번갈아 담은 벽돌 배치 */}
      <AnimatePresence mode='popLayout'>
        <motion.div
          key={`${tab}-${sort}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className='flex items-start gap-2 sm:gap-3'
        >
          {stacks.map((stack, column) => (
            <div key={column} className='flex min-w-0 flex-1 flex-col gap-2 sm:gap-3'>
              {stack.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  index={ordered.indexOf(post)}
                  pinned={isPinned(post)}
                  onOpen={() => open(post)}
                />
              ))}
            </div>
          ))}
        </motion.div>
      </AnimatePresence>

      {inTab.length > 0 && matched.length === 0 && (
        <p className='rounded-inner bg-ink/[0.04] px-6 py-10 text-center text-sm text-mute'>
          ‘{query.trim()}’에 맞는 글이 없어요.
        </p>
      )}

      {inTab.length === 0 && (
        <div className='flex flex-col items-center gap-3 rounded-inner bg-ink/[0.04] px-6 py-14 text-center'>
          <p className='text-sm text-mute'>
            {tab === 'all'
              ? '아직 글이 없어요. 첫 이야기를 남겨 보세요.'
              : `${BOARDS[tab].label} 게시판에 아직 글이 없어요.`}
          </p>
          <button
            type='button'
            onClick={() => setComposer({ post: null, kind: tab === 'all' ? undefined : tab })}
            className={buttonClass('secondary', 'sm')}
          >
            <GoPlus size={13} />
            글쓰기
          </button>
        </div>
      )}

      <PinOrderModal
        open={ordering}
        posts={pinned}
        onClose={() => setOrdering(false)}
        onSaved={(ids) => {
          const rank = new Map(ids.map((id, index) => [id, index]))
          setPosts((current) =>
            (current ?? []).map((item) => (rank.has(item.id) ? { ...item, pin_order: rank.get(item.id)! } : item)),
          )
          setOrdering(false)
        }}
        onMessage={toast.show}
      />
      <PostModal
        post={openPost}
        viewer={viewer}
        onClose={() => setOpenId(null)}
        onChange={update}
        onEdit={(post) => {
          setOpenId(null)
          setComposer({ post })
        }}
        onDeleted={(id) => {
          setPosts((current) => (current ?? []).filter((item) => item.id !== id))
          setOpenId(null)
          toast.show('글을 지웠어요')
        }}
        onMessage={toast.show}
      />
      <PostComposer
        open={composer !== null}
        post={composer?.post ?? null}
        initialKind={composer?.kind}
        viewer={viewer}
        onClose={() => setComposer(null)}
        onSaved={(message) => {
          setComposer(null)
          toast.show(message)
          router.refresh()
        }}
        onMessage={toast.show}
      />
      {toast.node}
    </section>
  )
}

/** 글 카드: 게시판 · 제목 · 미리보기 · 첫 이미지 · 작성자 · 반응 · 댓글 수 */
function PostCard({
  post,
  index,
  pinned,
  onOpen,
}: {
  post: CommunityPost
  index: number
  pinned?: boolean
  onOpen: () => void
}) {
  const image = firstImage(post)
  const topReactions = post.reactions
    .slice()
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)

  return (
    <motion.button
      type='button'
      onClick={onOpen}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index, 12) * 0.03, ease: 'easeOut' }}
      whileHover={{ y: -3 }}
      className={classNames(
        // 모바일(2열)에서는 여백 · 글자를 줄인 가벼운 카드
        'relative flex w-full flex-col gap-2 p-3 text-left sm:gap-3 sm:p-4',
        // 흰 라운지 블록 안: 회색 면 · 올리면 진하게 / 고정 글은 강조 면(inverse, 다크모드에서도 어두운 면)
        INSET_HOVER,
      )}
    >
      <span className='flex items-center justify-between gap-2'>
        <span className='flex items-center gap-1.5'>
          <BoardChip kind={post.kind} className={undefined} />
          {pinned && (
            <span className='flex items-center gap-1 text-[11px] text-mute'>
              <GoPin size={11} />
              고정
            </span>
          )}
        </span>
        <span className={classNames('truncate text-[10px] sm:text-[11px]', 'text-mute')}>
          <RelativeTime iso={post.created_at} />
        </span>
      </span>

      {post.title && (
        <span className='line-clamp-2 text-[15px] leading-snug font-medium break-keep sm:line-clamp-none sm:text-[17px]'>
          {post.title}
        </span>
      )}
      {post.body && (
        <span
          className={classNames(
            'line-clamp-3 text-[13px] leading-relaxed break-keep whitespace-pre-line sm:line-clamp-5 sm:text-sm',
            'text-ink/70',
          )}
        >
          <MentionText text={post.body} />
        </span>
      )}
      {image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt='' loading='lazy' className='rounded-inner max-h-48 w-full object-cover sm:max-h-72' />
      )}

      <span className='flex items-center justify-between gap-2 pt-0.5 sm:pt-1'>
        <span className='flex min-w-0 items-center gap-2' title={post.author_name}>
          <ProfileImage
            src={post.author_image}
            name={post.author_name}
            size='sm'
            className='size-5 shrink-0 text-[9px] sm:size-6 sm:text-[10px]'
          />
          {/* 모바일에서는 아이콘만 */}
          <span className={classNames('hidden truncate text-xs sm:inline', 'text-ink/70')}>{post.author_name}</span>
        </span>
        <span className={classNames('flex shrink-0 items-center gap-1.5 text-[11px] sm:gap-2 sm:text-xs', 'text-mute')}>
          {topReactions.length > 0 && (
            <span className='flex items-center gap-0.5'>
              {/* 모바일에서는 가장 많은 반응 하나만 */}
              {topReactions.map((reaction, index) => (
                <span key={reaction.emoji} className={index > 0 ? 'hidden sm:inline' : undefined}>
                  {reaction.emoji}
                </span>
              ))}
              <span className='ml-0.5 tabular-nums'>
                {post.reactions.reduce((sum, reaction) => sum + reaction.count, 0)}
              </span>
            </span>
          )}
          {post.comments.length > 0 && (
            <span className='flex items-center gap-1 tabular-nums'>
              <GoComment size={12} />
              {post.comments.length}
            </span>
          )}
        </span>
      </span>
    </motion.button>
  )
}

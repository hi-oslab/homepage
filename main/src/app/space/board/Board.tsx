'use client'

import classNames from 'classnames'
import { AnimatePresence, motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { GoComment, GoPin, GoPlus } from 'react-icons/go'
import { buttonClass, useServerState, useToast } from '@/components/admin/ui'
import { ProfileImage } from '@/components/ProfileImage'
import { parseBlocks } from '@/lib/blocks'
import { BOARDS, BOARD_ORDER, isPinned, type CommunityKind, type CommunityPost } from '@/lib/community-types'
import { RelativeTime } from '../DashboardActions'
import { BoardChip, type Viewer } from './shared'
import { PostComposer } from './PostComposer'
import { PostModal } from './PostModal'

type Tab = 'all' | CommunityKind

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

  const inTab = posts.filter((post) => tab === 'all' || post.kind === tab)
  const pinned = inTab.filter(isPinned)
  const rest = inTab.filter((post) => !isPinned(post))
  const openPost = posts.find((post) => post.id === openId) ?? null

  // 표가 아직 없으면(마이그레이션 전)
  if (serverPosts === null) {
    return (
      <section className='rounded-2xl bg-surface p-6 text-sm text-mute'>
        게시판을 쓰려면 DB 마이그레이션(supabase/migrations/20261006_community_boards.sql)이 필요해요.
      </section>
    )
  }

  const update = (next: CommunityPost) => setPosts((current) => (current ?? []).map((item) => (item.id === next.id ? next : item)))

  return (
    <section className='flex flex-col gap-4'>
      {/* 탭 + 글쓰기 */}
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <div className='flex max-w-full items-center gap-1 overflow-x-auto rounded-full bg-paper/80 p-1 [scrollbar-width:none]'>
          {(['all', ...BOARD_ORDER] as Tab[]).map((value) => (
            <button
              key={value}
              type='button'
              onClick={() => setTab(value)}
              className={classNames(
                'relative flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm transition-colors',
                tab === value ? 'text-ink' : 'text-mute hover:text-ink',
              )}
            >
              {tab === value && (
                <motion.span layoutId='board-tab' className='absolute inset-0 rounded-full bg-surface shadow-sm' transition={{ type: 'spring', stiffness: 500, damping: 38 }} />
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

      {/* 고정된 공지 */}
      {pinned.length > 0 && (
        <div className='grid grid-cols-1 gap-3 md:grid-cols-2'>
          {pinned.map((post, index) => (
            <PostCard key={post.id} post={post} index={index} pinned onOpen={() => setOpenId(post.id)} />
          ))}
        </div>
      )}

      {/* 나머지 글: 벽돌처럼 쌓기 */}
      <AnimatePresence mode='popLayout'>
        <motion.div
          key={tab}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          // 모바일도 2열 (카드를 가볍게). 홈 오른쪽에 할 일 카드 칸이 있어서 아주 넓은 화면에서만 3열
          className='columns-2 gap-2 sm:gap-3 2xl:columns-3'
        >
          {rest.map((post, index) => (
            <div key={post.id} className='mb-2 break-inside-avoid sm:mb-3'>
              <PostCard post={post} index={index} onOpen={() => setOpenId(post.id)} />
            </div>
          ))}
        </motion.div>
      </AnimatePresence>

      {inTab.length === 0 && (
        <div className='flex flex-col items-center gap-3 rounded-2xl bg-surface px-6 py-14 text-center'>
          <p className='text-sm text-mute'>
            {tab === 'all' ? '아직 글이 없어요. 첫 이야기를 남겨 보세요.' : `${BOARDS[tab].label} 게시판에 아직 글이 없어요.`}
          </p>
          <button type='button' onClick={() => setComposer({ post: null, kind: tab === 'all' ? undefined : tab })} className={buttonClass('secondary', 'sm')}>
            <GoPlus size={13} />
            글쓰기
          </button>
        </div>
      )}

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
  const topReactions = post.reactions.slice().sort((a, b) => b.count - a.count).slice(0, 3)

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
        'flex w-full flex-col gap-2 rounded-2xl p-3 text-left transition-shadow hover:shadow-[0_10px_30px_rgba(17,17,17,0.08)] sm:gap-3 sm:p-4',
        pinned ? 'bg-ink text-white' : 'bg-surface',
      )}
    >
      <span className='flex items-center justify-between gap-2'>
        <span className='flex items-center gap-1.5'>
          <BoardChip kind={post.kind} className={pinned ? 'bg-white/15 text-white' : undefined} />
          {pinned && (
            <span className='flex items-center gap-1 text-[11px] text-white/60'>
              <GoPin size={11} />
              고정
            </span>
          )}
        </span>
        <span className={classNames('truncate text-[10px] sm:text-[11px]', pinned ? 'text-white/50' : 'text-mute')}>
          <RelativeTime iso={post.created_at} />
        </span>
      </span>

      {post.title && (
        <span className='line-clamp-2 text-[15px] leading-snug font-medium tracking-[-0.01em] break-keep sm:line-clamp-none sm:text-[17px]'>
          {post.title}
        </span>
      )}
      {post.body && (
        <span
          className={classNames(
            'line-clamp-3 text-[13px] leading-relaxed break-keep whitespace-pre-line sm:line-clamp-5 sm:text-sm',
            pinned ? 'text-white/70' : 'text-ink/70',
          )}
        >
          {post.body}
        </span>
      )}
      {image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt='' loading='lazy' className='max-h-48 w-full rounded-xl object-cover sm:max-h-72' />
      )}

      <span className='flex items-center justify-between gap-2 pt-0.5 sm:pt-1'>
        <span className='flex min-w-0 items-center gap-2' title={post.author_name}>
          <ProfileImage src={post.author_image} name={post.author_name} size='sm' className='size-5 shrink-0 text-[9px] sm:size-6 sm:text-[10px]' />
          {/* 모바일에서는 아이콘만 */}
          <span className={classNames('hidden truncate text-xs sm:inline', pinned ? 'text-white/70' : 'text-ink/70')}>
            {post.author_name}
          </span>
        </span>
        <span className={classNames('flex shrink-0 items-center gap-1.5 text-[11px] sm:gap-2 sm:text-xs', pinned ? 'text-white/60' : 'text-mute')}>
          {topReactions.length > 0 && (
            <span className='flex items-center gap-0.5'>
              {/* 모바일에서는 가장 많은 반응 하나만 */}
              {topReactions.map((reaction, index) => (
                <span key={reaction.emoji} className={index > 0 ? 'hidden sm:inline' : undefined}>
                  {reaction.emoji}
                </span>
              ))}
              <span className='ml-0.5 tabular-nums'>{post.reactions.reduce((sum, reaction) => sum + reaction.count, 0)}</span>
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

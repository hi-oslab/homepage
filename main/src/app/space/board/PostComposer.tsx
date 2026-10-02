'use client'

import classNames from 'classnames'
import { useEffect, useState, useTransition } from 'react'
import { BlockEditor } from '@/components/admin/BlockEditor'
import { AutoTextarea } from '@/components/admin/BlockEditor/AutoTextarea'
import { Modal } from '@/components/admin/Modal'
import { MentionInputScope } from '@/components/mentions/MentionProvider'
import { buttonClass } from '@/components/admin/ui'
import { parseBlocks, serializeBlocks } from '@/lib/blocks'
import { callAction } from '@/lib/call-action'
import { BOARDS, BOARD_ORDER, TITLE_MAX, type CommunityKind, type CommunityPost } from '@/lib/community-types'
import { deleteImage, isOwnStorageUrl } from '@/lib/storage'
import type { Block } from '@/types/blocks'
import { createPostAction, updatePostAction } from '../community/actions'
import type { Viewer } from './shared'

/**
 * 글쓰기 · 고치기: 게시판 고르기 + 제목 + 블록 본문 (프로젝트 편집과 같은 블록 에디터)
 * 공지는 운영자만 쓸 수 있고, 올리면 일주일 동안 맨 위에 고정된다.
 */
export function PostComposer({
  open,
  post,
  initialKind,
  viewer,
  onClose,
  onSaved,
  onMessage,
}: {
  open: boolean
  /** 고칠 글 (없으면 새 글) */
  post: CommunityPost | null
  initialKind?: CommunityKind
  viewer: Viewer
  onClose: () => void
  onSaved: (message: string) => void
  onMessage: (message: string, tone?: 'success' | 'error') => void
}) {
  const boards = BOARD_ORDER.filter((kind) => kind !== 'notice' || viewer.isMaster)
  const [kind, setKind] = useState<CommunityKind>('talk')
  const [title, setTitle] = useState('')
  const [blocks, setBlocks] = useState<Block[]>([])
  const [isPending, startTransition] = useTransition()

  // 열 때마다 새로 채운다 (고치기면 그 글, 새 글이면 비우기)
  useEffect(() => {
    if (!open) return
    setKind(post?.kind ?? (initialKind && (initialKind !== 'notice' || viewer.isMaster) ? initialKind : 'talk'))
    setTitle(post?.title ?? '')
    setBlocks(
      post?.content
        ? parseBlocks(post.content)
        : post?.body
          ? [{ id: 'legacy', type: 'paragraph', text: post.body }]
          : [],
    )
  }, [open, post, initialKind, viewer.isMaster])

  const empty = !title.trim() && !blocks.some((block) => block.type !== 'paragraph' || block.text.trim())

  const close = () => {
    if (!empty && !confirm('작성 중인 내용이 사라져요. 닫을까요?')) return
    onClose()
  }

  const submit = () => {
    if (empty || isPending) return
    const draft = { kind, title, content: serializeBlocks(blocks) }
    startTransition(async () => {
      const result = await callAction(() => (post ? updatePostAction(post.id, draft) : createPostAction(draft)))
      if ('message' in result) return onMessage(result.message, 'error')
      onSaved(
        post ? '글을 고쳤어요' : kind === 'notice' ? '공지를 올렸어요. 일주일 동안 맨 위에 고정돼요' : '글을 올렸어요',
      )
    })
  }

  return (
    <Modal
      open={open}
      onClose={close}
      size='lg'
      tall
      title={post ? '글 고치기' : '새 글'}
      footer={
        <>
          <button type='button' onClick={close} className={buttonClass('ghost', 'sm')}>
            취소
          </button>
          <button
            type='button'
            disabled={empty || isPending}
            onClick={submit}
            className={buttonClass('primary', 'sm', 'ml-auto')}
          >
            {isPending ? '올리는 중…' : post ? '고친 내용 저장' : '올리기'}
          </button>
        </>
      }
    >
      <div className='flex flex-col gap-4'>
        {/* 게시판 */}
        <div className='flex flex-wrap gap-1.5'>
          {boards.map((value) => (
            <button
              key={value}
              type='button'
              onClick={() => setKind(value)}
              className={classNames(
                'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-colors',
                kind === value ? 'bg-ink text-paper' : 'bg-tile text-ink/70 hover:text-ink',
              )}
            >
              <span className={classNames('size-1.5 rounded-full', kind === value ? 'bg-paper' : BOARDS[value].dot)} />
              {BOARDS[value].label}
            </button>
          ))}
        </div>
        <p className='-mt-2 text-xs text-mute'>
          {BOARDS[kind].hint}
          {kind === 'notice' && ' · 올리면 일주일 동안 맨 위에 고정돼요'}
        </p>

        {/* 제목 (본문 글 시작 위치에 맞춘다: 왼쪽 여백 + 블록 조작 칸) */}
        <label className='rounded-block group/field flex cursor-text flex-col gap-1.5 bg-surface py-4 pr-4 pl-[58px] md:pr-6 md:pl-[72px]'>
          <span className='text-xs text-mute transition-colors group-focus-within/field:text-ink'>제목 (선택)</span>
          <AutoTextarea
            autoFocus
            value={title}
            maxLength={TITLE_MAX}
            placeholder='제목을 입력하세요'
            onChange={(event) => setTitle(event.target.value.replace(/\n/g, ''))}
            className='text-2xl leading-tight font-medium '
          />
        </label>

        {/* 본문 */}
        <div className='rounded-block flex flex-col gap-1 bg-surface py-4 pr-4 pl-1 md:pr-6 md:pl-2'>
          <span className='pl-[54px] text-xs text-mute md:pl-16'>본문 · @로 멤버 언급</span>
          {/* 문단에서 '@'로 멤버를 고를 수 있게 (프로젝트 편집에는 없음) */}
          <MentionInputScope>
            <BlockEditor
              blocks={blocks}
              onChange={setBlocks}
              // 게시판 글 이미지는 본인 계정 폴더에
              projectId={viewer.id}
              onDeleteImage={async (url) => {
                if (!isOwnStorageUrl(url)) return true
                return deleteImage(url).then(
                  () => true,
                  () => false,
                )
              }}
              // 아직 저장 전인 글이라 바로 저장할 곳이 없다 (올리기를 누르면 함께 저장)
              onPersistContent={async () => undefined}
            />
          </MentionInputScope>
        </div>
      </div>
    </Modal>
  )
}

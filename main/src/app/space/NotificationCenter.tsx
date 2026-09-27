'use client'

import classNames from 'classnames'
import { AnimatePresence, motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState, useTransition } from 'react'
import { GoBell, GoComment, GoMegaphone, GoPersonAdd, GoX } from 'react-icons/go'
import { buttonClass, useRefreshOnFocus, useServerState, useToast } from '@/components/admin/ui'
import { callAction } from '@/lib/call-action'
import type { NotificationItem, NotificationKind } from '@/lib/notifications'
import { RelativeTime } from './DashboardActions'
import { approveAsMasterAction, setUserStatusAction } from './users/actions'

const ICONS: Record<NotificationKind, React.ComponentType<{ size?: number }>> = {
  signup: GoPersonAdd,
  notice: GoMegaphone,
  post: GoComment,
  comment: GoComment,
}

/** 마지막으로 알림을 연 시각 (이 브라우저에만 저장. 막혀 있으면 모두 새 알림으로 본다) */
const seenKey = (userId: string) => `osl-notifications-seen:${userId}`
const readSeen = (userId: string) => {
  try {
    return localStorage.getItem(seenKey(userId)) ?? ''
  } catch {
    return ''
  }
}
const writeSeen = (userId: string, iso: string) => {
  try {
    localStorage.setItem(seenKey(userId), iso)
  } catch {
    // 저장이 막혀 있어도 알림은 그대로 동작
  }
}

/**
 * 멤버 공간 모든 화면 오른쪽 아래 알림 버튼.
 * 승인 대기(운영자) · 공지 · 새 글 · 내 글에 달린 댓글을 모아 보여주고,
 * 승인 대기는 여기서 바로 승인 · 거절할 수 있다.
 */
export function NotificationCenter({ items: initialItems, userId }: { items: NotificationItem[]; userId: string }) {
  const router = useRouter()
  const toast = useToast()
  const [items, setItems] = useServerState(initialItems)
  // 레이아웃은 화면을 옮겨도 다시 불러오지 않으므로, 탭으로 돌아오면 최신 알림을 받아 온다
  useRefreshOnFocus()
  const [open, setOpen] = useState(false)
  // 처음 그릴 때는 서버와 같게(빈 값) 두고, 브라우저에서 읽어 온다
  const [seen, setSeen] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [, startTransition] = useTransition()
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => setSeen(readSeen(userId)), [userId])

  const isNew = (item: NotificationItem) => seen !== null && item.at > seen
  const signups = items.filter((item) => item.kind === 'signup')
  const others = items.filter((item) => item.kind !== 'signup')
  // 처리할 승인 대기가 있거나 새 알림이 있으면 버튼에 점
  const attention = signups.length > 0 || others.some(isNew)

  const toggle = () => {
    if (open) {
      // 닫을 때 읽음 처리 (열어 둔 동안은 새 알림 강조를 유지)
      const now = new Date().toISOString()
      writeSeen(userId, now)
      setSeen(now)
    }
    setOpen((value) => !value)
  }

  // 바깥을 누르거나 Esc로 닫기
  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (!panelRef.current?.contains(event.target as Node)) toggle()
    }
    const onKeyDown = (event: KeyboardEvent) => event.key === 'Escape' && toggle()
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
    // toggle은 open에 따라 바뀌므로 open만 본다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const decide = (item: NotificationItem, decision: 'approve' | 'operator' | 'reject') => {
    if (!item.userId) return
    const name = item.title.split('님')[0]
    if (decision === 'operator' && !confirm(`${name}님을 운영자로 승인할까요?\n모든 프로젝트·프로필·멤버를 함께 관리할 수 있게 됩니다.`))
      return
    if (decision === 'reject' && !confirm(`${name}님의 가입 신청을 거절할까요?`)) return
    const userId = item.userId
    setBusyId(item.id)
    startTransition(async () => {
      const result = await callAction(() =>
        decision === 'operator'
          ? approveAsMasterAction(userId)
          : setUserStatusAction(userId, decision === 'approve' ? 'approved' : 'rejected'),
      )
      setBusyId(null)
      if ('message' in result) return toast.show(result.message, 'error')
      setItems((current) => current.filter((entry) => entry.id !== item.id))
      toast.show(
        decision === 'reject' ? `${name}님의 가입을 거절했습니다` : `${name}님을 ${decision === 'operator' ? '운영자로 ' : ''}승인했습니다`,
      )
      router.refresh()
    })
  }

  return (
    <div ref={panelRef} // 모바일에서는 바텀탭 위에
    className='fixed right-4 bottom-[calc(var(--spacing-tabbar)+env(safe-area-inset-bottom)+0.75rem)] z-40 flex flex-col items-end gap-3 md:right-8 md:bottom-8'>
      <AnimatePresence>
        {open && (
          <motion.div
            role='dialog'
            aria-label='알림'
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className='flex max-h-[min(70dvh,560px)] w-[min(calc(100vw-2rem),380px)] flex-col overflow-hidden rounded-2xl bg-paper shadow-[0_12px_40px_rgba(17,17,17,0.18)]'
          >
            <div className='flex shrink-0 items-center justify-between px-4 pt-4 pb-2'>
              <span className='text-base font-medium tracking-[-0.02em]'>알림</span>
              <button type='button' onClick={toggle} aria-label='닫기' className='rounded-md p-1 text-mute hover:bg-tile hover:text-ink'>
                <GoX size={16} />
              </button>
            </div>

            <div className='flex min-h-0 flex-col gap-4 overflow-y-auto px-2 pb-3'>
              {/* 승인 대기: 바로 처리 */}
              {signups.length > 0 && (
                <section className='flex flex-col gap-1'>
                  <span className='px-2 text-xs text-mute'>승인 대기</span>
                  {signups.map((item) => (
                    <div
                      key={item.id}
                      className={classNames('flex flex-col gap-2 rounded-xl bg-surface p-3', busyId === item.id && 'opacity-50')}
                    >
                      <Row item={item} highlight={false} />
                      <div className='flex flex-wrap gap-1 pl-8'>
                        {item.masterRequested && (
                          <button
                            type='button'
                            disabled={busyId === item.id}
                            onClick={() => decide(item, 'operator')}
                            className={buttonClass('primary', 'sm')}
                          >
                            운영자로 승인
                          </button>
                        )}
                        <button
                          type='button'
                          disabled={busyId === item.id}
                          onClick={() => decide(item, 'approve')}
                          className={buttonClass(item.masterRequested ? 'secondary' : 'primary', 'sm')}
                        >
                          {item.masterRequested ? '멤버로 승인' : '승인'}
                        </button>
                        <button
                          type='button'
                          disabled={busyId === item.id}
                          onClick={() => decide(item, 'reject')}
                          className={buttonClass('ghost', 'sm')}
                        >
                          거절
                        </button>
                      </div>
                    </div>
                  ))}
                </section>
              )}

              {/* 새 소식 */}
              <section className='flex flex-col gap-0.5'>
                {signups.length > 0 && <span className='px-2 text-xs text-mute'>소식</span>}
                {others.map((item) =>
                  item.href ? (
                    <Link
                      key={item.id}
                      href={item.href}
                      onClick={toggle}
                      className='rounded-xl p-2 transition-colors hover:bg-tile'
                    >
                      <Row item={item} highlight={isNew(item)} />
                    </Link>
                  ) : (
                    <div key={item.id} className='p-2'>
                      <Row item={item} highlight={isNew(item)} />
                    </div>
                  ),
                )}
                {others.length === 0 && signups.length === 0 && (
                  <p className='px-2 py-8 text-center text-sm text-mute'>최근 30일 동안 새 소식이 없어요.</p>
                )}
              </section>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type='button'
        onClick={toggle}
        aria-expanded={open}
        aria-label={attention ? '알림 (새 알림 있음)' : '알림'}
        className='relative flex size-12 items-center justify-center rounded-full bg-ink text-white shadow-[0_8px_24px_rgba(17,17,17,0.25)] transition-transform hover:scale-105'
      >
        <GoBell size={18} />
        {attention && <span className='absolute top-2.5 right-2.5 size-2 rounded-full bg-danger ring-2 ring-ink' />}
      </button>
      {toast.node}
    </div>
  )
}

function Row({ item, highlight }: { item: NotificationItem; highlight: boolean }) {
  const Icon = ICONS[item.kind]
  return (
    <div className='flex gap-3'>
      <span
        className={classNames(
          'flex size-6 shrink-0 items-center justify-center rounded-full',
          highlight ? 'bg-ink text-white' : 'bg-tile text-ink/60',
        )}
      >
        <Icon size={12} />
      </span>
      <span className='flex min-w-0 flex-1 flex-col gap-0.5'>
        <span className={classNames('text-sm break-keep', highlight ? 'text-ink' : 'text-ink/80')}>{item.title}</span>
        {item.detail && <span className='line-clamp-2 text-xs break-keep text-mute'>{item.detail}</span>}
        <span className='text-[11px] text-mute'>
          <RelativeTime iso={item.at} />
        </span>
      </span>
    </div>
  )
}

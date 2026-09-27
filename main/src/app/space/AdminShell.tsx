'use client'

import classNames from 'classnames'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { Fragment, useEffect, useState, useTransition } from 'react'
import {
  GoFileMedia,
  GoGear,
  GoHistory,
  GoHome,
  GoKebabHorizontal,
  GoLinkExternal,
  GoPulse,
  GoPerson,
  GoShieldCheck,
  GoSignOut,
  GoStack,
  GoSync,
} from 'react-icons/go'
import { useToast } from '@/components/admin/ui'
import { logout, revalidateAll } from './actions'
import { OperatorBadge } from '@/components/OperatorBadge'

export type ShellUser = { name: string; username: string; isMaster: boolean; hasProfile: boolean; pendingCount: number }

type NavItem = {
  label: string
  href: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  exact?: boolean
  /** 운영자 전용 */
  master?: boolean
  badge?: 'pending'
}

// 묶음 사이에 구분선이 들어간다: 홈 / 콘텐츠 / 운영 / 계정
const NAV_GROUPS: NavItem[][] = [
  [{ label: '홈', href: '/space', icon: GoHome, exact: true }],
  [
    { label: '프로젝트 관리', href: '/space/works', icon: GoStack },
    { label: '연혁 관리', href: '/space/history', icon: GoHistory, master: true },
  ],
  [
    { label: '멤버 관리', href: '/space/users', icon: GoShieldCheck, master: true, badge: 'pending' },
    { label: '미디어 관리', href: '/space/media', icon: GoFileMedia, master: true },
    { label: '시스템 상태', href: '/space/system', icon: GoPulse, master: true },
  ],

  [
    { label: '프로필카드 설정', href: '/space/profile', icon: GoPerson },
    { label: '내 정보 설정', href: '/space/account', icon: GoGear },
  ],
]

export function AdminShell({ user, children }: { user: ShellUser; children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const toast = useToast()
  const [isRevalidating, startRevalidate] = useTransition()

  const isActive = (href: string, exact?: boolean) => (exact ? pathname === href : pathname.startsWith(href))

  const refreshSite = () =>
    startRevalidate(async () => {
      const { ok } = await revalidateAll()
      toast.show(ok ? '사이트를 최신 내용으로 갱신했습니다' : '갱신하지 못했습니다', ok ? 'success' : 'error')
    })

  const signOut = async () => {
    await logout()
    router.refresh()
  }

  return (
    <div className='flex min-h-[calc(100dvh-var(--spacing-header))] w-full flex-col md:flex-row'>
      {/* 사이드바 (모바일에서는 숨기고 아래 바텀탭) */}
      <aside className='z-30 hidden shrink-0 flex-col gap-6 bg-paper px-4 pt-4 pb-2 md:sticky md:flex md:top-header md:h-[calc(100dvh-var(--spacing-header))] md:w-56 md:px-5 md:pt-8 md:pb-6'>
        <Link href='/space' className='hidden flex-col gap-0.5 md:flex'>
          <span className='text-xl font-medium tracking-[-0.03em]'>Member Space</span>
          <span className='text-xs text-mute'>Open Source Lab</span>
        </Link>

        <nav className='-mx-1 flex gap-1 overflow-x-auto md:mx-0 md:flex-col md:overflow-visible'>
          {NAV_GROUPS.map((group) => group.filter((item) => !item.master || user.isMaster))
            // 운영자 메뉴만 있는 묶음은 멤버에게 통째로 빠진다
            .filter((group) => group.length > 0)
            .map((group, index) => (
              <Fragment key={group[0].href}>
                {/* 묶음 구분선: 모바일 가로 탭에서는 세로선, 데스크탑에서는 가로선 */}
                {index > 0 && (
                  <span
                    aria-hidden
                    className='mx-1 my-1.5 w-px shrink-0 self-stretch bg-ink/10 md:mx-3 md:my-2 md:h-px md:w-auto'
                  />
                )}
                {group.map(({ label, href, icon: Icon, exact, badge }) => (
                  <Link
                    key={href}
                    href={href}
                    className={classNames(
                      'flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors',
                      isActive(href, exact) ? 'bg-ink text-white' : 'text-ink/60 hover:bg-tile hover:text-ink',
                    )}
                  >
                    <Icon size={15} />
                    {label}
                    {badge && user.pendingCount > 0 && (
                      <span className='ml-auto flex size-5 items-center justify-center rounded-full bg-danger text-[11px] text-white'>
                        {user.pendingCount}
                      </span>
                    )}
                  </Link>
                ))}
              </Fragment>
            ))}
        </nav>

        <div className='mt-auto hidden flex-col gap-1 md:flex'>
          <div className='mb-2 flex flex-col gap-0.5 px-3'>
            <span className='flex items-center gap-1.5 truncate text-sm'>
              {user.name}
              {user.isMaster && (
                <OperatorBadge />
              )}
            </span>
            <span className='truncate text-xs text-mute'>@{user.username}</span>
          </div>
          <a
            href='/'
            target='_blank'
            rel='noopener noreferrer'
            className='flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ink/60 transition-colors hover:bg-tile hover:text-ink'
          >
            <GoLinkExternal size={15} />
            사이트 보기
          </a>
          <button
            type='button'
            onClick={refreshSite}
            disabled={isRevalidating}
            title='공개 페이지 캐시를 즉시 갱신합니다'
            className='flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-ink/60 transition-colors hover:bg-tile hover:text-ink disabled:opacity-50'
          >
            <GoSync size={15} className={isRevalidating ? 'animate-spin' : ''} />
            {isRevalidating ? '갱신 중…' : '사이트 갱신'}
          </button>
          <button
            type='button'
            onClick={signOut}
            className='flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-ink/60 transition-colors hover:bg-tile hover:text-ink'
          >
            <GoSignOut size={15} />
            로그아웃
          </button>
        </div>
      </aside>

      {/* 모바일은 바텀탭만큼 아래 여백을 더 둔다 */}
      <div className='min-w-0 flex-1 px-4 pt-4 pb-[calc(var(--spacing-tabbar)+env(safe-area-inset-bottom)+2rem)] md:px-8 md:pt-8 md:pb-24'>
        {children}
      </div>

      <MobileTabBar
        user={user}
        isActive={isActive}
        onRefreshSite={refreshSite}
        refreshing={isRevalidating}
        onSignOut={signOut}
      />
      {toast.node}
    </div>
  )
}

/* ─── 모바일 바텀탭 ─────────────────────────────────────────────────────── */

// 바텀탭: 자주 쓰는 네 곳 + 더보기 (운영 메뉴 · 사이트 보기 · 갱신 · 로그아웃은 더보기 시트에)
const TABS: NavItem[] = [
  { label: '홈', href: '/space', icon: GoHome, exact: true },
  { label: '프로젝트', href: '/space/works', icon: GoStack },
  { label: '프로필카드', href: '/space/profile', icon: GoPerson },
  { label: '내 정보', href: '/space/account', icon: GoGear },
]

function MobileTabBar({
  user,
  isActive,
  onRefreshSite,
  refreshing,
  onSignOut,
}: {
  user: ShellUser
  isActive: (href: string, exact?: boolean) => boolean
  onRefreshSite: () => void
  refreshing: boolean
  onSignOut: () => void
}) {
  const [moreOpen, setMoreOpen] = useState(false)
  const pathname = usePathname()
  // 탭에 없는 운영 메뉴는 더보기 시트로
  const moreItems = NAV_GROUPS.flat().filter(
    (item) => (!item.master || user.isMaster) && !TABS.some((tab) => tab.href === item.href),
  )
  const moreActive = moreItems.some((item) => isActive(item.href, item.exact))
  const attention = user.isMaster && user.pendingCount > 0

  // 화면을 옮기면 시트를 닫는다
  useEffect(() => setMoreOpen(false), [pathname])

  return (
    <>
      <nav
        aria-label='멤버 공간 메뉴'
        className='fixed inset-x-0 bottom-0 z-40 bg-paper/90 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgba(17,17,17,0.06)] backdrop-blur-md md:hidden'
      >
        <div className='mx-auto grid h-tabbar max-w-md grid-cols-5 px-2'>
          {TABS.map(({ label, href, icon: Icon, exact }) => {
            const active = isActive(href, exact)
            return (
              <Link key={href} href={href} className='relative flex flex-col items-center justify-center gap-1'>
                {active && (
                  <motion.span
                    layoutId='tabbar-pill'
                    transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                    className='absolute inset-x-2 inset-y-2 rounded-2xl bg-tile'
                  />
                )}
                <Icon size={18} className={classNames('relative', active ? 'text-ink' : 'text-ink/45')} />
                <span className={classNames('relative text-[10px]', active ? 'text-ink' : 'text-ink/45')}>{label}</span>
              </Link>
            )
          })}
          <button
            type='button'
            onClick={() => setMoreOpen(true)}
            aria-expanded={moreOpen}
            className='relative flex flex-col items-center justify-center gap-1'
          >
            {moreActive && (
              <motion.span
                layoutId='tabbar-pill'
                transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                className='absolute inset-x-2 inset-y-2 rounded-2xl bg-tile'
              />
            )}
            <span className='relative'>
              <GoKebabHorizontal size={18} className={moreActive ? 'text-ink' : 'text-ink/45'} />
              {attention && <span className='absolute -top-0.5 -right-1 size-2 rounded-full bg-danger ring-2 ring-paper' />}
            </span>
            <span className={classNames('relative text-[10px]', moreActive ? 'text-ink' : 'text-ink/45')}>더보기</span>
          </button>
        </div>
      </nav>

      {/* 더보기 시트 */}
      <AnimatePresence>
        {moreOpen && (
          <motion.div
            className='fixed inset-0 z-[60] flex items-end bg-ink/30 md:hidden'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMoreOpen(false)}
          >
            <motion.div
              initial={{ y: 40 }}
              animate={{ y: 0 }}
              exit={{ y: 40 }}
              transition={{ type: 'spring', stiffness: 420, damping: 36 }}
              onClick={(event) => event.stopPropagation()}
              className='flex w-full flex-col gap-1 rounded-t-3xl bg-paper px-3 pt-3 pb-[calc(env(safe-area-inset-bottom)+1rem)]'
            >
              <span className='mx-auto mb-2 h-1 w-10 rounded-full bg-ink/15' />
              <div className='mb-2 flex items-center gap-1.5 px-3'>
                <span className='truncate text-sm'>{user.name}</span>
                {user.isMaster && <OperatorBadge />}
                <span className='truncate text-xs text-mute'>@{user.username}</span>
              </div>
              {moreItems.map(({ label, href, icon: Icon, exact, badge }) => (
                <Link
                  key={href}
                  href={href}
                  className={classNames(
                    'flex items-center gap-3 rounded-xl px-3 py-3 text-[15px]',
                    isActive(href, exact) ? 'bg-ink text-white' : 'text-ink/80 active:bg-tile',
                  )}
                >
                  <Icon size={17} />
                  {label}
                  {badge && user.pendingCount > 0 && (
                    <span className='ml-auto flex size-5 items-center justify-center rounded-full bg-danger text-[11px] text-white'>
                      {user.pendingCount}
                    </span>
                  )}
                </Link>
              ))}
              {moreItems.length > 0 && <span aria-hidden className='mx-3 my-1.5 h-px bg-ink/10' />}
              <a href='/' target='_blank' rel='noopener noreferrer' className='flex items-center gap-3 rounded-xl px-3 py-3 text-[15px] text-ink/80 active:bg-tile'>
                <GoLinkExternal size={17} />
                사이트 보기
              </a>
              <button
                type='button'
                onClick={onRefreshSite}
                disabled={refreshing}
                className='flex items-center gap-3 rounded-xl px-3 py-3 text-left text-[15px] text-ink/80 active:bg-tile disabled:opacity-50'
              >
                <GoSync size={17} className={refreshing ? 'animate-spin' : ''} />
                {refreshing ? '갱신 중…' : '사이트 갱신'}
              </button>
              <button type='button' onClick={onSignOut} className='flex items-center gap-3 rounded-xl px-3 py-3 text-left text-[15px] text-ink/80 active:bg-tile'>
                <GoSignOut size={17} />
                로그아웃
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

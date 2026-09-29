'use client'

import classNames from 'classnames'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { Fragment, useEffect, useState, useTransition } from 'react'
import {
  GoGear,
  GoHome,
  GoKebabHorizontal,
  GoLinkExternal,
  GoDeviceDesktop,
  GoMoon,
  GoSun,
  GoPerson,
  GoSidebarCollapse,
  GoSidebarExpand,
  GoSignOut,
  GoStack,
  GoSync,
  GoFileDirectoryFill,
  GoHomeFill,
} from 'react-icons/go'
import { BsClockFill } from 'react-icons/bs'
import { BsPersonFill } from 'react-icons/bs'
import { FaDisease } from 'react-icons/fa'
import { MdPeopleAlt, MdPermMedia } from 'react-icons/md'
import { PiPulseFill } from 'react-icons/pi'
import { IoSettings } from 'react-icons/io5'

import { useToast } from '@/components/admin/ui'
import { logout, revalidateAll } from './actions'
import { NAV_COLLAPSED_COOKIE, THEME_COOKIE, type SpaceTheme } from './nav'
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

// 묶음 사이에 구분선이 들어간다: Home / Works / Lab Space / 연혁 관리
const NAV_GROUPS: NavItem[][] = [
  [{ label: 'Home', href: '/space', icon: GoHomeFill, exact: true }],
  [
    { label: 'CV', href: '/space/history', icon: BsClockFill, master: true },
    { label: 'Works', href: '/space/works', icon: GoFileDirectoryFill },
    { label: 'Lab Space', href: '/space/lab', icon: FaDisease },
  ],
  [
    { label: 'Members', href: '/space/users', icon: MdPeopleAlt, master: true, badge: 'pending' },
    { label: 'Storage', href: '/space/media', icon: MdPermMedia, master: true },
    { label: 'System', href: '/space/system', icon: PiPulseFill, master: true },
    // { label: '디자인 가이드', href: '/space/design', icon: GoBrowser, master: true },
  ],

  [
    { label: 'My Profile', href: '/space/profile', icon: BsPersonFill },
    { label: 'Settings', href: '/space/account', icon: IoSettings },
  ],
]

/** 테마 버튼: 누를 때마다 라이트 → 다크 → 기기 설정 순으로 바뀐다 */
const THEME_OPTIONS: Record<
  SpaceTheme,
  { label: string; icon: React.ComponentType<{ size?: number }>; next: SpaceTheme }
> = {
  light: { label: '라이트 모드', icon: GoSun, next: 'dark' },
  dark: { label: '다크 모드', icon: GoMoon, next: 'system' },
  system: { label: '기기 설정 따름', icon: GoDeviceDesktop, next: 'light' },
}

/**
 * 멤버 공간 테마. 색은 globals.css의 [data-theme] 토큰이 바꾼다.
 * 모달처럼 body에 붙는 창도 같은 색을 쓰도록 <html>에도 붙이고, 멤버 공간을 떠나면 뗀다.
 */
function useSpaceTheme(initial: SpaceTheme) {
  const [theme, setTheme] = useState(initial)
  useEffect(() => {
    const root = document.documentElement
    root.dataset.theme = theme
    return () => {
      delete root.dataset.theme
    }
  }, [theme])
  const cycle = () => {
    const next = THEME_OPTIONS[theme].next
    setTheme(next)
    document.cookie = `${THEME_COOKIE}=${next}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`
  }
  return { theme, cycle }
}

export function AdminShell({
  user,
  navCollapsed = false,
  theme: initialTheme = 'light',
  children,
}: {
  user: ShellUser
  navCollapsed?: boolean
  theme?: SpaceTheme
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(navCollapsed)
  const { theme, cycle: cycleTheme } = useSpaceTheme(initialTheme)
  const ThemeIcon = THEME_OPTIONS[theme].icon

  const toggleNav = () => {
    const next = !collapsed
    setCollapsed(next)
    document.cookie = `${NAV_COLLAPSED_COOKIE}=${next ? '1' : ''}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`
  }
  const router = useRouter()
  const toast = useToast()
  const [isRevalidating, startRevalidate] = useTransition()

  const footerItem = classNames(
    'flex items-center gap-2.5 rounded-lg py-2 text-left text-sm text-ink/60 transition-colors hover:bg-tile hover:text-ink',
    collapsed ? 'justify-center px-2' : 'px-3',
  )

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
    <div
      data-theme={theme}
      className='flex min-h-[calc(100dvh-var(--spacing-header))] w-full flex-col bg-paper text-ink md:flex-row'
    >
      {/* 사이드바 (모바일에서는 숨기고 아래 바텀탭) */}
      {/* 접으면 아이콘만 남는 좁은 레일 */}
      <aside
        className={classNames(
          'z-30 hidden shrink-0 flex-col gap-6 bg-paper pt-8 pb-6 transition-[width] duration-200 md:sticky md:top-header md:flex md:h-[calc(100dvh-var(--spacing-header))]',
          collapsed ? 'w-17 px-3' : 'w-56 px-5',
        )}
      >
        <div className={classNames('flex items-start justify-between gap-2', collapsed && 'justify-center')}>
          {!collapsed && (
            <Link href='/space' className='flex min-w-0 flex-col gap-0.5'>
              <span className='truncate text-xl font-medium tracking-[-0.03em]'>Member Space</span>
              <span className='truncate text-xs text-mute'>Open Source Lab</span>
            </Link>
          )}
          <button
            type='button'
            onClick={toggleNav}
            aria-label={collapsed ? '메뉴 펼치기' : '메뉴 접기'}
            title={collapsed ? '메뉴 펼치기' : '메뉴 접기'}
            className='flex size-8 shrink-0 items-center justify-center rounded-lg text-ink/50 transition-colors hover:bg-tile hover:text-ink'
          >
            {collapsed ? <GoSidebarCollapse size={16} /> : <GoSidebarExpand size={16} />}
          </button>
        </div>

        <nav className='flex flex-col gap-1'>
          {NAV_GROUPS.map((group) => group.filter((item) => !item.master || user.isMaster))
            // 운영자 메뉴만 있는 묶음은 멤버에게 통째로 빠진다
            .filter((group) => group.length > 0)
            .map((group, index) => (
              <Fragment key={group[0].href}>
                {/* 묶음 구분선 */}
                {index > 0 && (
                  <span aria-hidden className={classNames('my-2 h-px bg-ink/10', collapsed ? 'mx-2' : 'mx-3')} />
                )}
                {group.map(({ label, href, icon: Icon, exact, badge }) => (
                  <Link
                    key={href}
                    href={href}
                    title={collapsed ? label : undefined}
                    className={classNames(
                      'relative flex shrink-0 items-center gap-2.5 rounded-lg py-2 text-sm transition-colors',
                      collapsed ? 'justify-center px-2' : 'px-3',
                      isActive(href, exact) ? 'bg-ink text-paper' : 'text-ink/60 hover:bg-tile hover:text-ink',
                    )}
                  >
                    <Icon size={15} />
                    {collapsed ? <span className='sr-only'>{label}</span> : <span className='truncate'>{label}</span>}
                    {badge &&
                      user.pendingCount > 0 &&
                      (collapsed ? (
                        <span className='absolute top-1 right-1 size-2 rounded-full bg-danger ring-2 ring-paper' />
                      ) : (
                        <span className='ml-auto flex size-5 items-center justify-center rounded-full bg-danger text-[11px] text-white'>
                          {user.pendingCount}
                        </span>
                      ))}
                  </Link>
                ))}
              </Fragment>
            ))}
        </nav>

        <div className='mt-auto flex flex-col gap-1'>
          {!collapsed && (
            <div className='mb-2 flex flex-col gap-0.5 px-3'>
              <span className='flex items-center gap-1.5 truncate text-sm'>
                {user.name}
                {user.isMaster && <OperatorBadge />}
              </span>
              <span className='truncate text-xs text-mute'>@{user.username}</span>
            </div>
          )}
          <a
            href='/'
            target='_blank'
            rel='noopener noreferrer'
            title={collapsed ? '사이트 보기' : undefined}
            className={footerItem}
          >
            <GoLinkExternal size={15} />
            <FooterLabel collapsed={collapsed}>사이트 보기</FooterLabel>
          </a>
          <button
            type='button'
            onClick={refreshSite}
            disabled={isRevalidating}
            title='공개 페이지 캐시를 즉시 갱신합니다'
            className={classNames(footerItem, 'disabled:opacity-50')}
          >
            <GoSync size={15} className={isRevalidating ? 'animate-spin' : ''} />
            <FooterLabel collapsed={collapsed}>{isRevalidating ? '갱신 중…' : '사이트 갱신'}</FooterLabel>
          </button>
          <button
            type='button'
            onClick={cycleTheme}
            title={`${THEME_OPTIONS[theme].label} (눌러서 바꾸기)`}
            className={footerItem}
          >
            <ThemeIcon size={15} />
            <FooterLabel collapsed={collapsed}>{THEME_OPTIONS[theme].label}</FooterLabel>
          </button>
          <button type='button' onClick={signOut} title={collapsed ? '로그아웃' : undefined} className={footerItem}>
            <GoSignOut size={15} />
            <FooterLabel collapsed={collapsed}>로그아웃</FooterLabel>
          </button>
        </div>
      </aside>

      {/* 모바일은 바텀탭만큼 아래 여백을 더 둔다 */}
      <div className='min-w-0 flex-1 px-4 pt-4 pb-[calc(var(--spacing-tabbar)+env(safe-area-inset-bottom)+2rem)] md:px-4 md:pt-4 md:pb-16'>
        {children}
      </div>

      <MobileTabBar
        user={user}
        isActive={isActive}
        onRefreshSite={refreshSite}
        refreshing={isRevalidating}
        onSignOut={signOut}
        themeLabel={THEME_OPTIONS[theme].label}
        themeIcon={ThemeIcon}
        onCycleTheme={cycleTheme}
      />
      {toast.node}
    </div>
  )
}

/** 사이드바 아래 메뉴 글자: 접으면 화면에서만 숨긴다 */
const FooterLabel = ({ collapsed, children }: { collapsed: boolean; children: React.ReactNode }) =>
  collapsed ? <span className='sr-only'>{children}</span> : <span className='truncate'>{children}</span>

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
  themeLabel,
  themeIcon: ThemeIcon,
  onCycleTheme,
}: {
  user: ShellUser
  isActive: (href: string, exact?: boolean) => boolean
  onRefreshSite: () => void
  refreshing: boolean
  onSignOut: () => void
  themeLabel: string
  themeIcon: React.ComponentType<{ size?: number }>
  onCycleTheme: () => void
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
        className='fixed inset-x-0 bottom-0 z-40 bg-paper/90 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgb(var(--shadow-rgb)/0.06)] backdrop-blur-md md:hidden'
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
              {attention && (
                <span className='absolute -top-0.5 -right-1 size-2 rounded-full bg-danger ring-2 ring-paper' />
              )}
            </span>
            <span className={classNames('relative text-[10px]', moreActive ? 'text-ink' : 'text-ink/45')}>더보기</span>
          </button>
        </div>
      </nav>

      {/* 더보기 시트 */}
      <AnimatePresence>
        {moreOpen && (
          <motion.div
            className='fixed inset-0 z-[60] flex items-end bg-black/45 md:hidden'
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
              className='flex w-full flex-col gap-1 rounded-t-3xl bg-surface px-3 pt-3 pb-[calc(env(safe-area-inset-bottom)+1rem)] ring-1 ring-ink/10'
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
                    isActive(href, exact) ? 'bg-ink text-paper' : 'text-ink/80 active:bg-tile',
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
              <a
                href='/'
                target='_blank'
                rel='noopener noreferrer'
                className='flex items-center gap-3 rounded-xl px-3 py-3 text-[15px] text-ink/80 active:bg-tile'
              >
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
              <button
                type='button'
                onClick={onCycleTheme}
                className='flex items-center gap-3 rounded-xl px-3 py-3 text-left text-[15px] text-ink/80 active:bg-tile'
              >
                <ThemeIcon size={17} />
                {themeLabel}
              </button>
              <button
                type='button'
                onClick={onSignOut}
                className='flex items-center gap-3 rounded-xl px-3 py-3 text-left text-[15px] text-ink/80 active:bg-tile'
              >
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

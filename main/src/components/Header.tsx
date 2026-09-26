'use client'

import classNames from 'classnames'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { logout } from '@/app/admin/actions'
import { Location } from './Location'

/*
 * 사이트 헤더 (상단 상태바 + 하단 노치 메뉴를 하나로 합친 것)
 * - 배경 박스 없이 검은 글자. 스크롤한 본문이 글자 밑으로 비치지 않도록 바탕은 종이색(bg-paper)으로 채운다
 * - 데스크탑: [브랜드] [메뉴 — 현재 페이지는 검은 알약으로 표시, 하위 경로도 알약 안에] [위치 · 시계 · 로그인 계정]
 * - 모바일: [브랜드] [현재 페이지 · Menu 버튼] → 누르면 헤더가 화면 아래까지 늘어나며 메뉴가 펼쳐진다
 * - 높이는 globals.css의 --spacing-header (본문 여백, sticky 위치가 이 값을 쓴다)
 */

const NAV = [
  { label: 'About', href: '/' },
  { label: 'Members', href: '/members' },
  { label: 'Works', href: '/work' },
  { label: 'Lab', href: '/lab-space' },
  { label: 'Contact', href: '/contact' },
]

// 메뉴에 없는 화면의 이름 (모바일 헤더에 표시)
const OTHER_PAGES: Record<string, string> = {
  admin: 'Admin',
  login: 'Login',
  join: 'Join',
  'admin-reset': 'Reset',
  showroom: 'Showroom',
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const islandSpring = { type: 'spring', stiffness: 420, damping: 36, mass: 0.8 } as const

type SessionUser = { username: string; name: string; isMaster: boolean; status: string }

const isActive = (href: string, pathname: string) =>
  href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`)

/** /work/some-project → 'some project' (메뉴 알약 안에 하위 경로로 표시) */
function subLabel(href: string, pathname: string) {
  if (href === '/' || pathname === href) return null
  const rest = pathname
    .slice(href.length + 1)
    .split('/')
    .filter(Boolean)[0]
  if (!rest) return null
  return UUID.test(rest) ? 'detail' : decodeURIComponent(rest).replaceAll('-', ' ')
}

export const Header = () => {
  const router = useRouter()
  const pathname = usePathname()
  const headerRef = useRef<HTMLElement>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [session, setSession] = useState<SessionUser | null>(null)

  const current =
    NAV.find((item) => isActive(item.href, pathname))?.label ?? OTHER_PAGES[pathname.split('/')[1]] ?? 'Page'

  // 페이지를 옮기면 펼친 메뉴를 닫고, 로그인 상태를 다시 확인한다
  useEffect(() => {
    setMenuOpen(false)
    setAccountOpen(false)
    let cancelled = false
    fetch('/api/session', { cache: 'no-store' })
      .then((response) => response.json())
      .then((body: { user: SessionUser | null }) => !cancelled && setSession(body.user))
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [pathname])

  // 바깥 클릭 / Esc로 닫기
  useEffect(() => {
    const close = () => {
      setMenuOpen(false)
      setAccountOpen(false)
    }
    const onPointerDown = (event: PointerEvent) => {
      if (!headerRef.current?.contains(event.target as Node)) close()
    }
    const onKeyDown = (event: KeyboardEvent) => event.key === 'Escape' && close()
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  // 모바일 메뉴가 열려 있는 동안 본문 스크롤 잠금
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  const signOut = async () => {
    await logout()
    setSession(null)
    router.push('/login')
  }

  const accountLinks = session
    ? [
        { label: '어드민', href: '/admin' },
        ...(session.status === 'approved' ? [{ label: '내 계정', href: '/admin/account' }] : []),
      ]
    : []

  return (
    <header ref={headerRef} className='fixed inset-x-0 top-0 z-50 bg-paper'>
      <motion.div layout transition={islandSpring} className='relative px-1 md:px-2 text-ink'>
        {/* 한 줄 바 */}
        <motion.div
          layout='position'
          className='flex h-11 items-center justify-between gap-3 pl-3 pr-1.5 md:grid md:grid-cols-[1fr_auto_1fr] md:pl-4'
        >
          <Link
            href='/'
            className='flex min-w-0 items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-wide'
          >
            <span aria-hidden className='text-[10px] tracking-[0.15em]'>
              ●▲☰
            </span>
            <span className='truncate'>Open Source Lab</span>
          </Link>

          {/* 데스크탑 메뉴: 항상 보이는 탭, 현재 페이지는 검은 알약 */}
          <nav aria-label='주요 메뉴' className='hidden items-center gap-0.5 md:flex'>
            {NAV.map((item) => {
              const active = isActive(item.href, pathname)
              const sub = active ? subLabel(item.href, pathname) : null
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={classNames(
                    'relative flex h-8 items-center rounded-lg px-3.5 text-sm transition-colors',
                    active ? 'text-white' : 'text-ink hover:bg-tile',
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId='header-pill'
                      transition={islandSpring}
                      className='absolute inset-0 rounded-lg bg-ink'
                    />
                  )}
                  <span className='relative flex items-center gap-1.5 whitespace-nowrap'>
                    {item.label}
                    {sub && (
                      <>
                        <span className='text-white/35'>/</span>
                        <span className='max-w-40 truncate text-white/60'>{sub}</span>
                      </>
                    )}
                  </span>
                </Link>
              )
            })}
          </nav>

          {/* 데스크탑 상태 영역 */}
          <div className='hidden items-center justify-end gap-3 font-mono text-[11px] md:flex'>
            <span className='hidden text-ink lg:block'>
              <Location />
            </span>
            <Clock className='text-ink' />
            {session && (
              <div className='relative'>
                <button
                  type='button'
                  aria-haspopup='menu'
                  aria-expanded={accountOpen}
                  onClick={() => setAccountOpen((open) => !open)}
                  className={classNames(
                    'flex h-8 items-center gap-1.5 rounded-lg px-2.5 transition-colors',
                    accountOpen ? 'bg-tile' : 'hover:bg-tile',
                  )}
                >
                  <StatusDot approved={session.status === 'approved'} />@{session.username}
                  {session.isMaster && <span className='rounded-sm bg-ink px-1 text-[9px] text-white'>ADMIN</span>}
                  <span
                    aria-hidden
                    className={classNames('text-ink/50 transition-transform', accountOpen && 'rotate-180')}
                  >
                    ▾
                  </span>
                </button>
                <AnimatePresence>
                  {accountOpen && (
                    <motion.div
                      role='menu'
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.15 }}
                      className='absolute top-[calc(100%+10px)] right-0 flex min-w-48 flex-col rounded-xl bg-ink p-1.5 text-xs text-white'
                    >
                      <span className='px-2.5 py-1.5 text-white/40'>{session.name}</span>
                      {accountLinks.map((link) => (
                        <Link
                          key={link.href}
                          role='menuitem'
                          href={link.href}
                          className='rounded-md px-2.5 py-1.5 hover:bg-white/10'
                        >
                          {link.label}
                        </Link>
                      ))}
                      <button
                        type='button'
                        role='menuitem'
                        onClick={signOut}
                        className='rounded-md px-2.5 py-1.5 text-left hover:bg-white/10'
                      >
                        로그아웃
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* 모바일: 현재 페이지 + 메뉴 버튼 */}
          <button
            type='button'
            aria-expanded={menuOpen}
            aria-controls='mobile-menu'
            onClick={() => setMenuOpen((open) => !open)}
            className='flex h-8 shrink-0 items-center gap-2 rounded-lg bg-ink px-3 text-sm text-white md:hidden'
          >
            <span className='text-white/50'>{current}</span>
            <span>{menuOpen ? 'Close' : 'Menu'}</span>
            <span aria-hidden className='relative block h-2.5 w-3'>
              <span
                className={classNames(
                  'absolute left-0 h-[1.5px] w-full bg-white transition-all duration-300',
                  menuOpen ? 'top-1 rotate-45' : 'top-0',
                )}
              />
              <span
                className={classNames(
                  'absolute left-0 h-[1.5px] w-full bg-white transition-all duration-300',
                  menuOpen ? 'top-1 -rotate-45' : 'top-2',
                )}
              />
            </span>
          </button>
        </motion.div>

        {/* 모바일 펼침 메뉴: 헤더가 화면 아래까지 늘어난다 */}
        <AnimatePresence initial={false}>
          {menuOpen && (
            <motion.div
              id='mobile-menu'
              key='mobile-menu'
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: 0.08 } }}
              exit={{ opacity: 0, transition: { duration: 0.1 } }}
              className='flex h-[calc(100dvh-2.75rem)] flex-col justify-between px-3 pt-6 pb-5 md:hidden'
            >
              <nav aria-label='주요 메뉴' className='flex flex-col'>
                {NAV.map((item, index) => {
                  const active = isActive(item.href, pathname)
                  return (
                    <motion.div
                      key={item.href}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.06 + index * 0.04, duration: 0.35 }}
                    >
                      <Link
                        href={item.href}
                        aria-current={active ? 'page' : undefined}
                        className={classNames(
                          'flex items-baseline justify-between py-1.5 text-5xl font-medium tracking-[-0.04em]',
                          active ? 'text-ink' : 'text-ink/25 active:text-ink',
                        )}
                      >
                        {item.label}
                        <span className='font-mono text-xs tracking-normal text-mute'>0{index + 1}</span>
                      </Link>
                    </motion.div>
                  )
                })}
              </nav>

              <div className='flex flex-col gap-4 font-mono text-[11px] text-mute'>
                {session && (
                  <div className='flex flex-wrap items-center gap-x-4 gap-y-2'>
                    <span className='flex items-center gap-1.5 text-ink'>
                      <StatusDot approved={session.status === 'approved'} />@{session.username}
                    </span>
                    {accountLinks.map((link) => (
                      <Link key={link.href} href={link.href} className='underline-offset-4 hover:underline'>
                        {link.label}
                      </Link>
                    ))}
                    <button type='button' onClick={signOut} className='underline-offset-4 hover:underline'>
                      로그아웃
                    </button>
                  </div>
                )}
                <div className='flex items-center justify-between gap-4'>
                  <Location />
                  <Clock />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </header>
  )
}

const StatusDot = ({ approved }: { approved: boolean }) => (
  <span className={classNames('size-1.5 rounded-full', approved ? 'bg-success' : 'bg-[#e0a526]')} />
)

/** 초 단위 시계 (넓은 화면에서는 날짜까지) */
const Clock = ({ className }: { className?: string }) => {
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    setNow(new Date())
    const timer = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  const parts = now
    ? new Intl.DateTimeFormat('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      })
        .formatToParts(now)
        .reduce<Record<string, string>>((result, part) => ({ ...result, [part.type]: part.value }), {})
    : null

  return (
    <time dateTime={now?.toISOString()} className={classNames('whitespace-nowrap tabular-nums', className)}>
      <span className='hidden xl:inline'>{parts ? `${parts.weekday} ${parts.month} ${parts.day} ` : ''}</span>
      {parts ? `${parts.hour}:${parts.minute}:${parts.second} ${parts.dayPeriod}` : '--:--:--'}
    </time>
  )
}

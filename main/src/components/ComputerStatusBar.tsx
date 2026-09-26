'use client'

import { Fragment, useEffect, useRef, useState } from 'react'
import type { Dispatch, ReactNode, SetStateAction } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Location } from './Location'
import classNames from 'classnames'
import { logout } from '@/app/admin/actions'

type StatusBarMenuProps = {
  id: string
  label: ReactNode
  openMenu: string | null
  setOpenMenu: Dispatch<SetStateAction<string | null>>
  options?: Array<{
    text: ReactNode
    onClick: () => void
    disabled?: boolean
  }>
  align?: 'left' | 'right'
  className?: string
  disabled?: boolean
  optionguide?: string
  onClick?: () => void
}

const StatusBarMenu = ({
  id,
  label,
  openMenu,
  setOpenMenu,
  options = [],
  align = 'left',
  className,
  disabled = false,
  optionguide,
  onClick,
}: StatusBarMenuProps) => {
  const isDirectAction = options.length === 0 && Boolean(onClick)
  const isOpen = !disabled && !isDirectAction && openMenu === id

  return (
    <div className={classNames('relative h-full', className)}>
      <button
        type='button'
        aria-haspopup={disabled || isDirectAction ? undefined : 'menu'}
        aria-expanded={disabled || isDirectAction ? undefined : isOpen}
        disabled={disabled}
        onClick={() => {
          if (disabled) return

          if (isDirectAction) {
            setOpenMenu(null)
            onClick?.()
            return
          }

          setOpenMenu(isOpen ? null : id)
        }}
        className={classNames(
          'flex h-full items-center whitespace-nowrap rounded-sm px-1.5 uppercase transition-colors',
          disabled ? 'cursor-default' : 'cursor-pointer hover:bg-black/10',
          isOpen && 'bg-black/10 text-black hover:bg-black/20',
        )}
      >
        {label}
      </button>

      {isOpen && (
        <div
          role='menu'
          className={classNames(
            'absolute top-[calc(100%+6px)] min-w-44 rounded-md bg-ink p-1.5 text-left text-[10px] font-normal normal-case leading-5 text-white',
            align === 'right' ? 'right-0' : 'left-0',
          )}
        >
          {options.length > 0 ? (
            options.map((option, index) => (
              <button
                key={`${id}-${index}`}
                type='button'
                role='menuitem'
                disabled={option.disabled}
                className='flex w-full cursor-pointer items-center px-2 py-1 text-left text-white/60 rounded-sm hover:bg-white/10 hover:text-white active:bg-white/20 disabled:cursor-not-allowed disabled:opacity-30'
                onClick={() => {
                  setOpenMenu(null)
                  option.onClick()
                }}
              >
                {option.text}
              </button>
            ))
          ) : (
            <div className='px-2 py-1 text-white/50'> {optionguide || 'No available options'}</div>
          )}
        </div>
      )}
    </div>
  )
}

// 경로 세그먼트 → 상태바 표시 이름
const SEGMENT_LABELS: Record<string, string> = {
  work: 'works',
  'lab-space': 'lab space',
  profile: 'my profile',
  account: 'my account',
}
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

type Crumb = { label: string; href: string | null }

/** /admin/works/<id> → [ADMIN, WORKS, EDIT] 처럼 경로를 브레드크럼으로 나눈다 */
function toCrumbs(pathname: string): Crumb[] {
  if (pathname === '/') return [{ label: 'home', href: null }]
  // 재설정 링크의 토큰은 화면에 노출하지 않는다
  if (pathname.startsWith('/admin-reset')) return [{ label: 'reset password', href: null }]

  const segments = pathname.split('/').filter(Boolean)
  return segments.map((segment, index) => ({
    label: UUID.test(segment) ? 'edit' : (SEGMENT_LABELS[segment] ?? decodeURIComponent(segment).replaceAll('-', ' ')),
    href: index < segments.length - 1 ? `/${segments.slice(0, index + 1).join('/')}` : null,
  }))
}

type SessionUser = { username: string; name: string; isMaster: boolean; status: string }

export const ComputerStatusBar = () => {
  const router = useRouter()
  const pathname = usePathname()
  const statusBarRef = useRef<HTMLElement>(null)
  const [now, setNow] = useState<Date | null>(null)
  const [viewport, setViewport] = useState('')
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [session, setSession] = useState<SessionUser | null>(null)

  // 로그인 상태: 페이지를 옮길 때마다 확인 (로그인/로그아웃 직후 반영)
  useEffect(() => {
    let cancelled = false
    fetch('/api/session', { cache: 'no-store' })
      .then((response) => response.json())
      .then((body: { user: SessionUser | null }) => !cancelled && setSession(body.user))
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [pathname])

  const closeBrowserTab = () => {
    window.close()

    window.setTimeout(() => {
      if (!window.closed) {
        window.alert('브라우저 보안 정책으로 탭을 자동으로 닫을 수 없습니다. 이 탭을 직접 닫아주세요.')
      }
    }, 100)
  }

  useEffect(() => {
    const updateClock = () => setNow(new Date())
    const updateViewport = () => setViewport(`${window.innerWidth} × ${window.innerHeight}`)

    updateClock()
    updateViewport()

    const clock = window.setInterval(updateClock, 1000)
    window.addEventListener('resize', updateViewport)

    return () => {
      window.clearInterval(clock)
      window.removeEventListener('resize', updateViewport)
    }
  }, [])

  useEffect(() => {
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!statusBarRef.current?.contains(event.target as Node)) setOpenMenu(null)
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenMenu(null)
    }

    document.addEventListener('pointerdown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)

    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [])

  const crumbs = toCrumbs(pathname)

  const dateAndTime = (() => {
    if (!now) return { date: '--- --- -- ', time: '--:--:--' }

    const parts = new Intl.DateTimeFormat('en-US', {
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

    return {
      date: `${parts.weekday} ${parts.month} ${parts.day} `,
      time: `${parts.hour}:${parts.minute}:${parts.second} ${parts.dayPeriod}`,
    }
  })()

  return (
    <aside
      ref={statusBarRef}
      aria-label='System status'
      className='fixed inset-x-0 top-0 z-50 flex h-7 items-center justify-between px-1.5 font-mono text-[10px] font-medium leading-none border-b border-black/10 bg-paper text-ink md:px-3'
    >
      <div className='flex h-full min-w-0 items-center gap-1'>
        <StatusBarMenu
          id='system'
          label={<span className='text-[11px]'>●▲☰</span>}
          openMenu={openMenu}
          setOpenMenu={setOpenMenu}
          options={[
            { text: '이 오픈소스랩에 관하여', onClick: () => router.push('/about') },
            { text: '페이지 새로고침하기', onClick: () => router.refresh() },
            { text: '홈으로 가기', onClick: () => router.push('/') },
          ]}
        />
        <StatusBarMenu
          id='brand'
          label={<strong className='whitespace-nowrap font-semibold'>OPEN SOURCE LAB</strong>}
          openMenu={openMenu}
          setOpenMenu={setOpenMenu}
          onClick={() => router.push('/')}
        />
        {crumbs.map((crumb, index) => (
          <Fragment key={`${crumb.label}-${index}`}>
            <StatusBarMenu
              id={`crumb-slash-${index}`}
              label={'/'}
              disabled
              openMenu={openMenu}
              setOpenMenu={setOpenMenu}
              className='hidden sm:block'
            />
            <StatusBarMenu
              id={`crumb-${index}`}
              label={<span className='block max-w-40 truncate whitespace-nowrap'>{crumb.label}</span>}
              disabled={!crumb.href}
              onClick={crumb.href ? () => router.push(crumb.href!) : undefined}
              openMenu={openMenu}
              setOpenMenu={setOpenMenu}
              className='hidden min-w-0 sm:block'
              optionguide={`현재 ${crumb.label.toUpperCase()} 페이지입니다.`}
            />
          </Fragment>
        ))}
      </div>

      <div className='flex h-full items-center gap-1 whitespace-nowrap'>
        {session && (
          <>
            <StatusBarMenu
              id='session'
              label={
                <span className='flex items-center gap-1.5'>
                  <span
                    className={classNames(
                      'size-1.5 rounded-full',
                      session.status === 'approved' ? 'bg-success' : 'bg-[#e0a526]',
                    )}
                  />
                  <span className='hidden sm:inline'>@{session.username}</span>
                  {session.isMaster && (
                    <span className='hidden rounded-sm bg-ink px-1 py-0.5 text-[8px] text-white sm:inline'>ADMIN</span>
                  )}
                </span>
              }
              openMenu={openMenu}
              setOpenMenu={setOpenMenu}
              align='right'
              options={[
                { text: `${session.name} (@${session.username})`, onClick: () => undefined, disabled: true },
                { text: '어드민으로 가기', onClick: () => router.push('/admin') },
                ...(session.status === 'approved'
                  ? [{ text: '내 계정', onClick: () => router.push('/admin/account') }]
                  : []),
                {
                  text: '로그아웃',
                  onClick: async () => {
                    await logout()
                    setSession(null)
                    router.push('/login')
                  },
                },
              ]}
            />
            <StatusBarMenu
              id='session-slash'
              label={'/'}
              disabled
              openMenu={openMenu}
              setOpenMenu={setOpenMenu}
              className='hidden sm:block'
            />
          </>
        )}
        <StatusBarMenu
          id='location'
          label={<Location />}
          openMenu={openMenu}
          setOpenMenu={setOpenMenu}
          align='right'
          optionguide={'현재 인터넷 접속 상태를 표시합니다.'}
        />
        <StatusBarMenu id='slash' label={'/'} disabled openMenu={openMenu} setOpenMenu={setOpenMenu} />
        {/* <span className='hidden text-black/50 md:block'>{viewport || '—'}</span> */}
        <StatusBarMenu
          id='clock'
          label={
            <time className='tabular-nums' dateTime={now?.toISOString()}>
              {/* 좁은 화면에서는 시간만 */}
              <span className='hidden sm:inline'>{dateAndTime.date}</span>
              {dateAndTime.time}
            </time>
          }
          openMenu={openMenu}
          setOpenMenu={setOpenMenu}
          align='right'
          optionguide={'현재 시간을 표시합니다.'}
        />
      </div>
    </aside>
  )
}

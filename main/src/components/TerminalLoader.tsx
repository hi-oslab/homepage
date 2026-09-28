'use client'

import classNames from 'classnames'
import { usePathname } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useReducedMotion } from 'framer-motion'

/* ─── 경로별 로딩 스크립트 ─────────────────────────────────────────────── */

export type LoadingScript = { title: string; command: string; lines: string[] }

const SCRIPTS: Record<string, LoadingScript> = {
  home: {
    title: 'Home',
    command: 'osl --boot',
    lines: ['mounting creative filesystem', 'loading latest works', 'warming up the lab', 'ready'],
  },
  about: {
    title: 'About',
    command: 'osl about --history',
    lines: ['reading lab manifesto', 'collecting history since 2018', 'counting collective members', 'ready'],
  },
  members: {
    title: 'Members',
    command: 'osl members --all',
    lines: ['opening member database', 'requesting member profiles', 'mapping creative fields', 'all members online'],
  },
  works: {
    title: 'Works',
    command: 'osl work --list',
    lines: ['initializing work archive', 'fetching projects', 'sorting by year', 'ready'],
  },
  work: {
    title: 'Work',
    command: 'osl work open',
    lines: ['connecting to project database', 'fetching content blocks', 'decoding media assets', 'rendering'],
  },
  contact: {
    title: 'Contact',
    command: 'osl contact --open',
    lines: ['opening mail channel', 'ready to receive'],
  },
  lab: {
    title: 'Lab Space',
    command: 'osl lab --status',
    lines: ['checking lab space', 'status: opening soon'],
  },
  auth: {
    title: 'Members only',
    command: 'osl auth',
    lines: ['establishing secure session', 'ready'],
  },
  admin: {
    title: 'Member Space',
    command: 'osl space --session',
    lines: ['verifying session', 'loading workspace', 'ready'],
  },
  adminWorks: {
    title: 'Member Space / Works',
    command: 'osl space works',
    lines: ['verifying session', 'fetching works', 'checking permissions', 'ready'],
  },
  adminEdit: {
    title: 'Member Space / Editor',
    command: 'osl space works edit',
    lines: ['verifying session', 'loading content blocks', 'preparing editor', 'ready'],
  },
  adminMembers: {
    title: 'Member Space / Profile',
    command: 'osl space profile',
    lines: ['verifying session', 'loading my profile', 'ready'],
  },
  adminUsers: {
    title: 'Member Space / Members',
    command: 'osl space members',
    lines: ['verifying operator session', 'fetching members', 'checking help requests', 'ready'],
  },
  adminMedia: {
    title: 'Member Space / Media',
    command: 'osl space media --scan',
    lines: ['verifying operator session', 'scanning storage bucket', 'resolving references', 'ready'],
  },
  fallback: {
    title: 'Loading',
    command: 'osl open',
    lines: ['resolving route', 'rendering'],
  },
}

export const SHOWROOM_SCRIPTS = [SCRIPTS.home, SCRIPTS.works, SCRIPTS.work, SCRIPTS.members, SCRIPTS.adminEdit]

export function getLoadingScript(pathname: string): LoadingScript {
  const [first, second, third] = pathname.split('/').filter(Boolean)
  if (!first) return SCRIPTS.home
  if (first === 'work') {
    return second ? { ...SCRIPTS.work, command: `${SCRIPTS.work.command} ${decodeURIComponent(second)}` } : SCRIPTS.works
  }
  if (first === 'space') {
    if (second === 'works') return third ? SCRIPTS.adminEdit : SCRIPTS.adminWorks
    if (second === 'profile') return SCRIPTS.adminMembers
    if (second === 'users') return SCRIPTS.adminUsers
    if (second === 'media') return SCRIPTS.adminMedia
    return SCRIPTS.admin
  }
  if (first === 'login' || first === 'join' || first === 'reset-password') return SCRIPTS.auth
  if (first === 'lab-space') return SCRIPTS.lab
  return SCRIPTS[first] ?? SCRIPTS.fallback
}

/* ─── 진행 시뮬레이션 ─────────────────────────────────────────────────── */

/**
 * 로그를 한 줄씩 보여주고 진행률을 올린다.
 * finish=false(실제 로딩): 데이터가 올 때까지 92%에 점점 가까워지며 멈춘다.
 * finish=true(쇼룸): 100%까지 채우고 완료 표시.
 */
function useTerminalProgress(script: LoadingScript, finish: boolean, run: number) {
  const reduceMotion = useReducedMotion()
  const [visible, setVisible] = useState(0)
  const [progress, setProgress] = useState(0)
  const [complete, setComplete] = useState(false)

  useEffect(() => {
    if (reduceMotion) {
      setVisible(script.lines.length)
      setProgress(finish ? 100 : 60)
      setComplete(finish)
      return
    }
    setVisible(0)
    setProgress(0)
    setComplete(false)

    let line = 0
    let value = 0
    const lineTimer = window.setInterval(() => {
      line += 1
      setVisible(Math.min(line, script.lines.length))
      if (line >= script.lines.length) window.clearInterval(lineTimer)
    }, 360)
    const progressTimer = window.setInterval(() => {
      if (finish) {
        value = Math.min(100, value + 3 + Math.random() * 7)
        if (value >= 100) {
          window.clearInterval(progressTimer)
          window.setTimeout(() => setComplete(true), 240)
        }
      } else {
        // 92%에 점근 — 실제 로딩이 끝나면 컴포넌트가 사라진다
        value = value + (92 - value) * 0.06 + Math.random() * 0.8
      }
      setProgress(Math.min(finish ? 100 : 92, value))
    }, 90)

    return () => {
      window.clearInterval(lineTimer)
      window.clearInterval(progressTimer)
    }
  }, [script, finish, run, reduceMotion])

  return { visible, progress: Math.round(progress), complete }
}

/* ─── 터미널 패널 ─────────────────────────────────────────────────────── */

const BAR_LENGTH = 28

export function TerminalPanel({
  script,
  visible,
  progress,
  complete,
  className,
}: {
  script: LoadingScript
  visible: number
  progress: number
  complete: boolean
  className?: string
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const filled = Math.round((progress / 100) * BAR_LENGTH)

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [visible, complete])

  return (
    // 터미널 창은 테마와 상관없이 항상 검은 창 (bg-ink는 다크모드에서 밝아지므로 고정색 black)
    <div className={classNames('flex min-h-0 flex-col overflow-hidden rounded-xl bg-black font-mono text-[11px] leading-relaxed text-white', className)}>
      {/* 창 상단 */}
      <div className='flex h-9 shrink-0 items-center justify-between px-4 text-[10px] text-white/30'>
        <span className='flex gap-1.5'>
          <span className='size-2 rounded-full bg-white/15' />
          <span className='size-2 rounded-full bg-white/15' />
          <span className='size-2 rounded-full bg-white/15' />
        </span>
        <span className='tracking-[0.2em] uppercase'>osl — zsh</span>
        <span className='tabular-nums'>{String(progress).padStart(3, '0')}</span>
      </div>

      <div ref={scrollRef} className='min-h-0 flex-1 overflow-y-auto px-4 pt-2 pb-5 sm:px-5'>
        <p className='whitespace-nowrap'>
          <span className='text-primary-100'>guest@osl</span>
          <span className='text-white/30'> ~ $ </span>
          <span>{script.command}</span>
        </p>
        <div className='mt-3 flex flex-col gap-1 text-white/55'>
          {script.lines.slice(0, visible).map((line, index) => (
            <p key={`${line}-${index}`} className='flex gap-3'>
              <span className='text-white/20 tabular-nums'>{String(index + 1).padStart(2, '0')}</span>
              <span className={index === visible - 1 && !complete ? 'text-white' : undefined}>{line}</span>
            </p>
          ))}
        </div>
        <p className='mt-4 flex items-center gap-3 whitespace-nowrap text-white/30'>
          <span aria-hidden>
            <span className='text-white/80'>{'■'.repeat(filled)}</span>
            {'·'.repeat(BAR_LENGTH - filled)}
          </span>
        </p>
        {complete ? (
          <p className='mt-3 text-[#7ee08a]'>✓ done</p>
        ) : (
          <span className='animate-cursor-blink mt-3 inline-block text-white'>▍</span>
        )}
      </div>
    </div>
  )
}

/* ─── 로딩 화면 ───────────────────────────────────────────────────────── */

/**
 * 페이지 로딩(loading.tsx)에 쓰는 터미널 로더. 현재 경로에 맞는 스크립트를 보여준다.
 * - overlay: 사이트 전체 화면 (상태바 아래)
 * - inline: 어드민처럼 레이아웃 안쪽 콘텐츠 영역
 * 빠른 이동에서 번쩍이지 않도록 150ms 뒤에 나타난다.
 */
export function TerminalLoader({
  variant = 'overlay',
  script: scriptOverride,
  finish = false,
  run = 0,
}: {
  variant?: 'overlay' | 'inline'
  script?: LoadingScript
  finish?: boolean
  run?: number
}) {
  const pathname = usePathname()
  // 경로가 바뀔 때만 스크립트를 새로 만든다 (매 렌더 새 객체면 애니메이션이 계속 재시작됨)
  const script = useMemo(() => scriptOverride ?? getLoadingScript(pathname), [scriptOverride, pathname])
  const { visible, progress, complete } = useTerminalProgress(script, finish, run)
  const currentLine = complete ? 'complete' : (script.lines[Math.max(0, visible - 1)] ?? 'starting')

  const panel = (
    <TerminalPanel
      script={script}
      visible={visible}
      progress={progress}
      complete={complete}
      className={variant === 'overlay' ? 'h-64 sm:h-72' : 'h-64'}
    />
  )

  const percent = (
    <div className='flex flex-col gap-3'>
      <p
        className={classNames(
          'flex items-start font-medium leading-[0.85] tracking-[-0.05em] tabular-nums',
          variant === 'overlay' ? 'text-[clamp(4.5rem,15vw,13rem)]' : 'text-[clamp(3.5rem,8vw,6rem)]',
        )}
      >
        {progress}
        <span className='mt-[0.12em] text-[0.3em] tracking-normal text-mute'>%</span>
      </p>
      <p className='font-mono text-xs text-mute'>
        {script.title.toLowerCase()} — {currentLine}
      </p>
    </div>
  )

  if (variant === 'inline') {
    return (
      <div role='status' aria-live='polite' className='flex min-h-[70dvh] animate-[loader-in_0.3s_ease-out_0.15s_both] items-end'>
        <span className='sr-only'>{script.title} 불러오는 중</span>
        <div className='grid w-full grid-cols-1 items-end gap-8 lg:grid-cols-2'>
          {percent}
          {panel}
        </div>
      </div>
    )
  }

  return (
    <div
      role='status'
      aria-live='polite'
      className='fixed inset-x-0 top-header bottom-0 z-40 flex animate-[loader-in_0.3s_ease-out_0.15s_both] flex-col justify-between bg-paper px-4 pt-6 pb-10 md:px-8 md:pt-8 md:pb-12'
    >
      <span className='sr-only'>{script.title} 불러오는 중</span>
      <div className='grid grid-cols-2 gap-4 text-sm md:grid-cols-12 md:gap-8'>
        <span className='md:col-span-4'>Loading</span>
        <span className='text-mute md:col-span-4'>{script.title}</span>
      </div>
      <div className='grid grid-cols-1 items-end gap-8 md:grid-cols-12'>
        <div className='md:col-span-6'>{percent}</div>
        <div className='md:col-span-5 md:col-start-8'>{panel}</div>
      </div>
    </div>
  )
}

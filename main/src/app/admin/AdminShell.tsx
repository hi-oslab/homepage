'use client'

import classNames from 'classnames'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useTransition } from 'react'
import {
  GoFileMedia,
  GoGear,
  GoHistory,
  GoHome,
  GoLinkExternal,
  GoPeople,
  GoPulse,
  GoPerson,
  GoShieldCheck,
  GoSignOut,
  GoStack,
  GoSync,
} from 'react-icons/go'
import { useToast } from '@/components/admin/ui'
import { logout, revalidateAll } from './actions'

export type ShellUser = { name: string; username: string; isMaster: boolean; hasProfile: boolean; pendingCount: number }

// master: 마스터 전용 메뉴
const NAV = [
  { label: '대시보드', href: '/admin', icon: GoHome, exact: true },
  { label: '작품', href: '/admin/works', icon: GoStack },
  { label: '내 프로필', href: '/admin/profile', icon: GoPerson },
  { label: '내 계정', href: '/admin/account', icon: GoGear },
  { label: '멤버', href: '/admin/members', icon: GoPeople, master: true },
  { label: '연혁', href: '/admin/history', icon: GoHistory, master: true },
  { label: '회원 관리', href: '/admin/users', icon: GoShieldCheck, master: true, badge: 'pending' as const },
  { label: '미디어', href: '/admin/media', icon: GoFileMedia, master: true },
  { label: '시스템 상태', href: '/admin/system', icon: GoPulse, master: true },
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
      {/* 사이드바 (모바일에서는 상단 가로 탭) */}
      <aside className='z-30 flex shrink-0 flex-col gap-6 bg-paper px-4 pt-4 pb-2 md:sticky md:top-header md:h-[calc(100dvh-var(--spacing-header))] md:w-56 md:px-5 md:pt-8 md:pb-6'>
        <Link href='/admin' className='hidden flex-col gap-0.5 md:flex'>
          <span className='text-xl font-medium tracking-[-0.03em]'>OSL Members</span>
          <span className='text-xs text-mute'>Content manager</span>
        </Link>

        <nav className='-mx-1 flex gap-1 overflow-x-auto md:mx-0 md:flex-col md:overflow-visible'>
          {NAV.filter((item) => !item.master || user.isMaster).map(
            ({ label, href, icon: Icon, exact, badge }) => (
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
            ),
          )}
        </nav>

        <div className='mt-auto hidden flex-col gap-1 md:flex'>
          <div className='mb-2 flex flex-col gap-0.5 px-3'>
            <span className='flex items-center gap-1.5 truncate text-sm'>
              {user.name}
              {user.isMaster && <span className='rounded bg-ink px-1.5 py-0.5 text-[10px] text-white'>ADMIN</span>}
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

      <div className='min-w-0 flex-1 px-4 pt-4 pb-24 md:px-8 md:pt-8'>{children}</div>
      {toast.node}
    </div>
  )
}

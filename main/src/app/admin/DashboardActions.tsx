'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { relativeTime, useToast } from '@/components/admin/ui'
import { logout, revalidateAll } from './actions'

export function DashboardActions() {
  const router = useRouter()
  const toast = useToast()
  const [isPending, startTransition] = useTransition()

  return (
    <div className='flex flex-col gap-2'>
      <p className='text-xs leading-relaxed text-mute'>
        저장하면 공개 페이지에 자동 반영됩니다. 바로 반영되지 않았다면 캐시를 갱신해 주세요.
      </p>
      <div className='flex flex-wrap gap-2'>
        <button
          type='button'
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              const { ok } = await revalidateAll()
              toast.show(ok ? '사이트를 최신 내용으로 갱신했습니다' : '갱신하지 못했습니다', ok ? 'success' : 'error')
            })
          }
          className='btn btn-secondary'
        >
          {isPending ? '갱신 중…' : '사이트 갱신'}
        </button>
        <a href='/' target='_blank' rel='noopener noreferrer' className='btn btn-ghost'>
          사이트 보기 ↗
        </a>
        <button
          type='button'
          onClick={async () => {
            await logout()
            router.refresh()
          }}
          className='btn btn-ghost md:hidden'
        >
          로그아웃
        </button>
      </div>
      {toast.node}
    </div>
  )
}

export function RelativeTime({ iso }: { iso: string }) {
  return (
    <time dateTime={iso} suppressHydrationWarning className='shrink-0 text-xs text-mute'>
      {relativeTime(iso)}
    </time>
  )
}

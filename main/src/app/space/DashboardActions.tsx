'use client'

import { relativeTime } from '@/components/admin/ui'

export function RelativeTime({ iso }: { iso: string }) {
  return (
    <time dateTime={iso} suppressHydrationWarning className='shrink-0 text-xs text-mute'>
      {relativeTime(iso)}
    </time>
  )
}

'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { GoSync } from 'react-icons/go'

/** 서버에서 상태를 다시 점검한다 */
export function RecheckButton() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  return (
    <button type='button' onClick={() => startTransition(() => router.refresh())} disabled={isPending} className='btn btn-secondary'>
      <GoSync size={14} className={isPending ? 'animate-spin' : ''} />
      {isPending ? '확인 중…' : '다시 확인'}
    </button>
  )
}

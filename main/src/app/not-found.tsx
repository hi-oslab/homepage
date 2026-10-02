/**
 * Not Found Page
 */

import Link from 'next/link'
import { Arrow } from '@/components'

export default function NotFound() {
  return (
    <div className='flex min-h-[calc(100dvh-var(--spacing-header))] w-full flex-col justify-between gap-16 px-4 pt-6 pb-24 md:px-8 md:pt-8 md:pb-32'>
      <span className='text-sm'>404</span>
      <div className='flex flex-col gap-10'>
        <h1 className='text-[clamp(3.5rem,13vw,13rem)] font-medium leading-[0.85] '>
          Not
          <br />
          <span className='text-ink/15'>found.</span>
        </h1>
        <div className='flex flex-wrap items-end justify-between gap-4 text-sm'>
          <p>페이지를 찾을 수 없습니다.</p>
          <Link href='/' className='inline-flex items-center gap-1 transition-colors hover:text-mute'>
            Back to home
            <Arrow className='size-4' />
          </Link>
        </div>
      </div>
    </div>
  )
}

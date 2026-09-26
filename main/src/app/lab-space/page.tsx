import type { Metadata } from 'next'
import { OG_IMAGE } from '@/app/metadata'
import Link from 'next/link'
import { Arrow, InView } from '@/components'

export const metadata: Metadata = {
  title: 'Lab Space',
  description: '오픈소스랩의 새로운 공간, Lab Space가 곧 열립니다.',
  openGraph: { title: 'Lab Space | Open Source Lab', url: '/lab-space', images: [OG_IMAGE] },
  alternates: { canonical: '/lab-space' },
}

export default function Page() {
  return (
    <div className='flex w-full flex-col px-4 md:px-8'>
      <InView className='flex min-h-[calc(100dvh-var(--spacing-header))] flex-col justify-between gap-16 pt-6 pb-24 md:pt-8 md:pb-32'>
        <div className='grid grid-cols-2 gap-4 text-sm md:grid-cols-12 md:gap-8'>
          <span className='md:col-span-4'>Lab Space</span>
          <span className='flex items-center gap-2 text-mute md:col-span-4'>
            <span className='size-1.5 animate-pulse rounded-full bg-primary-300' />
            Opening soon
          </span>
        </div>

        <div className='flex flex-col gap-10'>
          <h1 className='text-[clamp(3.5rem,13vw,13rem)] font-medium leading-[0.85] tracking-[-0.05em]'>
            Opening
            <br />
            <span className='text-ink/15'>soon.</span>
          </h1>
          <div className='grid grid-cols-1 gap-8 md:grid-cols-12'>
            <p className='max-w-md break-keep text-base leading-relaxed md:col-span-6'>
              누구나 코드와 사물을 가지고 실험할 수 있는 오픈소스랩의 새로운 공간을 준비하고 있습니다. 소식은 인스타그램에서
              가장 먼저 전해드릴게요.
            </p>
            <div className='flex flex-wrap items-end gap-x-6 gap-y-2 text-sm md:col-span-6 md:justify-end'>
              <a
                href='https://www.instagram.com/opensource_lab/'
                target='_blank'
                rel='noopener noreferrer'
                className='inline-flex items-center gap-1 transition-colors hover:text-mute'
              >
                Instagram
                <Arrow className='size-4' />
              </a>
              <Link href='/' className='inline-flex items-center gap-1 transition-colors hover:text-mute'>
                Back to home
                <Arrow className='size-4' />
              </Link>
            </div>
          </div>
        </div>
      </InView>
    </div>
  )
}

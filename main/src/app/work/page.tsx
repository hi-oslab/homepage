import type { Metadata } from 'next'
import { OG_IMAGE } from '@/app/metadata'
import { getPublishedWorks } from '@/lib/cms'
import { InView } from '@/components'
import Client from './client'

export const revalidate = 30 // 30초마다 데이터 갱신 (자동 업데이트)

export const metadata: Metadata = {
  title: 'Works',
  description: '오픈소스랩의 미디어 아트, 크리에이티브 코딩, 피지컬 컴퓨팅 프로젝트들을 소개합니다.',
  openGraph: {
    title: 'Works | Open Source Lab',
    description: '오픈소스랩의 미디어 아트, 크리에이티브 코딩, 피지컬 컴퓨팅 프로젝트들을 소개합니다.',
    url: '/work',
    images: [OG_IMAGE],
  },
  alternates: { canonical: '/work' },
}

export default async function Page() {
  const works = await getPublishedWorks()

  return (
    <div className='flex w-full flex-col px-4 pb-32 md:px-8 md:pb-48'>
      <InView className='flex min-h-[50dvh] flex-col justify-between gap-16 pt-6 pb-16 md:pt-8 md:pb-24'>
        <div className='grid grid-cols-2 gap-4 text-sm md:grid-cols-12 md:gap-8'>
          <span className='md:col-span-4'>Works</span>
          <span className='text-mute md:col-span-4'>Exhibitions, performances & projects</span>
        </div>
        <h1 className='flex items-start gap-3 text-[clamp(3.5rem,11vw,11rem)] font-medium leading-[0.85] tracking-[-0.05em]'>
          Works
          <sup className='mt-[0.4em] text-base font-normal tracking-normal text-mute md:text-xl'>
            ({String(works.length).padStart(2, '0')})
          </sup>
        </h1>
      </InView>
      <Client works={works} />
    </div>
  )
}

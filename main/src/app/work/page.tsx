import type { Metadata } from 'next'
import { getParsedDataByTableType } from '@/app/api/notion'
import { InView } from '@/components'
import Client from './client'

export const revalidate = 30 // 30초마다 데이터 갱신 (자동 업데이트)

export const metadata: Metadata = {
  title: 'Works',
  description: '오픈소스랩의 미디어 아트, 크리에이티브 코딩, 피지컬 컴퓨팅 작품들을 소개합니다.',
  openGraph: {
    title: 'Works | Open Source Lab',
    description: '오픈소스랩의 미디어 아트, 크리에이티브 코딩, 피지컬 컴퓨팅 작품들을 소개합니다.',
    url: 'https://hioslab.com/work',
  },
  alternates: { canonical: 'https://hioslab.com/work' },
}

export default async function Page() {
  const works = await getParsedDataByTableType('works')

  return (
    <>
      <InView className='w-full min-h-dvh h-fit flex flex-col justify-start items-center'>
        <div className='w-full h-48 flex flex-col items-start justify-center p-4 md:p-8 text-center'>
          <h1 className='text-4xl font-bold uppercase'>our works</h1>
        </div>
        <Client works={works} />
      </InView>
    </>
  )
}

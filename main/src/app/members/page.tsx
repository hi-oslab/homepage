import type { Metadata } from 'next'
import { OG_IMAGE } from '@/app/metadata'
import { getPublishedMembers } from '@/lib/cms'
import { InView, Label } from '@/components'
import { MemberCard } from './components'

export const revalidate = 30 // 30초마다 데이터 갱신 (자동 업데이트)

export const metadata: Metadata = {
  title: 'Members',
  description: '오픈소스랩을 함께 만들어가는 멤버들을 소개합니다.',
  openGraph: {
    title: 'Members | Open Source Lab',
    description: '오픈소스랩을 함께 만들어가는 멤버들을 소개합니다.',
    url: '/members',
    images: [OG_IMAGE],
  },
  alternates: { canonical: '/members' },
}

export default async function Page() {
  const members = await getPublishedMembers()

  return (
    <div className='flex w-full flex-col px-4 md:px-8'>
      <InView className='flex min-h-[60dvh] flex-col justify-between gap-16 pt-6 pb-16 md:pt-8 md:pb-24'>
        <div className='grid grid-cols-2 gap-4 text-sm md:grid-cols-12 md:gap-8'>
          <span className='md:col-span-4'>Members</span>
          <span className='text-mute md:col-span-4'>We are OSL creators</span>
        </div>
        <div className='grid grid-cols-1 items-end gap-8 md:grid-cols-12'>
          <h1 className='flex items-start gap-3 text-[clamp(3.5rem,11vw,11rem)] font-medium leading-[0.85] tracking-[-0.05em] md:col-span-8'>
            Members
            <sup className='mt-[0.4em] text-base font-normal tracking-normal text-mute md:text-xl'>
              ({String(members.length).padStart(2, '0')})
            </sup>
          </h1>
          <p className='max-w-sm break-keep text-sm leading-relaxed md:col-span-4 md:justify-self-end'>
            디자인, 개발, 사운드, 공간을 넘나드는 사람들이 모여 함께 공부하고, 만들고, 나눕니다.
          </p>
        </div>
      </InView>

      <InView className='flex flex-col gap-8 pb-32 md:pb-48'>
        <Label index='01'>People</Label>
        <div className='grid grid-cols-2 gap-x-4 gap-y-14 sm:grid-cols-2 md:gap-x-8 lg:grid-cols-4'>
          {members.map((member) => (
            <MemberCard key={member.id} member={member} />
          ))}
        </div>
      </InView>
    </div>
  )
}
